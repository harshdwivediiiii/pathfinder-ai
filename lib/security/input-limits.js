export const JOB_DESCRIPTION_MAX_LENGTH = 5000;

// VLM Navigation Safeguards
export const VLM_IMAGE_MAX_LENGTH = 10 * 1024 * 1024;
export const VLM_INSTRUCTION_MAX_LENGTH = 1000;
// Agent run name/prompt length caps to prevent oversized stored-content abuse.
export const AGENT_NAME_MAX_LENGTH = 100;
export const AGENT_PROMPT_MAX_LENGTH = 8192;
export const AGENT_ERROR_MAX_LENGTH = 5000;

// Upper bound for getAgentRuns pagination so a caller-supplied limit cannot trigger unbounded queries.
export const AGENT_RUN_LIST_MAX_LIMIT = 100;

// SSRF Fetch Safeguards
export const URL_FETCH_TIMEOUT_MS = 10000;
export const URL_FETCH_MAX_BYTES = 5 * 1024 * 1024;
export const URL_FETCH_MAX_LENGTH = 2048;