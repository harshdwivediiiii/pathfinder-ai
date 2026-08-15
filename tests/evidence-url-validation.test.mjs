import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  revalidatePath: vi.fn(),
  userFindUnique: vi.fn(),
  evidenceCreate: vi.fn(),
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
    evidenceItem: {
      create: mocks.evidenceCreate,
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: vi.fn(),
}));

import { createEvidenceItem } from "../actions/evidence.js";

describe("Evidence Locker URL validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "clerk-user-1" });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1" });
  });

  it.each([
    "javascript:alert(document.domain)",
    "data:text/html,<script>alert(1)</script>",
  ])("rejects unsafe URL schemes before persistence: %s", async (url) => {
    const result = await createEvidenceItem({
      title: "Unsafe link",
      url,
      category: "PROJECT",
      description: "",
      tags: [],
    });

    expect(result.success).toBe(false);
    expect(result.errors.url).toContain("Only HTTP/HTTPS URLs are permitted");
    expect(mocks.evidenceCreate).not.toHaveBeenCalled();
  });

  it("allows HTTPS evidence URLs", async () => {
    mocks.evidenceCreate.mockResolvedValue({
      id: "evidence-1",
      title: "Safe link",
      url: "https://example.com/proof",
    });

    const result = await createEvidenceItem({
      title: "Safe link",
      url: "https://example.com/proof",
      category: "PROJECT",
      description: "",
      tags: [],
    });

    expect(result.success).toBe(true);
    expect(mocks.evidenceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        url: "https://example.com/proof",
      }),
    });
  });
});
