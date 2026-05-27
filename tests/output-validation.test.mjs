import { expect, it } from "vitest";

import { stripMarkdownFences, validateOutput } from "../lib/validate.js";
import {
  resumeImprovementOutputSchema,
  coverLetterOutputSchema,
  interviewQuestionsOutputSchema,
} from "../lib/schemas/outputs.js";
import { buildFormatCorrectionPrompt } from "../lib/prompt-safety.js";

// ── stripMarkdownFences ────────────────────────────────────────────────────

it("stripMarkdownFences removes ```json fences", () => {
  const input = "```json\n{\"key\": \"value\"}\n```";
  const result = stripMarkdownFences(input);
  expect(result).toBe('{"key": "value"}');
});

it("stripMarkdownFences removes plain ``` fences", () => {
  const input = "```\n{\"key\": \"value\"}\n```";
  const result = stripMarkdownFences(input);
  expect(result).toBe('{"key": "value"}');
});

it("stripMarkdownFences leaves plain JSON untouched", () => {
  const input = '{"key": "value"}';
  const result = stripMarkdownFences(input);
  expect(result).toBe('{"key": "value"}');
});

// ── validateOutput — resume ────────────────────────────────────────────────

it("validateOutput accepts valid resume improvement output", () => {
  const raw = JSON.stringify({
    improvedContent: "Led a team of 5 engineers to deliver a microservices migration, reducing latency by 40%.",
    highlights: ["Reduced latency by 40%", "Led team of 5 engineers"],
  });
  const result = validateOutput(resumeImprovementOutputSchema, raw);
  expect(result.success).toBe(true);
  expect(result.data.improvedContent).toBeTruthy();
  expect(Array.isArray(result.data.highlights)).toBe(true);
});

it("validateOutput strips markdown fences before parsing resume output", () => {
  const raw = "```json\n" + JSON.stringify({
    improvedContent: "Designed scalable APIs serving 1M+ requests/day.",
    highlights: ["Scalable APIs", "1M+ requests/day"],
  }) + "\n```";
  const result = validateOutput(resumeImprovementOutputSchema, raw);
  expect(result.success).toBe(true);
});

it("validateOutput rejects resume output with missing highlights", () => {
  const raw = JSON.stringify({ improvedContent: "Some improved content here." });
  const result = validateOutput(resumeImprovementOutputSchema, raw);
  expect(result.success).toBe(false);
  expect(result.errors.highlights).toBeDefined();
});

it("validateOutput rejects malformed JSON", () => {
  const result = validateOutput(resumeImprovementOutputSchema, "not json at all");
  expect(result.success).toBe(false);
  expect(result.errors._output[0]).toContain("valid JSON");
});

it("validateOutput rejects empty string", () => {
  const result = validateOutput(resumeImprovementOutputSchema, "");
  expect(result.success).toBe(false);
  expect(result.errors._output[0]).toContain("empty");
});

// ── validateOutput — cover letter ──────────────────────────────────────────

it("validateOutput accepts valid cover letter output", () => {
  const raw = JSON.stringify({
    greeting: "Dear Hiring Manager,",
    body: "I am excited to apply for the Software Engineer position. My experience in building scalable systems and leading cross-functional teams aligns well with your requirements.",
    closing: "Sincerely,\nJohn Doe",
  });
  const result = validateOutput(coverLetterOutputSchema, raw);
  expect(result.success).toBe(true);
  expect(result.data.greeting).toBeTruthy();
  expect(result.data.body).toBeTruthy();
  expect(result.data.closing).toBeTruthy();
});

it("validateOutput rejects cover letter with missing body", () => {
  const raw = JSON.stringify({
    greeting: "Dear Hiring Manager,",
    closing: "Sincerely, Jane",
  });
  const result = validateOutput(coverLetterOutputSchema, raw);
  expect(result.success).toBe(false);
  expect(result.errors.body).toBeDefined();
});

// ── buildFormatCorrectionPrompt ────────────────────────────────────────────

it("buildFormatCorrectionPrompt includes schema description", () => {
  const prompt = buildFormatCorrectionPrompt(
    "Write a resume bullet.",
    "This is not JSON",
    '{"improvedContent": "string", "highlights": ["string"]}'
  );
  expect(prompt).toContain("improvedContent");
  expect(prompt).toContain("did not match the required JSON format");
});

it("buildFormatCorrectionPrompt truncates long bad output to 500 chars", () => {
  const longBadOutput = "x".repeat(1000);
  const prompt = buildFormatCorrectionPrompt("task", longBadOutput, "schema");
  const badOutputSection = prompt.split("Previous (malformed) response:")[1];
  expect(badOutputSection.length).toBeLessThanOrEqual(600);
});

// ── validateOutput — interview questions ───────────────────────────────────

it("validateOutput accepts valid interview questions output", () => {
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
  expect(result.success).toBe(true);
  expect(Array.isArray(result.data.questions)).toBe(true);
  expect(result.data.questions.length).toBe(1);
});

it("validateOutput rejects interview questions output with missing explanation", () => {
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
  expect(result.success).toBe(false);
});

it("validateOutput rejects interview questions with wrong options count", () => {
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
  expect(result.success).toBe(false);
});
