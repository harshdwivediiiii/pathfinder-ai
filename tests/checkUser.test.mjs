import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("../lib/db/prisma.js", () => ({
  db: {
    user: {
      upsert: mocks.upsert,
    },
  },
}));

import { checkUser } from "../lib/auth/checkUser.js";

describe("checkUser", () => {
  it("returns null when Clerk has no user", async () => {
    mocks.currentUser.mockResolvedValue(null);

    await expect(checkUser()).resolves.toBeNull();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns the existing Prisma user", async () => {
    const existingUser = { id: "db-user-1", clerkUserId: "clerk-user-1" };
    mocks.currentUser.mockResolvedValue({
      id: "clerk-user-1",
      emailAddresses: [{ emailAddress: "existing@example.com" }],
    });
    mocks.upsert.mockResolvedValue(existingUser);

    await expect(checkUser()).resolves.toBe(existingUser);
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user-1" },
      create: {
        clerkUserId: "clerk-user-1",
        email: "existing@example.com",
        name: "User",
        imageUrl: "",
      },
      update: {
        email: "existing@example.com",
        name: "User",
        imageUrl: "",
      },
    });
  });

  it("creates a Prisma user when one does not exist", async () => {
    const createdUser = { id: "db-user-2", clerkUserId: "clerk-user-2" };
    mocks.currentUser.mockResolvedValue({
      id: "clerk-user-2",
      firstName: "Ava",
      lastName: "Patel",
      imageUrl: "https://example.com/avatar.png",
      emailAddresses: [{ emailAddress: "ava@example.com" }],
    });
    mocks.upsert.mockResolvedValue(createdUser);

    await expect(checkUser()).resolves.toBe(createdUser);
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user-2" },
      create: {
        clerkUserId: "clerk-user-2",
        name: "Ava Patel",
        imageUrl: "https://example.com/avatar.png",
        email: "ava@example.com",
      },
      update: {
        name: "Ava Patel",
        imageUrl: "https://example.com/avatar.png",
        email: "ava@example.com",
      },
    });
  });

  it("returns null when Clerk has no email address", async () => {
    mocks.currentUser.mockResolvedValue({
      id: "clerk-user-3",
      firstName: "NoEmail",
      emailAddresses: [],
    });

    await expect(checkUser()).resolves.toBeNull();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("handles 10 simultaneous upserts for the same new user", async () => {
    const createdUser = { id: "db-user-concurrent", clerkUserId: "clerk-user-concurrent" };
    mocks.currentUser.mockResolvedValue({
      id: "clerk-user-concurrent",
      firstName: "Con",
      lastName: "Current",
      imageUrl: "",
      emailAddresses: [{ emailAddress: "concurrent@example.com" }],
    });
    mocks.upsert.mockResolvedValue(createdUser);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => checkUser())
    );

    expect(results).toHaveLength(10);
    results.forEach((result) => {
      expect(result).toBe(createdUser);
    });
    expect(mocks.upsert).toHaveBeenCalledTimes(10);
  });
});