import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";
import { conversationSearchSchema } from "@/lib/schemas/forms";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const validation = conversationSearchSchema.safeParse({ q: searchParams.get("q") });

    if (!validation.success) {
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid search query",
        validation.error.flatten().fieldErrors
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return respondError(ERROR_CODES.USER_NOT_FOUND);
    }

    const searchKeyword = validation.data.q;

    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            title: {
              contains: searchKeyword,
              mode: "insensitive",
            },
          },
          {
            messages: {
              some: {
                content: {
                  contains: searchKeyword,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json({
      conversations: Array.isArray(conversations) ? conversations : [],
    });
  } catch (error) {
    console.error("Error searching conversations:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal Server Error");
  }
}
