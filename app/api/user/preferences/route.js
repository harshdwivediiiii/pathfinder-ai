import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";
import { userPreferencesSchema } from "@/lib/schemas/forms";

const DEFAULT_PREFERENCES = {
  saveChatHistory: true,
};

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    let user;
    try {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { saveChatHistory: true },
      });
    } catch (dbError) {
      console.error("[Preferences API] Prisma error on GET:", dbError.message);
      return Response.json(DEFAULT_PREFERENCES);
    }

    if (!user) {
      return Response.json(DEFAULT_PREFERENCES);
    }

    return Response.json({
      saveChatHistory: user.saveChatHistory ?? DEFAULT_PREFERENCES.saveChatHistory,
    });
  } catch (error) {
    console.error("Critical error fetching user preferences:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal Server Error");
  }
}

export async function PATCH(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid request body");
    }

    const validation = userPreferencesSchema.safeParse(body);

    if (!validation.success) {
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid user preferences payload",
        validation.error.flatten().fieldErrors
      );
    }

    try {
      const updatedUser = await db.user.update({
        where: { clerkUserId: userId },
        data: { saveChatHistory: validation.data.saveChatHistory },
        select: { saveChatHistory: true },
      });

      return Response.json({
        saveChatHistory: updatedUser.saveChatHistory ?? DEFAULT_PREFERENCES.saveChatHistory,
      });
    } catch (dbError) {
      console.error("[Preferences API] Prisma error on PATCH:", dbError.message);

      if (dbError.code === "P2025") {
        return respondError(ERROR_CODES.USER_NOT_FOUND);
      }

      return respondError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "Failed to save preferences"
      );
    }
  } catch (error) {
    console.error("Critical error updating user preferences:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal Server Error");
  }
}
