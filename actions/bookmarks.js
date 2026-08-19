"use server";

import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";

export async function saveBookmark({ question, options, answer, category }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const bookmark = await db.interviewBookmark.create({
    data: {
      userId: user.id,
      question,
      options: options || [],
      answer,
      category,
    },
  });

  return bookmark;
}

export async function removeBookmark(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Verify ownership
  const bookmark = await db.interviewBookmark.findUnique({
    where: { id },
  });

  if (!bookmark || bookmark.userId !== user.id) {
    throw new Error("Bookmark not found or unauthorized");
  }

  await db.interviewBookmark.delete({
    where: { id },
  });

  return { success: true };
}

export async function getBookmarks(category = null, search = null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const whereClause = { userId: user.id };

  if (category && category !== "All") {
    whereClause.category = category;
  }

  if (search) {
    whereClause.question = {
      contains: search,
      mode: "insensitive",
    };
  }

  const bookmarks = await db.interviewBookmark.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return bookmarks;
}

export async function checkIsBookmarked(question) {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return null;

  const bookmark = await db.interviewBookmark.findFirst({
    where: {
      userId: user.id,
      question: question
    }
  });

  return bookmark;
}
