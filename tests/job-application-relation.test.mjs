import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.GEMINI_API_KEY = "dummy-api-key";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  atsAnalysisDeleteMany: vi.fn(),
  coverLetterDeleteMany: vi.fn(),
  jobApplicationFindMany: vi.fn(),
  jobApplicationUpdateMany: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    atsAnalysis: {
      deleteMany: mocks.atsAnalysisDeleteMany,
    },
    coverLetter: {
      deleteMany: mocks.coverLetterDeleteMany,
    },
    jobApplication: {
      findMany: mocks.jobApplicationFindMany,
      updateMany: mocks.jobApplicationUpdateMany,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { deleteATSAnalysis } from "../actions/ats.js";
import { deleteCoverLetter } from "../actions/cover-letter.js";
import { disassociateAtsAnalysis, disassociateCoverLetter } from "../actions/job-tracker.js";

describe("Job Application Relation Deletion Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteATSAnalysis", () => {
    it("should prevent deletion when ATS analysis is referenced by job applications", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationFindMany.mockResolvedValue([
        { id: "job-1", jobTitle: "Software Engineer", companyName: "Tech Corp" },
        { id: "job-2", jobTitle: "Senior Developer", companyName: "Startup Inc" },
      ]);

      const result = await deleteATSAnalysis("analysis-1");

      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("Cannot delete");
      expect(result.errors._form[0]).toContain("referenced by 2 job application(s)");
      expect(mocks.atsAnalysisDeleteMany).not.toHaveBeenCalled();
    });

    it("should allow deletion when ATS analysis is not referenced", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationFindMany.mockResolvedValue([]);
      mocks.atsAnalysisDeleteMany.mockResolvedValue({ count: 1 });

      const result = await deleteATSAnalysis("analysis-1");

      expect(result.success).toBe(true);
      expect(mocks.atsAnalysisDeleteMany).toHaveBeenCalledWith({
        where: {
          id: "analysis-1",
          userId: "db-user-1",
        },
      });
    });

    it("should show job application names in error message", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationFindMany.mockResolvedValue([
        { id: "job-1", jobTitle: "Software Engineer", companyName: "Tech Corp" },
      ]);

      const result = await deleteATSAnalysis("analysis-1");

      expect(result.errors._form[0]).toContain("Software Engineer at Tech Corp");
    });
  });

  describe("deleteCoverLetter", () => {
    it("should prevent deletion when cover letter is referenced by job applications", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationFindMany.mockResolvedValue([
        { id: "job-1", jobTitle: "Product Manager", companyName: "Big Tech" },
      ]);

      const result = await deleteCoverLetter("cover-letter-1");

      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("Cannot delete");
      expect(result.errors._form[0]).toContain("referenced by 1 job application(s)");
      expect(mocks.coverLetterDeleteMany).not.toHaveBeenCalled();
    });

    it("should allow deletion when cover letter is not referenced", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationFindMany.mockResolvedValue([]);
      mocks.coverLetterDeleteMany.mockResolvedValue({ count: 1 });

      const result = await deleteCoverLetter("cover-letter-1");

      expect(result.success).toBe(true);
      expect(mocks.coverLetterDeleteMany).toHaveBeenCalledWith({
        where: {
          id: "cover-letter-1",
          userId: "db-user-1",
        },
      });
    });
  });

  describe("disassociateAtsAnalysis", () => {
    it("should successfully disassociate ATS analysis from job application", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationUpdateMany.mockResolvedValue({ count: 1 });

      const result = await disassociateAtsAnalysis("job-1");

      expect(result.success).toBe(true);
      expect(mocks.jobApplicationUpdateMany).toHaveBeenCalledWith({
        where: {
          id: "job-1",
          userId: "db-user-1",
        },
        data: {
          atsAnalysisId: null,
        },
      });
    });

    it("should return error when job application not found", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationUpdateMany.mockResolvedValue({ count: 0 });

      const result = await disassociateAtsAnalysis("job-1");

      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("Job application not found");
    });
  });

  describe("disassociateCoverLetter", () => {
    it("should successfully disassociate cover letter from job application", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationUpdateMany.mockResolvedValue({ count: 1 });

      const result = await disassociateCoverLetter("job-1");

      expect(result.success).toBe(true);
      expect(mocks.jobApplicationUpdateMany).toHaveBeenCalledWith({
        where: {
          id: "job-1",
          userId: "db-user-1",
        },
        data: {
          coverLetterId: null,
        },
      });
    });

    it("should return error when job application not found", async () => {
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationUpdateMany.mockResolvedValue({ count: 0 });

      const result = await disassociateCoverLetter("job-1");

      expect(result.success).toBe(false);
      expect(result.errors._form[0]).toContain("Job application not found");
    });
  });

  describe("referential integrity workflow", () => {
    it("should allow deletion after disassociation", async () => {
      // Step 1: Try to delete - should fail
      mocks.auth.mockResolvedValue({ userId: "user-1" });
      mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
      mocks.jobApplicationFindMany.mockResolvedValue([
        { id: "job-1", jobTitle: "Engineer", companyName: "Tech" },
      ]);

      let result = await deleteATSAnalysis("analysis-1");
      expect(result.success).toBe(false);

      // Step 2: Disassociate
      mocks.jobApplicationUpdateMany.mockResolvedValue({ count: 1 });
      result = await disassociateAtsAnalysis("job-1");
      expect(result.success).toBe(true);

      // Step 3: Try to delete again - should succeed
      mocks.jobApplicationFindMany.mockResolvedValue([]);
      mocks.atsAnalysisDeleteMany.mockResolvedValue({ count: 1 });
      result = await deleteATSAnalysis("analysis-1");
      expect(result.success).toBe(true);
    });
  });
});
