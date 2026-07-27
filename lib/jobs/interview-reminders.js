import "server-only";
import { db } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { log } from "@/lib/jobs/logger";
import { JOB_APPLICATION_STATUS } from "@/lib/constants/job-application-status";

let _cronFnPromise;

/**
 * Core execution logic for interview reminders.
 * Extracted to allow comprehensive regression and unit testing.
 */
export async function processInterviewRemindersJob({
  step,
  dbClient = db,
  sendEmailFn = sendEmail,
  logLogger = log,
  currentTime = new Date(),
}) {
  const now = currentTime;
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueJobs = await step.run("Fetch due interviews", async () => {
    return dbClient.jobApplication.findMany({
      where: {
        status: JOB_APPLICATION_STATUS.INTERVIEWING,
        interviewDate: { gte: now, lte: windowEnd },
        interviewReminderSentAt: null,
      },
      include: {
        user: { include: { settings: true } },
      },
    });
  });

  let sent = 0;
  for (const job of dueJobs) {
    const emailAlertsOn = job.user?.settings?.emailAlerts ?? true;
    if (!emailAlertsOn || !job.user?.email) continue;

    await step.run(`Send reminder ${job.id}`, async () => {
      await sendEmailFn({
        to: job.user.email,
        subject: `Interview reminder: ${job.jobTitle} at ${job.companyName}`,
        html: `<p>Your interview for <strong>${job.jobTitle}</strong> at <strong>${job.companyName}</strong> is coming up on ${new Date(job.interviewDate).toLocaleString()}.</p>`,
      });
      await dbClient.jobApplication.update({
        where: { id: job.id },
        data: { interviewReminderSentAt: new Date() },
      });
    });
    sent++;
  }

  logLogger.info("send-interview-reminders-cron", "Reminders processed", { sent, checked: dueJobs.length });
  return { sent, checked: dueJobs.length };
}

/**
 * Daily cron: emails users about interviews happening in the next 24–48h,
 * but only if their UserSettings.emailAlerts is true, and only once per
 * interview (guarded by interviewReminderSentAt).
 */
export function getSendInterviewReminders() {
  if (!_cronFnPromise) {
    _cronFnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();

      return inngest.createFunction(
        {
          id: "send-interview-reminders-cron",
          name: "Send Interview Reminders",
          rateLimit: { limit: 1, period: "12h" },
        },
        { cron: "0 8 * * *" }, // daily 8am UTC
        async ({ step }) => processInterviewRemindersJob({ step })
      );
    })();
  }
  return _cronFnPromise;
}