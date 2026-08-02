"use server";
import { handleServerError } from "@/lib/errors/error-handler";

import { db } from "@/lib/db/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { getIndustryInsightRefreshTime } from "@/lib/misc/industry-insights";
import { validateInput } from "@/lib/ai/validate";
import { userProfileSchema } from "@/lib/schemas/forms";
import { withAuth } from "@/lib/auth/auth-errors";

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
  if (!userId) {
    return { success: false, errors: { _form: ["Please sign in to complete onboarding"] } };
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) {
    return { success: false, errors: { _form: ["User not found"] } };
  }

  const insightPlaceholderData = (
    marketOutlook = "AI insights generation failed. This profile will be updated automatically in the future."
  ) => ({
    salaryRanges: [],
    growthRate: 0,
    demandLevel: "Medium",
    topSkills: [],
    marketOutlook,
    keyTrends: [],
    recommendedSkills: [],
    nextUpdate: getIndustryInsightRefreshTime(),
  });

  // Claim the industry insight row inside a short transaction before running the
  // slow, external AI call. Only the request that wins the claim generates
  // insights; concurrent first-time onboardings for the same industry skip it,
  // so the AI call happens at most once per industry.
  let precomputedInsights = null;
  let claimed = false;
  try {
    claimed = await db.$transaction(async (tx) => {
      const existing = await tx.industryInsight.findUnique({
        where: { industry: profileData.industry },
      });
      if (existing) return false;

      await tx.industryInsight.create({
        data: {
          industry: profileData.industry,
          ...insightPlaceholderData("AI insights generation in progress."),
        },
      });
      return true;
    });

    if (claimed) {
      try {
        precomputedInsights = await generateAIInsights(profileData.industry);
      } catch (e) {
        // If AI generation fails, the placeholder created by the claim stays.
        console.error("Failed to generate AI insights, will create placeholder:", e);
      }
    }
  } catch (e) {
    // Unique-constraint conflict means another concurrent request claimed the row;
    // do not generate a duplicate.
    console.error("Failed to claim industry insight row, skipping generation:", e);
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const industryInsight = await tx.industryInsight.upsert({
        where: { industry: profileData.industry },
        update: precomputedInsights
          ? { ...precomputedInsights, nextUpdate: getIndustryInsightRefreshTime() }
          : claimed
            ? insightPlaceholderData()
            : {},
        create: {
          industry: profileData.industry,
          ...(precomputedInsights ?? insightPlaceholderData()),
        },
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
    return handleServerError(err, "user");
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
    return handleServerError(error, "user");
  }
}
