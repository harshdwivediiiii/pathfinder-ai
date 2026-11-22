import { notoSansBold, notoSansRegular } from "@/lib/resume/noto-sans-fonts";

const PAGE_MARGIN = 16;
const SECTION_GAP = 5;
const FONT_FAMILY = "NotoSans";

function normalizePdfText(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";

  return String(value)
    .normalize("NFC")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function createResumePdf(data, jsPDFConstructor) {
  if (!jsPDFConstructor) {
    throw new Error("A jsPDF constructor is required.");
  }

  const resume = isRecord(data) ? data : {};
  const doc = new jsPDFConstructor({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });
  doc.addFileToVFS("NotoSans-Regular.ttf", notoSansRegular);
  doc.addFont("NotoSans-Regular.ttf", FONT_FAMILY, "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", notoSansBold);
  doc.addFont("NotoSans-Bold.ttf", FONT_FAMILY, "bold");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const pageBottom = pageHeight - PAGE_MARGIN;
  let y = PAGE_MARGIN;

  const lineHeightFor = (fontSize, gap) => fontSize * 0.42 + gap;

  const addPageIfNeeded = (height) => {
    if (y + height > pageBottom && y > PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const getLines = (
    value,
    { fontSize = 10, bold = false, indent = 0 } = {},
  ) => {
    const text = normalizePdfText(value);
    if (!text) return [];

    doc.setFont(FONT_FAMILY, bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, Math.max(1, contentWidth - indent));
  };

  const writeWrapped = (
    value,
    {
      fontSize = 10,
      bold = false,
      indent = 0,
      gap = 1.2,
      keepWithNext = 0,
      keepBlock = false,
    } = {},
  ) => {
    const lines = getLines(value, { fontSize, bold, indent });
    const lineHeight = lineHeightFor(fontSize, gap);

    lines.forEach((line, index) => {
      const keepCurrentLines =
        index === 0 && keepBlock ? lines.length * lineHeight : lineHeight;
      addPageIfNeeded(keepCurrentLines + (index === 0 ? keepWithNext : 0));
      doc.setFont(FONT_FAMILY, bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.text(line, PAGE_MARGIN + indent, y);
      y += lineHeight;
    });

    return lines;
  };

  const writeSectionHeading = (
    heading,
    firstContent,
    firstContentOptions = {},
  ) => {
    const firstLine = getLines(firstContent, firstContentOptions)[0];
    const firstLineHeight = firstLine
      ? lineHeightFor(
          firstContentOptions.fontSize || 10,
          firstContentOptions.gap ?? 1.2,
        )
      : 0;
    const headingHeight =
      SECTION_GAP + 1.5 + 4 + lineHeightFor(11, 0) + firstLineHeight;

    addPageIfNeeded(headingHeight);
    if (y > PAGE_MARGIN) y += SECTION_GAP;
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(11);
    doc.text(heading, PAGE_MARGIN, y);
    y += 1.5;
    doc.setDrawColor(175, 183, 192);
    doc.setLineWidth(0.25);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 4;
  };

  const personalInfo = isRecord(resume.personalInfo) ? resume.personalInfo : {};
  const contact = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
    personalInfo.github,
  ]
    .map(normalizePdfText)
    .filter(Boolean);

  const name = normalizePdfText(personalInfo.name) || "Resume";
  const nameLines = getLines(name, { fontSize: 20, bold: true });
  nameLines.forEach((line) => {
    addPageIfNeeded(9);
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(20);
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 9;
  });

  if (contact.length) {
    writeWrapped(contact.join(" | "), { fontSize: 9, gap: 1 });
  }

  const summary = normalizePdfText(resume.summary);
  if (summary) {
    writeSectionHeading("PROFESSIONAL SUMMARY", summary);
    writeWrapped(summary);
  }

  const skills = Array.isArray(resume.skills)
    ? resume.skills.map(normalizePdfText).filter(Boolean)
    : [];
  const skillsText = skills.join(" | ");
  if (skillsText) {
    writeSectionHeading("SKILLS", skillsText);
    writeWrapped(skillsText);
  }

  const experience = Array.isArray(resume.experience)
    ? resume.experience.filter((entry) => isRecord(entry))
    : [];
  const experienceEntries = experience
    .map((entry) => {
      const title = normalizePdfText(entry.title);
      const company = normalizePdfText(entry.company);
      const location = normalizePdfText(entry.location);
      const dates = [entry.startDate, entry.endDate]
        .map(normalizePdfText)
        .filter(Boolean)
        .join(" - ");
      const employer = [company, location].filter(Boolean).join(" | ");
      const metadata = [employer, dates].filter(Boolean).join(" | ");
      const achievements = Array.isArray(entry.achievements)
        ? entry.achievements.map(normalizePdfText).filter(Boolean)
        : [];

      return { title, metadata, achievements };
    })
    .filter(
      (entry) => entry.title || entry.metadata || entry.achievements.length,
    );

  if (experienceEntries.length) {
    const firstEntry = experienceEntries[0];
    const firstContent =
      firstEntry.title || firstEntry.metadata || firstEntry.achievements[0];
    writeSectionHeading("PROFESSIONAL EXPERIENCE", firstContent, {
      bold: Boolean(firstEntry.title),
    });

    experienceEntries.forEach(({ title, metadata, achievements }) => {
      const nextLine = metadata || achievements[0] || "";
      const nextHeight = nextLine
        ? lineHeightFor(metadata ? 9 : 10, metadata ? 1.2 : 1)
        : 0;
      if (title)
        writeWrapped(title, {
          bold: true,
          keepWithNext: nextHeight,
          keepBlock: true,
        });
      if (metadata) writeWrapped(metadata, { fontSize: 9 });
      achievements.forEach((achievement) => {
        writeWrapped(`- ${achievement}`, { indent: 3, gap: 1 });
      });
      y += 2;
    });
  }

  const projects = Array.isArray(resume.projects)
    ? resume.projects.filter((entry) => isRecord(entry))
    : [];
  const projectEntries = projects
    .map((entry) => {
      const name = normalizePdfText(entry.name);
      const technologies = Array.isArray(entry.technologies)
        ? entry.technologies.map(normalizePdfText).filter(Boolean)
        : [];
      const description = normalizePdfText(entry.description);
      return { name, technologies, description };
    })
    .filter(
      (entry) => entry.name || entry.technologies.length || entry.description,
    );

  if (projectEntries.length) {
    const firstEntry = projectEntries[0];
    const firstContent =
      firstEntry.name || firstEntry.technologies[0] || firstEntry.description;
    writeSectionHeading("PROJECTS", firstContent, {
      bold: Boolean(firstEntry.name),
    });

    projectEntries.forEach(({ name, technologies, description }) => {
      const firstDetails = technologies.join(", ") || description;
      const detailsLines = getLines(firstDetails, {
        fontSize: technologies.length ? 9 : 10,
      });
      const firstDetailsHeight = detailsLines.length
        ? lineHeightFor(technologies.length ? 9 : 10, 1.2)
        : 0;
      if (name)
        writeWrapped(name, {
          bold: true,
          keepWithNext: firstDetailsHeight,
          keepBlock: true,
        });
      if (technologies.length)
        writeWrapped(technologies.join(", "), { fontSize: 9 });
      if (description) writeWrapped(description);
      y += 2;
    });
  }

  const education = Array.isArray(resume.education)
    ? resume.education.filter((entry) => isRecord(entry))
    : [];
  const educationEntries = education
    .map((entry) => ({
      degree: normalizePdfText(entry.degree),
      school: normalizePdfText(entry.school),
      graduationDate: normalizePdfText(entry.graduationDate),
    }))
    .filter((entry) => entry.degree || entry.school || entry.graduationDate);

  if (educationEntries.length) {
    const firstEntry = educationEntries[0];
    const firstContent =
      firstEntry.degree ||
      [firstEntry.school, firstEntry.graduationDate]
        .filter(Boolean)
        .join(" | ");
    writeSectionHeading("EDUCATION", firstContent, {
      bold: Boolean(firstEntry.degree),
    });
    educationEntries.forEach(({ degree, school, graduationDate }) => {
      const metadata = [school, graduationDate].filter(Boolean).join(" | ");
      if (degree)
        writeWrapped(degree, {
          bold: true,
          keepWithNext: metadata ? lineHeightFor(10, 1.2) : 0,
          keepBlock: true,
        });
      if (metadata) writeWrapped(metadata);
    });
  }

  return doc;
}
