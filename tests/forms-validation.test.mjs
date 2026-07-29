import { expect, it } from "vitest";

import {
  chatPromptSchema,
  conversationCreateSchema,
  messageCreateSchema,
  quizResultSaveSchema,
  userProfileSchema,
} from "../lib/schemas/forms.js";
import { validateId } from "@/lib/ai/validate.js";

it("rejects empty chat prompts", () => {
  const result = chatPromptSchema.safeParse({ prompt: "" });

  expect(result.success).toBe(false);
});

it("accepts conversation creation payloads with optional first messages", () => {
  const result = conversationCreateSchema.safeParse({
    title: "General",
    firstMessage: { content: "Hello there" },
  });

  expect(result.success).toBe(true);
});

it("rejects invalid message roles", () => {
  const result = messageCreateSchema.safeParse({
    role: "assistant",
    content: "Hello",
  });

  expect(result.success).toBe(false);
});

it("rejects quiz results with mismatched answer counts", () => {
  const result = quizResultSaveSchema.safeParse({
    questions: [
      {
        question: "What is polymorphism?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "It is the ability of objects to take many forms.",
      },
    ],
    answers: [],
    score: 80,
    category: "Technical",
  });

  expect(result.success).toBe(false);
});

it("accepts user profile payloads with optional fields", () => {
  const result = userProfileSchema.safeParse({
    industry: "Healthcare",
    currentRole: "Nurse",
    targetRole: null,
    careerGoals: "Move into care leadership",
    experience: 5,
    bio: "Focused on patient outcomes.",
    skills: ["Empathy", "Documentation"],
  });

  expect(result.success).toBe(true);
});

it("rejects empty trimmed IDs", () => {
  const result = validateId("   ");

  expect(result.success).toBe(false);
  expect(result.errors.id[0]).toContain("required");
});