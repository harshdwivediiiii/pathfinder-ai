"use server";
import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";

import { db } from "@/lib/db/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchRecentJobEmails } from "@/lib/google/gmail";
import { extractJobApplicationFromEmail } from "@/lib/ai/gemini";
import { validateInput } from "@/lib/ai/validate";
import { jobApplicationSchema, jobApplicationUpdateStatusSchema } from "@/lib/schemas/forms";
import { toCanonicalStatus, toDisplayStatus } from "@/lib/constants/job-application-status";

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
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: [] };

  const jobs = await db.jobApplication.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      atsAnalysis: {
        select: {
          id: true,
          atsScore: true,
        }
      },
      coverLetter: {
        select: {
          id: true,
          status: true,
        }
      }
    }
  });

  return { success: true, data: jobs };
}

export async function createJobApplication(data) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const validation = validateInput(jobApplicationSchema, data);
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
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
        userId: user.id,
        ...validation.data,
        status: toCanonicalStatus(validation.data.status),
      },
    });

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true, data: job };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function updateJobApplicationStatus(id, status) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const validation = validateInput(jobApplicationUpdateStatusSchema, { id, status });
  if (!validation.success) return { success: false, errors: validation.errors };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
    const job = await db.jobApplication.updateMany({
      where: {
        id: validation.data.id,
        userId: user.id,
      },
      data: {
        status: toCanonicalStatus(validation.data.status),
      },
    });

    if (job.count === 0) {
      return { success: false, errors: { _form: ["Job application not found"] } };
    }

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function updateJobApplicationInterviewDate(id, interviewDate) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
    const parsedDate = interviewDate ? new Date(interviewDate) : null;
    if (parsedDate && isNaN(parsedDate.getTime())) {
      return { success: false, errors: { _form: ["Invalid interview date format"] } };
    }
    const job = await db.jobApplication.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        interviewDate: parsedDate,
      },
    });

    if (job.count === 0) {
      return { success: false, errors: { _form: ["Job application not found"] } };
    }

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function deleteJobApplication(id) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
    const job = await db.jobApplication.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (job.count === 0) {
      return { success: false, errors: { _form: ["Job application not found"] } };
    }

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function disassociateAtsAnalysis(id) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
    const job = await db.jobApplication.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        atsAnalysisId: null,
      },
    });

    if (job.count === 0) {
      return { success: false, errors: { _form: ["Job application not found"] } };
    }

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function disassociateCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
    const job = await db.jobApplication.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        coverLetterId: null,
      },
    });

    if (job.count === 0) {
      return { success: false, errors: { _form: ["Job application not found"] } };
    }

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function getJobAnalytics() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: null };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, data: null };

  try {
    const jobs = await db.jobApplication.findMany({
      where: { userId: user.id },
      select: {
        status: true,
        jobTitle: true,
        companyName: true,
        atsAnalysisId: true,
        coverLetterId: true,
      }
    });

    const total = jobs.length;
    const statusCounts = {};

    // Role grouping
    const roleStats = {};
    const companyStats = {};

    jobs.forEach(job => {
      const normalizedStatus = toDisplayStatus(job.status);

      statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;

      let roleGroup = "Other";
      const titleLower = job.jobTitle.toLowerCase();
      if (titleLower.includes("engineer") || titleLower.includes("developer")) roleGroup = "Engineering";
      else if (titleLower.includes("manager") || titleLower.includes("pm")) roleGroup = "Product/Management";
      else if (titleLower.includes("design") || titleLower.includes("ui") || titleLower.includes("ux")) roleGroup = "Design";
      else if (titleLower.includes("data") || titleLower.includes("analyst")) roleGroup = "Data";

      if (!roleStats[roleGroup]) roleStats[roleGroup] = { total: 0, responses: 0 };
      roleStats[roleGroup].total += 1;
      const isResponse = ["Online Assessment (OA)", "Interview", "Offer"].includes(normalizedStatus);
      if (isResponse) {
        roleStats[roleGroup].responses += 1;
      }

      const comp = job.companyName;
      if (!companyStats[comp]) companyStats[comp] = { total: 0, responses: 0 };
      companyStats[comp].total += 1;
      if (isResponse) {
        companyStats[comp].responses += 1;
      }
    });

    const roleData = Object.keys(roleStats).map(name => ({
      name,
      total: roleStats[name].total,
      responseRate: roleStats[name].total > 0 ? (roleStats[name].responses / roleStats[name].total) * 100 : 0
    }));

    const uniqueCompanyCount = Object.keys(companyStats).length;

    const companyData = Object.keys(companyStats).map(name => ({
      name,
      total: companyStats[name].total,
      responseRate: companyStats[name].total > 0 ? (companyStats[name].responses / companyStats[name].total) * 100 : 0
    })).sort((a, b) => b.total - a.total).slice(0, 10);

    return {
      success: true,
      data: {
        total,
        statusCounts,
        roleData,
        companyData,
        uniqueCompanyCount
      }
    };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}

export async function syncJobApplicationsFromEmail() {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "Unauthorized" };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return createErrorResponse("User not found");

  try {
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(userId, "oauth_google");
    const tokens = response.data;
    if (!tokens || tokens.length === 0) {
      return { success: false, message: "No Google Account connected or missing Gmail scopes." };
    }
    
    const accessToken = tokens[0].token;
    const emails = await fetchRecentJobEmails(accessToken, 7);
    
    if (emails.length === 0) {
      return { success: true, message: "No recent job-related emails found." };
    }

    let addedCount = 0;
    let updatedCount = 0;

    for (const email of emails) {
      const parsedData = await extractJobApplicationFromEmail(email.body);
      if (!parsedData || !parsedData.companyName) continue;

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

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true, message: `Synced! Added ${addedCount}, Updated ${updatedCount} applications.` };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}
