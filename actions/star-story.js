"use server";

import { handleServerError } from "@/lib/errors/error-handler";
import { createErrorResponse } from "@/lib/action-helpers/action-errors";
import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/ai/prompt-safety";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";

/**
 * Validates raw experience input for gibberish or meaningless content.
 * Rejects single words, keyboard mashes, and highly repetitive strings.
 *
 * @param {string} text - The raw experience input
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateRawExperience(text) {
  const trimmed = text.trim();

  // Reject single words or very sparse content
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return "Please describe your experience in at least two words.";
  }

  // Reject if fewer than 30% of characters are alphabetic
  // (catches keyboard mashes like "asdfjkl; qwertyuiop zxcvbnm")
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const alphaRatio = alphaCount / trimmed.length;
  if (alphaRatio < 0.3) {
    return "Please provide a meaningful description using real words.";
  }

  // Reject excessive character repetition (e.g. "aaaaaaa bbbbb ccccc")
  const repetitionPattern = /(.)\1{5,}/g;
  if (repetitionPattern.test(trimmed)) {
    return "Please provide a real description instead of repeated characters.";
  }

  return null;
}

function isMeaningfulExperience(input) {
  if (!input || typeof input !== "string") return false;

  const text = input.trim();
  
  // Empty or too short
  if (text.length < 20) return false;

  // Split into words and filter for real words (letters only, min 2 chars)
  const words = text
    .split(/\s+/)
    .filter((word) => /^[a-zA-Z]{2,}$/.test(word));

  // Need at least 5 real words
  if (words.length < 5) return false;

  // Detect excessive repeated characters (e.g., "kkkkkkkkkk")
  if (/(.)\1{5,}/i.test(text)) return false;

  // Check for repeated words (gibberish detection)
  const uniqueWords = new Set(words.map(word => word.toLowerCase()));
  if (uniqueWords.size < 3) return false;

  // Calculate alphabetic ratio
  const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
  const alphabeticRatio = letterCount / text.length;

  // At least 60% of characters should be letters
  if (alphabeticRatio < 0.6) return false;

  return true;
}

export async function generateStarStory(rawExperience) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, errors: { _form: ["Unauthorized"] } };
  }

  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId } 
  });
  
  if (!user) {
    return createErrorResponse("User not found");
  }

  // First validate the input before checking rate limit
  // Validate meaningful experience
  if (!isMeaningfulExperience(rawExperience)) {
    return {
      success: false,
      errors: {
        _form: [
          "Please describe a meaningful experience with enough details about the situation, challenge, and actions you took."
        ],
      },
    };
  }

  // Maximum length validation
  if (rawExperience.trim().length > 3000) {
    return {
      success: false,
      errors: {
        _form: ["Experience description must be 3000 characters or fewer."]
      }
    };
  }

  // Check rate limit after validation (to avoid consuming quota on invalid input)
  const limit = await checkRateLimit(userId, "starStory");
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        _form: [`STAR story generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`],
      },
    };
  }

  // Build the prompt
  const prompt = buildSecurePrompt({
    context: "You are an expert career coach helping a candidate prepare for behavioral interviews.",
    task: `Transform the candidate's raw experience into a perfectly structured STAR format (Situation, Task, Action, Result). 
    Enhance the professional tone, highlight the impact, and ensure it sounds compelling for an interview.`,
    untrustedData: [
      { label: "rawExperience", value: rawExperience, maxLength: 3000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "title": "A short 3-5 word title for this story",
  "situation": "Describe the context or background.",
  "task": "Describe the challenge or expectation.",
  "action": "Describe exactly what the candidate did, focusing on their specific contributions and skills used.",
  "result": "Describe the positive outcome, using metrics or concrete impact if possible."
}`,
  });

  try {
    // Generate STAR story using AI
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    // Save to database
    const record = await db.starStory.create({
      data: {
        userId: user.id,
        rawExperience,
        starContent: parsedData,
      },
    });

    revalidatePath("/interview/star-builder");
    
    return { 
      success: true, 
      data: record 
    };
  } catch (error) {
    // Decrement rate limit on error
    await decrementRateLimit(userId, "starStory");
    return handleServerError(error, "star-story");
  }
}

export async function getStarStories() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, data: [] };
  }

  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId } 
  });
  
  if (!user) {
    return { success: false, data: [] };
  }

  const records = await db.starStory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { 
    success: true, 
    data: records 
  };
}
