"use server";
import { handleServerError } from "@/lib/error-handler";
import { createErrorResponse } from "@/lib/action-errors";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { fetchRecentJobEmails } from "@/lib/google/gmail";
import { extractJobApplicationFromEmail } from "@/lib/gemini";
import { validateInput } from "@/lib/validate";
import { jobApplicationSchema, jobApplicationUpdateStatusSchema } from "@/lib/schemas/forms";

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
    const job = await db.jobApplication.create({
      data: {
        userId: user.id,
        ...validation.data,
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
        status: validation.data.status,
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
      let normalizedStatus = job.status;
      if (normalizedStatus === "Interviewing") normalizedStatus = "Interview";
      if (normalizedStatus === "Offer Received") normalizedStatus = "Offer";
      if (normalizedStatus === "Wishlist") normalizedStatus = "Saved";

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

      // Find existing by company (basic deduplication)
      const existing = await db.jobApplication.findFirst({
        where: {
          userId: user.id,
          companyName: { contains: companyName, mode: "insensitive" }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const parsedDate = interviewDate ? new Date(interviewDate) : null;
      const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

      if (existing) {
        // Update if status changed or new interview date
        const isNewStatus = existing.status !== status && status !== "Applied"; // Don't downgrade
        const isNewDate = validDate && (!existing.interviewDate || existing.interviewDate.getTime() !== validDate.getTime());
        
        if (isNewStatus || isNewDate) {
          await db.jobApplication.update({
            where: { id: existing.id },
            data: {
              ...(isNewStatus ? { status } : {}),
              ...(isNewDate ? { interviewDate: validDate } : {})
            }
          });
          updatedCount++;
        }
      } else {
        await db.jobApplication.create({
          data: {
            userId: user.id,
            companyName,
            jobTitle: jobTitle || "Unknown Role",
            status: status || "Applied",
            interviewDate: validDate,
            notes: `Auto-synced from email: ${email.subject}`
          }
        });
        addedCount++;
      }
    }

    revalidatePath("/job-tracker");
    revalidatePath("/dashboard");
    return { success: true, message: `Synced! Added ${addedCount}, Updated ${updatedCount} applications.` };
  } catch (error) {
    return handleServerError(error, "job-tracker");
  }
}
