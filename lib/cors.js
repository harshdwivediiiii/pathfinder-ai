import "server-only";
import { getEnv } from "./env";

const ALLOW_HEADERS = "Content-Type, Authorization";
const ALLOW_METHODS = "POST, OPTIONS";
const MAX_AGE = "86400";

function parseOriginList(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin) => origin !== "*");
}

export function getCorsAllowedOrigins() {
  const env = getEnv();
  return new Set([
    ...parseOriginList(env.ALLOWED_ORIGINS),
    ...parseOriginList(env.CORS_ORIGIN),
  ]);
}

export function getRequestOrigin(request) {
  return request?.headers?.get("origin")?.trim() || null;
}

export function resolveCorsPolicy(request) {
  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return {
      allowed: true,
      origin: null,
      headers: null,
    };
  }

  const requestUrlOrigin = new URL(request.url).origin;

  if (requestOrigin !== requestUrlOrigin && !getCorsAllowedOrigins().has(requestOrigin)) {
    return {
      allowed: false,
      origin: requestOrigin,
      headers: null,
    };
  }

  const headers = new Headers({
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Max-Age": MAX_AGE,
    Vary: "Origin",
  });

  return {
    allowed: true,
    origin: requestOrigin,
    headers,
  };
}

export function buildCorsDeniedResponse() {
  return new Response(JSON.stringify({ error: "Origin not allowed" }), {
    status: 403,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}