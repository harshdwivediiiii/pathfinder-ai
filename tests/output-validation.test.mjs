import assert from "node:assert/strict";
import test from "node:test";

import { stripMarkdownFences, validateOutput } from "../lib/validate.js";
import {
  resumeImprovementOutputSchema,
  coverLetterOutputSchema,
  interviewQuestionsOutputSchema,
} from "../lib/schemas/outputs.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── stripMarkdownFences ────────────────────────────────────────────────────

test("stripMarkdownFences removes ```json fences", () => {
  const input = "```json\n{\"key\": \"value\"}\n```";
  const result = stripMarkdownFences(input);
  assert.equal(result, '{"key": "value"}');
});

test("stripMarkdownFences removes plain ``` fences", () => {
  const input = "```\n{\"key\": \"value\"}\n```";
  const result = stripMarkdownFences(input);
  assert.equal(result, '{"key": "value"}');
});

test("stripMarkdownFences leaves plain JSON untouched", () => {
  const input = '{"key": "value"}';
  const result = stripMarkdownFences(input);
  assert.equal(result, '{"key": "value"}');
});

// ── validateOutput — resume ────────────────────────────────────────────────

test("validateOutput accepts valid resume improvement output", () => {
  const raw = JSON.stringify({
    improvedContent: "Led a team of 5 engineers to deliver a microservices migration, reducing latency by 40%.",
    highlights: ["Reduced latency by 40%", "Led team of 5 engineers"],
  });
  const result = validateOutput(resumeImprovementOutputSchema, raw);
  assert.equal(result.success, true);
  assert.ok(result.data.improvedContent);
  assert.ok(Array.isArray(result.data.highlights));
});

test("validateOutput strips markdown fences before parsing resume output", () => {
  const raw = "```json\n" + JSON.stringify({
    improvedContent: "Designed scalable APIs serving 1M+ requests/day.",
    highlights: ["Scalable APIs", "1M+ requests/day"],
  }) + "\n```";
  const result = validateOutput(resumeImprovementOutputSchema, raw);
  assert.equal(result.success, true);
});

test("validateOutput rejects resume output with missing highlights", () => {
  const raw = JSON.stringify({ improvedContent: "Some improved content here." });
  const result = validateOutput(resumeImprovementOutputSchema, raw);
  assert.equal(result.success, false);
  assert.ok(result.errors.highlights);
});

test("validateOutput rejects malformed JSON", () => {
  const result = validateOutput(resumeImprovementOutputSchema, "not json at all");
  assert.equal(result.success, false);
  assert.ok(result.errors._output[0].includes("valid JSON"));
});

test("validateOutput rejects empty string", () => {
  const result = validateOutput(resumeImprovementOutputSchema, "");
  assert.equal(result.success, false);
  assert.ok(result.errors._output[0].includes("empty"));
});

// ── validateOutput — cover letter ──────────────────────────────────────────

test("validateOutput accepts valid cover letter output", () => {
  const raw = JSON.stringify({
    greeting: "Dear Hiring Manager,",
    body: "I am excited to apply for the Software Engineer position. My experience in building scalable systems and leading cross-functional teams aligns well with your requirements.",
    closing: "Sincerely,\nJohn Doe",
  });
  const result = validateOutput(coverLetterOutputSchema, raw);
  assert.equal(result.success, true);
  assert.ok(result.data.greeting);
  assert.ok(result.data.body);
  assert.ok(result.data.closing);
});

test("validateOutput rejects cover letter with missing body", () => {
  const raw = JSON.stringify({
    greeting: "Dear Hiring Manager,",
    closing: "Sincerely, Jane",
  });
  const result = validateOutput(coverLetterOutputSchema, raw);
  assert.equal(result.success, false);
  assert.ok(result.errors.body);
});

// ── buildFormatCorrectionPrompt ────────────────────────────────────────────

test("buildFormatCorrectionPrompt includes schema description", () => {
  const prompt = buildFormatCorrectionPrompt(
    "Write a resume bullet.",
    "This is not JSON",
    '{"improvedContent": "string", "highlights": ["string"]}'
  );
  assert.ok(prompt.includes("improvedContent"));
  assert.ok(prompt.includes("did not match the required JSON format"));
});

test("buildFormatCorrectionPrompt truncates long bad output to 500 chars", () => {
  const longBadOutput = "x".repeat(1000);
  const prompt = buildFormatCorrectionPrompt("task", longBadOutput, "schema");
  const badOutputSection = prompt.split("Previous (malformed) response:")[1];
  assert.ok(badOutputSection.length <= 600); // 500 + some whitespace
});

// ── validateOutput — interview questions ───────────────────────────────────

test("validateOutput accepts valid interview questions output", () => {
  const raw = JSON.stringify({
    questions: [
      {
        question: "What is polymorphism in OOP?",
        options: ["A design pattern", "Ability of objects to take many forms", "A data structure", "A sorting algorithm"],
        correctAnswer: "Ability of objects to take many forms",
        explanation: "Polymorphism allows objects of different types to be treated as instances of the same class.",
      },
    ],
  });
  const result = validateOutput(interviewQuestionsOutputSchema, raw);
  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.data.questions));
  assert.equal(result.data.questions.length, 1);
});

test("validateOutput rejects interview questions output with missing explanation", () => {
  const raw = JSON.stringify({
    questions: [
      {
        question: "What is polymorphism?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
      },
    ],
  });
  const result = validateOutput(interviewQuestionsOutputSchema, raw);
  assert.equal(result.success, false);
});

test("validateOutput rejects interview questions with wrong options count", () => {
  const raw = JSON.stringify({
    questions: [
      {
        question: "What is polymorphism?",
        options: ["A", "B", "C"],
        correctAnswer: "A",
        explanation: "Some explanation here.",
      },
    ],
  });
  const result = validateOutput(interviewQuestionsOutputSchema, raw);
  assert.equal(result.success, false);
});
