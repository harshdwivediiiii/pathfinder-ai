"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// fallback to flash if env missing
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function chatWithGemini(prompt) {
  if (!prompt) throw new Error("Prompt is required");

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const { response } = await model.generateContent(prompt);
    return response.text();
  } catch (err) {
    // surface Google error message if present
    const message =
      err?.response?.error?.message || err?.message || "Unknown Gemini error";
    console.error("Gemini API error:", message);
    throw new Error("Failed to get response from Gemini AI");
  }
}
