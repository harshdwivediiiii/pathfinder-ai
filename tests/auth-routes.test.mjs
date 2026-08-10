import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isPublicRoute,
  isAuthedAppRoute,
  isProtectedApiRoute,
  getAuthDecision,
} from "../lib/auth/routes.js";

// Helper to create mock NextRequest-like objects
function createMockRequest(path, hostname = "localhost") {
  const url = `http://${hostname}:3000${path}`;
  return {
    url,
    nextUrl: new URL(url),
  };
}

describe("Auth Route Matchers", () => {
  beforeEach(() => {
    // Reset NODE_ENV to a safe default before each test
    process.env.NODE_ENV = "test";
  });

  describe("isPublicRoute", () => {
    it("matches public routes", () => {
      expect(isPublicRoute(createMockRequest("/"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/sign-in"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/sign-in/callback"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/sign-up"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/api/dev/status"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/api/inngest"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/api/inngest/"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/api/health"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/api/health/ready"))).toBe(true);
    });

    it("does not match non-public routes", () => {
      expect(isPublicRoute(createMockRequest("/dashboard"))).toBe(false);
      expect(isPublicRoute(createMockRequest("/api/user"))).toBe(false);
      expect(isPublicRoute(createMockRequest("/api/health/metrics"))).toBe(false);
    });
  });

  describe("isAuthedAppRoute", () => {
    it("matches app routes that require authentication", () => {
      expect(isAuthedAppRoute(createMockRequest("/dashboard"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/onboarding"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/resume/edit"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/settings"))).toBe(true);
    });

    it("matches new feature routes that require authentication", () => {
      expect(isAuthedAppRoute(createMockRequest("/roadmap"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/roadmap/generate"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/job-tracker"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/linkedin-optimizer"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/project-ideas"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/networking"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/side-hustle"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/remote-work"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/manager-readme"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/imposter-syndrome"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/founder-readiness"))).toBe(true);
      expect(isAuthedAppRoute(createMockRequest("/executive-presence"))).toBe(true);
    });

    it("does not match other routes", () => {
      expect(isAuthedAppRoute(createMockRequest("/"))).toBe(false);
      expect(isAuthedAppRoute(createMockRequest("/sign-in"))).toBe(false);
      expect(isAuthedAppRoute(createMockRequest("/api/dev/status"))).toBe(false);
    });
  });

  describe("isProtectedApiRoute", () => {
    it("matches api routes that are not public", () => {
      expect(isProtectedApiRoute(createMockRequest("/api/user"))).toBe(true);
      expect(isProtectedApiRoute(createMockRequest("/api/resume/create"))).toBe(true);
    });

    it("does not match public api routes", () => {
      expect(isProtectedApiRoute(createMockRequest("/api/dev/status"))).toBe(false);
      expect(isProtectedApiRoute(createMockRequest("/api/inngest"))).toBe(false);
      expect(isProtectedApiRoute(createMockRequest("/api/inngest/"))).toBe(false);
      expect(isProtectedApiRoute(createMockRequest("/api/health"))).toBe(false);
      expect(isProtectedApiRoute(createMockRequest("/api/health/ready"))).toBe(false);
    });

    it("matches protected health metrics route", () => {
      expect(isProtectedApiRoute(createMockRequest("/api/health/metrics"))).toBe(true);
    });

    it("does not match non-api routes", () => {
      expect(isProtectedApiRoute(createMockRequest("/dashboard"))).toBe(false);
    });
  });
});

describe("getAuthDecision", () => {
  const authed = async () => ({ userId: "user_123" });
  const unauthed = async () => ({ userId: null });

  beforeEach(() => {
    // Reset NODE_ENV to a safe default before each test
    process.env.NODE_ENV = "test";
  });

  it("returns public action for public routes regardless of authentication", async () => {
    const req1 = createMockRequest("/");
    const res1 = await getAuthDecision(req1, unauthed);
    expect(res1).toEqual({ action: "public" });

    const req2 = createMockRequest("/api/dev/status");
    const res2 = await getAuthDecision(req2, authed);
    expect(res2).toEqual({ action: "public" });
  });

  it("returns public action for health probe routes", async () => {
    const req1 = createMockRequest("/api/health");
    const res1 = await getAuthDecision(req1, unauthed);
    expect(res1).toEqual({ action: "public" });

    const req2 = createMockRequest("/api/health/ready");
    const res2 = await getAuthDecision(req2, unauthed);
    expect(res2).toEqual({ action: "public" });
  });

  it("returns deny action for unauthenticated users accessing the metrics route", async () => {
    const req = createMockRequest("/api/health/metrics");
    const res = await getAuthDecision(req, unauthed);
    expect(res).toEqual({ action: "deny", status: 401 });
  });

  it("returns redirect action for unauthenticated users accessing app routes", async () => {
    const req = createMockRequest("/dashboard/analytics");
    const res = await getAuthDecision(req, unauthed);
    expect(res.action).toBe("redirect");
    expect(res.signInUrl).toContain("/sign-in");
    expect(res.signInUrl).toContain("redirect_url=%2Fdashboard%2Fanalytics");
  });

  it("returns next action for authenticated users accessing app routes", async () => {
    const req = createMockRequest("/dashboard/analytics");
    const res = await getAuthDecision(req, authed);
    expect(res).toEqual({ action: "next" });
  });

  it("returns deny action for unauthenticated users accessing protected API routes", async () => {
    const req = createMockRequest("/api/user/profile");
    const res = await getAuthDecision(req, unauthed);
    expect(res).toEqual({ action: "deny", status: 401 });
  });

  it("returns next action for authenticated users accessing protected API routes", async () => {
    const req = createMockRequest("/api/user/profile");
    const res = await getAuthDecision(req, authed);
    expect(res).toEqual({ action: "next" });
  });

  it("returns next action for other routes", async () => {
    const req = createMockRequest("/some-random-route");
    const res = await getAuthDecision(req, unauthed);
    expect(res).toEqual({ action: "next" });
  });
  it("redirects unauthenticated user from /roadmap to /sign-in", async () => {
    const req = createMockRequest("/roadmap");
    const res = await getAuthDecision(req, unauthed);
    expect(res.action).toBe("redirect");
    expect(res.signInUrl).toContain("/sign-in");
    expect(res.signInUrl).toContain("redirect_url=%2Froadmap");
  });

  it("redirects unauthenticated user from newly protected app routes to /sign-in", async () => {
    const routes = [
      "/side-hustle",
      "/remote-work",
      "/manager-readme",
      "/imposter-syndrome",
      "/founder-readiness",
      "/executive-presence"
    ];

    for (const route of routes) {
      const req = createMockRequest(route);
      const res = await getAuthDecision(req, unauthed);
      expect(res.action).toBe("redirect");
      expect(res.signInUrl).toContain("/sign-in");
      expect(res.signInUrl).toContain(`redirect_url=${encodeURIComponent(route)}`);
    }
  });

  describe("Video-Coach Development Bypass", () => {
    it("allows bypass for video-coach route in development on localhost", async () => {
      process.env.NODE_ENV = "development";
      const req = createMockRequest("/interview/video-coach", "localhost");
      const res = await getAuthDecision(req, unauthed);
      expect(res.action).toBe("next");
    });

    it("allows bypass for video-coach route in development on 127.0.0.1", async () => {
      process.env.NODE_ENV = "development";
      const req = createMockRequest("/interview/video-coach", "127.0.0.1");
      const res = await getAuthDecision(req, unauthed);
      expect(res.action).toBe("next");
    });

    it("allows bypass for video-coach subroutes in development", async () => {
      process.env.NODE_ENV = "development";
      const req = createMockRequest("/interview/video-coach/session/123", "localhost");
      const res = await getAuthDecision(req, unauthed);
      expect(res.action).toBe("next");
    });

    it("throws error for video-coach route in production", async () => {
      process.env.NODE_ENV = "production";
      const req = createMockRequest("/interview/video-coach", "localhost");
      
      await expect(getAuthDecision(req, unauthed)).rejects.toThrow(
        "NOT allowed in production"
      );
    });

    it("throws error for video-coach route in non-development mode", async () => {
      process.env.NODE_ENV = "staging";
      const req = createMockRequest("/interview/video-coach", "localhost");
      
      await expect(getAuthDecision(req, unauthed)).rejects.toThrow(
        "only allowed in development mode"
      );
    });

    it("throws error for video-coach route on non-localhost in development", async () => {
      process.env.NODE_ENV = "development";
      const req = createMockRequest("/interview/video-coach", "example.com");
      
      await expect(getAuthDecision(req, unauthed)).rejects.toThrow(
        "only allowed on localhost"
      );
    });

    it("throws error for video-coach route on deployed environment", async () => {
      process.env.NODE_ENV = "development";
      const req = createMockRequest("/interview/video-coach", "myapp.vercel.app");
      
      await expect(getAuthDecision(req, unauthed)).rejects.toThrow(
        "only allowed on localhost"
      );
    });
  });
});
