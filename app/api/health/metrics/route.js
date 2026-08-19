import { auth } from "@clerk/nextjs/server";
import { getPrometheusMetrics } from "@/lib/observability/metrics";
import { ERROR_CODES, respondError } from "@/lib/api/error-handler";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return respondError(ERROR_CODES.UNAUTHORIZED);
export async function GET(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const host = forwarded?.split(",")[0]?.trim() || request.headers.get("host") || "";
  const isLocalhost =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("::1");

  if (!isLocalhost) {
    return new Response("Forbidden", { status: 403 });
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