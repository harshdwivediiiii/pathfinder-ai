import { db } from "@/lib/db/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

/**
 * Clerk webhook endpoint.
 *
 * IMPORTANT (trust boundary):
 * This endpoint is public. Every request MUST be verified against Clerk's
 * webhook signing secret before any payload field is trusted or any database
 * operation is performed. Without this, an attacker can forge arbitrary
 * `user.created` / `user.updated` events and create or mutate user records.
 *
 * We use Clerk's official `verifyWebhook` helper, which reads the raw request
 * body once and validates the Svix headers (`svix-id`, `svix-timestamp`,
 * `svix-signature`) using the configured signing secret, including replay
 * protection via timestamp validation.
 */

/** Resolve the Clerk webhook signing secret from the environment. */
function getWebhookSigningSecret() {
  return (
    process.env.CLERK_WEBHOOK_SECRET ||
    process.env.CLERK_WEBHOOK_SIGNING_SECRET
  );
}

/** Convenience helper to return a JSON error response with correct content type. */
function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  const WEBHOOK_SIGNING_SECRET = getWebhookSigningSecret();

  // 1. Reject early if no signing secret is configured. The endpoint cannot
  //    prove authenticity without it, so it must never process payloads.
  if (!WEBHOOK_SIGNING_SECRET) {
    console.error(
      "[clerk-webhook] No signing secret configured (CLERK_WEBHOOK_SECRET / CLERK_WEBHOOK_SIGNING_SECRET). Rejecting request."
    );
    return jsonError("Webhook signing secret is not configured", 500);
  }

  // 2. Verify the request signature BEFORE parsing/trusting the body.
  //    `verifyWebhook` consumes the raw body and throws if the signature is
  //    invalid, missing, or replayed.
  let event;
  try {
    event = await verifyWebhook(request, {
      signingSecret: WEBHOOK_SIGNING_SECRET,
    });
  } catch (err) {
    console.error(
      "[clerk-webhook] Webhook signature verification failed:",
      err?.message ?? err
    );
    return jsonError("Unauthorized", 401);
  }

  const { type, data } = event;

  if (!type || !data) {
    return jsonError("Invalid webhook payload", 400);
  }

  if (type === "user.created" || type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data;

    if (!id) {
      return jsonError("Missing user id", 400);
    }

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return jsonError("User has no email address", 400);
    }

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User";

    try {
      await db.user.upsert({
        where: { clerkUserId: id },
        create: {
          clerkUserId: id,
          email,
          name,
          imageUrl: image_url ?? "",
        },
        update: {
          email,
          name,
          imageUrl: image_url ?? "",
        },
      });
    } catch (error) {
      console.error("[clerk-webhook] Failed to upsert user:", error?.message ?? error);
      return jsonError("Failed to sync user", 500);
    }
  }

  return new Response(null, { status: 204 });
}
