import { describe, it, expect } from "vitest";
import { issueSchema } from "../lib/schemas/issue.js";

describe("issueSchema", () => {
  describe("valid inputs", () => {
    it("accepts a valid issue with all required fields", () => {
      const result = issueSchema.safeParse({
        title: "Bug in login page",
        description: "Login button does not respond on mobile devices",
        category: "Bug",
        priority: "High",
      });
      expect(result.success).toBe(true);
    });

    it("accepts issue with optional url field", () => {
      const result = issueSchema.safeParse({
        title: "Enhancement request",
        description: "Add dark mode support",
        category: "Feature Request",
        priority: "Medium",
        url: "https://github.com/example/repo/issues/123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty string as optional url", () => {
      const result = issueSchema.safeParse({
        title: "Minor fix",
        description: "Typo in error message",
        category: "Bug",
        priority: "Low",
        url: "",
      });
      expect(result.success).toBe(true);
    });

    it.each(["Bug", "Feature Request", "Feedback", "Support"])(
      "accepts category '%s'",
      (category) => {
        const result = issueSchema.safeParse({
          title: "Test issue",
          description: "Test description",
          category,
          priority: "Low",
        });
        expect(result.success).toBe(true);
      }
    );

    it.each(["Low", "Medium", "High"])("accepts priority '%s'", (priority) => {
      const result = issueSchema.safeParse({
        title: "Test issue",
        description: "Test description",
        category: "Bug",
        priority,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing title", () => {
      const result = issueSchema.safeParse({
        description: "Test description",
        category: "Bug",
        priority: "Low",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty string title", () => {
      const result = issueSchema.safeParse({
        title: "",
        description: "Test description",
        category: "Bug",
        priority: "Low",
      });
      expect(result.success).toBe(false);
    });

    it("rejects whitespace-only title", () => {
      const result = issueSchema.safeParse({
        title: "   ",
        description: "Test description",
        category: "Bug",
        priority: "Low",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing description", () => {
      const result = issueSchema.safeParse({
        title: "Test issue",
        category: "Bug",
        priority: "Low",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty string description", () => {
      const result = issueSchema.safeParse({
        title: "Test issue",
        description: "",
        category: "Bug",
        priority: "Low",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid category", () => {
      const result = issueSchema.safeParse({
        title: "Test issue",
        description: "Test description",
        category: "InvalidCategory",
        priority: "Low",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority", () => {
      const result = issueSchema.safeParse({
        title: "Test issue",
        description: "Test description",
        category: "Bug",
        priority: "Critical",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL format when provided", () => {
      const result = issueSchema.safeParse({
        title: "Test issue",
        description: "Test description",
        category: "Bug",
        priority: "Low",
        url: "not-a-valid-url",
      });
      expect(result.success).toBe(false);
    });
  });
});
