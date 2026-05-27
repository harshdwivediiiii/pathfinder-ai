import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(request, context) {
  const params = await context.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role, content } = body;

    if (!role || !content) {
      return Response.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        conversationId: params.id,
        role,
        content,
      },
    });

    await db.conversation.updateMany({
   where: {
    id: params.id,
    userId: user.id,
  },
  data: {
    updatedAt: new Date(),
  },
});

    return Response.json(message);
  } catch (error) {
    console.error("POST message error:", error);
    return Response.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}