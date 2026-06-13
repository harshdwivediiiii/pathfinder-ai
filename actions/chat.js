"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { enforceRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { validateInput } from "@/lib/validate";
import { chatPromptSchema } from "@/lib/schemas/forms";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

export async function chatWithGemini(prompt) {
  try {
    const validation = validateInput(chatPromptSchema, { prompt });
    if (!validation.success) {
      return { success: false, errors: validation.errors };
    }

    const authResult = await auth();
    const userId = authResult?.userId;
    const headerList = await headers();

    const subject = getRateLimitIdentifier({ headers: headerList }, userId);
    const rateLimit = await enforceRateLimit({
      endpoint: "action:chatWithGemini",
      subject,
      limitPerMinute: userId ? 20 : 5,
      burstCapacity: userId ? 10 : 5,
    });

    if (!rateLimit.allowed) {
      return {
        success: false,
        errors: { _form: [`Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds}s.`] },
      };
    }

    if (userId) {
      const limit = await checkRateLimit(userId, "chat");
      if (!limit.allowed) {
        return {
          success: false,
          errors: {
            _form: [`Chat limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
          },
        };
      }
    }
    const user = userId
      ? await db.user.findUnique({
          where: { clerkUserId: userId },
        })
      : null;

    const securePrompt = buildSecurePrompt({
      context: buildUserProfileContext(user),
      task: "You are Pathfinder AI, a career-focused assistant. Only answer career-related questions. Politely refuse unrelated questions.",
      untrustedData: [
        { label: "userQuery", value: validation.data.prompt, maxLength: 4000 },
      ],
    });

    try {
      const { response } = await generateGeminiContent(securePrompt);
      return response.text();
    } catch (err) {
      const message =
        err?.response?.error?.message || err?.message || "Unknown Gemini error";
      console.error("Gemini API error:", message);
      return {
        success: false,
        errors: { _form: ["Failed to get response from Gemini AI. Please try again."] },
      };
    }
  } catch (error) {
    console.error("Chat action error:", error);
    return {
      success: false,
      errors: { _form: [error.message || "An unexpected error occurred."] },
    };
  }
}
