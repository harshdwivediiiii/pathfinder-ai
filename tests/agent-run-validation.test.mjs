import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.GEMINI_API_KEY = "dummy-api-key";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUniqueUser: vi.fn(),
  agentRunCreate: vi.fn(),
  agentRunFindMany: vi.fn(),
  agentRunUpdateMany: vi.fn(),
  agentRunFindFirst: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@prisma/client", () => ({
  AgentRunStatus: {
    Running: "Running",
    Completed: "Completed",
    Failed: "Failed",
    Cancelled: "Cancelled",
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  db: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    agentRun: {
      create: mocks.agentRunCreate,
      findMany: mocks.agentRunFindMany,
      updateMany: mocks.agentRunUpdateMany,
      findFirst: mocks.agentRunFindFirst,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createAgentRun, getAgentRuns, updateAgentRun } from "../actions/agent-run.js";

describe("agent-run input hygiene", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.findUniqueUser.mockResolvedValue({ id: "db-user-1", clerkUserId: "user-1" });
    mocks.agentRunCreate.mockResolvedValue({ id: "run-1" });
    mocks.agentRunFindMany.mockResolvedValue([]);
    mocks.agentRunUpdateMany.mockResolvedValue({ count: 1 });
    mocks.agentRunFindFirst.mockResolvedValue({ id: "run-1" });
  });

  describe("createAgentRun", () => {
    it("rejects an oversized agentName without calling the database", async () => {
      const result = await createAgentRun({ agentName: "x".repeat(101), userPrompt: "Summarize my inbox" });

      expect(result).toEqual({ error: "Agent name is too long." });
      expect(mocks.agentRunCreate).not.toHaveBeenCalled();
    });

    it("rejects an oversized userPrompt without calling the database", async () => {
      const result = await createAgentRun({ agentName: "Inbox Agent", userPrompt: "y".repeat(8193) });

      expect(result).toEqual({ error: "Prompt is too long." });
      expect(mocks.agentRunCreate).not.toHaveBeenCalled();
    });

    it("rejects an invalid status value", async () => {
      const result = await createAgentRun({ agentName: "Inbox Agent", userPrompt: "Summarize", status: "Pending" });

      expect(result.error).toBeDefined();
      expect(mocks.agentRunCreate).not.toHaveBeenCalled();
    });

    it("creates a run with a default Running status", async () => {
      const result = await createAgentRun({ agentName: "  Inbox Agent  ", userPrompt: "  Summarize my inbox  " });

      expect(result).toEqual({ run: { id: "run-1" } });
      expect(mocks.agentRunCreate).toHaveBeenCalledWith({
        data: {
          userId: "db-user-1",
          agentName: "Inbox Agent",
          userPrompt: "Summarize my inbox",
          status: "Running",
          startedAt: expect.any(Date),
        },
      });
    });

    it("passes an explicit valid status through", async () => {
      const result = await createAgentRun({ agentName: "Inbox Agent", userPrompt: "Summarize", status: "Completed" });

      expect(result).toEqual({ run: { id: "run-1" } });
      expect(mocks.agentRunCreate).toHaveBeenCalledWith({
        data: {
          userId: "db-user-1",
          agentName: "Inbox Agent",
          userPrompt: "Summarize",
          status: "Completed",
          startedAt: expect.any(Date),
        },
      });
    });
  });

  describe("getAgentRuns", () => {
    it("clamps a huge limit to the configured maximum", async () => {
      await getAgentRuns({ limit: 100000 });

      expect(mocks.agentRunFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it("rejects a negative limit", async () => {
      const result = await getAgentRuns({ limit: -5 });

      expect(result.error).toBeDefined();
      expect(mocks.agentRunFindMany).not.toHaveBeenCalled();
    });

    it("rejects a malformed cursor", async () => {
      const result = await getAgentRuns({ limit: 50, cursor: "not-a-valid-cursor" });

      expect(result.error).toBeDefined();
      expect(mocks.agentRunFindMany).not.toHaveBeenCalled();
    });

    it("uses a valid cursor for pagination", async () => {
      await getAgentRuns({ limit: 50, cursor: "clx1validcursoroftheusualshape" });

      expect(mocks.agentRunFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          cursor: { id: "clx1validcursoroftheusualshape" },
          skip: 1,
        })
      );
    });
  });

  describe("updateAgentRun", () => {
    it("rejects an invalid status", async () => {
      const result = await updateAgentRun("run-1", { status: "Pending" });

      expect(result.error).toBeDefined();
      expect(mocks.agentRunUpdateMany).not.toHaveBeenCalled();
    });

    it("updates valid fields and clears completedAt when running", async () => {
      const result = await updateAgentRun("run-1", { status: "Running", output: { summary: "ok" } });

      expect(result).toEqual({ run: { id: "run-1" } });
      expect(mocks.agentRunUpdateMany).toHaveBeenCalledWith({
        where: { id: "run-1", userId: "db-user-1" },
        data: {
          status: "Running",
          output: { summary: "ok" },
          errorMessage: undefined,
          completedAt: null,
        },
      });
    });

    it("sets completedAt when moving out of Running", async () => {
      await updateAgentRun("run-1", { status: "Completed", errorMessage: null });

      expect(mocks.agentRunUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "Completed",
            completedAt: expect.any(Date),
          }),
        })
      );
    });
  });
});
