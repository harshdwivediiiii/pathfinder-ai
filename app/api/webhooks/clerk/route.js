import { db } from "@/lib/db/prisma";
import { verifyWebhook, WebhookVerificationError } from "@clerk/backend";

export async function POST(request) {
  // Verify svix signature to ensure the request is from Clerk
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500 });
  }

  const rawBody = await request.text();

  let payload;
  try {
    payload = verifyWebhook({
      payload: rawBody,
      headers: request.headers,
      secret: webhookSecret,
    });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("[clerk-webhook] Invalid signature:", err.message);
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), { status: 400 });
    }
    console.error("[clerk-webhook] Verification error:", err);
    return new Response(JSON.stringify({ error: "Webhook verification failed" }), { status: 400 });
  }

  const { type, data } = payload;

  if (!type || !data) {
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), { status: 400 });
  }

  if (type === "user.created" || type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing user id" }), { status: 400 });
    }

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return new Response(JSON.stringify({ error: "User has no email address" }), { status: 400 });
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
      return new Response(JSON.stringify({ error: "Failed to sync user" }), { status: 500 });
    }
  }

  return new Response(null, { status: 204 });
}
