import { db } from "@/lib/db/prisma";

export async function POST(request) {
  const payload = await request.json();
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
