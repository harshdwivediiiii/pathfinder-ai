import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  revalidatePath: vi.fn(),
  fetchRecentJobEmails: vi.fn(),
  extractJobApplicationFromEmail: vi.fn(),
  userFindUnique: vi.fn(),
  transaction: vi.fn(),
  tx: {
    jobApplication: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: mocks.clerkClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/google/gmail", () => ({
  fetchRecentJobEmails: mocks.fetchRecentJobEmails,
}));

vi.mock("@/lib/ai/gemini", () => ({
  extractJobApplicationFromEmail: mocks.extractJobApplicationFromEmail,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

import { syncJobApplicationsFromEmail } from "../actions/job-tracker.js";

describe("syncJobApplicationsFromEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.clerkClient.mockResolvedValue({
      users: {
        getUserOauthAccessToken: vi.fn().mockResolvedValue({
          data: [{ token: "gmail-token" }],
        }),
      },
    });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1" });
    mocks.transaction.mockImplementation(async (operation) => operation(mocks.tx));
  });

  it("recovers one unambiguous Unknown Role record when a later email has the title", async () => {
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { body: "interview email", subject: "Interview invite" },
    ]);
    mocks.extractJobApplicationFromEmail.mockResolvedValue({
      companyName: "Acme",
      jobTitle: "Frontend Engineer",
      status: "Interview",
      interviewDate: "2026-08-15T10:00:00.000Z",
    });
    mocks.tx.jobApplication.findFirst.mockResolvedValue(null);
    mocks.tx.jobApplication.findMany.mockResolvedValue([
      {
        id: "job-1",
        status: "Applied",
        interviewDate: null,
      },
    ]);
    mocks.tx.jobApplication.update.mockResolvedValue({});

    const result = await syncJobApplicationsFromEmail();

    expect(result).toEqual({
      success: true,
      message: "Synced! Added 0, Updated 1 applications.",
    });
    expect(mocks.tx.jobApplication.create).not.toHaveBeenCalled();
    expect(mocks.tx.jobApplication.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        jobTitle: "Frontend Engineer",
        status: "Interviewing",
        interviewDate: new Date("2026-08-15T10:00:00.000Z"),
      },
    });
  });

  it("keeps different roles at the same company as separate applications", async () => {
    mocks.fetchRecentJobEmails.mockResolvedValue([
      { body: "frontend email", subject: "Frontend application" },
      { body: "backend email", subject: "Backend application" },
    ]);
    mocks.extractJobApplicationFromEmail
      .mockResolvedValueOnce({
        companyName: "Acme",
        jobTitle: "Frontend Engineer",
        status: "Applied",
      })
      .mockResolvedValueOnce({
        companyName: "Acme",
        jobTitle: "Backend Engineer",
        status: "Applied",
      });
    mocks.tx.jobApplication.findFirst.mockResolvedValue(null);
    mocks.tx.jobApplication.findMany.mockResolvedValue([]);
    mocks.tx.jobApplication.create.mockResolvedValue({});

    const result = await syncJobApplicationsFromEmail();

    expect(result).toEqual({
      success: true,
      message: "Synced! Added 2, Updated 0 applications.",
    });
    expect(mocks.tx.jobApplication.create).toHaveBeenCalledTimes(2);
    expect(mocks.tx.jobApplication.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        companyName: "Acme",
        jobTitle: "Frontend Engineer",
        status: "Applied",
      }),
    });
    expect(mocks.tx.jobApplication.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        companyName: "Acme",
        jobTitle: "Backend Engineer",
        status: "Applied",
      }),
    });
  });
});
