import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Search query 'q' is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchKeyword = query.trim();

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
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      conversations: Array.isArray(conversations) ? conversations : [],
    });
  } catch (error) {
    console.error("Error searching conversations:", error);
    return NextResponse.json(
      { conversations: [], error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
