import "server-only";
import { resolveCorsPolicy } from "../cors.js";

const SSE_BASE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function buildSseCorsHeaders(request) {
  if (!request) return new Headers();

  const policy = resolveCorsPolicy(request);

  if (!policy.allowed || !policy.headers) {
    return new Headers();
  }

  return policy.headers;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: "Invalid request body or parameters",
  [ERROR_CODES.UNAUTHORIZED]: "Unauthorized access",
  [ERROR_CODES.USER_NOT_FOUND]: "User not found",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "Resource not found",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Too many requests, please try again later",
  [ERROR_CODES.PAYLOAD_TOO_LARGE]: "Request payload exceeds maximum size",
  [ERROR_CODES.AI_SERVICE_ERROR]: "AI service error, please try again",
  [ERROR_CODES.DATABASE_ERROR]: "Database error occurred",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "Internal server error",
};

const ERROR_STATUS_CODES = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.USER_NOT_FOUND]: 404,
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.PAYLOAD_TOO_LARGE]: 413,
  [ERROR_CODES.AI_SERVICE_ERROR]: 502,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
};

export class ApiError extends Error {
  constructor(code, customMessage = null, details = null) {
    const message = customMessage || ERROR_MESSAGES[code];
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.customMessage = customMessage;
    this.details = details;
  }
}

export function createErrorResponse(code, customMessage = null, details = null) {
  const message = customMessage || ERROR_MESSAGES[code] || "An error occurred";
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

export function respondError(code, customMessage = null, details = null, additionalHeaders = {}) {
  const statusCode = ERROR_STATUS_CODES[code] || 500;
  const errorResponse = createErrorResponse(code, customMessage, details);

  return Response.json(errorResponse, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      ...additionalHeaders,
    },
  });
}

export function respondRateLimitError(retryAfterSeconds) {
  return respondError(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    null,
    null,
    {
      "Retry-After": String(retryAfterSeconds),
    }
  );
}

function mergeHeaders(base, corsHeaders, extra = {}) {
  const merged = new Headers(base);
  for (const [key, value] of corsHeaders.entries()) {
    merged.set(key, value);
  }
  for (const [key, value] of Object.entries(extra)) {
    merged.set(key, value);
  }
  return merged;
}

export function respondSseError(request, code, customMessage = null, details = null) {
  const errorResponse = createErrorResponse(code, customMessage, details);
  const encoder = new TextEncoder();
  const sseEvent = encoder.encode(
    `event: error\ndata: ${JSON.stringify(errorResponse)}\n\n`
  );

  return new Response(sseEvent, {
    status: ERROR_STATUS_CODES[code] || 500,
    headers: mergeHeaders(SSE_BASE_HEADERS, buildSseCorsHeaders(request)),
  });
}

export function respondSseRateLimitError(request, retryAfterSeconds) {
  const errorResponse = createErrorResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED);
  const encoder = new TextEncoder();
  const sseEvent = encoder.encode(
    `event: error\ndata: ${JSON.stringify(errorResponse)}\n\n`
  );

  return new Response(sseEvent, {
    status: 429,
    headers: mergeHeaders(SSE_BASE_HEADERS, buildSseCorsHeaders(request), {
      "Retry-After": String(retryAfterSeconds),
    }),
  });
}
