function isInngestConfigured() {
  return !!(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY);
}

export async function GET(request) {
  if (!isInngestConfigured()) {
    return new Response(JSON.stringify({ error: "Inngest not configured" }), { status: 404 });
  }
  try {
    const [{ getInngest }, { getGenerateIndustryInsights }, { getCleanupRateLimits }, { serve }] = await Promise.all([
      import("@/lib/inngest/client"),
      import("@/lib/inngest/function"),
      import("@/.inngest/functions/cleanup-rate-limits"),
      import("inngest/next"),
    ]);
    const client = await getInngest();
    const fn = await getGenerateIndustryInsights();
    const cleanupFn = await getCleanupRateLimits();
    const handler = serve({
      client,
      signingKey: process.env.INNGEST_SIGNING_KEY,
      functions: [fn, cleanupFn],
    });
    return handler.GET(request);
  } catch (error) {
    console.error("Inngest GET handler error:", error);
    return new Response(JSON.stringify({ error: "Inngest handler error" }), { status: 500 });
  }
}

export async function POST(request) {
  if (!isInngestConfigured()) {
    return new Response(JSON.stringify({ error: "Inngest not configured" }), { status: 404 });
  }
  try {
    const [{ getInngest }, { getGenerateIndustryInsights }, { getCleanupRateLimits }, { serve }] = await Promise.all([
      import("@/lib/inngest/client"),
      import("@/lib/inngest/function"),
      import("@/.inngest/functions/cleanup-rate-limits"),
      import("inngest/next"),
    ]);
    const client = await getInngest();
    const fn = await getGenerateIndustryInsights();
    const cleanupFn = await getCleanupRateLimits();
    const handler = serve({
      client,
      signingKey: process.env.INNGEST_SIGNING_KEY,
      functions: [fn, cleanupFn],
    });
    return handler.POST(request);
  } catch (error) {
    console.error("Inngest POST handler error:", error);
    return new Response(JSON.stringify({ error: "Inngest handler error" }), { status: 500 });
  }
}

export async function PUT(request) {
  if (!isInngestConfigured()) {
    return new Response(JSON.stringify({ error: "Inngest not configured" }), { status: 404 });
  }
  try {
    const [{ getInngest }, { getGenerateIndustryInsights }, { getCleanupRateLimits }, { serve }] = await Promise.all([
      import("@/lib/inngest/client"),
      import("@/lib/inngest/function"),
      import("@/.inngest/functions/cleanup-rate-limits"),
      import("inngest/next"),
    ]);
    const client = await getInngest();
    const fn = await getGenerateIndustryInsights();
    const cleanupFn = await getCleanupRateLimits();
    const handler = serve({
      client,
      signingKey: process.env.INNGEST_SIGNING_KEY,
      functions: [fn, cleanupFn],
    });
    return handler.PUT(request);
  } catch (error) {
    console.error("Inngest PUT handler error:", error);
    return new Response(JSON.stringify({ error: "Inngest handler error" }), { status: 500 });
  }
}

