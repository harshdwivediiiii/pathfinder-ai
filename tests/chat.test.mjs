import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateGeminiContent: vi.fn(),
  buildSecurePrompt: vi.fn(),
  consoleError: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

vi.mock("@/lib/prompt-safety", () => ({
  buildSecurePrompt: mocks.buildSecurePrompt,
}));

// const consoleErrorSpy = vi
//   .spyOn(console, "error")
//   .mockImplementation(() => {});

import { chatWithGemini } from "../actions/chat.js";

describe("chatWithGemini", () => {
  it("requires a prompt", async () => {
    await expect(chatWithGemini("")).rejects.toThrow("Prompt is required");
  });

  it("wraps the prompt before sending it to Gemini", async () => {
    mocks.buildSecurePrompt.mockReturnValue("secure prompt");
    mocks.generateGeminiContent.mockResolvedValue({
      response: { text: () => "career advice" },
    });

    await expect(chatWithGemini("How do I improve my resume?")).resolves.toBe(
      "career advice"
    );

    expect(mocks.buildSecurePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        untrustedData: [
          {
            label: "userQuery",
            value: "How do I improve my resume?",
            maxLength: 4000,
          },
        ],
      })
    );
    expect(mocks.generateGeminiContent).toHaveBeenCalledWith("secure prompt");
  });

  it("normalizes Gemini errors", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.buildSecurePrompt.mockReturnValue("secure prompt");
    mocks.generateGeminiContent.mockRejectedValue(new Error("quota exceeded"));

    await expect(chatWithGemini("Help me with interviews")).rejects.toThrow(
      "Failed to get response from Gemini AI"
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});