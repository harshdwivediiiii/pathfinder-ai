import { describe, expect, it } from "vitest";
import { parseCitations } from "../lib/citations/parse-citations";

describe("parseCitations", () => {
  it("extracts page citations", () => {
    const result = parseCitations(
      "Hello [Page 4]"
    );

    expect(result).toHaveLength(2);
    expect(result[1].type).toBe("citation");
    expect(result[1].content).toBe("Page 4");
  });

  it("extracts section citations", () => {
    const result = parseCitations(
      "Intro [Section 2.1]"
    );

    expect(result[1].content).toBe("Section 2.1");
  });

  it("extracts source citations", () => {
    const result = parseCitations(
      "Answer [Source #3]"
    );

    expect(result[1].content).toBe("Source #3");
  });

  it("returns plain text when no citations exist", () => {
    const result = parseCitations("Normal text");

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("text");
  });
});