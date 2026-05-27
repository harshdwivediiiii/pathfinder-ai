import { auth } from "@clerk/nextjs/server";
import { generateGeminiContentStream } from "@/lib/gemini";
import { db } from "@/lib/prisma";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import {
  getRateLimitIdentifier,
  enforceRateLimit,
  buildRateLimitResponse,
} from "@/lib/rate-limit";
import {
  preparePromptForGeneration,
  buildSseErrorResponse,
} from "@/lib/prompt-guard";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const encodeSseEvent = (encoder, event, payload) => {
  const safePayload = payload ?? {};
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(safePayload)}\n\n`);
};

const extractChunkText = (chunk) => {
  if (!chunk) return "";

  try {
    const rawText = typeof chunk.text === "function" ? chunk.text() : chunk?.text;

    if (rawText == null) return "";
    if (typeof rawText === "string") return rawText;

    return String(rawText);
  } catch {
    return "";
  }
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: SSE_HEADERS,
  });
}

export async function POST(request) {
  const { userId } = await auth();
  const endpoint = "/api/generate";
  const subject = getRateLimitIdentifier(request, userId);
  const rateLimit = await enforceRateLimit({
    endpoint,
    subject,
    limitPerMinute: userId ? 20 : 5,
    burstCapacity: userId ? 10 : 5,
  });

  console.info("rate-limit-check", {
    endpoint,
    subjectKind: subject.kind,
    allowed: rateLimit.allowed,
    remaining: rateLimit.remaining,
    retryAfterSeconds: rateLimit.retryAfterSeconds,
    ...(rateLimit.allowed ? {} : { rejectionRate: rateLimit.rejectionRate }),
  });

  if (!rateLimit.allowed) {
    return buildRateLimitResponse({
      message: "Too Many Requests",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      sse: true,
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let prompt;
  let conversationId;

  try {
    const body = await request.json();
    prompt = body.prompt;
    conversationId = body.conversationId;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return buildSseErrorResponse("Prompt is required", 400);
  }

  const promptCheck = preparePromptForGeneration(prompt);

  if (!promptCheck.allowed) {
    return buildSseErrorResponse(promptCheck.message, promptCheck.status);
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (conversationId) {
    try {
      await db.$transaction(
        async (tx) => {
          const conversation = await tx.conversation.findFirst({
            where: {
              id: conversationId,
              userId: user.id,
            },
          });

          if (!conversation) {
            throw new Error("Conversation not found");
          }

          if (user?.saveChatHistory ?? true) {
            await tx.message.create({
              data: {
                conversationId,
                role: "user",
                content: prompt,
              },
            });
          }
        },
        { timeout: 10_000 }
      );
    } catch (error) {
      if (error?.message === "Conversation not found") {
        return new Response(
          JSON.stringify({ error: "Conversation not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.error("Pre-stream conversation transaction failed:", error);
      return new Response(JSON.stringify({ error: "Failed to prepare conversation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      let streamClosed = false;

      const safeEnqueue = (event, payload) => {
        if (streamClosed) return;
        controller.enqueue(encodeSseEvent(encoder, event, payload));
      };

      const safeClose = () => {
        if (streamClosed) return;
        streamClosed = true;
        controller.close();
      };

      try {
        const restrictedPrompt = buildSecurePrompt({
          task: `You are Pathfinder AI, a professional career guidance assistant.

Your scope includes ALL professional and career-related domains, including:
- software engineering, medicine, healthcare, law, finance, accounting, banking
- business, management, marketing, sales, design, UI/UX, architecture
- education, teaching, research, government jobs, civil services
- entrepreneurship, freelancing, consulting, skilled trades
- manufacturing, logistics, human resources, customer support
- media, content creation, non-technical professions

You help users with:
- career guidance, interview preparation, mock interviews
- resume/CV improvement, cover letters, job applications
- job search strategy, skill development, certification guidance
- learning roadmaps, salary discussions, career transitions
- workplace growth, professional development

Rules:
- Stay focused on careers and professional growth.
- If the user asks something completely unrelated (jokes, entertainment, random trivia, casual unrelated chat), politely redirect them toward career/professional topics.
- Be practical, structured, and professional.
- Give actionable advice.`,
          untrustedData: [
            { label: "userQuery", value: promptCheck.prompt, maxLength: 4000 },
          ],
        });

        const result = await generateGeminiContentStream(restrictedPrompt);

        for await (const chunk of result.stream) {
          const text = extractChunkText(chunk);

          if (text) {
            fullResponse += text;
            safeEnqueue("delta", { text });
          }
        }

        if (conversationId && fullResponse.trim()) {
          if (user?.saveChatHistory ?? true) {
            try {
              await db.$transaction(
                async (tx) => {
                  await tx.message.create({
                    data: {
                      conversationId,
                      role: "assistant",
                      content: fullResponse,
                    },
                  });

                  await tx.conversation.update({
                    where: {
                      id: conversationId,
                    },
                    data: {
                      updatedAt: new Date(),
                    },
                  });
                },
                { timeout: 10_000 }
              );
            } catch (error) {
              console.error("Post-stream conversation transaction failed:", error);
              throw error;
            }
          }
        }

        safeEnqueue("done", {
          finalText: fullResponse,
          hasContent: Boolean(fullResponse.trim()),
        });
        safeClose();
      } catch (error) {
        console.error("Gemini streaming error:", error?.message || error);

        safeEnqueue("error", {
          message: error?.message || "Unknown error",
        });
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}