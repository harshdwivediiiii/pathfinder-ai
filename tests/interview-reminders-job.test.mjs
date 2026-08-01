import { describe, expect, it, vi, beforeEach } from "vitest";
import { processInterviewRemindersJob, getSendInterviewReminders } from "@/lib/jobs/interview-reminders";
import { JOB_APPLICATION_STATUS } from "@/lib/constants/job-application-status";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  sendEmail: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  db: { jobApplication: { findMany: mocks.findMany, update: mocks.update } },
}));

vi.mock("@/lib/email/send-email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/jobs/logger", () => ({
  log: { info: mocks.logInfo, error: mocks.logError, warn: vi.fn() },
}));

describe("interview reminder logic", () => {
  const step = {
    run: async (name, fn) => fn(),
  };

  const mockDb = {
    jobApplication: {
      findMany: mocks.findMany,
      update: mocks.update,
    },
  };

  const mockLogger = {
    info: mocks.logInfo,
    error: mocks.logError,
    warn: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Reminder Selection & Status Filtering (Regression Test)", () => {
    it("queries database using canonical 'Interviewing' status and window range", async () => {
      mocks.findMany.mockResolvedValue([]);
      const now = new Date("2026-07-27T10:00:00.000Z");

      await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
        currentTime: now,
      });

      expect(mocks.findMany).toHaveBeenCalledTimes(1);
      const queryArgs = mocks.findMany.mock.calls[0][0];

      // CRITICAL REGRESSION ASSERTION: status MUST be "Interviewing"
      expect(queryArgs.where.status).toBe("Interviewing");
      expect(queryArgs.where.status).toBe(JOB_APPLICATION_STATUS.INTERVIEWING);
      expect(queryArgs.where.status).not.toBe("Interview");

      // Verify date window filter (now to now + 24h)
      expect(queryArgs.where.interviewDate.gte).toEqual(now);
      const expectedEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(queryArgs.where.interviewDate.lte).toEqual(expectedEnd);

      // Verify duplicate protection filter
      expect(queryArgs.where.interviewReminderSentAt).toBeNull();
    });

    it("successfully selects and processes applications with status 'Interviewing'", async () => {
      const interviewDate = new Date("2026-07-27T14:00:00.000Z");
      const dueJob = {
        id: "job-1",
        jobTitle: "Software Engineer",
        companyName: "TechCorp",
        interviewDate,
        status: JOB_APPLICATION_STATUS.INTERVIEWING,
        user: {
          email: "candidate@example.com",
          settings: { emailAlerts: true },
        },
      };

      mocks.findMany.mockResolvedValue([dueJob]);
      mocks.sendEmail.mockResolvedValue({ id: "msg-1" });
      mocks.update.mockResolvedValue({ id: "job-1" });

      const result = await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      expect(result).toEqual({ sent: 1, checked: 1 });
      expect(mocks.sendEmail).toHaveBeenCalledWith({
        to: "candidate@example.com",
        subject: "Interview reminder: Software Engineer at TechCorp",
        html: expect.stringContaining("Software Engineer"),
      });
      expect(mocks.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { interviewReminderSentAt: expect.any(Date) },
      });
      expect(mocks.logInfo).toHaveBeenCalledWith(
        "send-interview-reminders-cron",
        "Reminders processed",
        { sent: 1, checked: 1 }
      );
    });
  });

  describe("Reminder Delivery & Duplicate Protection", () => {
    it("persists interviewReminderSentAt in the same step as the email send", async () => {
      const dueJob = {
        id: "job-2",
        jobTitle: "Product Manager",
        companyName: "InnoTech",
        interviewDate: new Date(),
        user: { email: "pm@example.com", settings: { emailAlerts: true } },
      };

      mocks.findMany.mockResolvedValue([dueJob]);
      mocks.sendEmail.mockResolvedValue({});
      mocks.update.mockResolvedValue({});

      await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
      expect(mocks.update).toHaveBeenCalledTimes(1);
      expect(mocks.update).toHaveBeenCalledWith({
        where: { id: "job-2" },
        data: { interviewReminderSentAt: expect.any(Date) },
      });
    });

    it("marks interviewReminderSentAt before sending so the idempotency guard blocks re-sends", async () => {
      const dueJob = {
        id: "job-2",
        jobTitle: "Product Manager",
        companyName: "InnoTech",
        interviewDate: new Date(),
        user: { email: "pm@example.com", settings: { emailAlerts: true } },
      };

      mocks.findMany.mockResolvedValue([dueJob]);
      const callOrder = [];
      mocks.update.mockImplementation(async () => {
        callOrder.push("update");
        return {};
      });
      mocks.sendEmail.mockImplementation(async () => {
        callOrder.push("send");
        return {};
      });

      await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      // If the flag is persisted first, a failure or retry between the two
      // awaits can never produce a duplicate reminder.
      expect(callOrder).toEqual(["update", "send"]);
    });

    it("does not process jobs where interviewReminderSentAt is already populated", async () => {
      // The DB query filters out interviewReminderSentAt != null
      mocks.findMany.mockResolvedValue([]);

      const result = await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      expect(result.sent).toBe(0);
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    });
  });

  describe("Batch Isolation (Regression Test)", () => {
    it("a failing email for one job does not block reminders for the remaining jobs", async () => {
      const jobs = [
        {
          id: "job-fail",
          jobTitle: "Backend Dev",
          companyName: "Acme",
          interviewDate: new Date(),
          user: { email: "a@test.com", settings: { emailAlerts: true } },
        },
        {
          id: "job-ok",
          jobTitle: "Frontend Dev",
          companyName: "Acme",
          interviewDate: new Date(),
          user: { email: "b@test.com", settings: { emailAlerts: true } },
        },
      ];

      mocks.findMany.mockResolvedValue(jobs);
      mocks.sendEmail.mockRejectedValueOnce(new Error("smtp unavailable"));
      mocks.sendEmail.mockResolvedValueOnce({ id: "msg-ok" });
      mocks.update.mockResolvedValue({});

      const result = await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      // The second job is still processed despite the first failing.
      expect(result).toEqual({ sent: 1, checked: 2 });
      expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
      expect(mocks.update).toHaveBeenCalledTimes(2);
      expect(mocks.logError).toHaveBeenCalledWith(
        "send-interview-reminders-cron",
        expect.any(Error),
        { jobId: "job-fail" }
      );
    });

    it("persists the reminder flag even when the email fails so a re-run cannot re-send", async () => {
      const dueJob = {
        id: "job-fail",
        jobTitle: "Backend Dev",
        companyName: "Acme",
        interviewDate: new Date(),
        user: { email: "a@test.com", settings: { emailAlerts: true } },
      };

      mocks.findMany.mockResolvedValue([dueJob]);
      mocks.update.mockResolvedValue({});
      mocks.sendEmail.mockRejectedValue(new Error("smtp unavailable"));

      const result = await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      // The flag was already persisted, so the interview is dropped from the
      // next run's query (interviewReminderSentAt: null) and never re-sent.
      expect(result).toEqual({ sent: 0, checked: 1 });
      expect(mocks.update).toHaveBeenCalledTimes(1);
      expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
      expect(mocks.logError).toHaveBeenCalledTimes(1);
    });
  });

  describe("Email Preferences & Missing Email Guards", () => {
    it("skips users with emailAlerts disabled", async () => {
      mocks.findMany.mockResolvedValue([
        {
          id: "job-3",
          jobTitle: "Backend Dev",
          companyName: "Acme",
          interviewDate: new Date(),
          user: { email: "a@test.com", settings: { emailAlerts: false } },
        },
      ]);

      const result = await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      expect(result).toEqual({ sent: 0, checked: 1 });
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it("skips jobs where user email is missing or empty", async () => {
      mocks.findMany.mockResolvedValue([
        {
          id: "job-4",
          jobTitle: "DevOps Engineer",
          companyName: "CloudCo",
          interviewDate: new Date(),
          user: { email: null, settings: { emailAlerts: true } },
        },
        {
          id: "job-5",
          jobTitle: "Site Reliability Engineer",
          companyName: "CloudCo",
          interviewDate: new Date(),
          user: { email: "", settings: { emailAlerts: true } },
        },
      ]);

      const result = await processInterviewRemindersJob({
        step,
        dbClient: mockDb,
        sendEmailFn: mocks.sendEmail,
        logLogger: mockLogger,
      });

      expect(result).toEqual({ sent: 0, checked: 2 });
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    });
  });

  describe("Exported Function Structure & Cron Registration", () => {
    it("exports getSendInterviewReminders function", () => {
      expect(typeof getSendInterviewReminders).toBe("function");
    });
  });
});
