import { describe, expect, it, vi, beforeEach } from "vitest";
import { DELETE } from "../app/api/conversations/[id]/route.js";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: mocks.db,
}));

describe("DELETE /api/conversations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const response = await DELETE({}, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 if user not found", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue(null);
    const response = await DELETE({}, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
  });

  it("deletes conversation if owned by user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    
    mocks.db.conversation.deleteMany.mockResolvedValue({ count: 1 });

    const response = await DELETE({}, { params: Promise.resolve({ id: "conv-1" }) });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mocks.db.conversation.deleteMany).toHaveBeenCalledWith({
      where: { id: "conv-1", userId: "u-1" }
    });
    expect(mocks.db.conversation.findFirst).not.toHaveBeenCalled();
    expect(mocks.db.conversation.delete).not.toHaveBeenCalled();
  });

  it("returns 404 if conversation not owned by user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.conversation.deleteMany.mockResolvedValue({ count: 0 });

    const response = await DELETE({}, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
    expect(mocks.db.conversation.deleteMany).toHaveBeenCalled();
  });
});
