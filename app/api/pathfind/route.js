import { NextResponse } from "next/server";
import { compareAlgorithms } from "@/actions/pathfinding";
import { coordinateAgents } from "@/actions/pathfinding";
import { dynamicReplan } from "@/actions/pathfinding";

export async function POST(request) {
  try {
    const body = await request.json();
    const { path } = body;
    switch (path) {
      case "compare": return NextResponse.json({ success: true, data: await compareAlgorithms(body) });
      case "coordinate": return NextResponse.json({ success: true, data: await coordinateAgents(body) });
      case "replan": return NextResponse.json({ success: true, data: await dynamicReplan(body) });
      default: return NextResponse.json({ success: false, error: `Unknown path: '${path}'` }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
