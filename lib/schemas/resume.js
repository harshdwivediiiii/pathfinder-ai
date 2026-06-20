import { z } from "zod";

/**
 * @typedef {Object} PersonalInfo
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} location
 * @property {string} [linkedin]
 * @property {string} [github]
 */

export const personalInfoSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().min(1, "Email is required").max(150),
  phone: z.string().min(1, "Phone is required").max(50),
  location: z.string().min(1, "Location is required").max(150),
  linkedin: z.string().max(255).optional().nullable(),
  github: z.string().max(255).optional().nullable(),
}).strict();

/**
 * @typedef {Object} ExperienceEntry
 * @property {string} title
 * @property {string} company
 * @property {string} location
 * @property {string} startDate
 * @property {string} endDate
 * @property {string[]} achievements
 */

export const experienceEntrySchema = z.object({
  title: z.string().min(1, "Job title is required").max(150),
  company: z.string().min(1, "Company name is required").max(150),
  location: z.string().min(1, "Location is required").max(150),
  startDate: z.string().min(1, "Start date is required").max(50),
  endDate: z.string().min(1, "End date is required").max(50),
  achievements: z.array(z.string().min(1)).min(1, "At least one achievement is required"),
}).strict();

/**
 * @typedef {Object} EducationEntry
 * @property {string} degree
 * @property {string} school
 * @property {string} graduationDate
 */

export const educationEntrySchema = z.object({
  degree: z.string().min(1, "Degree is required").max(150),
  school: z.string().min(1, "School name is required").max(150),
  graduationDate: z.string().min(1, "Graduation date is required").max(50),
}).strict();

/**
 * @typedef {Object} ProjectEntry
 * @property {string} name
 * @property {string[]} technologies
 * @property {string} description
 */

export const projectEntrySchema = z.object({
  name: z.string().min(1, "Project name is required").max(150),
  technologies: z.array(z.string().min(1)).min(1, "At least one technology is required"),
  description: z.string().min(1, "Description is required").max(1000),
}).strict();

/**
 * @typedef {Object} ResumeOutput
 * @property {PersonalInfo} personalInfo
 * @property {string} summary
 * @property {string[]} skills
 * @property {ExperienceEntry[]} experience
 * @property {EducationEntry[]} education
 * @property {ProjectEntry[]} [projects]
 */

export const resumeOutputSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string().min(10, "Summary is too short").max(2000),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  experience: z.array(experienceEntrySchema).min(1, "At least one experience entry is required"),
  education: z.array(educationEntrySchema).min(1, "At least one education entry is required"),
  projects: z.array(projectEntrySchema).optional().nullable(),
}).strict();

/**
 * @typedef {Object} ResumeImprovementOutput
 * @property {string} improvedContent
 * @property {string[]} highlights
 */

export const resumeImprovementOutputSchema = z.object({
  improvedContent: z
    .string()
    .min(10, "Improved content is too short.")
    .max(4000, "Improved content exceeds allowed length."),
  highlights: z
    .array(z.string().min(2).max(300))
    .min(1, "At least one highlight is required.")
    .max(8, "Too many highlights provided."),
}).strict();
