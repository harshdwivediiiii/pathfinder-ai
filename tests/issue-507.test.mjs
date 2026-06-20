import { expect, it, vi } from "vitest";
import { generateCacheKey } from "../lib/cache/utils.js";
import { buildUserProfileContext } from "../lib/ai-context.js";

it("different users with same inputs have different cache keys for resume improvement", () => {
  const userA = {
    id: "user-a-db-id",
    name: "User A",
    industry: "Tech",
  };
  const userB = {
    id: "user-b-db-id",
    name: "User B",
    industry: "Tech",
  };

  const current = "Software Engineer at Google";
  const type = "experience";

  const keyA = generateCacheKey("improve", userA.id, buildUserProfileContext(userA), current, type);
  const keyB = generateCacheKey("improve", userB.id, buildUserProfileContext(userB), current, type);

  expect(keyA).not.toBe(keyB);
});

it("different profile contexts for same user result in different cache keys", () => {
  const user = {
    id: "user-id",
    name: "User",
    industry: "Tech",
    skills: ["React"],
  };

  const current = "Dev";
  const type = "summary";

  const key1 = generateCacheKey("improve", user.id, buildUserProfileContext(user), current, type);

  const updatedUser = { ...user, skills: ["React", "Node.js"] };
  const key2 = generateCacheKey("improve", updatedUser.id, buildUserProfileContext(updatedUser), current, type);

  expect(key1).not.toBe(key2);
});

it("ATS cache key is isolated by user and profile context", () => {
  const userA = { id: "user-a", industry: "Tech" };
  const userB = { id: "user-b", industry: "Tech" };
  const resume = "Resume content";
  const job = "Job description";

  const keyA = generateCacheKey("ats", userA.id, buildUserProfileContext(userA), resume, job);
  const keyB = generateCacheKey("ats", userB.id, buildUserProfileContext(userB), resume, job);

  expect(keyA).not.toBe(keyB);
});
