/**
 * lib/inngest/function.js — compatibility shim
 *
 * Job logic now lives in lib/jobs/industry-insights.js.
 * This file re-exports from the canonical jobs layer so that any existing
 * import paths (e.g. `@/lib/inngest/function`) continue to resolve without
 * requiring consumer changes.
 *
 * Prefer importing from `@/lib/jobs` in new code.
 */
export {
  getGenerateIndustryInsights,
  getProcessIndustryInsight,
} from "@/lib/jobs/index.js";