import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  compareAlgorithms: vi.fn(),
  coordinateAgents: vi.fn(),
  dynamicReplan: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/actions/pathfinding", () => ({
  compareAlgorithms: mocks.compareAlgorithms,
  coordinateAgents: mocks.coordinateAgents,
  dynamicReplan: mocks.dynamicReplan,
}));

import { POST } from "../app/api/pathfind/route.js";

function buildRequest(body) {
  return new Request("http://localhost/api/pathfind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/pathfind", () => {
  it("dispatches compare and returns 200", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.compareAlgorithms.mockResolvedValue({ success: true, data: {} });

    const res = await POST(buildRequest({ path: "compare", graph: {}, start: "A", goal: "D" }));

    expect(res.status).toBe(200);
    expect(mocks.compareAlgorithms).toHaveBeenCalledTimes(1);
    expect(mocks.compareAlgorithms).toHaveBeenCalledWith({
      path: "compare",
      graph: {},
      start: "A",
      goal: "D",
    });
  });

  it("dispatches coordinate and returns 200", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.coordinateAgents.mockResolvedValue({ success: true, data: {} });

    const res = await POST(buildRequest({ path: "coordinate", graph: {}, agents: [{}, {}] }));

    expect(res.status).toBe(200);
    expect(mocks.coordinateAgents).toHaveBeenCalledTimes(1);
  });

  it("dispatches replan and returns 200", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.dynamicReplan.mockResolvedValue({ success: true, data: {} });

    const res = await POST(buildRequest({ path: "replan", graph: {}, agentId: "a1", changes: [] }));

    expect(res.status).toBe(200);
    expect(mocks.dynamicReplan).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for an unknown path", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    const res = await POST(buildRequest({ path: "unknown" }));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 401 for an unauthenticated request", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const res = await POST(buildRequest({ path: "compare", graph: {}, start: "A", goal: "D" }));

    expect(res.status).toBe(401);
    expect(mocks.compareAlgorithms).not.toHaveBeenCalled();
  });
});
