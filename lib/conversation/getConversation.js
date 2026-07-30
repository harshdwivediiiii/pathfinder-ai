import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";

export async function verifyMessageOwnership(messageId, conversationId, userId) {
  const message = await db.message.findFirst({
    where: {
      id: messageId,
      conversation: {
        id: conversationId,
        userId: userId,
      },
    },
  });
  return !!message;
}

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