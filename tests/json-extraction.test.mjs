import { describe, it, expect } from "vitest";
import { z } from "zod";
import { extractJSON, parseAIJson, validateOutput } from "@/lib/ai/validate.js";

describe("extractJSON", () => {
  it("returns a pure JSON object string unchanged (trimmed)", () => {
    const raw = '{ "a": 1 }';
    expect(extractJSON(raw)).toBe('{ "a": 1 }');
    expect(parseAIJson(raw)).toEqual({ a: 1 });
  });

  it("extracts JSON preceded by prose", () => {
    const raw = 'Here is the JSON:\n{ "a": 1 }';
    expect(parseAIJson(raw)).toEqual({ a: 1 });
  });

  it("extracts JSON followed by trailing notes", () => {
    const raw = '{ "a": 1 }\n\nNote: values are approximate.';
    expect(parseAIJson(raw)).toEqual({ a: 1 });
  });

  it("extracts JSON surrounded by leading and trailing chatter", () => {
    const raw = 'Sure! Here you go:\n{ "a": 1, "b": "two" }\nLet me know if you need more.';
    expect(parseAIJson(raw)).toEqual({ a: 1, b: "two" });
  });

  it("extracts markdown-fenced JSON with surrounding prose", () => {
    const raw =
      'Here is the result you asked for:\n```json\n{ "a": 1, "nested": { "b": 2 } }\n```\nHope that helps!';
    expect(parseAIJson(raw)).toEqual({ a: 1, nested: { b: 2 } });
  });

  it("handles string values that contain braces and brackets (string-aware matching)", () => {
    const raw = '{"tip":"use {placeholder} and [x]"}';
    expect(extractJSON(raw)).toBe('{"tip":"use {placeholder} and [x]"}');
    expect(parseAIJson(raw)).toEqual({ tip: "use {placeholder} and [x]" });
  });

  it("handles escaped quotes inside string values", () => {
    const raw = '{"quote":"she said \\"hi\\" } [done]"}';
    expect(parseAIJson(raw)).toEqual({ quote: 'she said "hi" } [done]' });
  });

  it("extracts a top-level array", () => {
    const raw = "Result: [1, 2, 3]";
    expect(extractJSON(raw)).toBe("[1, 2, 3]");
    expect(parseAIJson(raw)).toEqual([1, 2, 3]);
  });

  it("parses nested objects and arrays correctly", () => {
    const raw =
      'Output below:\n{ "items": [ { "id": 1 }, { "id": 2 } ], "meta": { "count": 2 } }\nDone.';
    expect(parseAIJson(raw)).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      meta: { count: 2 },
    });
  });

  it("extracts valid JSON even when preceded by conversational/explanatory braces", () => {
    const raw = "Here is some {placeholder} text.\nActual JSON: { \"a\": 1 }";
    expect(parseAIJson(raw)).toEqual({ a: 1 });
  });

  it("extracts valid JSON even when multiple invalid balanced blocks precede it", () => {
    const raw = "Note: {foo} and {bar} are used.\nResult: {\"status\": \"ok\"}";
    expect(parseAIJson(raw)).toEqual({ status: "ok" });
  });

  it("handles large responses with many non-JSON braces before the payload", () => {
    const manyBraces = Array(100).fill("{ not json }").join(" ");
    const raw = `${manyBraces} Actual: { "valid": true }`;
    expect(parseAIJson(raw)).toEqual({ valid: true });
  });

  it("throws when no JSON is present", () => {
    expect(() => extractJSON("there is no json here")).toThrow(
      "No JSON payload found in AI response"
    );
    expect(() => parseAIJson("there is no json here")).toThrow(
      "No JSON payload found in AI response"
    );
  });

  it("throws on an empty string", () => {
    expect(() => extractJSON("")).toThrow("No JSON payload found in AI response");
    expect(() => parseAIJson("")).toThrow("No JSON payload found in AI response");
  });

  it("throws on non-string input", () => {
    expect(() => extractJSON(null)).toThrow("No JSON payload found in AI response");
    expect(() => extractJSON(undefined)).toThrow("No JSON payload found in AI response");
    expect(() => extractJSON(42)).toThrow("No JSON payload found in AI response");
  });

  it("throws when brackets never close", () => {
    expect(() => extractJSON('{ "a": 1 ')).toThrow(
      "No JSON payload found in AI response"
    );
  });
});

describe("parseAIJson", () => {
  it("throws a descriptive parse error on malformed-but-bracketed content", () => {
    expect(() => parseAIJson('{ "a": 1, }')).toThrow(
      /Failed to parse JSON payload from AI response/
    );
  });
});

describe("validateOutput integration", () => {
  const atsSchema = z.object({
    atsScore: z.number(),
    matchedKeywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    summary: z.string(),
  });

  it("validates a realistic noisy ATS response without falling back", () => {
    const raw = `Thanks for sharing your resume! Here is the ATS analysis:

\`\`\`json
{
  "atsScore": 82,
  "matchedKeywords": ["react", "node.js", "typescript"],
  "missingKeywords": ["graphql", "kubernetes"],
  "summary": "Strong frontend match; consider adding {cloud} and [devops] skills."
}
\`\`\`

Note: scores are approximate and based on keyword overlap.`;

    const result = validateOutput(atsSchema, raw);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      atsScore: 82,
      matchedKeywords: ["react", "node.js", "typescript"],
      missingKeywords: ["graphql", "kubernetes"],
      summary: "Strong frontend match; consider adding {cloud} and [devops] skills.",
    });
  });

  it("returns a structured failure when no JSON is present", () => {
    const result = validateOutput(atsSchema, "I could not produce a result.");
    expect(result.success).toBe(false);
    expect(result.errors._output).toBeDefined();
  });

  it("returns field errors when JSON parses but fails schema validation", () => {
    const raw = '{ "atsScore": "high", "matchedKeywords": [], "missingKeywords": [], "summary": "x" }';
    const result = validateOutput(atsSchema, raw);
    expect(result.success).toBe(false);
    expect(result.errors.atsScore).toBeDefined();
  });
});
