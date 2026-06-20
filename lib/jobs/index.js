/**
 * lib/jobs/index.js
 *
 * Barrel export for all background job factory functions.
 * Import from here, not from individual job files, so that adding
 * or renaming a job is a one-line change in this file.
 */

export {
  getGenerateIndustryInsights,
  getProcessIndustryInsight,
} from "./industry-insights.js";
