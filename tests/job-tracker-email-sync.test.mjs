import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.GEMINI_API_KEY = "dummy-api-key";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUserOauthAccessToken: vi.fn(),
  findUniqueUser: vi.fn(),
  jobApplicationFindFirst: vi.fn(),
  jobApplicationUpdate: vi.fn(),
  jobApplicationCreate: vi.fn(),
  fetchRecentJobEmails: vi.fn(),
  extractJobApplicationFromEmail: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: async () => ({
    users: {
      getUserOauthAccessToken: mocks.getUserOauthAccessToken,
    },
  }),
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    jobApplication: {
      findFirst: mocks.jobApplicationFindFirst,
      update: mocks.jobApplicationUpdate,
      create: mocks.jobApplicationCreate,
    },
  },
}));

vi.mock("@/lib/google/gmail", () => ({
  fetchRecentJobEmails: mocks.fetchRecentJobEmails,
}));

vi.mock("@/lib/ai/gemini", () => ({
  extractJobApplicationFromEmail: mocks.extractJobApplicationFromEmail,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { syncJobApplicationsFromEmail } from "../actions/job-tracker.js";

describe("syncJobApplicationsFromEmail deduplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.getUserOauthAccessToken.mockResolvedValue({ data: [{ token: "google-token" }] });
    mocks.jobApplicationFindFirst.mockResolvedValue(null);
  });

  it("creates separate records for distinct roles at the same company", async () => {
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { subject: "Interview at Acme", body: "acme-se1" },
      { subject: "Rejected by Acme", body: "acme-se2" },
    ]);
    mocks.extractJobApplicationFromEmail
      .mockResolvedValueOnce({ companyName: "Acme", jobTitle: "Software Engineer", status: "Interview", interviewDate: "2026-08-15T10:00:00.000Z" })
      .mockResolvedValueOnce({ companyName: "Acme", jobTitle: "Frontend Developer", status: "Rejected", interviewDate: null });

    const result = await syncJobApplicationsFromEmail();

    expect(result.success).toBe(true);
    expect(result.message).toContain("Added 2");
    expect(mocks.jobApplicationCreate).toHaveBeenCalledTimes(2);
    const createdCompanies = mocks.jobApplicationCreate.mock.calls.map(([args]) => args.data.companyName);
    const createdTitles = mocks.jobApplicationCreate.mock.calls.map(([args]) => args.data.jobTitle);
    expect(createdCompanies).toEqual(["Acme", "Acme"]);
    expect(createdTitles).toEqual(["Software Engineer", "Frontend Developer"]);
  });

  it("deduplicates on company AND role and canonicalizes the status", async () => {
    mocks.jobApplicationFindFirst.mockResolvedValue({
      id: "job-1",
      companyName: "Acme",
      jobTitle: "Software Engineer",
      status: "Applied",
      interviewDate: null,
    });
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { subject: "Interview at Acme", body: "acme-se" },
    ]);
    mocks.extractJobApplicationFromEmail.mockResolvedValue({
      companyName: "Acme",
      jobTitle: "Software Engineer",
      status: "Interview",
      interviewDate: "2026-08-15T10:00:00.000Z",
    });

    const result = await syncJobApplicationsFromEmail();

    expect(result.success).toBe(true);
    expect(result.message).toContain("Updated 1");
    expect(mocks.jobApplicationCreate).not.toHaveBeenCalled();
    expect(mocks.jobApplicationUpdate).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "Interviewing",
        interviewDate: new Date("2026-08-15T10:00:00.000Z"),
      },
    });
    expect(mocks.jobApplicationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "db-user-1",
          companyName: { contains: "Acme", mode: "insensitive" },
          jobTitle: { equals: "Software Engineer", mode: "insensitive" },
        }),
      })
    );
  });

  it("updates the job title on an existing record when extraction differs", async () => {
    mocks.jobApplicationFindFirst.mockResolvedValue({
      id: "job-1",
      companyName: "Acme",
      jobTitle: "Senior SWE",
      status: "Applied",
      interviewDate: null,
    });
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { subject: "Acme application", body: "acme-se" },
    ]);
    mocks.extractJobApplicationFromEmail.mockResolvedValue({
      companyName: "Acme",
      jobTitle: "Staff Software Engineer",
      status: "Applied",
      interviewDate: null,
    });

    const result = await syncJobApplicationsFromEmail();

    expect(result.message).toContain("Updated 1");
    expect(mocks.jobApplicationUpdate).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        jobTitle: "Staff Software Engineer",
      },
    });
  });

  it("does not downgrade a canonical status to Applied on re-sync", async () => {
    mocks.jobApplicationFindFirst.mockResolvedValue({
      id: "job-1",
      companyName: "Acme",
      jobTitle: "Software Engineer",
      status: "Offer Received",
      interviewDate: null,
    });
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { subject: "Acme follow-up", body: "acme-se" },
    ]);
    mocks.extractJobApplicationFromEmail.mockResolvedValue({
      companyName: "Acme",
      jobTitle: "Software Engineer",
      status: "Applied",
      interviewDate: null,
    });

    const result = await syncJobApplicationsFromEmail();

    expect(result.message).toContain("Updated 0");
    expect(mocks.jobApplicationUpdate).not.toHaveBeenCalled();
  });

  it("skips emails without a company name", async () => {
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { subject: "Newsletter", body: "newsletter-body" },
    ]);
    mocks.extractJobApplicationFromEmail.mockResolvedValue(null);

    const result = await syncJobApplicationsFromEmail();

    expect(result.success).toBe(true);
    expect(result.message).toContain("Added 0");
    expect(mocks.jobApplicationCreate).not.toHaveBeenCalled();
  });
});
