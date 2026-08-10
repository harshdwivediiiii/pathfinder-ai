import { auth } from "@clerk/nextjs/server";
import { getPrometheusMetrics } from "@/lib/observability/metrics";
import { ERROR_CODES, respondError } from "@/lib/api/error-handler";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return respondError(ERROR_CODES.UNAUTHORIZED);
  }

  const metrics = getPrometheusMetrics();

  return new Response(metrics, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}