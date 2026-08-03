import { NextResponse } from "next/server";
import { compareAlgorithms, coordinateAgents, dynamicReplan } from "@/actions/pathfinding";

export async function POST(request) {
  try {
    const { path, ...rest } = await request.json();
    let result;
    switch (path) {
      case "compare": result = await compareAlgorithms(rest); break;
      case "coordinate": result = await coordinateAgents(rest); break;
      case "replan": result = await dynamicReplan(rest); break;
      default: return NextResponse.json({ success: false, error: `Unknown path: '${path}'` }, { status: 404 });
    }
    return NextResponse.json(result, { status: result.success !== false ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
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
