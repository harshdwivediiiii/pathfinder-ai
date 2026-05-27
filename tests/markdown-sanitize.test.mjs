import { describe, expect, it } from "vitest";
import rehypeSanitize from "rehype-sanitize";

describe("markdown sanitization", () => {
  it("rehypeSanitize plugin should exist", () => {
    expect(rehypeSanitize).toBeDefined();
  });
});