import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id,
      },
      include: {
        messages: true,
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

    return Response.json(
      {
        error: "Failed to fetch conversations",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const { title, firstMessage } = body;

    const conversation = await db.conversation.create({
      data: {
        title: title || "New Conversation",
        userId: user.id,
        messages: {
          create: firstMessage
            ? [
                {
                  role: "user",
                  content: firstMessage,
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

    return Response.json(
      {
        error: "Failed to create conversation",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
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

    return Response.json(
      {
        error: "Failed to clear conversations",
      },
      { status: 500 }
    );
  }
}