export const JOB_DESCRIPTION_MAX_LENGTH = 5000;

// VLM Navigation Safeguards
export const VLM_IMAGE_MAX_LENGTH = 10 * 1024 * 1024;
export const VLM_INSTRUCTION_MAX_LENGTH = 1000;

// SSRF Fetch Safeguards
export const URL_FETCH_TIMEOUT_MS = 10000;
export const URL_FETCH_MAX_BYTES = 5 * 1024 * 1024;
export const URL_FETCH_MAX_LENGTH = 2048;