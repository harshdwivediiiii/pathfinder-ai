import { db } from "@/lib/db/prisma";
import { Webhook } from "svix";

export async function POST(request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[clerk-webhook] Missing required Svix headers");
    return new Response(JSON.stringify({ error: "Missing required headers" }), { status: 400 });
  }

  const body = await request.text();

  const wh = new Webhook(webhookSecret);

  let event;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (error) {
    console.error("[clerk-webhook] Webhook signature verification failed");
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
  }

  const { type, data } = event;

  if (!type || !data) {
    console.error("[clerk-webhook] Invalid webhook payload structure");
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), { status: 400 });
  }

  if (type === "user.created" || type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = data;

    if (!id) {
      console.error("[clerk-webhook] Missing user id in verified payload");
      return new Response(JSON.stringify({ error: "Missing user id" }), { status: 400 });
    }

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      console.error("[clerk-webhook] User has no email address in verified payload");
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
