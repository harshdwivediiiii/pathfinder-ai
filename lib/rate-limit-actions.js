import "server-only";
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
};

export async function checkRateLimit(userId, action) {
  const config = RATE_LIMITS[action];
  if (!config) throw new Error(`Unknown rate limit action: ${action}`);

  const { maxRequests, windowMs } = config;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);

  const existing = await db.aiRateLimit.findUnique({
    where: {
      userId_action_windowStart: { userId, action, windowStart },
    },
  });

  if (existing && existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  await db.aiRateLimit.upsert({
    where: {
      userId_action_windowStart: { userId, action, windowStart },
    },
    create: { userId, action, windowStart, count: 1, expiresAt: resetAt },
    update: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: maxRequests - ((existing?.count ?? 0) + 1),
    resetAt,
  };
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
