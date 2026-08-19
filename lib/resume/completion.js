/**
 * Resume Completion Helper
 *
 * Analyzes the stored resume Markdown and determines which
 * resume sections have been completed.
 *
 * This file is intentionally framework-free:
 * - No React
 * - No Next.js APIs
 * - No Prisma
 * - No authentication
 */

/**
 * Check whether the resume contains the contact information block.
 *
 * The resume format uses contact emojis such as:
 * 📧 Email
 * 📱 Phone
 * 💼 LinkedIn
 * 🐦 Twitter/X
 *
 * It may also contain the centered HTML block generated
 * by the existing resume helper.
 */
function hasContactInformation(content) {
  if (!content) return false;

  const contactMarkers = ["📧", "📱", "💼", "🐦"];

  const hasEmojiContact = contactMarkers.some((marker) =>
    content.includes(marker)
  );

  const hasCenteredContactBlock = /<div\s+align=["']center["']>/i.test(
    content
  );

  return hasEmojiContact || hasCenteredContactBlock;
}

/**
 * Check whether a Markdown section header exists.
 *
 * We intentionally match lines beginning with `## `
 * because the resume builder stores sections using
 * Markdown level-two headers.
 */
function hasSection(content, heading) {
  if (!content) return false;

  const lines = content.split(/\r?\n/);

  return lines.some((line) => {
    const normalizedLine = line.trim().toLowerCase();

    return normalizedLine === heading.toLowerCase();
  });
}

/**
 * Calculate resume completion information.
 *
 * Required sections:
 * - Contact
 * - Professional Summary
 * - Skills
 * - Work Experience
 * - Education
 *
 * Optional section:
 * - Projects
 *
 * Projects are displayed in the checklist but do not prevent
 * the resume from reaching 100%.
 *
 * @param {string|null|undefined} content
 * @returns {{
 *   percentage: number,
 *   completedCount: number,
 *   requiredCount: number,
 *   sections: Array<{
 *     key: string,
 *     label: string,
 *     complete: boolean,
 *     optional: boolean,
 *     section: string
 *   }>
 * }|null}
 */
export function getResumeCompletion(content) {
  if (!content || typeof content !== "string" || !content.trim()) {
    return null;
  }

  const sections = [
    {
      key: "contact",
      label: "Contact Information",
      complete: hasContactInformation(content),
      optional: false,
      section: "contact",
    },
    {
      key: "summary",
      label: "Professional Summary",
      // Canonical Markdown header used by the resume builder.
      complete: hasSection(content, "## Professional Summary"),
      optional: false,
      section: "professional-summary",
    },
    {
      key: "skills",
      label: "Skills",
      // Canonical Markdown header used by the resume builder.
      complete: hasSection(content, "## Skills"),
      optional: false,
      section: "skills",
    },
    {
      key: "work-experience",
      label: "Work Experience",
      // Canonical Markdown header used by the resume builder.
      complete: hasSection(content, "## Work Experience"),
      optional: false,
      section: "work-experience",
    },
    {
      key: "education",
      label: "Education",
      // Canonical Markdown header used by the resume builder.
      complete: hasSection(content, "## Education"),
      optional: false,
      section: "education",
    },
    {
      key: "projects",
      label: "Projects",
      // Projects are optional and therefore do not affect percentage.
      complete: hasSection(content, "## Projects"),
      optional: true,
      section: "projects",
    },
  ];

  const requiredSections = sections.filter(
    (section) => !section.optional
  );

  const completedCount = requiredSections.filter(
    (section) => section.complete
  ).length;

  const requiredCount = requiredSections.length;

  const percentage =
    requiredCount === 0
      ? 0
      : Math.round((completedCount / requiredCount) * 100);

  return {
    percentage,
    completedCount,
    requiredCount,
    sections,
  };
}

export default getResumeCompletion;