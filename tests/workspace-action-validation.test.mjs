import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  userFindUnique: vi.fn(),
  workspaceFindFirst: vi.fn(),
  workspaceCreate: vi.fn(),
  agentRunFindFirst: vi.fn(),
  agentOutputCreate: vi.fn(),
  activityCreate: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
    },
    projectWorkspace: {
      findFirst: mocks.workspaceFindFirst,
      create: mocks.workspaceCreate,
    },
    projectAgentOutput: {
      create: mocks.agentOutputCreate,
    },
    projectActivity: {
      create: mocks.activityCreate,
    },
    agentRun: {
      findFirst: mocks.agentRunFindFirst,
    },
  },
}));

import { createWorkspace, saveAgentOutput } from "../actions/workspace.js";

describe("workspace action validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1" });
    mocks.workspaceFindFirst.mockResolvedValue({ id: "workspace-1" });
  });

  it("rejects oversized workspace titles before creating a row", async () => {
    await expect(
      createWorkspace({
        title: "x".repeat(161),
        description: "valid description",
      })
    ).rejects.toThrow("Workspace title is too long");

    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.workspaceCreate).not.toHaveBeenCalled();
  });

  it("rejects agent output links to agent runs not owned by the current user", async () => {
    mocks.agentRunFindFirst.mockResolvedValue(null);

    await expect(
      saveAgentOutput("workspace-1", "Research output", { summary: "ok" }, "cmagentrun000000000000000")
    ).rejects.toThrow("Agent run not found or unauthorized");

    expect(mocks.agentRunFindFirst).toHaveBeenCalledWith({
      where: {
        id: "cmagentrun000000000000000",
        user: { clerkUserId: "clerk-user-1" },
      },
      select: { id: true },
    });
    expect(mocks.agentOutputCreate).not.toHaveBeenCalled();
  });
});
