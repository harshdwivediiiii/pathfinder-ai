import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";

export async function getOwnedConversation(conversationId) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    return null;
  }

  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
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

  return {
    user,
    conversation,
  };
}