import { auth } from "@clerk/nextjs/server";
import { generateGeminiContentStream } from "@/lib/ai/gemini";
import { db } from "@/lib/db/prisma";
import { sanitizeInput } from "@/lib/security/sanitize";

// Note: in-memory rate limit resets on every cold start and doesn't work across
// serverless instances. For production, consider using the shared enforceRateLimit
// from lib/security/rate-limit.js which uses a persistent store.
const rateLimitMap = new Map();

export async function POST(req) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const now = Date.now();
    const rateData = rateLimitMap.get(userId) || { count: 0, resetTime: now + 60000 };
    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + 60000;
    } else {
      rateData.count++;
      if (rateData.count > 10) {
        return new Response(JSON.stringify({
          error: "Too many requests. Please wait before sending another message.",
          retryAfter: Math.ceil((rateData.resetTime - now) / 1000),
        }), {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateData.resetTime - now) / 1000)) },
        });
      }
    }
    rateLimitMap.set(userId, rateData);

    const body = await req.json();
    let { messages, currentPage, userRole } = body;

    currentPage = String(currentPage || 'Unknown').slice(0, 100).replace(/[^a-zA-Z0-9_/\-]/g, '');
    userRole = String(userRole || 'User').slice(0, 50).replace(/[^a-zA-Z0-9 _\-]/g, '');

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    const isValidMessages = messages.every(msg => 
      msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')
    );

    if (!isValidMessages) {
      return new Response(JSON.stringify({ error: "Invalid message format" }), { status: 400 });
    }

    // Convert messages to Gemini format if they are not already
    // Gemini expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const geminiHistory = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Extract the latest user message
    const latestMessage = geminiHistory.pop();

    const systemPrompt = `You are the Pathfinder AI Career Mentor. You are a helpful, professional, and encouraging AI assistant embedded inside the Pathfinder web application.
Your goal is to guide the user based on their current context.

Current Page Context: ${currentPage || 'Unknown'}
User Role/Profile: ${userRole || 'User'}

Guidelines:
1. Provide actionable advice related to their current page (e.g. if they are on /resume-match, talk about ATS optimization).
2. Keep responses concise, structured, and easy to read (use markdown).
3. Do not break character. Do not provide information outside of career coaching, resumes, interviews, and skills.
4. Be encouraging and supportive.`;

    const fullPrompt = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [...geminiHistory, latestMessage]
    };

    const encoder = new TextEncoder();
    const result = await generateGeminiContentStream(fullPrompt, { signal: req.signal });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(sanitizeInput(chunkText)));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error("AI Mentor Chat Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
