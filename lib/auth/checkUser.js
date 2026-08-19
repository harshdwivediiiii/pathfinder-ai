import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "../db/prisma";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

async function upsertUserWithRetry(userId, email, name, imageUrl, attempt = 0) {
  try {
    return await db.user.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email,
        name: name || "User",
        imageUrl: imageUrl ?? "",
      },
      update: {
        email,
        name: name || "User",
        imageUrl: imageUrl ?? "",
      },
    });
  } catch (error) {
    if (error?.code === "P2002" && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      return upsertUserWithRetry(userId, email, name, imageUrl, attempt + 1);
    }
    throw error;
  }
}

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const email = user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      console.error("[checkUser] Clerk user has no email address:", user.id);
      return null;
    }

    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    return await upsertUserWithRetry(user.id, email, name, user.imageUrl);
  } catch (error) {
    console.error("[checkUser] Failed to sync user:", error?.message ?? error);
    return null;
  }
};
