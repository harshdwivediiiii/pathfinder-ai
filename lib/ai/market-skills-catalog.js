/**
 * Versioned curated market-skills catalog for roadmap adaptation.
 *
 * This is NOT a live job-board feed. Entries are reviewed snapshots keyed by
 * role family + industry family. Bump MARKET_SKILLS_CATALOG_VERSION when the
 * dataset changes so adaptations remain auditable.
 */
export const MARKET_SKILLS_CATALOG_VERSION = "2026.08.1";

const ROLE_ALIASES = [
  { family: "frontend", match: /front[\s-]?end|ui engineer|react developer|web developer/i },
  { family: "backend", match: /back[\s-]?end|api engineer|node developer|server engineer/i },
  { family: "embedded", match: /embedded|firmware|iot|rtos|electronics engineer/i },
  { family: "data", match: /data scientist|data engineer|ml engineer|machine learning|analytics/i },
  { family: "product", match: /product manager|product owner|pm\b/i },
  { family: "software", match: /software|developer|engineer|sde|programmer/i },
];

const INDUSTRY_ALIASES = [
  { family: "healthcare", match: /health|medical|pharma|biotech|clinical/i },
  { family: "education", match: /education|edtech|learning|university|school/i },
  { family: "finance", match: /finance|fintech|banking|trading|insurance/i },
  { family: "technology", match: /tech|software|saas|information|internet/i },
];

/**
 * Curated snapshots: roleFamily -> industryFamily -> skills payload
 */
const CATALOG = {
  embedded: {
    healthcare: {
      trending_skills: [
        "IEC 62304",
        "Medical device RTOS",
        "C / C++ for safety-critical systems",
        "HL7 / FHIR device integration",
        "Hardware-in-the-loop testing",
      ],
      declining_skills: ["Bare-metal prototypes without traceability", "Ad-hoc serial protocols"],
      market_shift:
        "Healthcare embedded roles emphasize safety standards, device interoperability, and regulated release processes.",
    },
    education: {
      trending_skills: [
        "Classroom IoT prototypes",
        "Low-power microcontrollers",
        "Bluetooth LE for learning kits",
        "Python for hardware labs",
        "Accessibility-minded device UX",
      ],
      declining_skills: ["One-off Arduino demos without documentation"],
      market_shift:
        "Education-focused embedded work prioritizes teachable kits, low cost, and safe classroom deployment.",
    },
    default: {
      trending_skills: ["Rust for embedded", "Zephyr RTOS", "Edge ML", "CAN / industrial protocols"],
      declining_skills: ["Unsupported legacy toolchains"],
      market_shift: "General embedded demand skews toward reliable RTOS skills and edge intelligence.",
    },
  },
  frontend: {
    healthcare: {
      trending_skills: [
        "WCAG accessibility",
        "FHIR-aware UI patterns",
        "Secure PHI handling in SPAs",
        "React + audit logging",
        "Design systems for clinical workflows",
      ],
      declining_skills: ["jQuery widgets", "Unscoped localStorage for patient data"],
      market_shift:
        "Healthcare front-end work centers on accessibility, auditability, and careful handling of sensitive data.",
    },
    education: {
      trending_skills: [
        "Learning Management System APIs",
        "Accessible interactive content",
        "React / Next.js for courseware",
        "Offline-first Progressive Web Apps",
        "Learning analytics dashboards",
      ],
      declining_skills: ["Flash-era course players", "Non-responsive lesson layouts"],
      market_shift:
        "Education front-end roles favor accessible course experiences, LMS integrations, and lightweight analytics.",
    },
    default: {
      trending_skills: ["React", "TypeScript", "Next.js", "Design systems", "Web performance"],
      declining_skills: ["jQuery", "AngularJS"],
      market_shift: "Front-end hiring still rewards component systems, TypeScript, and performance literacy.",
    },
  },
  backend: {
    healthcare: {
      trending_skills: ["FHIR APIs", "HIPAA-aligned logging", "Event-driven integrations", "PostgreSQL", "OAuth 2.0"],
      declining_skills: ["Unencrypted PHI queues"],
      market_shift: "Healthcare backends need interoperable clinical APIs and strict access controls.",
    },
    education: {
      trending_skills: ["LTI integrations", "Roster sync APIs", "Node.js", "PostgreSQL", "Content delivery caching"],
      declining_skills: ["Monolithic legacy SIS scrapers"],
      market_shift: "EdTech backends emphasize standards-based LMS/SIS integrations and reliable content delivery.",
    },
    default: {
      trending_skills: ["Go", "Kubernetes", "Event-driven architecture", "PostgreSQL", "Observability"],
      declining_skills: ["Unmaintained SOAP services"],
      market_shift: "Backend demand favors cloud-native services, typed APIs, and operational excellence.",
    },
  },
  data: {
    healthcare: {
      trending_skills: ["Clinical NLP", "OMOP / common data models", "Privacy-preserving ML", "Python", "Spark"],
      declining_skills: ["Unreviewed identifiable training sets"],
      market_shift: "Healthcare data roles emphasize privacy, clinical vocabularies, and regulated model ops.",
    },
    education: {
      trending_skills: ["Learning analytics", "Student success modeling", "Python", "dbt", "Dashboard storytelling"],
      declining_skills: ["Vanity metrics without intervention design"],
      market_shift: "Education analytics focuses on learner outcomes and actionable dashboarding.",
    },
    default: {
      trending_skills: ["LLMOps", "Vector databases", "PyTorch", "dbt", "Apache Iceberg"],
      declining_skills: ["Hadoop MapReduce-only pipelines"],
      market_shift: "Data roles continue shifting toward modern lakehouses and applied generative AI ops.",
    },
  },
  product: {
    healthcare: {
      trending_skills: ["Clinical workflow mapping", "Regulatory awareness", "Outcome metrics", "Discovery interviewing"],
      declining_skills: ["Feature factories without clinician validation"],
      market_shift: "Healthcare PMs need workflow empathy and compliance-aware discovery.",
    },
    education: {
      trending_skills: ["Pedagogy-informed discovery", "Adoption metrics", "Teacher co-design", "Accessibility requirements"],
      declining_skills: ["Engagement vanity metrics"],
      market_shift: "EdTech product work rewards educator partnership and measurable learning impact.",
    },
    default: {
      trending_skills: ["Opportunity solution trees", "Experiment design", "AI product sense", "Stakeholder storytelling"],
      declining_skills: ["Roadmaps without evidence"],
      market_shift: "Product roles emphasize evidence-based prioritization and AI feature judgment.",
    },
  },
  software: {
    healthcare: {
      trending_skills: ["Secure SDLC", "FHIR basics", "Cloud compliance", "TypeScript", "Automated testing"],
      declining_skills: ["Shadow IT integrations"],
      market_shift: "Healthcare software generalists need security, interoperability awareness, and test discipline.",
    },
    education: {
      trending_skills: ["Accessible full-stack delivery", "LMS APIs", "TypeScript", "Observability", "Content workflows"],
      declining_skills: ["Inaccessible UI patterns"],
      market_shift: "Education software roles blend full-stack delivery with accessibility and LMS literacy.",
    },
    finance: {
      trending_skills: ["Risk-aware engineering", "Streaming data", "Go", "Kubernetes", "Fraud detection basics"],
      declining_skills: ["Unreviewed spreadsheet-driven releases"],
      market_shift: "FinTech software work stresses reliability, streaming systems, and controls.",
    },
    default: {
      trending_skills: ["TypeScript", "Cloud fundamentals", "System design", "AI-assisted development", "Kubernetes"],
      declining_skills: ["jQuery", "AngularJS", "Legacy PHP monoliths"],
      market_shift: "General software roles still reward cloud fluency, strong typing, and AI-augmented delivery.",
    },
  },
};

export function resolveRoleFamily(role = "") {
  for (const entry of ROLE_ALIASES) {
    if (entry.match.test(role)) {
      return entry.family;
    }
  }
  return "software";
}

export function resolveIndustryFamily(industry = "") {
  for (const entry of INDUSTRY_ALIASES) {
    if (entry.match.test(industry)) {
      return entry.family;
    }
  }
  return "default";
}

function uniqueSkills(skills = []) {
  const seen = new Set();
  const result = [];
  for (const skill of skills) {
    const normalized = String(skill || "").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

/**
 * Resolve market skills for a role/industry pair.
 * Prefers IndustryInsight snapshots when present; otherwise uses the curated catalog.
 */
export function resolveMarketSkills({ role, industry, industryInsight } = {}) {
  const trimmedRole = String(role || "").trim();
  const trimmedIndustry = String(industry || "").trim();

  if (!trimmedRole || !trimmedIndustry) {
    return {
      available: false,
      reason: "Role and industry are required to resolve market skills.",
    };
  }

  const insightSkills = uniqueSkills([
    ...(industryInsight?.recommendedSkills || []),
    ...(industryInsight?.topSkills || []),
  ]);

  if (insightSkills.length > 0) {
    return {
      available: true,
      source: "industry_insight",
      sourceLabel: "PathFinder industry insight snapshot",
      catalogVersion: MARKET_SKILLS_CATALOG_VERSION,
      role: trimmedRole,
      industry: trimmedIndustry,
      roleFamily: resolveRoleFamily(trimmedRole),
      industryFamily: resolveIndustryFamily(trimmedIndustry),
      trending_skills: insightSkills,
      declining_skills: [],
      market_shift: industryInsight?.marketOutlook
        ? `Industry outlook: ${industryInsight.marketOutlook}. Skills drawn from the stored insight snapshot for ${trimmedIndustry}.`
        : `Skills drawn from the stored industry insight snapshot for ${trimmedIndustry}.`,
      isRealTime: false,
    };
  }

  const roleFamily = resolveRoleFamily(trimmedRole);
  const industryFamily = resolveIndustryFamily(trimmedIndustry);
  const roleCatalog = CATALOG[roleFamily];
  const entry = roleCatalog?.[industryFamily] || roleCatalog?.default;

  if (!entry?.trending_skills?.length) {
    return {
      available: false,
      reason: `No curated market-skills entry for role "${trimmedRole}" in industry "${trimmedIndustry}".`,
      catalogVersion: MARKET_SKILLS_CATALOG_VERSION,
      roleFamily,
      industryFamily,
    };
  }

  return {
    available: true,
    source: "curated_catalog",
    sourceLabel: `Curated market-skills catalog ${MARKET_SKILLS_CATALOG_VERSION}`,
    catalogVersion: MARKET_SKILLS_CATALOG_VERSION,
    role: trimmedRole,
    industry: trimmedIndustry,
    roleFamily,
    industryFamily,
    trending_skills: entry.trending_skills,
    declining_skills: entry.declining_skills || [],
    market_shift: entry.market_shift,
    isRealTime: false,
  };
}
