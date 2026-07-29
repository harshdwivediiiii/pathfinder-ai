import { NextResponse } from "next/server";
import { globalFederatedManager } from "@/lib/ai/federated-learning";
import { auth } from "@clerk/nextjs/server";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }
    
    // Return the latest global model weights for the edge device
    const model = globalFederatedManager.getGlobalModel();
    return NextResponse.json(model);
  } catch (error) {
    console.error("Federated Learning GET Error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to fetch global model.");
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const body = await request.json();
    const { clientDeltas, samplesTrained } = body;

    if (!clientDeltas || !samplesTrained) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Missing client deltas or samples trained data.");
    }

    // Edge device submits updated weights/deltas after local training
    const update = {
      clientDeltas,
      samplesTrained
    };

    // Aggregate updates to the global model (FedAvg)
    const aggregationResult = globalFederatedManager.aggregateUpdates([update]);

    return NextResponse.json({
      message: "Successfully aggregated edge device weights.",
      result: aggregationResult
    });
  } catch (error) {
    console.error("Federated Learning POST Error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to aggregate federated updates.");
  }
}
