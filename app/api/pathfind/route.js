import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { compareAlgorithms, coordinateAgents, dynamicReplan } from "@/actions/pathfinding";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { path } = body;

    switch (path) {
      case "compare": {
        const result = await compareAlgorithms(body);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      case "coordinate": {
        const result = await coordinateAgents(body);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      case "replan": {
        const result = await dynamicReplan(body);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown path: ${path}` },
          { status: 404 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { AlgorithmRegistry } = await import("@/lib/algorithms");

  return NextResponse.json({
    algorithms: AlgorithmRegistry.getNames(),
    metadata: AlgorithmRegistry.getAllMetadata(),
  });
}