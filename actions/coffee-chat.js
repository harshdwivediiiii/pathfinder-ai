"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { buildSecurePrompt, parseAIJson } from "@/lib/prompt-safety";
import { generateGeminiContent } from "@/lib/gemini";

export async function startCoffeeChat(industry, targetRole) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, errors: { _form: ["User not found"] } };

  if (!industry || !targetRole) {
    return { success: false, errors: { _form: ["Industry and target role are required."] } };
  }

  const initialMessage = {
    role: "assistant",
    content: `Hi there! Thanks for reaching out. I'm a Senior Executive in ${industry} overseeing ${targetRole}s. What would you like to know about the industry or the role?`
  };

  try {
    const record = await db.coffeeChatSession.create({
      data: {
        userId: user.id,
        industry,
        targetRole,
        chatHistory: [initialMessage],
      },
    });

    revalidatePath("/coffee-chat");
    return { success: true, data: record };
  } catch (error) {
    console.error("Start Coffee Chat Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to start session"] } };
  }
}

export async function sendCoffeeChatMessage(sessionId, userMessage) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const session = await db.coffeeChatSession.findUnique({ where: { id: sessionId } });
  if (!session) return { success: false, errors: { _form: ["Session not found"] } };

  const updatedHistory = [...session.chatHistory, { role: "user", content: userMessage }];

  const prompt = buildSecurePrompt({
    context: `You are a Senior Executive in the ${session.industry} industry, managing ${session.targetRole}s. 
    You are having a 15-minute informational "coffee chat" with a junior professional. 
    Be polite, insightful, and realistic. Provide good advice based on standard industry practices.
    If the user asks an awkward or inappropriate networking question, kindly redirect them or give them subtle feedback.
    Keep your response to 2-3 short paragraphs maximum.`,
    task: `Read the conversation history and respond to the latest user message.`,
    untrustedData: [
      { label: "conversationHistory", value: JSON.stringify(updatedHistory), maxLength: 5000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "reply": "Your conversational reply to the user's message."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    updatedHistory.push({ role: "assistant", content: parsedData.reply });

    const record = await db.coffeeChatSession.update({
      where: { id: sessionId },
      data: { chatHistory: updatedHistory },
    });

    revalidatePath(`/coffee-chat/${sessionId}`);
    return { success: true, data: record };
  } catch (error) {
    console.error("Coffee Chat Reply Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to get reply"] } };
  }
}

export async function generateCoffeeChatFeedback(sessionId) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  const session = await db.coffeeChatSession.findUnique({ where: { id: sessionId } });
  if (!session) return { success: false, errors: { _form: ["Session not found"] } };

  const prompt = buildSecurePrompt({
    context: "You are an expert career coach analyzing an informational interview (coffee chat).",
    task: `Analyze the transcript of the coffee chat. Evaluate how well the user asked questions, built rapport, and pitched themselves without sounding desperate. Provide constructive feedback.`,
    untrustedData: [
      { label: "chatHistory", value: JSON.stringify(session.chatHistory), maxLength: 5000 },
    ],
    outputRules: `Provide the output in the following JSON format ONLY:
{
  "overallScore": 85,
  "strengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Improvement 1", "Improvement 2"],
  "summary": "A brief summary of how the chat went."
}`,
  });

  try {
    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    const record = await db.coffeeChatSession.update({
      where: { id: sessionId },
      data: { feedback: parsedData },
    });

    revalidatePath(`/coffee-chat/${sessionId}`);
    return { success: true, data: record };
  } catch (error) {
    console.error("Coffee Chat Feedback Error:", error);
    return { success: false, errors: { _form: [error.message || "Failed to generate feedback"] } };
  }
}

export async function getCoffeeChatSessions() {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return { success: false, data: [] };

  const records = await db.coffeeChatSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: records };
}
