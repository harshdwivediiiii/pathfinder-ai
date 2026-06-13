import { describe, expect, it, vi, beforeEach } from "vitest";
import { PATCH, DELETE, POST } from "../app/api/conversations/[id]/messages/route.js";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    user: {
      findUnique: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    message: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  db: mocks.db,
}));

const mockRequestFor = (method, messageId, body = null) => {
  const searchParams = new URLSearchParams();
  if (messageId) searchParams.set("messageId", messageId);

  const req = {
    nextUrl: { searchParams },
    method,
  };

  if (body) {
    req.json = async () => body;
  } else {
    req.json = async () => { throw new Error("No body"); };
  }

  return req;
};

describe("PATCH /api/conversations/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const request = mockRequestFor("PATCH", "msg-1", { content: "Updated" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 if user not found", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue(null);
    const request = mockRequestFor("PATCH", "msg-1", { content: "Updated" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 if messageId query param is missing", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    const request = mockRequestFor("PATCH", null, { content: "Updated" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(400);
  });

  it("returns 404 if conversation not found or not owned by user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.conversation.findFirst.mockResolvedValue(null);
    const request = mockRequestFor("PATCH", "msg-1", { content: "Updated" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
  });

  it("returns 404 if message not found in conversation", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.conversation.findFirst.mockResolvedValue({ id: "conv-1", userId: "u-1" });
    mocks.db.message.findFirst.mockResolvedValue(null);
    const request = mockRequestFor("PATCH", "msg-1", { content: "Updated" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 if request body is invalid JSON", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.conversation.findFirst.mockResolvedValue({ id: "conv-1", userId: "u-1" });
    mocks.db.message.findFirst.mockResolvedValue({ id: "msg-1", conversationId: "conv-1" });

    const request = {
      nextUrl: { searchParams: new URLSearchParams("messageId=msg-1") },
      json: async () => { throw new Error("Unexpected end of JSON input"); },
    };

    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(400);
  });

  it("returns 400 if content is empty", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.conversation.findFirst.mockResolvedValue({ id: "conv-1", userId: "u-1" });
    mocks.db.message.findFirst.mockResolvedValue({ id: "msg-1", conversationId: "conv-1" });
    const request = mockRequestFor("PATCH", "msg-1", { content: "   " });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(400);
  });

  it("returns 200 and updates message content if owned by user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.conversation.findFirst.mockResolvedValue({ id: "conv-1", userId: "u-1" });
    mocks.db.message.findFirst.mockResolvedValue({ id: "msg-1", conversationId: "conv-1", content: "Original" });
    mocks.db.message.update.mockResolvedValue({ id: "msg-1", conversationId: "conv-1", content: "Updated content" });
    mocks.db.conversation.updateMany.mockResolvedValue({ count: 1 });

    const request = mockRequestFor("PATCH", "msg-1", { content: "Updated content" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "conv-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe("Updated content");
    expect(mocks.db.message.update).toHaveBeenCalledWith({
      where: { id: "msg-1" },
      data: { content: "Updated content" },
    });
  });
});

describe("DELETE /api/conversations/[id]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const request = mockRequestFor("DELETE", "msg-1");
    const response = await DELETE(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 if user not found", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue(null);
    const request = mockRequestFor("DELETE", "msg-1");
    const response = await DELETE(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 if messageId query param is missing", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    const request = mockRequestFor("DELETE", null);
    const response = await DELETE(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(400);
  });

  it("returns 404 if message not found or not owned by user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.message.findFirst.mockResolvedValue(null);
    const request = mockRequestFor("DELETE", "msg-1");
    const response = await DELETE(request, { params: Promise.resolve({ id: "conv-1" }) });
    expect(response.status).toBe(404);
  });

  it("returns 204 and deletes message if owned by user", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "u-1" });
    mocks.db.message.findFirst.mockResolvedValue({ id: "msg-1", conversationId: "conv-1" });
    mocks.db.message.delete.mockResolvedValue({ id: "msg-1" });
    mocks.db.conversation.updateMany.mockResolvedValue({ count: 1 });

    const request = mockRequestFor("DELETE", "msg-1");
    const response = await DELETE(request, { params: Promise.resolve({ id: "conv-1" }) });

    expect(response.status).toBe(204);
    expect(mocks.db.message.delete).toHaveBeenCalledWith({
      where: { id: "msg-1" },
    });
  });
});
