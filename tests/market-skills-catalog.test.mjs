import { describe, expect, it } from "vitest";
import {
  MARKET_SKILLS_CATALOG_VERSION,
  resolveIndustryFamily,
  resolveMarketSkills,
  resolveRoleFamily,
} from "../lib/ai/market-skills-catalog.js";

describe("market skills catalog", () => {
  it("classifies role and industry families", () => {
    expect(resolveRoleFamily("Embedded Firmware Engineer")).toBe("embedded");
    expect(resolveRoleFamily("Front-End Developer")).toBe("frontend");
    expect(resolveIndustryFamily("Healthcare Devices")).toBe("healthcare");
    expect(resolveIndustryFamily("Higher Education")).toBe("education");
  });

  it("returns different curated skills for different role/industry pairs", () => {
    const embeddedHealthcare = resolveMarketSkills({
      role: "Embedded Engineer",
      industry: "Healthcare",
    });
    const frontendEducation = resolveMarketSkills({
      role: "Front-End Developer",
      industry: "Education",
    });

    expect(embeddedHealthcare.available).toBe(true);
    expect(frontendEducation.available).toBe(true);
    expect(embeddedHealthcare.isRealTime).toBe(false);
    expect(frontendEducation.isRealTime).toBe(false);
    expect(embeddedHealthcare.catalogVersion).toBe(MARKET_SKILLS_CATALOG_VERSION);
    expect(embeddedHealthcare.trending_skills).toContain("IEC 62304");
    expect(frontendEducation.trending_skills).toContain("Learning Management System APIs");
    expect(embeddedHealthcare.trending_skills).not.toEqual(frontendEducation.trending_skills);
  });

  it("prefers industry insight snapshots when present", () => {
    const market = resolveMarketSkills({
      role: "Software Engineer",
      industry: "Healthcare",
      industryInsight: {
        recommendedSkills: ["FHIR", "HIPAA logging"],
        topSkills: ["TypeScript"],
        marketOutlook: "Positive",
      },
    });

    expect(market.source).toBe("industry_insight");
    expect(market.trending_skills).toEqual(["FHIR", "HIPAA logging", "TypeScript"]);
    expect(market.isRealTime).toBe(false);
  });

  it("reports unavailable when role or industry is missing", () => {
    expect(resolveMarketSkills({ role: "", industry: "Tech" }).available).toBe(false);
    expect(resolveMarketSkills({ role: "Engineer", industry: "" }).available).toBe(false);
  });
});
