import { respondError, ERROR_CODES } from "@/lib/api/error-handler";
import { isAiEnabled, isFeatureEnabled } from "@/lib/ai-gating";

export async function GET() {
  try {
    const status = {
      aiEnabled: isAiEnabled(),
      features: {
        chat: isFeatureEnabled("chat"),
        ats: isFeatureEnabled("ats"),
        coverLetter: isFeatureEnabled("coverLetter"),
        interview: isFeatureEnabled("interview"),
        roadmap: isFeatureEnabled("roadmap"),
        insights: isFeatureEnabled("insights"),
      },
    };

    return Response.json(status);
  } catch (err) {
    console.error("[api/ai/gating]", err);
    return respondError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to retrieve AI feature gating status"
    );
  }
}
