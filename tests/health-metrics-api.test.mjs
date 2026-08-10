import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

import { GET } from "../app/api/health/metrics/route.js";

describe("GET /api/health/metrics", () => {
  it("returns 401 if not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns Prometheus metrics for authenticated users", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const res = await GET();
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain; version=0.0.4; charset=utf-8");
    expect(body).toContain("# HELP");
    expect(body).toContain("# TYPE");
    expect(body).toContain("cache_hit_ratio");
  });
});
