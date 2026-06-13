import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";
import { validateId } from "@/lib/validate";

export async function GET(request, context) {
  const params = await context.params;
  const idValidation = validateId(params.id);

  if (!idValidation.success) {
    return respondError(ERROR_CODES.VALIDATION_ERROR, "Conversation ID is required", idValidation.errors);
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return respondError(ERROR_CODES.USER_NOT_FOUND);
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: idValidation.data,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return respondError(ERROR_CODES.RESOURCE_NOT_FOUND, "Conversation not found");
    }

    return Response.json(conversation);
  } catch (error) {
    console.error("GET single conversation error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to fetch conversation");
  }
}

export async function DELETE(request, context) {
  const params = await context.params;
  const idValidation = validateId(params.id);

  if (!idValidation.success) {
    return respondError(ERROR_CODES.VALIDATION_ERROR, "Conversation ID is required", idValidation.errors);
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return respondError(ERROR_CODES.USER_NOT_FOUND);
    }

    const { count } = await db.conversation.deleteMany({
      where: {
        id: idValidation.data,
        userId: user.id,
      },
    });

    if (count === 0) {
      return respondError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Conversation not found"
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE conversation error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to delete conversation");
  }
}