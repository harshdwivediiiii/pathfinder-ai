import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET(request, context) {
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
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return Response.json(conversation);
  } catch (error) {
    console.error("GET single conversation error:", error);
    return Response.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
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

    await db.conversation.delete({
      where: {
        id: params.id,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE conversation error:", error);
    return Response.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}