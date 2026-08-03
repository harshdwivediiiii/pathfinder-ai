import { NextResponse } from "next/server";
import { compareAlgorithms } from "@/actions/pathfinding";
import { coordinateAgents } from "@/actions/pathfinding";
import { dynamicReplan } from "@/actions/pathfinding";

/**
 * Unified pathfinding API endpoint.
 *
 * Fixed: previously read request.json() twice -- once to extract `path` and
 * once inside each switch case. The Request body is a ReadableStream that
 * can only be consumed once in Next.js 15. The fix reads the body exactly
 * once and passes the parsed object to the appropriate handler.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { path } = body;

    switch (path) {
      case "compare": {
        const result = await compareAlgorithms(body);
        return NextResponse.json({ success: true, data: result });
      }
      case "coordinate": {
        const result = await coordinateAgents(body);
        return NextResponse.json({ success: true, data: result });
      }
      case "replan": {
        const result = await dynamicReplan(body);
        return NextResponse.json({ success: true, data: result });
      }
      default: {
        return NextResponse.json(
          { success: false, error: `Unknown path: '${path}'` },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
