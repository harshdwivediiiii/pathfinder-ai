import "server-only";
import crypto from "crypto";

export const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;
export const QUIZ_CACHE_TTL_MS = 60 * 60 * 1000;
export const RESUME_IMPROVEMENT_CACHE_TTL_MS = 5 * 60 * 1000;
export const ATS_ANALYSIS_CACHE_TTL_MS = 10 * 60 * 1000;
export const INDUSTRY_INSIGHT_CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeValueForHash(value) {
  if (value === null) return null;
  if (value === undefined) return "__undefined__";
  if (value instanceof Date) return { __type: "Date", value: value.toISOString() };

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValueForHash(item));
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = normalizeValueForHash(value[key]);
        return accumulator;
      }, {});
  }

  if (typeof value === "bigint") {
    return { __type: "BigInt", value: value.toString() };
  }

  return value;
}

export function hashString(str = "") {
  return crypto.createHash("sha256").update(String(str)).digest("hex").slice(0, 32);
}

export function generateCacheKey(prefix, ...inputs) {
  const normalizedInputs = inputs.map((input) => normalizeValueForHash(input));
  const digest = hashString(JSON.stringify(normalizedInputs));

  return `${prefix}:${digest}`;
}