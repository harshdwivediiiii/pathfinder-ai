import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import { generateGeminiStructuredContent } from "../lib/gemini.js";

const sampleSchema = z.object({
  bullets: z.array(z.string().min(1)).min(1),
});

test("generateGeminiStructuredContent returns parsed data on first valid response", async () => {
  let calls = 0;

  const result = await generateGeminiStructuredContent({
    prompt: "Return bullets",
    schema: sampleSchema,
    schemaName: "resumeBullets",
    jsonSchemaExample: '{"bullets":["Did thing"]}',
    generateText: async () => {
      calls += 1;
      return '{"bullets":["Improved uptime by 20%"]}';
    },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { bullets: ["Improved uptime by 20%"] });
});

test("generateGeminiStructuredContent retries once when first response is malformed", async () => {
  const responses = ["not-json", '{"bullets":["Reduced latency by 35%"]}'];

  const result = await generateGeminiStructuredContent({
    prompt: "Return bullets",
    schema: sampleSchema,
    schemaName: "resumeBullets",
    jsonSchemaExample: '{"bullets":["Did thing"]}',
    generateText: async () => responses.shift(),
  });

  assert.deepEqual(result, { bullets: ["Reduced latency by 35%"] });
});

test("generateGeminiStructuredContent fails after malformed retry", async () => {
  await assert.rejects(
    () =>
      generateGeminiStructuredContent({
        prompt: "Return bullets",
        schema: sampleSchema,
        schemaName: "resumeBullets",
        jsonSchemaExample: '{"bullets":["Did thing"]}',
        generateText: async () => "still-not-json",
      }),
    /invalid resumeBullets format/
  );
});
