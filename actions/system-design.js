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

    // Extract the base64 payload and detect the actual image mime type.
    // The client encodes the whiteboard diagram as an SVG data URL
    // (data:image/svg+xml;base64,...) as well as png/jpeg/jpg.
    const dataUrlMatch = base64Image.match(
      /^data:image\/(png|jpeg|jpg|svg\+xml);base64,?([A-Za-z0-9+/=]+)$/i
    );
    const base64Data = dataUrlMatch ? dataUrlMatch[2] : base64Image;
    const mimeType = dataUrlMatch ? `image/${dataUrlMatch[1]}` : "image/png";

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
