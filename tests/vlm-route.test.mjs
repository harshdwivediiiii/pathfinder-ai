import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateGeminiContent: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

import { POST } from "../app/api/navigation/vlm/route.js";

function buildRequest(body) {
  return new Request("http://localhost/api/navigation/vlm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validImage = "data:image/png;base64,iVBORw0KGgo=";
const validBody = { image: validImage, instruction: "Turn right in 100 meters" };

describe("POST /api/navigation/vlm", () => {
  it("returns 401 if not authenticated", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const res = await POST(buildRequest(validBody));

    expect(res.status).toBe(401);
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns 400 if image is missing", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(buildRequest({ instruction: "Turn right" }));

    expect(res.status).toBe(400);
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns 400 if image is not a base64 data URL", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(buildRequest({ image: "not-a-data-url", instruction: "Turn right" }));

    expect(res.status).toBe(400);
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns 400 if image exceeds the maximum length", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const oversizedImage = "data:image/png;base64," + "A".repeat(10 * 1024 * 1024 + 1);
    const res = await POST(buildRequest({ image: oversizedImage, instruction: "Turn right" }));

    expect(res.status).toBe(400);
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns 400 if instruction is missing", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(buildRequest({ image: validImage }));

    expect(res.status).toBe(400);
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns 400 if instruction exceeds the maximum length", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });

    const res = await POST(buildRequest({ image: validImage, instruction: "a".repeat(1001) }));

    expect(res.status).toBe(400);
    expect(mocks.generateGeminiContent).not.toHaveBeenCalled();
  });

  it("returns 200 with landmarkInstruction for valid input", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => "Turn right just after the red brick Starbucks" },
    });

    const res = await POST(buildRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.landmarkInstruction).toBe("Turn right just after the red brick Starbucks");
    expect(mocks.generateGeminiContent).toHaveBeenCalledTimes(1);
  });
});
