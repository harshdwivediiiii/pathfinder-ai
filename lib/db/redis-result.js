import "server-only";

/**
 * Result status enumeration for Redis operations.
 * Distinguishes between successful operations, cache misses, and failures.
 * 
 * This allows callers to differentiate between:
 * - SUCCESS: Operation completed successfully with a value
 * - MISS: Key not found (expected cache miss)
 * - ERROR: Redis operation failed (infrastructure issue)
 */
export const ResultStatus = {
  /** Operation completed successfully */
  SUCCESS: "success",
  /** Key not found (for get operations) */
  MISS: "miss",
  /** Redis operation failed (connection error, timeout, etc.) */
  ERROR: "error",
};

/**
 * Creates a result object for successful Redis operations.
 * @param {*} value - The value returned from Redis
 * @returns {Object} Result object with status and value
 */
export function success(value) {
  return {
    status: ResultStatus.SUCCESS,
    value,
    isSuccess: true,
    isMiss: false,
    isError: false,
  };
}

/**
 * Creates a result object for cache misses (key not found).
 * @returns {Object} Result object indicating a cache miss
 */
export function miss() {
  return {
    status: ResultStatus.MISS,
    value: null,
    isSuccess: false,
    isMiss: true,
    isError: false,
  };
}

/**
 * Creates a result object for Redis operation failures.
 * @param {Error} error - The error that occurred
 * @param {string} operation - The operation being performed (get, set, delete, etc.)
 * @returns {Object} Result object with error details
 */
export function error(error, operation) {
  // Sanitize error to avoid leaking sensitive information
  const sanitizedError = sanitizeError(error);
  
  return {
    status: ResultStatus.ERROR,
    value: null,
    isSuccess: false,
    isMiss: false,
    isError: true,
    error: {
      ...sanitizedError,
      operation,
    },
  };
}

/**
 * Sanitizes error objects to prevent leaking sensitive information.
 * Removes connection strings, passwords, and other sensitive data.
 * @param {Error} err - The error to sanitize
 * @returns {Object} Sanitized error information
 */
function sanitizeError(err) {
  if (!err) return { message: "Unknown error" };

  const message = err.message || String(err);
  
  // Remove potential sensitive information from error message
  const sanitizedMessage = message
    .replace(/redis:\/\/[^@]+@/gi, "redis://***@")
    .replace(/password[=:][^\s]+/gi, "password=***")
    .replace(/auth[=:][^\s]+/gi, "auth=***");

  // Determine if error is retryable (connection issues, timeouts)
  const retryable = isRetryableError(err);

  return {
    message: sanitizedMessage,
    name: err.name || "Error",
    retryable,
    timestamp: Date.now(),
  };
}

/**
 * Determines if an error is retryable (transient) vs permanent.
 * @param {Error} err - The error to check
 * @returns {boolean} True if the error is retryable
 */
function isRetryableError(err) {
  const message = (err.message || "").toLowerCase();
  
  // Connection errors are retryable
  if (message.includes("econnrefused") || 
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("etimedout") ||
      message.includes("econnreset")) {
    return true;
  }

  // Redis-specific transient errors
  if (message.includes("loading") || 
      message.includes("master down") ||
      message.includes("cluster down")) {
    return true;
  }

  // Authentication errors and command errors are not retryable
  if (message.includes("noauth") || 
      message.includes("wrongpass") ||
      message.includes("invalid") ||
      message.includes("syntax")) {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
}

/**
 * Unwraps a result object to get the underlying value.
 * For backward compatibility, returns null for both misses and errors.
 * @param {Object} result - The result object to unwrap
 * @returns {*} The underlying value or null
 */
export function unwrap(result) {
  if (!result || typeof result !== "object") {
    return null;
  }
  return result.value;
}

/**
 * Checks if a result object represents a successful operation.
 * @param {Object} result - The result object to check
 * @returns {boolean} True if the operation succeeded
 */
export function isSuccess(result) {
  return result?.isSuccess === true;
}

/**
 * Checks if a result object represents a cache miss.
 * @param {Object} result - The result object to check
 * @returns {boolean} True if the key was not found
 */
export function isMiss(result) {
  return result?.isMiss === true;
}

/**
 * Checks if a result object represents a Redis failure.
 * @param {Object} result - The result object to check
 * @returns {boolean} True if the operation failed
 */
export function isError(result) {
  return result?.isError === true;
}
