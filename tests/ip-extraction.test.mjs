import { expect, it, describe, vi, beforeEach } from "vitest";
import { extractTrustedClientIp } from "../lib/security/rate-limit.js";

// Mock env.js to return custom TRUSTED_PROXY_COUNT
const mockEnv = {
  TRUSTED_PROXY_COUNT: 1,
};
vi.mock("../lib/security/env.js", () => ({
  getEnv: () => mockEnv,
}));

describe("extractTrustedClientIp", () => {
  beforeEach(() => {
    mockEnv.TRUSTED_PROXY_COUNT = 1;
  });

  it("prioritizes X-Real-IP when available", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.2",
      "x-forwarded-for": "203.0.113.10, 198.51.100.5",
    });

    const ip = extractTrustedClientIp(headers);
    expect(ip).toBe("198.51.100.2");
  });

  it("extracts the non-spoofed client IP when TRUSTED_PROXY_COUNT = 1", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.5",
    });

    const ip = extractTrustedClientIp(headers);
    // Under TRUSTED_PROXY_COUNT = 1, the last entry is the trusted client IP.
    expect(ip).toBe("198.51.100.5");
  });

  it("extracts the non-spoofed client IP when TRUSTED_PROXY_COUNT = 2", () => {
    mockEnv.TRUSTED_PROXY_COUNT = 2;
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.5, 192.168.1.1",
    });

    const ip = extractTrustedClientIp(headers);
    // Under TRUSTED_PROXY_COUNT = 2, the second entry from the right is the trusted client IP.
    expect(ip).toBe("198.51.100.5");
  });

  it("falls back to the leftmost IP if the chain is shorter than TRUSTED_PROXY_COUNT", () => {
    mockEnv.TRUSTED_PROXY_COUNT = 3;
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.5",
    });

    const ip = extractTrustedClientIp(headers);
    expect(ip).toBe("198.51.100.5");
  });

  it("returns unknown when no headers are present", () => {
    const headers = new Headers({});
    const ip = extractTrustedClientIp(headers);
    expect(ip).toBe("unknown");
  });

  it("returns unknown when headers object is null/undefined", () => {
    expect(extractTrustedClientIp(null)).toBe("unknown");
  });
});
