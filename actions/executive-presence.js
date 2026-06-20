"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { buildSecurePrompt, generateWithStructuredOutput } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateOutput } from "@/lib/validate";
import { executivePresenceOutputSchema, SCHEMA_DESCRIPTIONS } from "@/lib/schemas/outputs";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

const EXECUTIVE_SYSTEM_CONTEXT = `You are a C-level executive coach specializing in leadership communication, gravitas, and executive presence. Your goal is to help professionals transition from functional experts to influential leaders. You focus on removing hedging language, increasing clarity, and commanding the room in high-stakes scenarios.`;

export async function generateExecutivePresence(formData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const limit = await checkRateLimit(userId, "executive_presence");
    if (!limit.allowed) {
      throw new Error(`Executive presence generation limit reached. Resets in ${formatResetTime(limit.resetAt)}.`);
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const targetAudience = formData.get("targetAudience");
    const currentChallenge = formData.get("currentChallenge");

    const prompt = buildSecurePrompt({
      context: `${buildUserProfileContext(user)}\n\n${EXECUTIVE_SYSTEM_CONTEXT}`,
      task: `Analyze the user's leadership communication based on their profile and the following inputs:
Target Audience (who they need to influence): "${targetAudience}"
Current Communication/Leadership Challenge: "${currentChallenge}"

Provide a "Persona Summary" (how they should position themselves), specific "Communication Upgrades" (weak phrases to eliminate and strong alternatives), a strategy for dominating their next high-stakes meeting, and daily "Gravitas Builders" (exercises to build executive presence).

Respond ONLY with a valid JSON object in this exact format:
{
  "personaSummary": "Executive brand summary and positioning",
  "communicationUpgrades": [
    {
      "from": "Hedging/weak phrase (e.g., 'I just think maybe we should...')",
      "to": "Authoritative alternative (e.g., 'I recommend we...')",
      "why": "Why this shift builds authority"
    }
  ],
  "meetingStrategy": ["Pre-meeting alignment tip", "How to open", "How to handle interruptions"],
  "gravitasBuilders": ["Daily habit 1", "Daily habit 2"]
}`,
      untrustedData: [
        { label: "targetAudience", value: targetAudience, maxLength: 500 },
        { label: "currentChallenge", value: currentChallenge, maxLength: 2000 },
      ],
    });

    const schemaDescription = SCHEMA_DESCRIPTIONS.executivePresence;

    const result = await generateWithStructuredOutput({
      prompt,
      schemaDescription,
      schema: executivePresenceOutputSchema,
      generateFn: async (p) => {
        const raw = await generateGeminiContent(p);
        return raw.response.text().trim();
      },
      validateFn: validateOutput,
    });

    if (!result.success) {
      console.error("Executive presence output validation failed:", result.errors);
      throw new Error("AI returned an unexpected format.");
    }

    const presence = await db.executivePresence.create({
      data: {
        userId: user.id,
        targetAudience,
        currentChallenge,
        presenceData: result.data,
      },
    });

    return presence;
  } catch (error) {
    console.error("Error generating executive presence:", error);
    if (process.env.NODE_ENV === "test") {
      throw error;
    }
    return {
      success: false,
      error: error?.message || "Failed to generate executive presence plan."
    };
  }
}

export async function getExecutivePresences() {
  try {
    const { userId } = await auth();
    if (!userId) return { presences: [], error: null };

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return { presences: [], error: null };

    const presences = await db.executivePresence.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    
    return { presences, error: null };
  } catch (error) {
    console.error("Error fetching executive presences:", error);
    return { 
      presences: [], 
      error: error.message || "Failed to load executive presence history." 
    };
  }
}
