import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

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

    const dbUser = await db.user.upsert({
      where: { clerkUserId: user.id },
      create: {
        clerkUserId: user.id,
        email,
        name: name || "User",
        imageUrl: user.imageUrl ?? "",
      },
      update: {
        email,
        name: name || "User",
        imageUrl: user.imageUrl ?? "",
      },
    });

    return dbUser;
  } catch (error) {
    console.error("[checkUser] Failed to sync user:", error?.message ?? error);
    return null;
  }
};
