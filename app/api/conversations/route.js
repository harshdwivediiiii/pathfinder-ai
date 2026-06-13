import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";
import { conversationCreateSchema } from "@/lib/schemas/forms";

export async function GET() {
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

    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json({
      conversations,
    });
  } catch (error) {
    console.error("GET conversations error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to fetch conversations");
  }
}

export async function POST(request) {
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

    let body;
    try {
      body = await request.json();
    } catch {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid request body");
    }

    const validation = conversationCreateSchema.safeParse(body);

    if (!validation.success) {
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid conversation payload",
        validation.error.flatten().fieldErrors
      );
    }

    const { title, firstMessage } = validation.data;

    const conversation = await db.conversation.create({
      data: {
        title: title || "New Conversation",
        userId: user.id,
        messages: {
          create: firstMessage
            ? [
                {
                  role: "user",
                  content: firstMessage.content,
                },
              ]
            : [],
        },
      },
      include: {
        messages: true,
      },
    });

    return Response.json(conversation);
  } catch (error) {
    console.error("POST conversation error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to create conversation");
  }
}

export async function DELETE() {
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

    await db.conversation.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE conversations error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to clear conversations");
  }
}