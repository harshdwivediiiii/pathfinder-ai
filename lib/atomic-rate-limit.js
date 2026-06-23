import { db } from "@/lib/prisma";

export async function atomicCheckRateLimit(userId, action, maxRequests) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);

  const result = await db.$queryRaw`
    INSERT INTO "AiRateLimit" ("id", "userId", "action", "windowStart", "count", "expiresAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${userId}, ${action}, ${windowStart}, 1, ${resetAt}, NOW(), NOW())
    ON CONFLICT ("userId", "action", "windowStart")
    DO UPDATE SET
      "count" = CASE WHEN "AiRateLimit"."count" < ${maxRequests} THEN "AiRateLimit"."count" + 1 ELSE ${maxRequests} + 1 END,
      "updatedAt" = NOW()
    RETURNING "count";
  `;

  const count = result[0]?.count;
  if (!count) {
    throw new Error("Failed to update rate limit count");
  }

  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
    resetAt,
  };
}
