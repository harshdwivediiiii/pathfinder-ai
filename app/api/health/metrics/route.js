import { getPrometheusMetrics } from "@/lib/observability/metrics";

export async function GET() {
  const metrics = getPrometheusMetrics();

  return new Response(metrics, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}