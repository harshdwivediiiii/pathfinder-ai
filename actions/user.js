"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { getIndustryInsightRefreshTime } from "@/lib/industry-insights";
import { validateInput } from "@/lib/validate";
import { userProfileSchema } from "@/lib/schemas/forms";
import { withAuth } from "@/lib/auth-errors";

/**
 * Updates the current user's profile with industry and other info.
 * `data` is expected to hold: { industry, currentRole?, targetRole?, careerGoals?, experience?, bio?, skills? }
 */
export async function updateUser(data) {
  const validation = validateInput(userProfileSchema, data);

  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  const profileData = validation.data;

  const { userId } = await auth();
  if (!userId) throw new Error("Please sign in to complete onboarding");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Generate industry insights outside the DB transaction to avoid
  // long-running external calls inside a DB tx (which can cause timeouts).
  let precomputedInsights = null;
  try {
    let existingInsight = await db.industryInsight.findUnique({
      where: { industry: profileData.industry },
    });

    if (!existingInsight) {
      precomputedInsights = await generateAIInsights(profileData.industry);
    }
  } catch (e) {
    console.error("Failed to generate insights pre-transaction:", e);
    precomputedInsights = null;
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const industryInsight = precomputedInsights
        ? await tx.industryInsight.upsert({
            where: { industry: profileData.industry },
            update: {},
            create: {
              industry: profileData.industry,
              ...precomputedInsights,
              nextUpdate: getIndustryInsightRefreshTime(),
            },
          })
        : await tx.industryInsight.findUnique({
            where: { industry: profileData.industry },
          });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          industry: profileData.industry,
          currentRole: profileData.currentRole ?? null,
          targetRole: profileData.targetRole ?? null,
          careerGoals: profileData.careerGoals ?? null,
          experience: profileData.experience ?? null,
          bio: profileData.bio ?? null,
          skills: profileData.skills ?? [],
        },
      });
      return { updatedUser, industryInsight };
    });

    revalidatePath("/");
    revalidatePath("/settings");

    return result;
  } catch (err) {
    console.error("Error updating user and industry:", err);
    throw new Error("Failed to update profile");
  }
}

/**
 * Gets the user's onboarding status.
 * If the user doesn't exist in the app DB yet, create it from Clerk.
 * Returns: { isOnboarded: boolean }
 */
export async function getUserOnboardingStatus() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { isOnboarded: false, user: null, isSignedIn: false };
    }

    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      const backend = await clerkClient();
      const clerkUser = await backend.users.getUser(userId);

      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (!email) {
        return { isOnboarded: false, user: null, isSignedIn: true, error: "Email not found" };
      }

      user = await db.user.upsert({
        where: { clerkUserId: userId },
        update: {
          name: clerkUser.firstName ?? "",
          imageUrl: clerkUser.imageUrl ?? "",
        },
        create: {
          clerkUserId: userId,
          email,
          name: clerkUser.firstName ?? "",
          imageUrl: clerkUser.imageUrl ?? "",
        },
      });
    }

    return {
      isOnboarded: Boolean(user.industry),
      user,
      isSignedIn: true,
    };
  } catch (error) {
    console.error("Error getting user onboarding status:", error);
    return { isOnboarded: false, user: null, isSignedIn: false, error: error.message };
  }
}
