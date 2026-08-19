import { describe, expect, it } from "vitest";

import { onboardingSchema } from "../app/lib/schema.js";
import { userProfileSchema } from "../lib/schemas/forms.js";

describe("onboardingSchema", () => {
  const validPayload = {
    industry: "technology",
    subIndustry: "AI",
    currentRole: "Full Stack Developer",
    targetRole: "Senior Backend Engineer",
    careerGoals: "Lead teams",
    bio: "Focused on scalable systems.",
    experience: "5",
    skills: "React, Python, UI Design",
  };

  it("accepts a valid payload and transforms experience and skills", () => {
    const result = onboardingSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
    expect(result.data.experience).toBe(5);
    expect(result.data.skills).toEqual(["React", "Python", "UI Design"]);
  });

  it("reports a friendly error when experience is left blank", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, experience: "" });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Experience is required");
  });

  it("reports a friendly error for non-numeric experience", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, experience: "abc" });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Experience must be a valid number");
  });

  it("reports a friendly error when skills are left blank", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, skills: "" });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Skills are required");
  });

  it("rejects an empty subIndustry selection", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, subIndustry: "" });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Please select a specialization");
  });
});

describe("userProfileSchema", () => {
  it("rejects an empty-string experience instead of silently accepting it", () => {
    const result = userProfileSchema.safeParse({
      industry: "Healthcare",
      currentRole: "Nurse",
      targetRole: null,
      careerGoals: "Move into care leadership",
      experience: "",
      bio: "Focused on patient outcomes.",
      skills: ["Empathy"],
    });

    expect(result.success).toBe(false);
  });

  it("still allows absent experience and skills for partial profile updates", () => {
    const result = userProfileSchema.safeParse({
      industry: "Healthcare",
      currentRole: "Nurse",
      targetRole: null,
      careerGoals: null,
      experience: null,
      bio: null,
      skills: [],
    });

    expect(result.success).toBe(true);
  });
});
