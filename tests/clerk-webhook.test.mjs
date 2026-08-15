/**
 * Tests for the Clerk webhook endpoint: app/api/webhooks/clerk/route.js
 *
 * Regression coverage for the security issue where the webhook endpoint
 * trusted the request body without verifying Clerk's Svix signature.
 *
 * Covered scenarios (per the issue's "Suggested Fix" test list):
 *   - Missing signing secret env var -> 500 (refuse to process)
 *   - Valid signature, user.created -> upsert + 204
 *   - Valid signature, user.updated -> upsert + 204
 *   - Invalid signature -> 401
 *   - Missing Svix headers -> 401
 *   - Tampered payload -> 401
 *   - Replay / stale timestamp -> 401
 *   - Unknown event type -> 204 without touching the DB
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Build a Request for the webhook endpoint. The body is intentionally raw
 *  (stringified) so the route can hand the *raw* body to the signature
 *  verifier, mirroring real HTTP behaviour. */
function buildRequest(body, headers = {}) {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** A valid (already-verified) event as seen by the route after verifyWebhook succeeds. */
function verifiedEvent(type, data) {
  return {
    type,
    data: { id: "user_123", ...data },
    object: "event",
  };
}

/**
 * Re-import the route with full control over:
 *   - process.env.CLERK_WEBHOOK_SECRET (present / absent)
 *   - the behaviour of `verifyWebhook`
 *   - a fresh, reset `db.user.upsert` mock
 */
async function loadRoute({ withSecret, onVerify }) {
  vi.resetModules();

  if (withSecret) {
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test_signing_secret";
  } else {
    delete process.env.CLERK_WEBHOOK_SECRET;
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  }

  const upsert = vi.fn(async () => ({}));
  vi.doMock("@/lib/db/prisma", () => ({ db: { user: { upsert } } }));

  const verifyWebhook = vi.fn(async () => onVerify());
  vi.doMock("@clerk/nextjs/webhooks", () => ({ verifyWebhook }));

  const routeMod = await import("../app/api/webhooks/clerk/route.js");
  const clerkMod = await import("@clerk/nextjs/webhooks");
  const dbMod = await import("@/lib/db/prisma");

  // Allow tests to override verification behaviour per-call if needed.
  clerkMod.verifyWebhook.mockImplementation(async (req) => onVerify(req));

  return {
    POST: routeMod.POST,
    verifyWebhook: clerkMod.verifyWebhook,
    upsert: dbMod.db.user.upsert,
  };
}

afterEach(() => {
  vi.resetModules();
  delete process.env.CLERK_WEBHOOK_SECRET;
  delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
});

describe("POST /api/webhooks/clerk", () => {
  it("returns 500 when no signing secret is configured", async () => {
    const { POST } = await loadRoute({
      withSecret: false,
      onVerify: () => verifiedEvent("user.created", {}),
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(500);
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/);
    const body = await res.json();
    expect(body.error).toMatch(/signing secret/i);
  });

  it("verifies the signature and syncs a user.created event (204)", async () => {
    const { POST, verifyWebhook, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () =>
        verifiedEvent("user.created", {
          email_addresses: [{ email_address: "new@example.com" }],
          first_name: "Ada",
          last_name: "Lovelace",
          image_url: "https://example.com/ada.png",
        }),
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(verifyWebhook).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({
      where: { clerkUserId: "user_123" },
      create: {
        clerkUserId: "user_123",
        email: "new@example.com",
        name: "Ada Lovelace",
        imageUrl: "https://example.com/ada.png",
      },
      update: {
        email: "new@example.com",
        name: "Ada Lovelace",
        imageUrl: "https://example.com/ada.png",
      },
    });
    expect(res.status).toBe(204);
  });

  it("verifies the signature and syncs a user.updated event (204)", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () =>
        verifiedEvent("user.updated", {
          email_addresses: [{ email_address: "ada@example.com" }],
          first_name: "Ada",
          last_name: "King",
          image_url: null,
        }),
    });

    const res = await POST(buildRequest({ type: "user.updated", data: {} }));

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].update.email).toBe("ada@example.com");
    expect(res.status).toBe(204);
  });

  it("returns 401 when the signature cannot be verified", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => {
        throw new Error("Signature verification failed");
      },
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(401);
    expect(res.headers.get("Content-Type")).toMatch(/application\/json/);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    // Crucially: a forged/unverifiable payload must NOT reach the DB.
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 401 when Svix headers are missing", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => {
        const err = new Error("missing required svix headers");
        err.code = "ERR_INVALID_ARG";
        throw err;
      },
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 401 when the payload has been tampered with", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => {
        throw new Error("payload signature mismatch");
      },
    });

    const res = await POST(
      buildRequest({
        type: "user.created",
        data: { id: "attacker", email_addresses: [{ email_address: "x@y.z" }] },
      })
    );

    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 401 for replayed events (stale timestamp)", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => {
        const err = new Error("timestamp outside of tolerance window");
        err.code = "ERR_SVIX_REPLAY";
        throw err;
      },
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 204 for unknown event types without touching the DB", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => verifiedEvent("session.started", { id: "sess_1" }),
    });

    const res = await POST(buildRequest({ type: "session.started", data: {} }));

    expect(upsert).not.toHaveBeenCalled();
    expect(res.status).toBe(204);
  });

  it("returns 400 for a verified event missing type/data", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => ({ type: undefined, data: undefined }),
    });

    const res = await POST(buildRequest({}));

    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});

/* Legacy duplicate suite accidentally concatenated during an upstream merge.
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
*/
