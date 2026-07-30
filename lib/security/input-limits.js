export const JOB_DESCRIPTION_MAX_LENGTH = 5000;

// SSRF Fetch Safeguards
export const URL_FETCH_TIMEOUT_MS = 10000;
export const URL_FETCH_MAX_BYTES = 5 * 1024 * 1024;
export const URL_FETCH_MAX_LENGTH = 2048;

// VLM Image Upload Validation
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];