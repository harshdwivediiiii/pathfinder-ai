import crypto from "crypto";
import { db } from "@/lib/db/prisma";

const DEFAULT_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 };

const RATE_LIMITS = {
  chat:         { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  ats:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  resume:       { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  coverLetter:  { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  quiz:         { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  quizFeedback: { maxRequests: 15, windowMs: 60 * 60 * 1000 },
  roadmap:      { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  linkedin:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  githubAnalyzer:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  cultureMatch:     { maxRequests: 15, windowMs: 60 * 60 * 1000 },
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
  visa:               { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  promotion:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  burnout:            { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  starStory:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  relocation:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
emailAssistant:     { maxRequests: 15, windowMs: 60 * 60 * 1000 },
imposterSyndrome:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
freelanceRate:      { maxRequests: 10, windowMs: 60 * 60 * 1000 },
jobScraper:         { maxRequests: 10, windowMs: 60000 },
careerDecisionSimulator: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
translator:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
jdDecoder:           { maxRequests: 10, windowMs: 60 * 60 * 1000 },
toxicEscape:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
voiceEvaluation:     { maxRequests: 15, windowMs: 60 * 60 * 1000 },
videoEvaluation:     { maxRequests: 15, windowMs: 60 * 60 * 1000 },
weaknessSpinner:     { maxRequests: 10, windowMs: 60 * 60 * 1000 },
reverseInterviewer:  { maxRequests: 10, windowMs: 60 * 60 * 1000 },
linkedinPost:        { maxRequests: 10, windowMs: 60 * 60 * 1000 },
careerBreak:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
careerPivot:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
cheatSheet:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
equity:              { maxRequests: 10, windowMs: 60 * 60 * 1000 },
evidence:            { maxRequests: 10, windowMs: 60 * 60 * 1000 },
freelance:           { maxRequests: 10, windowMs: 60 * 60 * 1000 },
ikigai:              { maxRequests: 10, windowMs: 60 * 60 * 1000 },
internalTransfer:    { maxRequests: 10, windowMs: 60 * 60 * 1000 },
layoff:              { maxRequests: 10, windowMs: 60 * 60 * 1000 },
managerReadme:       { maxRequests: 10, windowMs: 60 * 60 * 1000 },
mentor:              { maxRequests: 10, windowMs: 60 * 60 * 1000 },
onboarding:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
performanceReview:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
portfolioBuilder:    { maxRequests: 10, windowMs: 60 * 60 * 1000 },
remoteWork:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
resignation:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
resumeRoast:         { maxRequests: 10, windowMs: 60 * 60 * 1000 },
sideHustle:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
weeklyRecs:          { maxRequests: 10, windowMs: 60 * 60 * 1000 },
industryInsights:    { maxRequests: 10, windowMs: 60 * 60 * 1000 },
interviewInsights:   { maxRequests: 10, windowMs: 60 * 60 * 1000 },
};

export async function checkRateLimit(userId, action) {
  const config = RATE_LIMITS[action] ?? DEFAULT_LIMIT;

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
    resetAt,
  };
}

export async function decrementRateLimit(userId, action) {
  const config = RATE_LIMITS[action] ?? DEFAULT_LIMIT;
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

