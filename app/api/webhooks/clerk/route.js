import { db } from "@/lib/db/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/lib/db/prisma";
import { ERROR_CODES, respondError } from "@/lib/api/error-handler";

function getWebhookSigningSecret() {
  return process.env.CLERK_WEBHOOK_SECRET || process.env.CLERK_WEBHOOK_SIGNING_SECRET;
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  const signingSecret = getWebhookSigningSecret();
  if (!signingSecret) {
    console.error("[clerk-webhook] No webhook signing secret configured");
    return jsonError("Webhook signing secret is not configured", 500);
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
export async function POST(request) {
  const WEBHOOK_SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  // 1. Reject early if no signing secret is configured. The endpoint cannot
  //    prove authenticity without it, so it must never process payloads.
  if (!WEBHOOK_SIGNING_SECRET) {
    console.error(
      "[clerk-webhook] No signing secret configured (CLERK_WEBHOOK_SECRET). Rejecting request."
    );
    return respondError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Webhook signing secret is not configured"
    );
  }

  let event;
  try {
    event = await verifyWebhook(request, { signingSecret });
  } catch (error) {
    console.error(
      "[clerk-webhook] Webhook signature verification failed:",
      error?.message ?? error
    );
    return jsonError("Unauthorized", 401);
    return respondError(ERROR_CODES.UNAUTHORIZED);
  }

  const { type, data } = event;
  if (!type || !data) {
    return jsonError("Invalid webhook payload", 400);
    return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid webhook payload");
  }

  if (type === "user.created" || type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data;
    if (!id) {
      return jsonError("Missing user id", 400);
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Missing user id");
    }

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return jsonError("User has no email address", 400);
    }

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User";
    try {
      await db.user.upsert({
        where: { clerkUserId: id },
        create: { clerkUserId: id, email, name, imageUrl: image_url ?? "" },
        update: { email, name, imageUrl: image_url ?? "" },
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        "User has no email address"
      );
    }

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();

    try {
      await db.user.upsert({
        where: { clerkUserId: id },
        create: {
          clerkUserId: id,
          email,
          name: name || "User",
          imageUrl: image_url ?? "",
        },
        update: {
          email,
          name: name || "User",
          imageUrl: image_url ?? "",
        },
      });
    } catch (error) {
      console.error(
        "[clerk-webhook] Failed to upsert user:",
        error?.message ?? error
      );
      return respondError(ERROR_CODES.DATABASE_ERROR, "Failed to sync user");
    }
  }

  return new Response(null, { status: 204 });
}
