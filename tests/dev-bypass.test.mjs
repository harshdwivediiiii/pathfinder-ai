import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  validateDevBypass,
  validateE2EBypass,
  validateVideoCoachBypass,
  _resetWarningFlag,
} from "../lib/auth/dev-bypass.js";

describe("Development Authentication Bypass Validation", () => {
  beforeEach(() => {
    // Reset warning flag before each test
    _resetWarningFlag();
    // Reset NODE_ENV to a safe default
    process.env.NODE_ENV = "test";
    delete process.env.SKIP_AUTH;
  });

  describe("validateDevBypass", () => {
    it("allows bypass in development mode on localhost with SKIP_AUTH=true", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("allows bypass in development mode on 127.0.0.1 with SKIP_AUTH=true", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "127.0.0.1",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects bypass when SKIP_AUTH is not enabled", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("rejects bypass in production mode with descriptive error", () => {
      process.env.NODE_ENV = "production";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("NOT allowed in production");
      expect(result.error.message).toContain("NODE_ENV");
    });

    it("rejects bypass in non-development mode (e.g., staging) with descriptive error", () => {
      process.env.NODE_ENV = "staging";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed in development mode");
      expect(result.error.message).toContain("staging");
    });

    it("rejects bypass on non-localhost hostname with descriptive error", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "example.com",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
      expect(result.error.message).toContain("example.com");
    });

    it("rejects bypass on deployed environment hostname with descriptive error", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "myapp.vercel.app",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
      expect(result.error.message).toContain("myapp.vercel.app");
    });

    it("rejects bypass on IP address that is not 127.0.0.1", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "192.168.1.1",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
    });

    it("emits console warning when bypass is allowed", () => {
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn");

      validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
        reason: "test bypass",
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls[0][0];
      expect(warningCall).toContain("WARNING");
      expect(warningCall).toContain("Authentication is currently DISABLED");
      expect(warningCall).toContain("test bypass");

      consoleWarnSpy.mockRestore();
    });

    it("only emits warning once for multiple validations", () => {
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn");

      validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      validateDevBypass({
        hostname: "127.0.0.1",
        skipAuthEnabled: true,
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });
  });

  describe("validateE2EBypass", () => {
    it("allows bypass in non-production mode on localhost with E2E_TEST=true", () => {
      process.env.NODE_ENV = "test";
      const result = validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("allows bypass in development mode on 127.0.0.1 with E2E_TEST=true", () => {
      process.env.NODE_ENV = "development";
      const result = validateE2EBypass({
        hostname: "127.0.0.1",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects bypass when E2E_TEST is not enabled without an error", () => {
      process.env.NODE_ENV = "development";
      const result = validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("rejects bypass in production mode with descriptive error", () => {
      process.env.NODE_ENV = "production";
      const result = validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("NOT allowed in production");
      expect(result.error.message).toContain("E2E_TEST");
      expect(result.error.message).toContain("NODE_ENV");
    });

    it("rejects bypass on non-localhost hostname with descriptive error", () => {
      process.env.NODE_ENV = "development";
      const result = validateE2EBypass({
        hostname: "example.com",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
      expect(result.error.message).toContain("example.com");
    });

    it("rejects bypass on deployed environment hostname with descriptive error", () => {
      process.env.NODE_ENV = "development";
      const result = validateE2EBypass({
        hostname: "myapp.vercel.app",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
      expect(result.error.message).toContain("myapp.vercel.app");
    });

    it("emits console warning when bypass is allowed", () => {
      process.env.NODE_ENV = "test";
      const consoleWarnSpy = vi.spyOn(console, "warn");

      validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: true,
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls[0][0];
      expect(warningCall).toContain("WARNING");
      expect(warningCall).toContain("Authentication is currently DISABLED");
      expect(warningCall).toContain("E2E_TEST=true");

      consoleWarnSpy.mockRestore();
    });

    it("only emits warning once for multiple validations", () => {
      process.env.NODE_ENV = "test";
      const consoleWarnSpy = vi.spyOn(console, "warn");

      validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: true,
      });

      validateE2EBypass({
        hostname: "127.0.0.1",
        e2eTestEnabled: true,
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });

    it("handles whitespace in hostname with strict equality", () => {
      process.env.NODE_ENV = "test";
      const result = validateE2EBypass({
        hostname: " localhost ",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("handles case-sensitive NODE_ENV check", () => {
      process.env.NODE_ENV = "PRODUCTION";
      const result = validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("prevents bypass when both production and localhost", () => {
      process.env.NODE_ENV = "production";
      const result = validateE2EBypass({
        hostname: "localhost",
        e2eTestEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("NOT allowed in production");
    });
  });

  describe("validateVideoCoachBypass", () => {
    it("allows bypass in development mode on localhost", () => {
      process.env.NODE_ENV = "development";
      const result = validateVideoCoachBypass({
        hostname: "localhost",
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("allows bypass in development mode on 127.0.0.1", () => {
      process.env.NODE_ENV = "development";
      const result = validateVideoCoachBypass({
        hostname: "127.0.0.1",
      });

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects bypass in production mode with descriptive error", () => {
      process.env.NODE_ENV = "production";
      const result = validateVideoCoachBypass({
        hostname: "localhost",
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("NOT allowed in production");
      expect(result.error.message).toContain("Video-coach");
    });

    it("rejects bypass in non-development mode with descriptive error", () => {
      process.env.NODE_ENV = "staging";
      const result = validateVideoCoachBypass({
        hostname: "localhost",
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed in development mode");
      expect(result.error.message).toContain("Video-coach");
    });

    it("rejects bypass on non-localhost hostname with descriptive error", () => {
      process.env.NODE_ENV = "development";
      const result = validateVideoCoachBypass({
        hostname: "example.com",
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
      expect(result.error.message).toContain("Video-coach");
    });

    it("rejects bypass on deployed environment hostname", () => {
      process.env.NODE_ENV = "development";
      const result = validateVideoCoachBypass({
        hostname: "myapp.vercel.app",
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed on localhost");
    });

    it("emits console warning when bypass is allowed", () => {
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn");

      validateVideoCoachBypass({
        hostname: "localhost",
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningCall = consoleWarnSpy.mock.calls[0][0];
      expect(warningCall).toContain("WARNING");
      expect(warningCall).toContain("Authentication is currently DISABLED");
      expect(warningCall).toContain("video-coach");

      consoleWarnSpy.mockRestore();
    });

    it("only emits warning once for multiple validations", () => {
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn");

      validateVideoCoachBypass({ hostname: "localhost" });
      validateVideoCoachBypass({ hostname: "127.0.0.1" });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Security Edge Cases", () => {
    it("handles undefined NODE_ENV gracefully", () => {
      delete process.env.NODE_ENV;
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("only allowed in development mode");
    });

    it("handles empty string NODE_ENV", () => {
      process.env.NODE_ENV = "";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("handles case-sensitive NODE_ENV check", () => {
      process.env.NODE_ENV = "DEVELOPMENT";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("handles whitespace in hostname", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: " localhost ",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("prevents bypass when both production and localhost", () => {
      process.env.NODE_ENV = "production";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain("NOT allowed in production");
    });
  });

  describe("Integration with Environment Variables", () => {
    it("respects SKIP_AUTH=false", () => {
      process.env.NODE_ENV = "development";
      process.env.SKIP_AUTH = "false";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("handles SKIP_AUTH with different casing", () => {
      process.env.NODE_ENV = "development";
      const result = validateDevBypass({
        hostname: "localhost",
        skipAuthEnabled: false, // Explicitly false regardless of env var
      });

      expect(result.allowed).toBe(false);
    });
  });
});
