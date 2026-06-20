"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput } from "@/lib/validate";
import { userSettingsSchema } from "@/lib/schemas/forms";

async function getUserByClerkId(userId) {
  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("[Settings Action] Error fetching user:", error.message);
    throw error;
  }
}

function normalizeSettings(settings) {
  if (!settings) return { notifications: true, emailAlerts: true };
  return {
    notifications: settings.notifications ?? true,
    emailAlerts: settings.emailAlerts ?? true,
  };
}

function normalizeSettingsInput(data) {
  return {
    notifications: Boolean(data.notifications),
    emailAlerts: Boolean(data.emailAlerts),
  };
}

export async function getUserSettings() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await getUserByClerkId(userId);

    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return normalizeSettings(settings);
  } catch (error) {
    console.error("[Settings Action] Error in getUserSettings:", error.message);
    return normalizeSettings(null);
  }
}

export async function updateUserSettings(data) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const validation = validateInput(userSettingsSchema, data);
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    const user = await getUserByClerkId(userId);
    const settingsData = validation.data;

    const settings = await db.userSettings.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        ...settingsData,
      },
      update: settingsData,
    });

    revalidatePath("/settings");
    return { success: true, settings: normalizeSettings(settings) };
  } catch (error) {
    console.error("[Settings Action] Error in updateUserSettings:", error.message);
    if (process.env.NODE_ENV === "test") {
      throw error;
    }
    return {
      success: false,
      error: "Failed to update settings. Please ensure database migrations are applied."
    };
  }
}
