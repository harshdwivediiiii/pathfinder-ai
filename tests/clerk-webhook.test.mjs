/**
 * Tests for the Clerk webhook endpoint: app/api/webhooks/clerk/route.js
 *
 * Regression coverage for the security issue where the webhook endpoint
 * trusted the request body without verifying Clerk's Svix signature.
 *
 * Covered scenarios:
 *   - Missing signing secret env var -> 500 (refuse to process)
 *   - Valid signature, user.created -> upsert + 204
 *   - Valid signature, user.updated -> upsert + 204
 *   - Invalid signature -> 401
 *   - Missing Svix headers -> 401
 *   - Tampered payload -> 401
 *   - Replay / stale timestamp -> 401
 *   - Unknown event type -> 204 without touching the DB
 */
import { afterEach, describe, expect, it, vi } from "vitest";

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
    expect(body.error.message).toMatch(/signing secret/i);
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
    expect(body.error.code).toBe("UNAUTHORIZED");
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

  it("returns 400 for a verified user event missing user id", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () =>
        verifiedEvent("user.created", {
          id: undefined,
          email_addresses: [{ email_address: "new@example.com" }],
        }),
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 400 for a verified user event missing email", async () => {
    const { POST, upsert } = await loadRoute({
      withSecret: true,
      onVerify: () => verifiedEvent("user.created", { email_addresses: [] }),
    });

    const res = await POST(buildRequest({ type: "user.created", data: {} }));

    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});
