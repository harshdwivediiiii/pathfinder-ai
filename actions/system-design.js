"use server";

import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { parseAIJson } from "@/lib/ai/validate";
import { getAiResponseText } from "@/lib/ai/ai-response";

export async function analyzeSystemDesign(base64Image) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
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

    // Extract the base64 payload
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const request = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/png",
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

    const parsedData = parseAIJson(getAiResponseText(aiResult));

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
