import { describe, expect, it, vi } from "vitest";
import {
  isPublicRoute,
  isAuthedAppRoute,
  isProtectedApiRoute,
  getAuthDecision,
} from "../lib/auth/routes.js";

// Helper to create mock NextRequest-like objects
function createMockRequest(path) {
  const url = `http://localhost:3000${path}`;
  return {
    url,
    nextUrl: new URL(url),
  };
}

describe("Auth Route Matchers", () => {
  describe("isPublicRoute", () => {
    it("matches public routes", () => {
      expect(isPublicRoute(createMockRequest("/"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/sign-in"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/sign-in/callback"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/sign-up"))).toBe(true);
      expect(isPublicRoute(createMockRequest("/api/dev/status"))).toBe(true);
    });

    it("does not match non-public routes", () => {
      expect(isPublicRoute(createMockRequest("/dashboard"))).toBe(false);
      expect(isPublicRoute(createMockRequest("/api/user"))).toBe(false);
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
    });

    it("does not match non-api routes", () => {
      expect(isProtectedApiRoute(createMockRequest("/dashboard"))).toBe(false);
    });
  });
});

describe("getAuthDecision", () => {
  const authed = async () => ({ userId: "user_123" });
  const unauthed = async () => ({ userId: null });

  it("returns public action for public routes regardless of authentication", async () => {
    const req1 = createMockRequest("/");
    const res1 = await getAuthDecision(req1, unauthed);
    expect(res1).toEqual({ action: "public" });

    const req2 = createMockRequest("/api/dev/status");
    const res2 = await getAuthDecision(req2, authed);
    expect(res2).toEqual({ action: "public" });
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
});
