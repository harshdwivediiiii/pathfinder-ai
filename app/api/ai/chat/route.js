import { auth } from "@clerk/nextjs/server";
import { generateGeminiContentStream } from "@/lib/ai/gemini";
import { db } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  buildRateLimitResponse,
} from "@/lib/security/rate-limit";

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|directions)/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions|directions)/i,
  /system\s*(prompt|instruction|message)/i,
  /you\s+are\s+(now|free|a\s+different)/i,
  /act\s+as\s+(if\s+you\s+are|though\s+you\s+are)/i,
  /do\s+not\s+(follow|obey|adhere)\s+to/i,
  /new\s+(instructions|prompt|directive)/i,
  /override\s+(instructions|prompt|constraints)/i,
  /role[-\s]*play/i,
];

function detectPromptInjection(text) {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

export async function POST(req) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const rateLimit = await enforceRateLimit({
      endpoint: "/api/ai/chat",
      subject: { kind: "user", value: userId },
      limitPerMinute: 10,
      burstCapacity: 10,
    });

    if (!rateLimit.allowed) {
      return buildRateLimitResponse({
        message: "Too Many Requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const body = await req.json();
    let { messages, currentPage, userRole } = body;

    currentPage = String(currentPage || 'Unknown').slice(0, 100).replace(/[^a-zA-Z0-9_/\-]/g, '');
    userRole = String(userRole || 'User').slice(0, 50).replace(/[^a-zA-Z0-9 _\-]/g, '');

    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.role === 'user' && typeof msg.content === 'string' && detectPromptInjection(msg.content)) {
          return new Response(JSON.stringify({
            error: "Message contains disallowed patterns and was blocked.",
          }), { status: 400 });
        }
      }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    const isValidMessages = messages.every(msg => 
      msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')
    );

    if (!isValidMessages) {
      return new Response(JSON.stringify({ error: "Invalid message format" }), { status: 400 });
    }

    const sanitizedMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return { ...msg, content: msg.content.slice(0, 4000) };
      }
      return { ...msg, content: msg.content.slice(0, 4000) };
    });

    // Convert messages to Gemini format if they are not already
    // Gemini expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const geminiHistory = sanitizedMessages.map(msg => ({
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
              controller.enqueue(encoder.encode(chunkText));
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
