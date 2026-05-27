import { z } from "zod";

export const resumeSaveSchema = z.object({
  content: z.string().min(10, "Resume context too minimal to process.").max(45000, "Content exceeds standard bounds."),
});

export const resumeImprovementSchema = z.object({
  current: z.string().min(2, "Content too short to optimize.").max(4000, "Paragraph segment is too large to scan."),
  type: z.enum(["workexperience", "education", "projects", "summary", "skills", "experience"], {
    errorMap: () => ({ message: "Invalid optimization criteria type provided." })
  }),
});

export const atsAnalysisSchema = z.object({
  // Job title and company name are optional in the UI. Accept empty strings
  // but validate presence/length when non-empty.
  jobTitle: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().min(2, "Job title is required.").max(100)
  ).optional(),
  companyName: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().min(2, "Company name is required.").max(100)
  ).optional(),
  jobDescription: z.string().min(10, "Job description is too sparse.").max(15000, "Target description is excessively long."),
  resumeContent: z.string().min(10, "Resume transcript content is required.").max(45000, "Resume file size input bounds exceeded."),
});
