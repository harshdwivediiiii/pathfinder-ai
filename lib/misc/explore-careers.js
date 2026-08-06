import { MOCK_CAREERS } from "@/lib/misc/mock-careers";

function normalizeSkill(skill) {
  return String(skill || "")
    .toLowerCase()
    .trim();
}

function buildUserSkillSet(skills = []) {
  return new Set(
    (Array.isArray(skills) ? skills : [])
      .map(normalizeSkill)
      .filter(Boolean)
  );
}

/** Finite 0–100 match scores only; rejects NaN / Infinity / out-of-range. */
export function isValidMatchScore(score) {
  return Number.isFinite(score) && score >= 0 && score <= 100;
}

function titleTokens(value) {
  return normalizeSkill(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

/**
 * Score a curated career against the visitor's profile skills / target role.
 * Does not reuse hard-coded mock match percentages.
 */
export function scoreCareerAgainstProfile(career, { skills = [], targetRole = "" } = {}) {
  const userSkills = buildUserSkillSet(skills);
  const careerSkills = Array.isArray(career.skills) ? career.skills : [];

  const matchedSkills = careerSkills.filter((skill) =>
    userSkills.has(normalizeSkill(skill))
  );
  const missingSkills = careerSkills.filter(
    (skill) => !userSkills.has(normalizeSkill(skill))
  );

  const skillRatio =
    careerSkills.length === 0
      ? 0
      : matchedSkills.length / careerSkills.length;

  let matchScore = Math.round(skillRatio * 100);

  const role = normalizeSkill(targetRole);
  if (role) {
    const careerTitle = normalizeSkill(career.title);
    if (careerTitle.includes(role) || role.includes(careerTitle)) {
      matchScore += 15;
    } else {
      const roleParts = titleTokens(targetRole);
      const titleParts = new Set(titleTokens(career.title));
      const overlap = roleParts.filter((part) => titleParts.has(part)).length;
      if (overlap > 0) {
        matchScore += Math.min(12, overlap * 6);
      }
    }
  }

  matchScore = Math.max(0, Math.min(matchScore, 99));

  return {
    ...career,
    matchScore,
    personalizedScore: matchScore,
    matchedSkills,
    missingSkills,
    isPersonalized: true,
  };
}

export function asBrowseCareers(careers = MOCK_CAREERS) {
  return careers.map((career) => ({
    ...career,
    matchScore: null,
    personalizedScore: null,
    matchedSkills: [],
    missingSkills: career.skills || [],
    isPersonalized: false,
  }));
}

export function rankExploreCareers(careers = MOCK_CAREERS, profile) {
  const skills = profile?.skills || [];
  const targetRole = profile?.targetRole || "";
  const hasProfileSignal =
    buildUserSkillSet(skills).size > 0 || Boolean(normalizeSkill(targetRole));

  if (!hasProfileSignal) {
    return asBrowseCareers(careers);
  }

  return careers
    .map((career) => scoreCareerAgainstProfile(career, { skills, targetRole }))
    .sort((a, b) => b.personalizedScore - a.personalizedScore);
}
