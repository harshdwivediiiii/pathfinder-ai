import { checkReadiness, sanitizeHealth } from "@/lib/observability/health";

export async function GET() {
  const readiness = await checkReadiness();

  return new Response(
    JSON.stringify({ ...readiness, health: sanitizeHealth(readiness.health) }, null, 2),
    {
      status: readiness.ready ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
