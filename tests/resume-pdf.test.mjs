import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createResumePdf } from "../lib/resume/generate-resume-pdf.js";

const completeResume = {
  personalInfo: {
    name: "Jordan Example",
    email: "jordan@example.com",
    phone: "+1 555 0100",
    location: "New York, NY",
    linkedin: "linkedin.com/in/jordan-example",
    github: "github.com/jordan-example",
  },
  summary:
    "Experienced engineer delivering reliable products for growing teams.",
  skills: ["JavaScript", "React", "Node.js"],
  experience: [
    {
      title: "Senior Engineer",
      company: "Example Co.",
      location: "New York, NY",
      startDate: "01/2021",
      endDate: "Present",
      achievements: [
        "Improved service reliability by 30%.",
        "Led a team of five engineers.",
      ],
    },
  ],
  projects: [
    {
      name: "Customer Portal",
      technologies: ["React", "PostgreSQL"],
      description:
        "Built a self-service portal for customer account management.",
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "Example University",
      graduationDate: "05/2020",
    },
  ],
};

async function extractPdfPages(pdf) {
  const bytes = new Uint8Array(pdf.output("arraybuffer"));
  const document = await getDocument({
    data: bytes,
    disableWorker: true,
    useSystemFonts: true,
  }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  await document.destroy();
  return pages;
}

async function extractPdfText(pdf) {
  return (await extractPdfPages(pdf)).join(" ");
}

describe("createResumePdf", () => {
  it("writes selectable text for all major resume sections and contact fields", async () => {
    const pdf = createResumePdf(completeResume, jsPDF);
    const text = await extractPdfText(pdf);

    for (const value of [
      "Jordan Example",
      "jordan@example.com",
      "+1 555 0100",
      "linkedin.com/in/jordan-example",
      "github.com/jordan-example",
      "PROFESSIONAL SUMMARY",
      "SKILLS",
      "JavaScript",
      "PROFESSIONAL EXPERIENCE",
      "Senior Engineer",
      "Improved service reliability by 30%.",
      "PROJECTS",
      "Customer Portal",
      "EDUCATION",
      "Example University",
    ]) {
      expect(text).toContain(value);
    }
  });

  it("handles omitted optional contact links and projects", async () => {
    const { projects, ...resumeWithoutProjects } = completeResume;
    const resume = {
      ...resumeWithoutProjects,
      personalInfo: {
        name: "Taylor Example",
        email: "taylor@example.com",
        phone: "555-0101",
        location: "Boston, MA",
      },
    };
    const text = await extractPdfText(createResumePdf(resume, jsPDF));

    expect(text).toContain("Taylor Example");
    expect(text).not.toContain("linkedin.com");
    expect(text).not.toContain("github.com");
    expect(text).not.toContain("PROJECTS");
  });

  it("preserves accented names and common Unicode punctuation in extracted text", async () => {
    const resume = {
      ...completeResume,
      personalInfo: {
        ...completeResume.personalInfo,
        name: "Zo\u00eb Dvo\u0159\u00e1k \u2014 \u0410\u043d\u0430\u0441\u0442\u0430\u0441\u0438\u044f",
      },
      summary:
        "Built a r\u00e9sum\u00e9 parser \u2022 saved 12% \u2014 earned \u20ac 5.",
    };
    const text = await extractPdfText(createResumePdf(resume, jsPDF));

    expect(text).toContain(
      "Zo\u00eb Dvo\u0159\u00e1k \u2014 \u0410\u043d\u0430\u0441\u0442\u0430\u0441\u0438\u044f",
    );
    expect(text).toContain(
      "a r\u00e9sum\u00e9 parser \u2022 saved 12% \u2014 earned \u20ac 5.",
    );
  });

  it("skips empty sections and tolerates incomplete or malformed optional data", async () => {
    const resume = {
      personalInfo: {
        name: "A. Example",
        email: "",
        phone: null,
        location: "",
      },
      summary: "  ",
      skills: ["", null, {}],
      experience: [null, "invalid", {}],
      projects: [null, { technologies: [], description: "" }],
      education: [null, {}],
    };
    const text = await extractPdfText(createResumePdf(resume, jsPDF));

    expect(text).toContain("A. Example");
    expect(text).not.toContain("PROFESSIONAL SUMMARY");
    expect(text).not.toContain("SKILLS");
    expect(text).not.toContain("PROFESSIONAL EXPERIENCE");
    expect(text).not.toContain("PROJECTS");
    expect(text).not.toContain("EDUCATION");
    await expect(
      extractPdfText(createResumePdf(null, jsPDF)),
    ).resolves.toContain("Resume");
  });

  it("creates multiple non-empty pages for long resumes", async () => {
    const longAchievement =
      "Delivered measurable product improvements across multiple teams. ".repeat(
        90,
      );
    const resume = {
      ...completeResume,
      summary:
        "Product engineer with a record of shipping reliable software. ".repeat(
          24,
        ),
      experience: Array.from({ length: 8 }, (_, index) => ({
        ...completeResume.experience[0],
        title: `Engineer ${index + 1}`,
        achievements: [
          longAchievement,
          `Final achievement for role ${index + 1}.`,
        ],
      })),
    };
    const pages = await extractPdfPages(createResumePdf(resume, jsPDF));

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.trim().length > 0)).toBe(true);
    expect(
      pages.some(
        (page) =>
          page.includes("PROFESSIONAL EXPERIENCE") &&
          page.includes("Engineer 1"),
      ),
    ).toBe(true);
    expect(pages.join(" ")).toContain("Final achievement for role 8.");
  });

  it("allows one long experience achievement to continue across pages", async () => {
    const longAchievement = `Beginning of long achievement. ${"Designed, implemented, and measured system improvements. ".repeat(120)} End of long achievement.`;
    const pages = await extractPdfPages(
      createResumePdf(
        {
          ...completeResume,
          experience: [
            {
              ...completeResume.experience[0],
              achievements: [longAchievement],
            },
          ],
          projects: [],
          education: [],
        },
        jsPDF,
      ),
    );
    const text = pages.join(" ");

    expect(pages.length).toBeGreaterThan(1);
    expect(text).toContain("Beginning of long achievement.");
    expect(text).toContain("End of long achievement.");
  });
});
