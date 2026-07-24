import "server-only";

// ---------------------------------------------------------------------------
// Lazy singleton promise — matches the pattern in industry-insights.js
// ---------------------------------------------------------------------------

let _cleanupFnPromise;

// ---------------------------------------------------------------------------
// Cron — hourly cleanup of expired AiRateLimit rows
// ---------------------------------------------------------------------------

/**
 * Returns (and lazily creates) the Inngest cron function that deletes
 * expired `AiRateLimit` rows every hour.
 *
 * The factory defers `getInngest()` / `createFunction()` until first call,
 * keeping module-load side-effect-free and safe for hot-reload.
 */
export function getCleanupRateLimits() {
  if (!_cleanupFnPromise) {
    _cleanupFnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();
      const { deleteExpiredRateLimits } = await import(
        "@/lib/security/rate-limit-actions"
      );

      return inngest.createFunction(
        {
          id: "cleanup-rate-limits",
          name: "Cleanup Expired Rate Limit Rows",
        },
        { cron: "0 * * * *" }, // runs every hour
        async ({ step }) => {
          const deleted = await step.run("delete-expired-rows", async () => {
            return await deleteExpiredRateLimits();
          });

          return { deleted };
        }
      );
    })();
  }
  return _cleanupFnPromise;
}
