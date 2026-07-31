import { checkReadiness } from "@/lib/observability/health";

export async function GET() {
  const readiness = await checkReadiness();

  return new Response(
    JSON.stringify(readiness, null, 2),
    {
      status: readiness.ready ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}