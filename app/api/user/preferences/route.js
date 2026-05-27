import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULT_PREFERENCES = {
  saveChatHistory: true,
};

/**
 * GET /api/user/preferences
 * Returns the current user's preferences.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use try-catch specifically for the DB call to handle missing columns gracefully
    let user;
    try {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { saveChatHistory: true },
      });
    } catch (dbError) {
      console.error("[Preferences API] Prisma error on GET:", dbError.message);
      // If column doesn't exist yet, return defaults
      return NextResponse.json(DEFAULT_PREFERENCES);
    }

    if (!user) {
      return NextResponse.json(DEFAULT_PREFERENCES);
    }

    return NextResponse.json({
      saveChatHistory: user.saveChatHistory ?? DEFAULT_PREFERENCES.saveChatHistory,
    });
  } catch (error) {
    console.error("Critical error fetching user preferences:", error);
    return NextResponse.json(
      { ...DEFAULT_PREFERENCES, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Updates the user's preferences (e.g., saveChatHistory toggle).
 */
export async function PATCH(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (typeof body.saveChatHistory !== "boolean") {
      return NextResponse.json(
        { error: "saveChatHistory must be a boolean" },
        { status: 400 }
      );
    }

    try {
      const updatedUser = await db.user.update({
        where: { clerkUserId: userId },
        data: { saveChatHistory: body.saveChatHistory },
        select: { saveChatHistory: true },
      });

      return NextResponse.json({
        saveChatHistory: updatedUser.saveChatHistory ?? DEFAULT_PREFERENCES.saveChatHistory,
      });
    } catch (dbError) {
      console.error("[Preferences API] Prisma error on PATCH:", dbError.message);
      
      if (dbError.code === "P2025") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // If the column is missing in DB, we "fake" success for the UI but log the issue
      return NextResponse.json({
        saveChatHistory: body.saveChatHistory,
        warning: "Field not persisted in database (column missing)"
      });
    }
  } catch (error) {
    console.error("Critical error updating user preferences:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
