import { auth } from "@clerk/nextjs/server";
import { generateGeminiContentStream } from "@/lib/gemini";
import { db } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/ai-gating";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserAiContext } from "@/lib/ai-context";
import { chatPromptSchema as chatPromptSchemaStr } from "@/lib/schemas/chat";
import {
  getRateLimitIdentifier,
  enforceRateLimit,
  buildRateLimitResponse,
} from "@/lib/rate-limit";
import {
  preparePromptForGeneration,
  buildSseErrorResponse,
} from "@/lib/prompt-guard";
import {
  buildCorsDeniedResponse,
  resolveCorsPolicy,
} from "@/lib/cors";
import {
  getCachedResponse,
  cacheResponse,
  buildCacheKey,
  getPendingGenerationRequest,
  setPendingGenerationRequest,
  deletePendingGenerationRequest,
} from "@/lib/cache/cache-service";
import { respondError, respondSseError, ERROR_CODES } from "@/lib/api/error-handler";
import { validateInput, validateId } from "@/lib/validate";
import { chatPromptSchema } from "@/lib/schemas/forms";
import { getEnv } from "@/lib/env";

const SSE_BASE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function buildSseHeaders(request) {
  const corsPolicy = resolveCorsPolicy(request);

  if (!corsPolicy.allowed) {
    return null;
  }

  const headers = new Headers(SSE_BASE_HEADERS);

  if (corsPolicy.headers) {
    corsPolicy.headers.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

const encodeSseEvent = (encoder, event, payload) => {
  const safePayload = payload ?? {};
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(safePayload)}\n\n`);
};

function createCachedSseResponse({
  text,
  headers,
  cacheStatus,
  deduped = false,
  debug = null,
}) {
  const encoder = new TextEncoder();

  const cachedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encodeSseEvent(encoder, "delta", {
          text,
          cached: true,
          ...(deduped ? { deduped: true } : {}),
        })
      );

      controller.enqueue(
        encodeSseEvent(encoder, "done", {
          finalText: text,
          hasContent: true,
          cached: true,
          ...(deduped ? { deduped: true } : {}),
          ...(debug ? { debug } : {}),
        })
      );

      controller.close();
    },
  });

  const responseHeaders = new Headers(headers);
  responseHeaders.set("X-Cache", cacheStatus);

  return new Response(cachedStream, {
    headers: responseHeaders,
  });
}

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

export async function OPTIONS(request) {
  const headers = buildSseHeaders(request);

  if (!headers) {
    return buildCorsDeniedResponse();
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

export async function POST(request) {
  const env = getEnv();
  const isDev = env.NODE_ENV !== "production";

  const headers = buildSseHeaders(request);

  if (!headers) {
    return buildCorsDeniedResponse();
  }
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
    return respondSseError(request, ERROR_CODES.UNAUTHORIZED);
  }

 if (!isFeatureEnabled("chat")) {
    return respondSseError(request, ERROR_CODES.AI_SERVICE_ERROR, "AI service is not configured. Please contact support.");
  }

  let prompt;
  let conversationId;

  try {
    const body = await request.json();

    const promptValidation = validateInput(chatPromptSchema, { prompt: body.prompt });
    if (!promptValidation.success) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid prompt", promptValidation.errors);
    }

    prompt = promptValidation.data.prompt;

    if (body.conversationId !== undefined && body.conversationId !== null && body.conversationId !== "") {
      const conversationIdValidation = validateId(body.conversationId, "conversationId");
      if (!conversationIdValidation.success) {
        return respondError(ERROR_CODES.VALIDATION_ERROR, "Conversation ID is required", conversationIdValidation.errors);
      }
      conversationId = conversationIdValidation.data;
    }
  } catch {
    return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid request body");
  }

  const validation = chatPromptSchemaStr.safeParse(prompt);
  if (!validation.success) {
    return buildSseErrorResponse(validation.error.errors[0].message, 400);
  }

  const validatedPrompt = validation.data;
  const promptCheck = preparePromptForGeneration(validatedPrompt);

  if (!promptCheck.allowed) {
    return buildSseErrorResponse(promptCheck.message, promptCheck.status);
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    return respondError(ERROR_CODES.USER_NOT_FOUND);
  }
  const cacheUser = userId || request.headers.get("x-forwarded-for") || "anonymous";

  const existingCachedResponse = await getCachedResponse(
    cacheUser,
    promptCheck.prompt
  );

  if (existingCachedResponse) {
    return createCachedSseResponse({
      text: existingCachedResponse,
      headers: SSE_BASE_HEADERS,
      cacheStatus: "HIT",
    });
  }

  // Check for pending request (deduplication)
  const pendingRequest = await getPendingGenerationRequest(
    cacheUser,
    promptCheck.prompt
  );

  if (pendingRequest) {
    try {
      await pendingRequest;
    } catch (error) {
      // Pending request failed, we'll proceed with our own generation
      console.warn("[dedup] Pending request failed, proceeding with new generation");
    }

    const cachedAfterPending = await getCachedResponse(
      cacheUser,
      promptCheck.prompt
    );

    if (cachedAfterPending) {
  return createCachedSseResponse({
    text: cachedAfterPending,
    headers: SSE_BASE_HEADERS,
    cacheStatus: "DEDUP",
    deduped: true,
  });
}
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
        return respondError(ERROR_CODES.RESOURCE_NOT_FOUND, "Conversation not found");
      }

      console.error("Pre-stream conversation transaction failed:", error);
      return respondError(ERROR_CODES.DATABASE_ERROR, "Failed to prepare conversation");
    }
  }

  const recentMessages = conversationId
    ? await db.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          role: true,
          content: true,
        },
      })
    : [];

  let generationCompletionResolve, generationCompletionReject;
  const generationCompletionPromise = new Promise((resolve, reject) => {
    generationCompletionResolve = resolve;
    generationCompletionReject = reject;
  });

  const aiContext = buildUserAiContext(user, recentMessages.reverse());

  const clientIp = request.headers.get("x-real-ip") || "anonymous";
  cacheUser = userId || clientIp;

  const restrictedPrompt = buildSecurePrompt({
    context: aiContext.context,
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


  const restrictedCachedResponse = await getCachedResponse(
    cacheUser,
    restrictedPrompt
  );

  if (restrictedCachedResponse) {
    if (conversationId && (user?.saveChatHistory ?? true)) {
      try {
        await db.$transaction(
          async (tx) => {
            await tx.message.create({
              data: {
                conversationId,
                role: "assistant",
                content: restrictedCachedResponse,  
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
        console.error("Cached response persistence failed:", error);
      }
    }

    const encoder = new TextEncoder();

    return createCachedSseResponse({
      text: restrictedCachedResponse,
      headers,
      cacheStatus: "HIT",
      debug: isDev
        ? {
            ...aiContext.debug,
            promptContext: aiContext.context,
          }
        : null,
    });
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      let streamClosed = false;

      const safeEnqueue = (event, payload) => {
        if (streamClosed || abortController.signal.aborted) return;
        controller.enqueue(encodeSseEvent(encoder, event, payload));
      };

      const safeClose = () => {
        if (streamClosed) return;
        streamClosed = true;
        controller.close();
      };

      try {
        const result = await generateGeminiContentStream(restrictedPrompt, {
          signal: abortController.signal,
        });

        for await (const chunk of result.stream) {
          if (abortController.signal.aborted) break;

          const text = extractChunkText(chunk);

          if (text) {
            fullResponse += text;
            safeEnqueue("delta", { text });
          }
        }

        if (abortController.signal.aborted) {
          safeClose();
          return;
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
        if (fullResponse.trim()) {
          await cacheResponse(
            cacheUser,
            promptCheck.prompt,
            fullResponse
          );
        }
        safeEnqueue("done", {
          finalText: fullResponse,
          hasContent: Boolean(fullResponse.trim()),
          ...(isDev && {
            debug: {
              ...aiContext.debug,
              promptContext: aiContext.context,
            },
          }),
        });
        safeClose();
        generationCompletionResolve(fullResponse);
      } catch (error) {
        if (abortController.signal.aborted) {
          safeClose();
          return;
        }
        console.error("Gemini streaming error:", error?.message || error);

        safeEnqueue("error", {
          message: error?.message || "Unknown error",
        });
        safeClose();
        generationCompletionReject(error);
      }
    },
    cancel(reason) {
      console.warn("SSE stream cancelled by client connection abort:", reason);
      abortController.abort();
    },
  });

  // Set this request as pending for deduplication
  setPendingGenerationRequest(cacheUser, promptCheck.prompt, generationCompletionPromise);
  generationCompletionPromise.finally(() => {
    deletePendingGenerationRequest(cacheUser, promptCheck.prompt);
  });

  return new Response(stream, {
    headers,
  });
}