function safeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizePortfolioContent(content) {
  if (!content) return content;

  const normalized = { ...content };

  if (Array.isArray(content.projects)) {
    normalized.projects = content.projects.map((proj) => {
      let techStack = proj.techStack;
      if (typeof techStack === "string") {
        techStack = techStack.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (!Array.isArray(techStack)) {
        techStack = [];
      } else {
        techStack = techStack.filter(Boolean);
      }

      return {
        ...proj,
        link: safeExternalUrl(proj.link),
        image: safeExternalUrl(proj.image),
        techStack,
      };
    });
  }

  return normalized;
}
