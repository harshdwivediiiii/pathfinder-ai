import "server-only";
import { generateGeminiContent } from "./gemini";
import prisma from "./prisma";

export async function getInterviewInsights(userId) {
  try {
    const sessions = await prisma.mockInterviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (!sessions || sessions.length === 0) {
      return null;
    }

    const sessionData = sessions.map(s => ({
      date: s.createdAt.toISOString(),
      overall: s.overallScore,
      technical: s.technicalScore,
      communication: s.communicationScore,
      grammar: s.grammarScore,
      feedback: s.feedback || "No specific feedback provided.",
    }));

    const prompt = `
You are an expert career and interview coach.
Analyze the following recent mock interview history for a candidate:
${JSON.stringify(sessionData, null, 2)}

Provide a JSON object containing:
- "weaknesses": an array of the top 3 recurring weakness areas (as short strings).
- "practiceTopics": an array of 3 recommended practice topics or concepts to focus on.
- "summary": A brief 2-3 sentence encouraging summary of their progress.

Return ONLY valid JSON. Do not use markdown backticks around the JSON.
`;

    const result = await generateGeminiContent(prompt, {
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate interview insights:", error);
    return null;
  }
}
