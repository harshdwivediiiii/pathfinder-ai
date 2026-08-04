import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  JOB_APPLICATION_STATUS,
  toCanonicalStatus,
  toDisplayStatus,
} from "@/lib/constants/job-application-status";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  findUniqueUser: vi.fn(),
  createJobApplication: vi.fn(),
  updateJobApplicationMany: vi.fn(),
  fetchRecentJobEmails: vi.fn(),
  extractJobApplicationFromEmail: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: mocks.clerkClient,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    jobApplication: {
      create: mocks.createJobApplication,
      updateMany: mocks.updateJobApplicationMany,
    },
  },
}));

vi.mock("@/lib/google/gmail", () => ({
  fetchRecentJobEmails: mocks.fetchRecentJobEmails,
}));

vi.mock("@/lib/ai/gemini", () => ({
  extractJobApplicationFromEmail: mocks.extractJobApplicationFromEmail,
}));

vi.mock("@/lib/errors/error-handler", () => ({
  handleServerError: (error) => ({ success: false, errors: { _form: [error.message] } }),
}));

vi.mock("@/lib/action-helpers/action-errors", () => ({
  createErrorResponse: (message) => ({ success: false, errors: { _form: [message] } }),
}));

import { createJobApplication, updateJobApplicationStatus } from "../actions/job-tracker.js";
import { getUpcomingInterviews } from "../lib/jobs/upcoming-interviews.js";

describe("job application status vocabulary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toCanonicalStatus / toDisplayStatus helpers", () => {
    it("maps display labels to canonical database values", () => {
      expect(toCanonicalStatus("Interview")).toBe(JOB_APPLICATION_STATUS.INTERVIEWING);
      expect(toCanonicalStatus("Offer")).toBe(JOB_APPLICATION_STATUS.OFFER_RECEIVED);
      expect(toCanonicalStatus("Wishlist")).toBe(JOB_APPLICATION_STATUS.SAVED);
      expect(toCanonicalStatus("Applied")).toBe(JOB_APPLICATION_STATUS.APPLIED);
      expect(toCanonicalStatus("Rejected")).toBe(JOB_APPLICATION_STATUS.REJECTED);
    });

    it("maps canonical database values to display labels", () => {
      expect(toDisplayStatus(JOB_APPLICATION_STATUS.INTERVIEWING)).toBe("Interview");
      expect(toDisplayStatus(JOB_APPLICATION_STATUS.OFFER_RECEIVED)).toBe("Offer");
      expect(toDisplayStatus(JOB_APPLICATION_STATUS.WISHLIST)).toBe("Saved");
      expect(toDisplayStatus(JOB_APPLICATION_STATUS.APPLIED)).toBe("Applied");
      expect(toDisplayStatus(JOB_APPLICATION_STATUS.REJECTED)).toBe("Rejected");
    });

    it("leaves unknown statuses unchanged", () => {
      expect(toCanonicalStatus("Not a real status")).toBe("Not a real status");
      expect(toDisplayStatus("Not a real status")).toBe("Not a real status");
    });
  });

  describe("UI write path persists canonical statuses (regression)", () => {
    it("createJobApplication persists canonical Interviewing when the UI sends 'Interview'", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.createJobApplication.mockImplementation(async ({ data }) => ({ id: "job-1", ...data }));

      const result = await createJobApplication({
        companyName: "Acme",
        jobTitle: "Software Engineer",
        status: "Interview",
      });

      expect(result.success).toBe(true);
      expect(mocks.createJobApplication).toHaveBeenCalledTimes(1);
      const createArgs = mocks.createJobApplication.mock.calls[0][0];
      expect(createArgs.data.status).toBe(JOB_APPLICATION_STATUS.INTERVIEWING);
      expect(createArgs.data.status).not.toBe("Interview");
    });

    it("updateJobApplicationStatus persists canonical Offer Received when the UI sends 'Offer'", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.updateJobApplicationMany.mockResolvedValue({ count: 1 });

      const result = await updateJobApplicationStatus("job-1", "Offer");

      expect(result.success).toBe(true);
      expect(mocks.updateJobApplicationMany).toHaveBeenCalledTimes(1);
      const updateArgs = mocks.updateJobApplicationMany.mock.calls[0][0];
      expect(updateArgs.data.status).toBe(JOB_APPLICATION_STATUS.OFFER_RECEIVED);
      expect(updateArgs.data.status).not.toBe("Offer");
    });
  });

  describe("getUpcomingInterviews (regression)", () => {
    it("queries canonical Interviewing so synced jobs appear in the dashboard widget", async () => {
      const findMany = vi.fn().mockResolvedValue([
        {
          id: "job-synced",
          jobTitle: "Backend Engineer",
          companyName: "CloudCo",
          interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      ]);

      const result = await getUpcomingInterviews("db-user-1", {
        jobApplication: { findMany },
      });

      expect(findMany).toHaveBeenCalledTimes(1);
      const queryArgs = findMany.mock.calls[0][0];
      expect(queryArgs.where.userId).toBe("db-user-1");
      expect(queryArgs.where.status).toBe(JOB_APPLICATION_STATUS.INTERVIEWING);
      expect(queryArgs.where.status).not.toBe("Interview");

      // A Gmail-synced job stored with the canonical "Interviewing" status is returned.
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("job-synced");
    });

    it("excludes interviews outside the 3-day window", async () => {
      const findMany = vi.fn().mockResolvedValue([
        {
          id: "job-far",
          jobTitle: "Frontend Engineer",
          companyName: "Acme",
          interviewDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
      ]);

      const result = await getUpcomingInterviews("db-user-1", {
        jobApplication: { findMany },
      });

      expect(result).toHaveLength(0);
    });
  });
});
