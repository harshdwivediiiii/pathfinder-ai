"use server";

import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { parseAIJson } from "@/lib/ai/validate";
import { checkRateLimit, formatResetTime } from "@/lib/security/rate-limit-actions";
import { VLM_IMAGE_MAX_LENGTH } from "@/lib/security/input-limits";

const SUPPORTED_IMAGE_TYPES = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
};

export async function analyzeSystemDesign(base64Image) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const limit = await checkRateLimit(userId, "systemDesign");
    if (!limit.allowed) {
      return {
        success: false,
        error: `System design analysis limit reached. Resets in ${formatResetTime(limit.resetAt)}.`,
      };
    }

    const match = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return {
        success: false,
        error: "Invalid image format. Expected a data URL like data:image/png;base64,...",
      };
    }

    const mimeType = SUPPORTED_IMAGE_TYPES[match[1]];
    if (!mimeType) {
      return {
        success: false,
        error: `Unsupported image type "${match[1]}". Please upload a PNG or JPEG image.`,
      };
    }

    const base64Data = match[2];
    if (base64Data.length > VLM_IMAGE_MAX_LENGTH) {
      return {
        success: false,
        error: "Image is too large. Maximum allowed size is 10 MB.",
      };
    }

    const prompt = `
You are a Staff Software Engineer conducting a System Design Interview.
Analyze the provided architecture diagram drawn by the candidate on a whiteboard.
Identify the main components, explain any potential bottlenecks (e.g., single points of failure, missing caches, database bottlenecks), and suggest architectural improvements.
Keep your tone constructive, professional, and mentoring.

Return ONLY a valid JSON object matching this schema:
{
  "summary": "Brief summary of the architecture as you understand it",
  "bottlenecks": ["List of potential bottlenecks or issues"],
  "suggestions": ["List of actionable improvements"],
  "overallFeedback": "A short concluding thought on the design"
}
`;

    const request = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
    };

    // Use gemini-1.5-pro since it has superior vision capabilities
    const aiResult = await generateGeminiContent(request, {
      generationConfig: { responseMimeType: "application/json" }
    });

    const textOutput = aiResult.response?.text?.() ?? aiResult.response?.text ?? "";
    const parsedData = parseAIJson(textOutput);

    return {
      success: true,
      analysis: parsedData,
    };
  } catch (error) {
    console.error("System Design Analysis Error:", error);
    return {
      success: false,
      error: error?.message || "Failed to analyze the system design.",
    };
  }
}
