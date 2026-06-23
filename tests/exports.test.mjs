import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../app/api/exports/[conversationId]/route.js";

const mocks = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
    exportRecord: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
  getOwnedConversation: vi.fn(),
  generateJsonExport: vi.fn(),
  generateMarkdownExport: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: mocks.db,
}));

vi.mock("@/lib/conversation/getConversation", () => ({
  getOwnedConversation: mocks.getOwnedConversation,
}));

vi.mock("@/lib/export/json-export", () => ({
  generateJsonExport: mocks.generateJsonExport,
}));

vi.mock("@/lib/export/markdown-export", () => ({
  generateMarkdownExport: mocks.generateMarkdownExport,
}));

describe("GET /api/exports/[conversationId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error if conversationId is invalid", async () => {
    const request = new Request("http://localhost/api/exports/   ");
    const context = { params: Promise.resolve({ conversationId: "   " }) };

    const response = await GET(request, context);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error if format is unsupported", async () => {
    const request = new Request("http://localhost/api/exports/conv-123?format=csv");
    const context = { params: Promise.resolve({ conversationId: "conv-123" }) };

    const response = await GET(request, context);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns unauthorized if conversation doesn't belong to user", async () => {
    const request = new Request("http://localhost/api/exports/conv-123");
    const context = { params: Promise.resolve({ conversationId: "conv-123" }) };

    mocks.getOwnedConversation.mockResolvedValue(null);

    const response = await GET(request, context);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 resource not found if conversation does not exist", async () => {
    const request = new Request("http://localhost/api/exports/conv-123");
    const context = { params: Promise.resolve({ conversationId: "conv-123" }) };

    mocks.getOwnedConversation.mockResolvedValue({
      user: { id: "user-123" },
      conversation: null,
    });

    const response = await GET(request, context);
    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("successfully exports in json format and writes tracking database records", async () => {
    const request = new Request("http://localhost/api/exports/conv-123?format=json");
    const context = { params: Promise.resolve({ conversationId: "conv-123" }) };

    const mockUser = { id: "user-123" };
    const mockConversation = { id: "conv-123", title: "My Test Chat" };

    mocks.getOwnedConversation.mockResolvedValue({
      user: mockUser,
      conversation: mockConversation,
    });

    mocks.generateJsonExport.mockReturnValue(JSON.stringify({ chat: "data" }));

    // Mock transaction to return whatever
    mocks.db.$transaction.mockResolvedValue([]);

    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="My Test Chat.json"'
    );

    const text = await response.text();
    expect(text).toBe(JSON.stringify({ chat: "data" }));

    // Verify database transaction calls
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.db.exportRecord.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        conversationId: "conv-123",
        format: "json",
        status: "completed",
        downloadCount: 1,
      },
    });
    expect(mocks.db.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        action: "EXPORT",
        resourceType: "CONVERSATION",
        resourceId: "conv-123",
        metadata: {
          format: "json",
          title: "My Test Chat",
        },
      },
    });
  });

  it("successfully exports in md format and writes tracking database records", async () => {
    const request = new Request("http://localhost/api/exports/conv-123?format=md");
    const context = { params: Promise.resolve({ conversationId: "conv-123" }) };

    const mockUser = { id: "user-123" };
    const mockConversation = { id: "conv-123", title: "My Test Chat" };

    mocks.getOwnedConversation.mockResolvedValue({
      user: mockUser,
      conversation: mockConversation,
    });

    mocks.generateMarkdownExport.mockReturnValue("# My Test Chat\n\n- User: Hello");

    mocks.db.$transaction.mockResolvedValue([]);

    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/markdown");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="My Test Chat.md"'
    );

    const text = await response.text();
    expect(text).toBe("# My Test Chat\n\n- User: Hello");

    // Verify database transaction calls
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.db.exportRecord.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        conversationId: "conv-123",
        format: "md",
        status: "completed",
        downloadCount: 1,
      },
    });
    expect(mocks.db.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        action: "EXPORT",
        resourceType: "CONVERSATION",
        resourceId: "conv-123",
        metadata: {
          format: "md",
          title: "My Test Chat",
        },
      },
    });
  });
});
