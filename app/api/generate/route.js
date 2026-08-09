import { auth } from "@clerk/nextjs/server";
import { generateGeminiContentStream } from "@/lib/ai/gemini";
import { db } from "@/lib/db/prisma";
import { isFeatureEnabled } from "@/lib/ai/ai-gating";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { buildUserAiContext } from "@/lib/ai/ai-context";
import { chatPromptSchema as chatPromptSchemaStr } from "@/lib/schemas/chat";
import {
  getRateLimitIdentifier,
  enforceRateLimit,
  buildRateLimitResponse,
  extractTrustedClientIp,
} from "@/lib/security/rate-limit";
import {
  preparePromptForGeneration,
  buildSseErrorResponse,
} from "@/lib/ai/prompt-guard";
import {
  buildCorsDeniedResponse,
  resolveCorsPolicy,
} from "@/lib/security/cors";
import {
  getCachedResponse,
  cacheResponse,
  getPendingGenerationRequest,
  setPendingGenerationRequest,
  deletePendingGenerationRequest,
  getOrCreatePendingGenerationRequest,
} from "@/lib/cache/cache-service";
import { respondError, respondSseError, ERROR_CODES } from "@/lib/api/error-handler";
import { getCircuitBreaker } from "@/lib/cache/circuit-breaker";
import { createLogger } from "@/lib/observability/logger";
import { incrementCacheHit, incrementCacheMiss, recordAiGenerationDuration, setCircuitBreakerState, recordError } from "@/lib/observability/metrics";
import { validateInput, validateId } from "@/lib/ai/validate";
import { chatPromptSchema as chatPromptInputSchema } from "@/lib/schemas/forms";
import { getEnv } from "@/lib/security/env";

const SSE_BASE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

const geminiCircuitBreaker = getCircuitBreaker("gemini-stream", {
  failureThreshold: Number.parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD ?? "5", 10),
  resetTimeoutMs: Number.parseInt(process.env.CIRCUIT_RESET_TIMEOUT_MS ?? "30000", 10),
  rollingWindowMs: Number.parseInt(process.env.CIRCUIT_ROLLING_WINDOW_MS ?? "60000", 10),
});

const aiLogger = createLogger("generate-route");

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
  responseHeaders.set("X-Response-Source", cacheStatus === "HIT" ? "cache" : "live");

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

    const promptValidation = validateInput(chatPromptInputSchema, { prompt: body.prompt });
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
    const errorMessage =
      validation.error?.errors?.length > 0
        ? validation.error.errors[0].message
        : "Invalid prompt format";
    return buildSseErrorResponse(errorMessage, 400);
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
  let cacheUser = userId || extractTrustedClientIp(request.headers) || "anonymous";






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

  const aiContext = buildUserAiContext(user, recentMessages.reverse());

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
                role: "user",
                content: prompt,
              },
            });

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

  // Atomic deduplication: ensure only one generation occurs for this cache key
  // The previous implementation had a race condition where multiple concurrent requests
  // could all observe no pending request and proceed to create independent generations.
  // This implementation uses atomic registration to prevent that race.

  // Pre-check circuit breaker state to avoid returning Response from inside ReadableStream.start()
  const cbState = geminiCircuitBreaker.getState();
  if (cbState === "open" || cbState === "half-open") {
    const degradedCache = await getCachedResponse(cacheUser, restrictedPrompt);
    if (degradedCache) {
      aiLogger.warn("Serving degraded cached response (pre-check)", { state: cbState });
      setCircuitBreakerState("degraded");
      return createCachedSseResponse({
        text: degradedCache,
        headers,
        cacheStatus: "DEGRADED",
        deduped: false,
        debug: null,
      });
    }
  }

  // Atomically get or create the pending request BEFORE any async work
  const { promise: pendingPromise, isCreator, resolve: resolvePending, reject: rejectPending } =
    getOrCreatePendingGenerationRequest(cacheUser, promptCheck.prompt);

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  // If we're not the creator, return a stream that waits for the pending request
  // and then returns the cached result
  if (!isCreator) {
    const dedupStream = new ReadableStream({
      async start(controller) {
        try {
          // Wait for the pending request to complete
          await pendingPromise;
        } catch (error) {
          // Pending request failed, we'll return an error
          console.warn("[dedup] Pending request failed", error);
          controller.enqueue(
            encodeSseEvent(encoder, "error", {
              message: "Generation failed. Please try again.",
            })
          );
          controller.close();
          return;
        }

        // After waiting, check cache again
        const cachedAfterPending = await getCachedResponse(cacheUser, restrictedPrompt);
        if (cachedAfterPending) {
          controller.enqueue(
            encodeSseEvent(encoder, "delta", {
              text: cachedAfterPending,
              cached: true,
              deduped: true,
            })
          );
          controller.enqueue(
            encodeSseEvent(encoder, "done", {
              finalText: cachedAfterPending,
              hasContent: true,
              cached: true,
              deduped: true,
            })
          );
          controller.close();
        } else {
          // No cache available after pending completed - shouldn't happen but handle gracefully
          controller.enqueue(
            encodeSseEvent(encoder, "error", {
              message: "No cached result available. Please try again.",
            })
          );
          controller.close();
        }
      },
    });

    return new Response(dedupStream, {
      headers: SSE_BASE_HEADERS,
    });
  }

  // We are the creator - create the actual generation stream
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
        let result;
        try {
          result = await geminiCircuitBreaker.execute(() =>
            generateGeminiContentStream(restrictedPrompt, {
              signal: abortController.signal,
            })
          );
        } catch (initialError) {
          const degradedCache = await getCachedResponse(cacheUser, restrictedPrompt);
          if (degradedCache) {
            aiLogger.warn("Serving degraded cached response after Gemini failure", {
              error: initialError?.message,
            });
            setCircuitBreakerState("degraded");
            safeEnqueue("delta", { text: degradedCache, cached: true, degraded: true });
            safeEnqueue("done", { finalText: degradedCache, hasContent: true, cached: true, degraded: true });
            safeClose();
            resolvePending(degradedCache);
            return;
          }
          throw initialError;
        }

        for await (const chunk of result.stream) {
          if (abortController.signal.aborted) break;

          const text = extractChunkText(chunk);

          if (text) {
            fullResponse += text;
            safeEnqueue("delta", { text });
          }
        }

        if (abortController.signal.aborted) {
          rejectPending(new Error("Generation aborted by client"));
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
                      role: "user",
                      content: prompt,
                    },
                  });

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
            restrictedPrompt,
            fullResponse
          );
        }
        if (abortController.signal.aborted) {
          rejectPending(new Error("Generation aborted by client"));
          safeClose();
          return;
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
        resolvePending(fullResponse);
      } catch (error) {
        if (abortController.signal.aborted) {
          rejectPending(error instanceof Error ? error : new Error("Generation aborted by client"));
          safeClose();
          return;
        }
        console.error("Gemini streaming error:", error?.message || error);

        safeEnqueue("error", {
          message: error?.message || "Unknown error",
        });
        safeClose();
        rejectPending(error);
      } finally {
        // Always clean up the pending request
        deletePendingGenerationRequest(cacheUser, promptCheck.prompt);
      }
    },
    cancel(reason) {
      console.warn("SSE stream cancelled by client connection abort:", reason);
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers,
  });
}

