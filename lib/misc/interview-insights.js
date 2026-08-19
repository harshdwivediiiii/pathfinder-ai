import "server-only";
import { cachedGenerateGeminiContent } from "../cache/index";
import prisma from "../db/prisma";

export async function getInterviewInsights(userId) {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (!assessments || assessments.length === 0) {
      return null;
    }

    const sessionData = assessments.map((a) => {
      const overall = a.quizScore;
      return {
        date: a.createdAt.toISOString(),
        overall,
        technical: overall,
        communication: overall,
        grammar: overall,
        feedback: a.improvementTip || "No specific feedback provided.",
      };
    });

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

    const result = await cachedGenerateGeminiContent(prompt, {
      generationConfig: { responseMimeType: "application/json" }
    }, {
      ttl: 24 * 60 * 60 * 1000,
    });

    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate interview insights:", error);
    return null;
  }
}
