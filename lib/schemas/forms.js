import { z } from "zod";
import { URL_FETCH_MAX_LENGTH } from "../input-limits.js";

const optionalString = (schema) =>
  z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    schema.optional().nullable()
  );

const requiredString = (schema) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema
  );

const quizQuestionSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).length(4),
  correctAnswer: z.string().min(1).max(200),
  explanation: z.string().min(1).max(500),
}).strict();

const safeUrlRefinement = (val) => {
  if (!val) return true;
  try {
    const u = new URL(val);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export const chatPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required.").max(8192, "Prompt is too long."),
}).strict();

export const coverLetterInputSchema = z.object({
  jobTitle: requiredString(z.string().min(2, "Job title is required.").max(100, "Job title is too long.")),
  companyName: requiredString(z.string().min(2, "Company name is required.").max(100, "Company name is too long.")),
  jobDescription: requiredString(z.string().min(10, "Job description is required.").max(15000, "Job description is too long.")),
}).strict();

export const quizCategorySchema = z.object({
  category: z.enum(["Technical", "Behavioral", "Situational", "Industry Knowledge"], {
    errorMap: () => ({ message: "Invalid quiz category provided." }),
  }),
}).strict();

export const quizResultSaveSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1, "At least one question is required.").max(20, "Too many questions provided."),
  answers: z.array(z.string().min(1).max(50000)).min(1, "At least one answer is required.").max(20, "Too many answers provided."),
  category: z.string().min(1, "Category is required.").max(100, "Category is too long."),
}).strict().superRefine((data, ctx) => {
  if (data.questions.length !== data.answers.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["answers"],
      message: "Answers must match the number of questions.",
    });
  }
});

export const quizResultSaveSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID format."),
  answers: z.array(z.string().min(1).max(50000)).min(1, "At least one answer is required.").max(20, "Too many answers provided."),
  category: z.string().min(1, "Category is required.").max(100, "Category is too long."),
}).strict();

export const userProfileSchema = z.object({
  industry: requiredString(z.string().min(2, "Industry is required.").max(100, "Industry is too long.")),
  currentRole: optionalString(z.string().min(2, "Current role is too short.").max(100, "Current role is too long.")),
  targetRole: optionalString(z.string().min(2, "Target role is too short.").max(100, "Target role is too long.")),
  careerGoals: optionalString(z.string().max(1000, "Career goals are too long.")),
  experience: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z.number().int("Experience must be a whole number.").min(0, "Experience must be at least 0.").max(50, "Experience must be 50 or less.").optional().nullable()
  ),
  bio: optionalString(z.string().max(1000, "Bio is too long.")),
  skills: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      return value;
    },
    z.array(z.string().min(1).max(50)).max(20, "Too many skills provided.").optional().nullable()
  ),
}).strict();

export const userSettingsSchema = z.object({
  notifications: z.boolean(),
  emailAlerts: z.boolean(),
}).strict();

export const conversationCreateSchema = z.object({
  title: z.string().trim().max(200, "Conversation title is too long.").optional(),
  firstMessage: z.object({
    content: z.string().trim().min(1, "First message is required.").max(50000, "First message is too long."),
  }).strict().optional(),
}).strict();

export const messageCreateSchema = z.object({
  role: z.enum(["user", "model"], {
    errorMap: () => ({ message: "Invalid message role." }),
  }),
  content: z.string().trim().min(1, "Message content is required.").max(50000, "Message content is too long."),
}).strict();

export const messageUpdateSchema = z.object({
  content: z.string().trim().min(1, "Message content is required.").max(50000, "Message content is too long."),
}).strict();

export const userPreferencesSchema = z.object({
  saveChatHistory: z.boolean(),
}).strict();

export const conversationSearchSchema = z.object({
  q: z.string().trim().min(1, "Search query is required.").max(200, "Search query is too long."),
}).strict();

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

export const resumeMatchSchema = z.object({
  resumeContent: z.string().min(10, "Resume content is required.").max(45000, "Resume is too long."),
  jobDescription: z.string().min(10, "Job description is required.").max(15000, "Job description is too long."),
  jobTitle: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().max(200, "Job title is too long.").optional()
  ),
  companyName: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().max(200, "Company name is too long.").optional()
  ),
});

export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Online Assessment (OA)",
  "Interview",
  "Rejected",
  "Offer",
];

export const jobApplicationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(150, "Company name is too long."),
  jobTitle: z.string().trim().min(1, "Job title is required.").max(150, "Job title is too long."),
  status: z.enum(JOB_STATUSES).default("Saved"),
  url: optionalString(z.string().url("Must be a valid URL").max(500, "URL is too long.").refine(safeUrlRefinement, "Only HTTP/HTTPS URLs are permitted")),
  salary: optionalString(z.string().max(100, "Salary format too long.")),
  location: optionalString(z.string().max(100, "Location too long.")),
  notes: optionalString(z.string().max(5000, "Notes too long.")),
  atsAnalysisId: optionalString(z.string()),
  coverLetterId: optionalString(z.string()),
  interviewDate: z.preprocess(
    (val) => {
      if (!val || val === "") return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    },
    z.date().nullable().optional()
  ),
});

export const jobApplicationUpdateStatusSchema = z.object({
  id: z.string().min(1, "ID is required"),
  status: z.enum(["Saved", "Applied", "Online Assessment (OA)", "Interview", "Rejected", "Offer"]),
});

export const linkedInOptimizationSchema = z.object({
  profileContent: optionalString(z.string().max(50000, "Profile content is too long")),
  profileUrl: optionalString(z.string().url("Must be a valid URL")),
}).refine(data => data.profileContent || data.profileUrl, {
  message: "Either profile content or a LinkedIn URL is required",
  path: ["profileContent"],
});

export const networkingEmailSchema = z.object({
  recipientName: optionalString(z.string().max(100, "Name is too long")),
  company: optionalString(z.string().max(100, "Company name is too long")),
  goal: z.string().min(1, "Goal is required").max(100, "Goal is too long"),
  context: optionalString(z.string().max(1000, "Context is too long")),
});

export const projectIdeaSchema = z.object({
  targetRole: z.string().min(2, "Target role is required").max(100, "Role name is too long"),
  skillGap: z.string().min(1, "Skill gap is required").max(100, "Skill gap name is too long"),
});

const offerSchema = z.object({
  company: requiredString(z.string().min(1, "Company name is required.").max(100, "Company name is too long.")),
  baseSalary: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return undefined;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z.number().min(0, "Base salary must be non-negative.").finite("Base salary must be a finite number.")
  ),
  bonus: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return 0;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z.number().min(0, "Bonus must be non-negative.").finite("Bonus must be a finite number.").default(0)
  ),
  equity: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return 0;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z.number().min(0, "Equity must be non-negative.").finite("Equity must be a finite number.").default(0)
  ),
}).strict();

export const offersComparisonSchema = z.array(offerSchema).min(2, "At least two offers are required.").max(3, "Maximum three offers allowed.");

export const bulletRewriterSchema = z.object({
  bulletText: requiredString(z.string().min(10, "Bullet text is too short.").max(500, "Bullet text is too long.")),
  targetRole: optionalString(z.string().max(100, "Target role is too long.")),
}).strict();

export const bulletRewriterOutputSchema = z.object({
  rewrites: z.array(z.object({
    bullet: z.string().min(5).max(1000),
    explanation: z.string().min(5).max(1000)
  })).min(1)
});

export const accessibilitySettingsSchema = z.object({
  largeButtonsMode: z.boolean(),
  highContrastMode: z.boolean(),
  speechSpeed: z.number().min(0.5, "Speech speed must be at least 0.5").max(2.0, "Speech speed must be at most 2.0"),
  preferredLanguage: z.enum(["en", "hi"], {
    // Note: Any new language must be added here AND to the Prisma-validated values in sync to prevent DB/schema/UI drift.
    errorMap: () => ({ message: "Invalid language selection." }),
  }),
  preferredVoiceLanguage: z.enum(["en", "hi"], {
    // Note: Any new language must be added here AND to the Prisma-validated values in sync to prevent DB/schema/UI drift.
    errorMap: () => ({ message: "Invalid voice language selection." }),
  }),
  oneTapCameraMode: z.boolean(),
}).strict();

export const cultureMatchSchema = z.object({
  companyUrl: z.string().url().optional().or(z.literal("")),
  companyContent: z.string().optional(),
}).refine((data) => data.companyUrl || data.companyContent, {
  message: "Please provide either a company URL or pasted content.",
  path: ["_form"],
});

export const githubAnalyzerSchema = z.object({
  githubUrl: z.string().url().optional().or(z.literal("")),
  profileContent: z.string().optional(),
}).refine((data) => data.githubUrl || data.profileContent, {
  message: "Please provide either a GitHub URL or pasted content.",
  path: ["_form"],
});
