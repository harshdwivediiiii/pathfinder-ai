"use server";
import { handleServerError } from "@/lib/error-handler";

import { db } from "@/lib/prisma";
import { getUserByClerkId } from "@/lib/user";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput } from "@/lib/validate";
import { userSettingsSchema, accessibilitySettingsSchema } from "@/lib/schemas/forms";

function normalizeSettings(settings) {
  if (!settings) return { 
    notifications: true, 
    emailAlerts: true,
    largeButtonsMode: false,
    highContrastMode: false,
    speechSpeed: 1.0,
    preferredLanguage: "en",
    preferredVoiceLanguage: "en",
    oneTapCameraMode: false
  };
  return {
    notifications: settings.notifications ?? true,
    emailAlerts: settings.emailAlerts ?? true,
    largeButtonsMode: settings.largeButtonsMode ?? false,
    highContrastMode: settings.highContrastMode ?? false,
    speechSpeed: settings.speechSpeed ?? 1.0,
    preferredLanguage: settings.preferredLanguage ?? "en",
    preferredVoiceLanguage: settings.preferredVoiceLanguage ?? "en",
    oneTapCameraMode: settings.oneTapCameraMode ?? false,
  };
}


export async function getUserSettings() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await getUserByClerkId(userId);

    const settings = await db.userSettings.findUnique({
      where: { userId: user.id },
    });

    return normalizeSettings(settings);
  } catch (error) {
    return handleServerError(error, "settings");
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
    return handleServerError(error, "settings");
  }
}

export async function updateAccessibilitySettings(data) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const validation = validateInput(accessibilitySettingsSchema, data);
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
    return handleServerError(error, "settings");
  }
}
