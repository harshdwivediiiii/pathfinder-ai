"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/prisma";
import { MOCK_CAREERS } from "@/lib/misc/mock-careers";
import {
  asBrowseCareers,
  rankExploreCareers,
} from "@/lib/misc/explore-careers";
import { handleServerError } from "@/lib/errors/error-handler";

export async function getExploreCareers() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return asBrowseCareers(MOCK_CAREERS);
    }

    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { skills: true, targetRole: true },
    });

    return rankExploreCareers(MOCK_CAREERS, user);
  } catch (error) {
    handleServerError(error, "explore");
    return asBrowseCareers(MOCK_CAREERS);
  }
}
