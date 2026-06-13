let _fnPromise;

export function getCleanupRateLimits() {
  if (!_fnPromise) {
    _fnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();
      const { deleteExpiredRateLimits } = await import("@/lib/rate-limit-actions");
      
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
  return _fnPromise;
}