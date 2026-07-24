function isInngestConfigured() {
  return !!(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY);
}

async function getHandler(request) {
  const [
    { getInngest },
    {
      getGenerateIndustryInsights,
      getProcessIndustryInsight,
      getSendInterviewReminders,
      getCleanupRateLimits,
    },
    { serve },
  ] = await Promise.all([
    import("@/lib/inngest/client"),
    import("@/lib/jobs"),
    import("inngest/next"),
  ]);
  const client = await getInngest();
  const cronFn = await getGenerateIndustryInsights();
  const workerFn = await getProcessIndustryInsight();
  const reminderFn = await getSendInterviewReminders();
  const cleanupFn = await getCleanupRateLimits();
  return serve({
    client,
    signingKey: process.env.INNGEST_SIGNING_KEY,
    functions: [cronFn, workerFn, reminderFn, cleanupFn],
  });
}

export async function GET(request) {
  if (!isInngestConfigured()) {
    return new Response(JSON.stringify({ error: "Inngest not configured" }), { status: 404 });
  }
  try {
    const handler = await getHandler(request);
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
    const handler = await getHandler(request);
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
    const handler = await getHandler(request);
    return handler.PUT(request);
  } catch (error) {
    console.error("Inngest PUT handler error:", error);
    return new Response(JSON.stringify({ error: "Inngest handler error" }), { status: 500 });
  }
}