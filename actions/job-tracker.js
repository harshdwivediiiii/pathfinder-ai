"use server";

import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { db } from "@/lib/db/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchRecentJobEmails } from "@/lib/google/gmail";
import { extractJobApplicationFromEmail } from "@/lib/ai/gemini";
import { validateInput } from "@/lib/ai/validate";
import { jobApplicationSchema, jobApplicationUpdateStatusSchema } from "@/lib/schemas/forms";
import { toCanonicalStatus, toDisplayStatus } from "@/lib/constants/job-application-status";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function getAuthenticatedUser() {
async function runSerializableJobApplicationSync(operation) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await db.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error?.code !== "P2034" || attempt === 2) {
        throw error;
      }
    }
  }
}

export async function getJobApplications() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", user: null };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    return { error: "User not found", user: null };
  }

  return { error: null, user };
}

function handleDatabaseError(error, context = "database") {
  console.error(`[${context}] Database error:`, error);
  
  // Log detailed error info for debugging
  if (error.code) {
    console.error(`Prisma error code: ${error.code}`);
  }
  if (error.meta) {
    console.error("Error metadata:", error.meta);
  }

  return {
    success: false,
    errors: {
      _form: [
        error instanceof Error
          ? error.message
          : `Database error in ${context}`,
      ],
    },
  };
}

function validateUserAndInput(schema, data) {
  const validation = validateInput(schema, data);
  if (!validation.success) {
    console.error("Validation error:", validation.errors);
    return { error: validation.errors };
  }
  return { data: validation.data };
}

// ============================================================
// MAIN FUNCTIONS
// ============================================================

export async function getJobApplications() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, data: [], error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  if (!user) {
    return { success: false, data: [], error: "User not found" };
  }

  try {
    const jobs = await db.jobApplication.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        atsAnalysis: {
          select: {
            id: true,
            atsScore: true,
          },
        },
        coverLetter: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return { success: true, data: jobs };
  } catch (error) {
    return handleDatabaseError(error, "getJobApplications");
  }
}

export async function createJobApplication(data) {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, errors: { _form: [authResult.error] } };
  }

  const validationResult = validateUserAndInput(jobApplicationSchema, data);
  if (validationResult.error) {
    return { success: false, errors: validationResult.error };
  }

  try {
    console.log("📝 Creating job application:", validationResult.data);
    const { atsAnalysisId, coverLetterId } = validation.data;

    if (atsAnalysisId) {
      const atsAnalysis = await db.atsAnalysis.findFirst({
        where: { id: atsAnalysisId, userId: user.id },
        select: { id: true },
      });
      if (!atsAnalysis) return createErrorResponse("ATS analysis not found or does not belong to you");
    }

    if (coverLetterId) {
      const coverLetter = await db.coverLetter.findFirst({
        where: { id: coverLetterId, userId: user.id },
        select: { id: true },
      });
      if (!coverLetter) return createErrorResponse("Cover letter not found or does not belong to you");
    }

    const job = await db.jobApplication.create({
      data: {
        userId: authResult.user.id,
        ...validationResult.data,
        status: toCanonicalStatus(validationResult.data.status),
      },
    });

    console.log("✅ Job application created:", job.id);
    
    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    
    return {
      success: true,
      data: job,
    };
  } catch (error) {
    console.error("❌ CREATE JOB APPLICATION ERROR:", error);
    
    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return {
        success: false,
        errors: {
          _form: ["A job application with this information already exists."],
        },
      };
    }

    return {
      success: false,
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "Failed to create job application. Please try again.",
        ],
      },
    };
  }
}

export async function updateJobApplicationStatus(id, status) {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, errors: { _form: [authResult.error] } };
  }

  const validationResult = validateUserAndInput(jobApplicationUpdateStatusSchema, { id, status });
  if (validationResult.error) {
    return { success: false, errors: validationResult.error };
  }

  try {
    console.log(`🔄 Updating job ${id} status to: ${status}`);

    const job = await db.jobApplication.updateMany({
      where: {
        id: validationResult.data.id,
        userId: authResult.user.id,
      },
      data: {
        status: toCanonicalStatus(validationResult.data.status),
      },
    });

    if (job.count === 0) {
      return {
        success: false,
        errors: { _form: ["Job application not found or you don't have permission to update it."] },
      };
    }

    console.log(`✅ Job ${id} status updated successfully`);
    
    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating job ${id} status:`, error);
    return handleDatabaseError(error, "updateJobApplicationStatus");
  }
}

export async function updateJobApplicationInterviewDate(id, interviewDate) {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, errors: { _form: [authResult.error] } };
  }

  try {
    const parsedDate = interviewDate ? new Date(interviewDate) : null;
    
    if (parsedDate && isNaN(parsedDate.getTime())) {
      return {
        success: false,
        errors: { _form: ["Invalid interview date format. Please use a valid date."] },
      };
    }

    console.log(`📅 Updating interview date for job ${id}:`, parsedDate);

    const job = await db.jobApplication.updateMany({
      where: {
        id,
        userId: authResult.user.id,
      },
      data: {
        interviewDate: parsedDate,
      },
    });

    if (job.count === 0) {
      return {
        success: false,
        errors: { _form: ["Job application not found or you don't have permission to update it."] },
      };
    }

    console.log(`✅ Interview date for job ${id} updated successfully`);
    
    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating interview date for job ${id}:`, error);
    return handleDatabaseError(error, "updateJobApplicationInterviewDate");
  }
}

export async function deleteJobApplication(id) {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, errors: { _form: [authResult.error] } };
  }

  try {
    console.log(`🗑️ Deleting job application: ${id}`);

    const job = await db.jobApplication.deleteMany({
      where: {
        id,
        userId: authResult.user.id,
      },
    });

    if (job.count === 0) {
      return {
        success: false,
        errors: { _form: ["Job application not found or you don't have permission to delete it."] },
      };
    }

    console.log(`✅ Job ${id} deleted successfully`);
    
    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error deleting job ${id}:`, error);
    return handleDatabaseError(error, "deleteJobApplication");
  }
}

export async function disassociateAtsAnalysis(id) {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, errors: { _form: [authResult.error] } };
  }

  try {
    console.log(`🔗 Disassociating ATS analysis from job: ${id}`);

    const job = await db.jobApplication.updateMany({
      where: {
        id,
        userId: authResult.user.id,
      },
      data: {
        atsAnalysisId: null,
      },
    });

    if (job.count === 0) {
      return {
        success: false,
        errors: { _form: ["Job application not found or you don't have permission to update it."] },
      };
    }

    console.log(`✅ ATS analysis disassociated from job ${id}`);
    
    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error disassociating ATS analysis from job ${id}:`, error);
    return handleDatabaseError(error, "disassociateAtsAnalysis");
  }
}

export async function disassociateCoverLetter(id) {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, errors: { _form: [authResult.error] } };
  }

  try {
    console.log(`📝 Disassociating cover letter from job: ${id}`);

    const job = await db.jobApplication.updateMany({
      where: {
        id,
        userId: authResult.user.id,
      },
      data: {
        coverLetterId: null,
      },
    });

    if (job.count === 0) {
      return {
        success: false,
        errors: { _form: ["Job application not found or you don't have permission to update it."] },
      };
    }

    console.log(`✅ Cover letter disassociated from job ${id}`);
    
    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error disassociating cover letter from job ${id}:`, error);
    return handleDatabaseError(error, "disassociateCoverLetter");
  }
}

export async function getJobAnalytics() {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, data: null, error: authResult.error };
  }

  try {
    console.log("📊 Fetching job analytics");

    const jobs = await db.jobApplication.findMany({
      where: { userId: authResult.user.id },
      select: {
        status: true,
        jobTitle: true,
        companyName: true,
        atsAnalysisId: true,
        coverLetterId: true,
      },
    });

    const total = jobs.length;
    const statusCounts = {};
    const roleStats = {};
    const companyStats = {};

    jobs.forEach((job) => {
      const normalizedStatus = toDisplayStatus(job.status);
      statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;

      // Role grouping
      let roleGroup = "Other";
      const titleLower = job.jobTitle.toLowerCase();
      if (titleLower.includes("engineer") || titleLower.includes("developer")) {
        roleGroup = "Engineering";
      } else if (titleLower.includes("manager") || titleLower.includes("pm")) {
        roleGroup = "Product/Management";
      } else if (titleLower.includes("design") || titleLower.includes("ui") || titleLower.includes("ux")) {
        roleGroup = "Design";
      } else if (titleLower.includes("data") || titleLower.includes("analyst")) {
        roleGroup = "Data";
      }

      if (!roleStats[roleGroup]) {
        roleStats[roleGroup] = { total: 0, responses: 0 };
      }
      roleStats[roleGroup].total += 1;

      const isResponse = ["Online Assessment (OA)", "Interview", "Offer"].includes(normalizedStatus);
      if (isResponse) {
        roleStats[roleGroup].responses += 1;
      }

      const comp = job.companyName;
      if (!companyStats[comp]) {
        companyStats[comp] = { total: 0, responses: 0 };
      }
      companyStats[comp].total += 1;
      if (isResponse) {
        companyStats[comp].responses += 1;
      }
    });

    const roleData = Object.keys(roleStats).map((name) => ({
      name,
      total: roleStats[name].total,
      responseRate:
        roleStats[name].total > 0
          ? (roleStats[name].responses / roleStats[name].total) * 100
          : 0,
    }));

    const uniqueCompanyCount = Object.keys(companyStats).length;

    const companyData = Object.keys(companyStats)
      .map((name) => ({
        name,
        total: companyStats[name].total,
        responseRate:
          companyStats[name].total > 0
            ? (companyStats[name].responses / companyStats[name].total) * 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    console.log(`✅ Analytics fetched: ${total} jobs`);

    return {
      success: true,
      data: {
        total,
        statusCounts,
        roleData,
        companyData,
        uniqueCompanyCount,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching job analytics:", error);
    return handleDatabaseError(error, "getJobAnalytics");
  }
}

export async function syncJobApplicationsFromEmail() {
  const authResult = await getAuthenticatedUser();
  if (authResult.error) {
    return { success: false, message: authResult.error };
  }

  try {
    console.log("📧 Syncing job applications from email");

    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(
      authResult.user.clerkUserId,
      "oauth_google"
    );
    
    const tokens = response.data;
    if (!tokens || tokens.length === 0) {
      return {
        success: false,
        message: "No Google Account connected or missing Gmail scopes.",
      };
    }

    const accessToken = tokens[0].token;
    const emails = await fetchRecentJobEmails(accessToken, 7);

    if (emails.length === 0) {
      return {
        success: true,
        message: "No recent job-related emails found.",
      };
    }

    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      try {
        const parsedData = await extractJobApplicationFromEmail(email.body);
        if (!parsedData || !parsedData.companyName) {
          errorCount++;
          continue;
        }

        const { companyName, jobTitle, status, interviewDate } = parsedData;

        // Find existing by company (basic deduplication)
        const existing = await db.jobApplication.findFirst({
          where: {
            userId: authResult.user.id,
            companyName: { contains: companyName, mode: "insensitive" },
          },
          orderBy: { updatedAt: "desc" },
        });

        const parsedDate = interviewDate ? new Date(interviewDate) : null;
        const validDate =
          parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

        if (existing) {
          // Update if status changed or new interview date
          const isNewStatus =
            existing.status !== status && status !== "Applied";
          const isNewDate =
            validDate &&
            (!existing.interviewDate ||
              existing.interviewDate.getTime() !== validDate.getTime());

          if (isNewStatus || isNewDate) {
            await db.jobApplication.update({
              where: { id: existing.id },
              data: {
                ...(isNewStatus ? { status } : {}),
                ...(isNewDate ? { interviewDate: validDate } : {}),
              },
            });
            updatedCount++;
          }
        } else {
          await db.jobApplication.create({
            data: {
              userId: authResult.user.id,
              companyName,
              jobTitle: jobTitle || "Unknown Role",
              status: status || "Applied",
              interviewDate: validDate,
              notes: `Auto-synced from email: ${email.subject}`,
            },
          });
          addedCount++;
        }
      } catch (emailError) {
        console.error("❌ Error processing email:", emailError);
        errorCount++;
      const { companyName, jobTitle, status, interviewDate } = parsedData;
      const normalizedJobTitle = jobTitle || "Unknown Role";
      const hasKnownJobTitle = Boolean(jobTitle);
      const canonicalStatus = toCanonicalStatus(status || "Applied");

      const parsedDate = interviewDate ? new Date(interviewDate) : null;
      const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

      const syncResult = await runSerializableJobApplicationSync(async (tx) => {
        const exactMatch = await tx.jobApplication.findFirst({
          where: {
            userId: user.id,
            companyName: { equals: companyName, mode: "insensitive" },
            jobTitle: { equals: normalizedJobTitle, mode: "insensitive" },
          },
          orderBy: { updatedAt: "desc" },
        });

        let existing = exactMatch;
        let shouldRecoverTitle = false;

        if (!existing && hasKnownJobTitle) {
          const fallbackMatches = await tx.jobApplication.findMany({
            where: {
              userId: user.id,
              companyName: { equals: companyName, mode: "insensitive" },
              jobTitle: { equals: "Unknown Role", mode: "insensitive" },
            },
            orderBy: { updatedAt: "desc" },
            take: 2,

      // Normalize the extracted status to its canonical value before comparing/writing
      const canonicalStatus = toCanonicalStatus(status || "Applied");

      const parsedDate = interviewDate ? new Date(interviewDate) : null;
      const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

      // Deduplicate on company AND role so distinct roles at the same company stay separate
      const existing = await db.jobApplication.findFirst({
        where: {
          userId: user.id,
          companyName: { contains: companyName, mode: "insensitive" },
          ...(jobTitle
            ? { jobTitle: { equals: jobTitle, mode: "insensitive" } }
            : {}),
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (existing) {
        // Update if status changed or new interview date
        const isNewStatus = existing.status !== canonicalStatus && canonicalStatus !== "Applied"; // Don't downgrade
        const isNewDate = validDate && (!existing.interviewDate || existing.interviewDate.getTime() !== validDate.getTime());
        const isNewTitle = jobTitle && existing.jobTitle !== jobTitle;

        if (isNewStatus || isNewDate || isNewTitle) {
          await db.jobApplication.update({
            where: { id: existing.id },
            data: {
              ...(isNewStatus ? { status: canonicalStatus } : {}),
              ...(isNewTitle ? { jobTitle } : {}),
              ...(isNewDate ? { interviewDate: validDate } : {})
            }
          });

          if (fallbackMatches.length === 1) {
            existing = fallbackMatches[0];
            shouldRecoverTitle = true;
          }
        }

        if (existing) {
          const isNewStatus = existing.status !== canonicalStatus && canonicalStatus !== "Applied"; // Don't downgrade
          const isNewDate = validDate && (!existing.interviewDate || existing.interviewDate.getTime() !== validDate.getTime());

          if (isNewStatus || isNewDate || shouldRecoverTitle) {
            await tx.jobApplication.update({
              where: { id: existing.id },
              data: {
                ...(shouldRecoverTitle ? { jobTitle: normalizedJobTitle } : {}),
                ...(isNewStatus ? { status: canonicalStatus } : {}),
                ...(isNewDate ? { interviewDate: validDate } : {}),
              },
            });
            return "updated";
          }

          return "unchanged";
        }

        await tx.jobApplication.create({
          data: {
            userId: user.id,
            companyName,
            jobTitle: normalizedJobTitle,
            jobTitle: jobTitle || "Unknown Role",
            status: canonicalStatus,
            interviewDate: validDate,
            notes: `Auto-synced from email: ${email.subject}`
          }
        });
        return "added";
      });

      if (syncResult === "added") {
        addedCount++;
      } else if (syncResult === "updated") {
        updatedCount++;
      }
    }

    console.log(
      `✅ Sync complete: Added ${addedCount}, Updated ${updatedCount}, Errors ${errorCount}`
    );

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Synced! Added ${addedCount}, Updated ${updatedCount} applications.`,
    };
  } catch (error) {
    console.error("❌ Error syncing job applications from email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sync emails.",
    };
  }
}