import { describe, expect, it } from "vitest";
import {
  success,
  miss,
  error,
  unwrap,
  isSuccess,
  isMiss,
  isError,
  ResultStatus,
} from "../lib/db/redis-result.js";

describe("redis-result utility", () => {
  describe("success", () => {
    it("creates a success result object", () => {
      const result = success("test-value");
      expect(result.status).toBe(ResultStatus.SUCCESS);
      expect(result.value).toBe("test-value");
      expect(result.isSuccess).toBe(true);
      expect(result.isMiss).toBe(false);
      expect(result.isError).toBe(false);
    });

    it("handles null values", () => {
      const result = success(null);
      expect(result.status).toBe(ResultStatus.SUCCESS);
      expect(result.value).toBe(null);
      expect(result.isSuccess).toBe(true);
    });

    it("handles undefined values", () => {
      const result = success(undefined);
      expect(result.status).toBe(ResultStatus.SUCCESS);
      expect(result.value).toBe(undefined);
      expect(result.isSuccess).toBe(true);
    });
  });

  describe("miss", () => {
    it("creates a miss result object", () => {
      const result = miss();
      expect(result.status).toBe(ResultStatus.MISS);
      expect(result.value).toBe(null);
      expect(result.isSuccess).toBe(false);
      expect(result.isMiss).toBe(true);
      expect(result.isError).toBe(false);
    });
  });

  describe("error", () => {
    it("creates an error result object with sanitized error", () => {
      const err = new Error("Connection failed");
      const result = error(err, "get");
      expect(result.status).toBe(ResultStatus.ERROR);
      expect(result.value).toBe(null);
      expect(result.isSuccess).toBe(false);
      expect(result.isMiss).toBe(false);
      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe("Connection failed");
      expect(result.error.operation).toBe("get");
      expect(result.error.retryable).toBe(true);
      expect(result.error.timestamp).toBeGreaterThan(0);
    });

    it("sanitizes error messages containing passwords", () => {
      const err = new Error("redis://user:secret@localhost:6379");
      const result = error(err, "connect");
      expect(result.error.message).not.toContain("secret");
      expect(result.error.message).toContain("***");
    });

    it("sanitizes error messages containing auth parameters", () => {
      const err = new Error("auth=wrongpassword");
      const result = error(err, "auth");
      expect(result.error.message).not.toContain("wrongpassword");
      expect(result.error.message).toContain("auth=***");
    });

    it("identifies retryable connection errors", () => {
      const err = new Error("ECONNREFUSED");
      const result = error(err, "connect");
      expect(result.error.retryable).toBe(true);
    });

    it("identifies retryable timeout errors", () => {
      const err = new Error("ETIMEDOUT");
      const result = error(err, "get");
      expect(result.error.retryable).toBe(true);
    });

    it("identifies non-retryable authentication errors", () => {
      const err = new Error("NOAUTH Authentication required");
      const result = error(err, "auth");
      expect(result.error.retryable).toBe(false);
    });

    it("handles null errors gracefully", () => {
      const result = error(null, "get");
      expect(result.error.message).toBe("Unknown error");
    });

    it("handles undefined errors gracefully", () => {
      const result = error(undefined, "set");
      expect(result.error.message).toBe("Unknown error");
    });
  });

  describe("unwrap", () => {
    it("returns value from success result", () => {
      const result = success("test-value");
      expect(unwrap(result)).toBe("test-value");
    });

    it("returns null from miss result", () => {
      const result = miss();
      expect(unwrap(result)).toBe(null);
    });

    it("returns null from error result", () => {
      const result = error(new Error("test"), "get");
      expect(unwrap(result)).toBe(null);
    });

    it("returns null for null input", () => {
      expect(unwrap(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(unwrap(undefined)).toBe(null);
    });

    it("returns null for non-object input", () => {
      expect(unwrap("string")).toBe(null);
      expect(unwrap(123)).toBe(null);
    });
  });

  describe("isSuccess", () => {
    it("returns true for success result", () => {
      expect(isSuccess(success("value"))).toBe(true);
    });

    it("returns false for miss result", () => {
      expect(isSuccess(miss())).toBe(false);
    });

    it("returns false for error result", () => {
      expect(isSuccess(error(new Error("test"), "get"))).toBe(false);
    });

    it("returns false for null input", () => {
      expect(isSuccess(null)).toBe(false);
    });
  });

  describe("isMiss", () => {
    it("returns true for miss result", () => {
      expect(isMiss(miss())).toBe(true);
    });

    it("returns false for success result", () => {
      expect(isMiss(success("value"))).toBe(false);
    });

    it("returns false for error result", () => {
      expect(isMiss(error(new Error("test"), "get"))).toBe(false);
    });

    it("returns false for null input", () => {
      expect(isMiss(null)).toBe(false);
    });
  });

  describe("isError", () => {
    it("returns true for error result", () => {
      expect(isError(error(new Error("test"), "get"))).toBe(true);
    });

    it("returns false for success result", () => {
      expect(isError(success("value"))).toBe(false);
    });

    it("returns false for miss result", () => {
      expect(isError(miss())).toBe(false);
    });

    it("returns false for null input", () => {
      expect(isError(null)).toBe(false);
    });
  });

  describe("ResultStatus enum", () => {
    it("has correct status values", () => {
      expect(ResultStatus.SUCCESS).toBe("success");
      expect(ResultStatus.MISS).toBe("miss");
      expect(ResultStatus.ERROR).toBe("error");
    });
  });

  describe("backward compatibility", () => {
    it("allows distinguishing cache miss from Redis failure", () => {
      const missResult = miss();
      const errorResult = error(new Error("Redis down"), "get");

      // Both return null when unwrapped (backward compatible)
      expect(unwrap(missResult)).toBe(null);
      expect(unwrap(errorResult)).toBe(null);

      // But can be distinguished using status checks
      expect(isMiss(missResult)).toBe(true);
      expect(isError(missResult)).toBe(false);
      expect(isMiss(errorResult)).toBe(false);
      expect(isError(errorResult)).toBe(true);
    });
  });
});
