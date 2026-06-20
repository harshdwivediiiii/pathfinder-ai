import "server-only";
import { db } from "@/lib/prisma";
import {
  generateIndustryInsightData,
  getIndustryInsightRefreshTime,
  isIndustryInsightStale,
} from "@/lib/industry-insights";
import { log } from "@/lib/jobs/logger";

// ---------------------------------------------------------------------------
// Shared upsert helper — keeps both functions DRY
// ---------------------------------------------------------------------------

/**
 * Persists a fresh insight snapshot to the database.
 * @param {string} industry
 * @param {object} insights  Result from generateIndustryInsightData()
 */
async function persistInsights(industry, insights) {
  const fields = {
    salaryRanges: insights.salaryRanges,
    growthRate: insights.growthRate,
    demandLevel: insights.demandLevel,
    topSkills: insights.topSkills,
    marketOutlook: insights.marketOutlook,
    keyTrends: insights.keyTrends,
    recommendedSkills: insights.recommendedSkills,
    isGrounded: insights.isGrounded,
    lastUpdated: new Date(),
    nextUpdate: getIndustryInsightRefreshTime(),
  };

  await db.industryInsight.upsert({
    where: { industry },
    create: { industry, ...fields },
    update: fields,
  });
}

// ---------------------------------------------------------------------------
// Lazy singleton promises — one per function, safe across hot-reloads
// ---------------------------------------------------------------------------

let _cronFnPromise;
let _workerFnPromise;

// ---------------------------------------------------------------------------
// Cron — nightly fan-out
// ---------------------------------------------------------------------------

/**
 * Returns (and lazily creates) the Inngest cron function that fans out
 * per-industry refresh events once per day.
 *
 * Idempotency guards:
 *   - rateLimit: { limit: 1, period: "12h" } — prevents a replay or double
 *     trigger within the same window from spawning duplicate AI calls.
 *   - Staleness filter — only dispatches events for industries whose
 *     nextUpdate has passed, so fresh rows are never redundantly refreshed.
 */
export function getGenerateIndustryInsights() {
  if (!_cronFnPromise) {
    _cronFnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();

      return inngest.createFunction(
        {
          id: "generate-industry-insights-cron",
          name: "Generate Industry Insights",
          // Prevent double-runs: if the function is replayed or triggered
          // twice within 12 hours, Inngest deduplicates it server-side.
          rateLimit: { limit: 1, period: "12h" },
        },
        { cron: "0 0 * * *" },
        async ({ step }) => {
          // Fetch all rows — include staleness fields so we can filter
          const allIndustries = await step.run("Fetch industries", async () => {
            return await db.industryInsight.findMany({
              select: { industry: true, nextUpdate: true, lastUpdated: true },
            });
          });

          // Only fan out work for rows that are actually stale
          const staleIndustries = allIndustries.filter((row) =>
            isIndustryInsightStale(row)
          );

          log.info("generate-industry-insights-cron", "Staleness check complete", {
            total: allIndustries.length,
            stale: staleIndustries.length,
            skipped: allIndustries.length - staleIndustries.length,
          });

          if (staleIndustries.length === 0) {
            log.info("generate-industry-insights-cron", "All industries are fresh — nothing to do");
            return { dispatched: 0, skipped: allIndustries.length };
          }

          await step.sendEvent(
            "Fan out stale industry events",
            staleIndustries.map(({ industry }) => ({
              name: "industry/insight.requested",
              data: { industry },
            }))
          );

          log.info("generate-industry-insights-cron", "Fan-out dispatched", {
            dispatched: staleIndustries.length,
          });

          return {
            dispatched: staleIndustries.length,
            skipped: allIndustries.length - staleIndustries.length,
          };
        }
      );
    })();
  }
  return _cronFnPromise;
}

// ---------------------------------------------------------------------------
// Worker — per-industry AI refresh
// ---------------------------------------------------------------------------

/**
 * Returns (and lazily creates) the Inngest event-driven worker that processes
 * a single industry insight update.
 *
 * Idempotency guards:
 *   - concurrency: 5 — caps simultaneous AI calls to avoid rate-limit spikes.
 *   - step.ai.wrap — Inngest memoises the AI result on replay, so a retried
 *     run never re-issues the Gemini request for the same step.
 *
 * Failure handling:
 *   - onFailure — logs a structured payload that can be parsed by log drains
 *     or alerted on in production dashboards.
 */
export function getProcessIndustryInsight() {
  if (!_workerFnPromise) {
    _workerFnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();

      return inngest.createFunction(
        {
          id: "process-industry-insight",
          name: "Process Industry Insight",
          concurrency: 5,
          onFailure: async ({ error, event }) => {
            log.error("process-industry-insight", error, {
              industry: event?.data?.industry,
              eventId: event?.id,
            });
          },
        },
        { event: "industry/insight.requested" },
        async ({ event, step }) => {
          const { industry } = event.data;

          log.info("process-industry-insight", "Starting insight refresh", { industry });

          // step.ai.wrap memoises the result on Inngest's side — safe to replay
          const insights = await step.ai.wrap(
            "gemini",
            async (insightIndustry) => {
              return await generateIndustryInsightData(insightIndustry);
            },
            industry
          );

          log.info("process-industry-insight", "AI generation complete", {
            industry,
            isGrounded: insights.isGrounded,
          });

          await step.run(`Persist ${industry} insights`, async () => {
            await persistInsights(industry, insights);
          });

          log.info("process-industry-insight", "Insight persisted", { industry });

          return { industry, updated: true, isGrounded: insights.isGrounded };
        }
      );
    })();
  }
  return _workerFnPromise;
}
