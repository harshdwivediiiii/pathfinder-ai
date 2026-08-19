import { getInngest } from "@/lib/inngest/client";
import { deleteExpiredRateLimits } from "@/lib/security/rate-limit-actions";

let _cleanupFnPromise;

export function getCleanupRateLimits() {
  if (!_cleanupFnPromise) {
    _cleanupFnPromise = (async () => {
      const inngest = await getInngest();

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
