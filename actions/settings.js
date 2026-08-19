"use server";
import { handleServerError } from "@/lib/errors/error-handler";

import { db } from "@/lib/db/prisma";
import { getUserByClerkId } from "@/lib/auth/user";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validateInput } from "@/lib/ai/validate";
import { userSettingsSchema, accessibilitySettingsSchema } from "@/lib/schemas/forms";
function revalidateSettingsRoute() {
  revalidatePath("/settings");
}
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
    if (!user) return normalizeSettings(null);

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

    const preferenceValidation = validateInput(userSettingsSchema, {
      notifications: data?.notifications,
      emailAlerts: data?.emailAlerts,
    });
    const accessibilityValidation = validateInput(accessibilitySettingsSchema, {
      largeButtonsMode: data?.largeButtonsMode,
      highContrastMode: data?.highContrastMode,
      speechSpeed: data?.speechSpeed,
      preferredLanguage: data?.preferredLanguage,
      preferredVoiceLanguage: data?.preferredVoiceLanguage,
      oneTapCameraMode: data?.oneTapCameraMode,
    });

    if (!preferenceValidation.success || !accessibilityValidation.success) {
      return {
        success: false,
        errors: {
          ...preferenceValidation.errors,
          ...accessibilityValidation.errors,
        },
      };
    }

    const user = await getUserByClerkId(userId);
    const settingsData = {
      ...preferenceValidation.data,
      ...accessibilityValidation.data,
    };

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

    revalidateSettingsRoute();
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

    revalidateSettingsRoute();
    return { success: true, settings: normalizeSettings(settings) };
  } catch (error) {
    return handleServerError(error, "settings");
  }
}
