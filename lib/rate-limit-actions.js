import crypto from "crypto";
import { db } from "@/lib/prisma";

const RATE_LIMITS = {
  chat:         { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  ats:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  resume:       { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  coverLetter:  { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  quiz:         { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  quizFeedback: { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  roadmap:      { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  linkedin:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  negotiation:      { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  networking:       { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  portfolio:        { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  resumeBuilder:    { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  offerComparer:    { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  "skill-gap":      { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  bulletRewriter:   { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  "resume-match":   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  executive_presence: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  founder_readiness:  { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  coffeeChat:         { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  freelanceRate:      { maxRequests: 10, windowMs: 60 * 60 * 1000 },
};

export async function checkRateLimit(userId, action) {
  const config = RATE_LIMITS[action];

  if (!config) {
    throw new Error(`Unknown rate limit action: ${action}`);
  }

  const { maxRequests, windowMs } = config;

  const now = Date.now();
  const windowStart = new Date(
    Math.floor(now / windowMs) * windowMs
  );
  const resetAt = new Date(windowStart.getTime() + windowMs);

  const id = crypto.randomUUID();

  const result = await db.$queryRaw`
    INSERT INTO "AiRateLimit"
      ("id", "userId", "action", "windowStart", "count", "expiresAt", "createdAt", "updatedAt")
    VALUES
      (${id}, ${userId}, ${action}, ${windowStart}, 1, ${resetAt}, NOW(), NOW())
    ON CONFLICT ("userId", "action", "windowStart")
    DO UPDATE SET
      "count" = CASE
        WHEN "AiRateLimit"."count" < ${maxRequests}
        THEN "AiRateLimit"."count" + 1
        ELSE ${maxRequests} + 1
      END,
      "updatedAt" = NOW()
    RETURNING "count";
  `;

  const count = result[0]?.count;

  if (count === undefined || count === null) {
    throw new Error("Failed to update rate limit count");
  }

  if (count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - count,
    remaining: Math.max(0, maxRequests - count),
    resetAt,
  };
}

export async function decrementRateLimit(userId, action) {
  const config = RATE_LIMITS[action];
  if (!config) throw new Error(`Unknown rate limit action: ${action}`);
  const { windowMs } = config;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  await db.$executeRaw`
    UPDATE "AiRateLimit"
    SET "count" = CASE WHEN "count" > 0 THEN "count" - 1 ELSE 0 END,
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
      AND "action" = ${action}
      AND "windowStart" = ${windowStart};
  `;
}

export function formatResetTime(resetAt) {
  const mins = Math.ceil((resetAt.getTime() - Date.now()) / 60000);
  return mins <= 1 ? "less than a minute" : `${mins} minutes`;
}

export async function deleteExpiredRateLimits() {
  const result = await db.aiRateLimit.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}

