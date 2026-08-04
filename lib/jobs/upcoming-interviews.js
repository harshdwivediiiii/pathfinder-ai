import "server-only";
import { db } from "@/lib/db/prisma";
import { JOB_APPLICATION_STATUS } from "@/lib/constants/job-application-status";

/**
 * Returns job applications with an upcoming interview in the next 3 days for
 * the given user. Filters on the canonical INTERVIEWING status so both
 * UI-created and Gmail-synced jobs are included.
 */
export async function getUpcomingInterviews(userId, dbClient = db) {
  const jobs = await dbClient.jobApplication.findMany({
    where: {
      userId,
      status: JOB_APPLICATION_STATUS.INTERVIEWING,
      interviewDate: { not: null },
    },
    select: {
      id: true,
      jobTitle: true,
      companyName: true,
      interviewDate: true,
    },
  });

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return jobs.filter((job) => {
    const interviewTime = new Date(job.interviewDate);
    return interviewTime >= now && interviewTime <= threeDaysFromNow;
  });
}
