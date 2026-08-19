import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: { findUnique: mocks.findUnique },
    roadmap: { findUnique: mocks.findUnique },
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

import { AppError } from "../lib/errors/app-error.js";
import { getRoadmap } from "../actions/roadmap.js";

describe("getRoadmap (#2841 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns { roadmap, error } with the error message when loading fails", async () => {
    mocks.auth.mockRejectedValue(new AppError("Database unavailable"));

    const result = await getRoadmap();

    expect(result).toEqual({
      roadmap: null,
      error: "Database unavailable",
    });
  });

  it("returns a generic message on unexpected errors", async () => {
    mocks.auth.mockRejectedValue(new Error("boom"));
    vi.stubEnv("NODE_ENV", "test");

    const result = await getRoadmap();

    expect(result).toEqual({
      roadmap: null,
      error: "An unexpected error occurred. Our team has been notified.",
    });
    expect(mocks.captureException).toHaveBeenCalled();
  });

  it("returns the loaded roadmap on success", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique
      .mockResolvedValueOnce({ id: "db-user-1", clerkUserId: "user-1" })
      .mockResolvedValueOnce({ id: "roadmap-1", title: "My roadmap", milestones: [] });

    const result = await getRoadmap();

    expect(result).toEqual({
      roadmap: { id: "roadmap-1", title: "My roadmap", milestones: [] },
      error: null,
    });
  });

  it("returns { roadmap: null, error: null } when the user has no roadmap", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUnique
      .mockResolvedValueOnce({ id: "db-user-1", clerkUserId: "user-1" })
      .mockResolvedValueOnce(null);

    const result = await getRoadmap();

    expect(result).toEqual({ roadmap: null, error: null });
  });
});
