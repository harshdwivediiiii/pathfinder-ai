import { db } from "@/lib/db/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

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
        create: { clerkUserId: id, email, name, imageUrl: image_url ?? "" },
        update: { email, name, imageUrl: image_url ?? "" },
      });
    } catch (error) {
      console.error("[clerk-webhook] Failed to upsert user:", error?.message ?? error);
      return jsonError("Failed to sync user", 500);
    }
  }

  return new Response(null, { status: 204 });
}
