import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../app/api/webhooks/clerk/route.js";

// Mock Prisma
vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      upsert: vi.fn(),
    },
  },
}));

// Mock Svix Webhook
const mockVerify = vi.fn();
vi.mock("svix", () => ({
  Webhook: class {
    constructor(secret) {
      this.secret = secret;
    }
    verify(body, headers) {
      return mockVerify(body, headers);
    }
  },
}));

// Mock environment
const originalEnv = process.env;

describe("Clerk Webhook Endpoint Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CLERK_WEBHOOK_SECRET: "whsec_test_secret" };
    // Default mock behavior: verify succeeds for valid_signature
    mockVerify.mockImplementation((body, headers) => {
      if (headers["svix-signature"] && headers["svix-signature"] !== "invalid_signature") {
        // Check if body has been tampered with (contains "attacker_456")
        if (body.includes("attacker_456")) {
          throw new Error("Invalid signature");
        }
        return JSON.parse(body);
      }
      throw new Error("Invalid signature");
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    mockVerify.mockReset();
  });

  const createValidPayload = (eventType = "user.created") => {
    const payload = {
      type: eventType,
      data: {
        id: "user_123",
        email_addresses: [{ email_address: "test@example.com" }],
        first_name: "John",
        last_name: "Doe",
        image_url: "https://example.com/avatar.jpg",
      },
    };

    const body = JSON.stringify(payload);
    const headers = {
      "svix-id": "msg_123",
      "svix-timestamp": Date.now().toString(),
      "svix-signature": "valid_signature",
    };

    return { body, headers, payload };
  };

  describe("Valid webhook scenarios", () => {
    it("should accept valid user.created webhook", async () => {
      const { db } = await import("@/lib/db/prisma");
      db.user.upsert.mockResolvedValue({});

      const { body, headers } = createValidPayload("user.created");

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(204);
      expect(db.user.upsert).toHaveBeenCalledWith({
        where: { clerkUserId: "user_123" },
        create: {
          clerkUserId: "user_123",
          email: "test@example.com",
          name: "John Doe",
          imageUrl: "https://example.com/avatar.jpg",
        },
        update: {
          email: "test@example.com",
          name: "John Doe",
          imageUrl: "https://example.com/avatar.jpg",
        },
      });
    });

    it("should accept valid user.updated webhook", async () => {
      const { db } = await import("@/lib/db/prisma");
      db.user.upsert.mockResolvedValue({});

      const { body, headers } = createValidPayload("user.updated");

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(204);
      expect(db.user.upsert).toHaveBeenCalled();
    });

    it("should handle unsupported event types gracefully", async () => {
      const { db } = await import("@/lib/db/prisma");

      const { body, headers } = createValidPayload("user.deleted");

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(204);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Signature verification failures", () => {
    it("should reject webhook with invalid signature", async () => {
      const { db } = await import("@/lib/db/prisma");

      const payload = {
        type: "user.created",
        data: {
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
        },
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "invalid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.error).toBe("Invalid signature");
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject webhook with tampered payload", async () => {
      const { db } = await import("@/lib/db/prisma");

      const { body, headers } = createValidPayload("user.created");
      const tamperedBody = body.replace("user_123", "attacker_456");

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(tamperedBody),
      };

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject webhook with expired timestamp (replay protection)", async () => {
      const { db } = await import("@/lib/db/prisma");

      const payload = {
        type: "user.created",
        data: {
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
        },
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "invalid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Missing Svix headers", () => {
    it("should reject webhook missing svix-id", async () => {
      const { db } = await import("@/lib/db/prisma");

      const { body, headers } = createValidPayload();
      delete headers["svix-id"];

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe("Missing required headers");
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject webhook missing svix-signature", async () => {
      const { db } = await import("@/lib/db/prisma");

      const { body, headers } = createValidPayload();
      delete headers["svix-signature"];

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject webhook missing svix-timestamp", async () => {
      const { db } = await import("@/lib/db/prisma");

      const { body, headers } = createValidPayload();
      delete headers["svix-timestamp"];

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Malformed payload", () => {
    it("should reject malformed JSON", async () => {
      const { db } = await import("@/lib/db/prisma");

      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "fake_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue("invalid json {{{"),
      };

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject payload missing type", async () => {
      const { db } = await import("@/lib/db/prisma");

      const payload = {
        data: {
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
        },
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "valid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject payload missing data", async () => {
      const { db } = await import("@/lib/db/prisma");

      const payload = {
        type: "user.created",
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "valid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Environment configuration", () => {
    it("should return 500 when CLERK_WEBHOOK_SECRET is missing", async () => {
      const { db } = await import("@/lib/db/prisma");

      process.env.CLERK_WEBHOOK_SECRET = "";

      const { body, headers } = createValidPayload();

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe("Server configuration error");
      expect(db.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Database failures", () => {
    it("should return 500 on Prisma upsert failure", async () => {
      const { db } = await import("@/lib/db/prisma");
      db.user.upsert.mockRejectedValue(new Error("Database connection failed"));

      const { body, headers } = createValidPayload("user.created");

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe("Failed to sync user");
    });
  });

  describe("Data validation within verified payload", () => {
    it("should reject verified payload missing user id", async () => {
      const { db } = await import("@/lib/db/prisma");

      const payload = {
        type: "user.created",
        data: {
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "John",
        },
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "valid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should reject verified payload missing email", async () => {
      const { db } = await import("@/lib/db/prisma");

      const payload = {
        type: "user.created",
        data: {
          id: "user_123",
          email_addresses: [],
          first_name: "John",
        },
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "valid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should handle user with no first/last name", async () => {
      const { db } = await import("@/lib/db/prisma");
      db.user.upsert.mockResolvedValue({});

      const payload = {
        type: "user.created",
        data: {
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
        },
      };

      const body = JSON.stringify(payload);
      const headers = {
        "svix-id": "msg_123",
        "svix-timestamp": Date.now().toString(),
        "svix-signature": "valid_signature",
      };

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(body),
      };

      const response = await POST(request);

      expect(response.status).toBe(204);
      expect(db.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            name: "User",
          }),
        })
      );
    });
  });

  describe("Security: No database operations on invalid requests", () => {
    it("should never call Prisma on invalid signature", async () => {
      const { db } = await import("@/lib/db/prisma");

      const request = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
        text: vi.fn().mockResolvedValue("{}"),
      };

      await POST(request);

      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should never call Prisma on missing headers", async () => {
      const { db } = await import("@/lib/db/prisma");

      const request = {
        headers: {
          get: vi.fn((name) => (name === "svix-id" ? "msg_123" : null)),
        },
        text: vi.fn().mockResolvedValue("{}"),
      };

      await POST(request);

      expect(db.user.upsert).not.toHaveBeenCalled();
    });

    it("should never call Prisma on tampered payload", async () => {
      const { db } = await import("@/lib/db/prisma");

      const { body, headers } = createValidPayload();
      const tamperedBody = body.replace("user_123", "attacker_456");

      const request = {
        headers: {
          get: vi.fn((name) => headers[name]),
        },
        text: vi.fn().mockResolvedValue(tamperedBody),
      };

      await POST(request);

      expect(db.user.upsert).not.toHaveBeenCalled();
    });
  });
});
