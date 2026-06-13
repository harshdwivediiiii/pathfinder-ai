import { inngest } from "@/lib/inngest/client";
import { deleteExpiredRateLimits } from "@/lib/rate-limit-actions";

export const cleanupRateLimits = inngest.createFunction(
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