import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("../lib/prisma.js", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));

import { checkUser } from "../lib/checkUser.js";

describe("checkUser", () => {
  it("returns null when Clerk has no user", async () => {
    mocks.currentUser.mockResolvedValue(null);

    await expect(checkUser()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("returns the existing Prisma user", async () => {
    const existingUser = { id: "db-user-1", clerkUserId: "clerk-user-1" };
    mocks.currentUser.mockResolvedValue({ id: "clerk-user-1" });
    mocks.findUnique.mockResolvedValue(existingUser);

    await expect(checkUser()).resolves.toBe(existingUser);
    expect(mocks.create).not.toHaveBeenCalled();
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
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue(createdUser);

    await expect(checkUser()).resolves.toBe(createdUser);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        clerkUserId: "clerk-user-2",
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
    mocks.findUnique.mockResolvedValue(null);

    await expect(checkUser()).resolves.toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});