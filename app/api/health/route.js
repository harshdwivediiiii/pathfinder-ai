import { checkHealth, sanitizeHealth } from "@/lib/observability/health";

export async function GET() {
  const health = await checkHealth();

  const status = health.status === "healthy" ? 200 : 503;

  return new Response(JSON.stringify(sanitizeHealth(health), null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
