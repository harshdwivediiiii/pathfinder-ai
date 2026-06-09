"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
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
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

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
    console.error("Failed to create job application:", error);
    return { success: false, errors: { _form: ["Failed to create job application"] } };
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
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

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
    console.error("Failed to update job status:", error);
    return { success: false, errors: { _form: ["Failed to update job status"] } };
  }
}

export async function updateJobApplicationInterviewDate(id, interviewDate) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

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
    console.error("Failed to update interview date:", error);
    return { success: false, errors: { _form: ["Failed to update interview date"] } };
  }
}

export async function deleteJobApplication(id) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

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
    console.error("Failed to delete job application:", error);
    return { success: false, errors: { _form: ["Failed to delete job application"] } };
  }
}
