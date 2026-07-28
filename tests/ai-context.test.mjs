import { expect, it } from "vitest";

import {
  buildConversationContext,
  buildUserProfileContext,
} from "@/lib/ai/ai-context.js";

it("buildUserProfileContext formats the expected profile fields", () => {
  const context = buildUserProfileContext({
    name: "Avery",
    currentRole: "Software Engineer",
    industry: "Healthcare Technology",
    experience: 4,
    targetRole: "Senior Backend Engineer",
    skills: ["Node.js", "PostgreSQL", "React"],
    careerGoals: "Move into platform engineering",
  });

  expect(context).toContain("User Profile Context:");
  expect(context).toContain("Name: Avery");
  expect(context).toContain("Current Role: Software Engineer");
  expect(context).toContain("Industry: Healthcare Technology");
  expect(context).toContain("Experience: 4 years");
  expect(context).toContain("Target Role: Senior Backend Engineer");
  expect(context).toContain("Skills: Node.js, PostgreSQL, React");
  expect(context).toContain("Career Goals: Move into platform engineering");
});

it("buildConversationContext keeps only the last three turns", () => {
  const { context, debug } = buildConversationContext([
    { role: "user", content: "Turn 1 user" },
    { role: "assistant", content: "Turn 1 assistant" },
    { role: "user", content: "Turn 2 user" },
    { role: "assistant", content: "Turn 2 assistant" },
    { role: "user", content: "Turn 3 user" },
    { role: "assistant", content: "Turn 3 assistant" },
    { role: "user", content: "Turn 4 user" },
    { role: "assistant", content: "Turn 4 assistant" },
  ]);

  expect(context).toContain("Recent Conversation Turns:");
  expect(context).not.toContain("Turn 1 user");
  expect(context).toContain("Turn 2 user");
  expect(context).toContain("Turn 3 user");
  expect(context).toContain("Turn 4 user");
  expect(debug.turns).toHaveLength(3);
});