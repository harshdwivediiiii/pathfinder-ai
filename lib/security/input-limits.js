export const JOB_DESCRIPTION_MAX_LENGTH = 5000;

// SSRF Fetch Safeguards
export const URL_FETCH_TIMEOUT_MS = 10000;
export const URL_FETCH_MAX_BYTES = 5 * 1024 * 1024;
export const URL_FETCH_MAX_LENGTH = 2048;

// VLM (vision) payload safeguards
export const VLM_IMAGE_MAX_LENGTH = 10 * 1024 * 1024;