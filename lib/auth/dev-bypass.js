import "server-only";

/**
 * Development Authentication Bypass Validation
 * 
 * This module provides secure validation for development-time authentication bypasses.
 * It implements multiple layers of protection to prevent accidental deployment with
 * disabled authentication while preserving the developer experience for local development.
 * 
 * SECURITY CONSIDERATIONS:
 * - Authentication bypass is ONLY allowed in development mode
 * - Authentication bypass is ONLY allowed on localhost/127.0.0.1
 * - Authentication bypass is NEVER allowed in production
 * - Authentication bypass is NEVER allowed on deployed environments
 * - Unsafe configurations will throw errors rather than silently continuing
 * 
 * @module lib/auth/dev-bypass
 */

// Track whether warning has been emitted to avoid spam
let warningEmitted = false;

/**
 * Validates if the current environment is safe for development authentication bypass.
 * 
 * This function performs multiple security checks:
 * 1. Verifies NODE_ENV is "development"
 * 2. Verifies the request originates from localhost or 127.0.0.1
 * 3. Verifies SKIP_AUTH is explicitly set to "true"
 * 4. Prevents bypass in production environments
 * 5. Prevents bypass on non-localhost hosts
 * 
 * @param {Object} options - Validation options
 * @param {string} options.hostname - The request hostname (e.g., "localhost", "127.0.0.1")
 * @param {boolean} options.skipAuthEnabled - Whether SKIP_AUTH environment variable is set to "true"
 * @param {string} [options.reason] - Optional reason for the bypass (for warning messages)
 * @returns {Object} Validation result with allowed flag and optional error
 * @returns {boolean} returns.allowed - Whether bypass is allowed
 * @returns {Error} [returns.error] - Error if validation failed
 */
export function validateDevBypass({ hostname, skipAuthEnabled, reason = "development" }) {
  const nodeEnv = process.env.NODE_ENV;
  const isDevelopment = nodeEnv === "development";
  
  // Check if running in production - NEVER allow bypass
  if (nodeEnv === "production") {
    return {
      allowed: false,
      error: new Error(
        "Authentication bypass is NOT allowed in production. " +
        `NODE_ENV is set to "${nodeEnv}". ` +
        "Remove SKIP_AUTH=true from your environment variables."
      ),
    };
  }

  // Check if not in development - this catches test, staging, etc.
  if (!isDevelopment) {
    return {
      allowed: false,
      error: new Error(
        `Authentication bypass is only allowed in development mode. ` +
        `Current NODE_ENV is "${nodeEnv}". ` +
        "Set NODE_ENV=development to enable development mode, or remove SKIP_AUTH=true."
      ),
    };
  }

  // Check if SKIP_AUTH is not enabled - bypass not requested
  if (!skipAuthEnabled) {
    return { allowed: false };
  }

  // Validate hostname is localhost or 127.0.0.1
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  
  if (!isLocalhost) {
    return {
      allowed: false,
      error: new Error(
        `Authentication bypass is only allowed on localhost. ` +
        `Current hostname is "${hostname}". ` +
        "This security measure prevents accidental bypass on deployed environments. " +
        "Remove SKIP_AUTH=true from your environment variables."
      ),
    };
  }

  // All checks passed - emit warning once
  if (!warningEmitted) {
    emitDevBypassWarning(reason);
    warningEmitted = true;
  }

  return { allowed: true };
}

/**
 * Validates if the E2E test authentication bypass is safe to enable.
 *
 * This bypass is used by the Playwright end-to-end test suite and mirrors the
 * safety model of `validateDevBypass`: it is only allowed on localhost and
 * never in production. Unlike `validateDevBypass`, any non-production NODE_ENV
 * is accepted (not just "development"), because E2E tests run under
 * NODE_ENV=test in CI and under NODE_ENV=development locally.
 *
 * @param {Object} options - Validation options
 * @param {string} options.hostname - The request hostname (e.g., "localhost", "127.0.0.1")
 * @param {boolean} options.e2eTestEnabled - Whether E2E_TEST environment variable is set to "true"
 * @returns {Object} Validation result with allowed flag and optional error
 * @returns {boolean} returns.allowed - Whether bypass is allowed
 * @returns {Error} [returns.error] - Error if validation failed
 */
export function validateE2EBypass({ hostname, e2eTestEnabled }) {
  const nodeEnv = process.env.NODE_ENV;

  // Check if E2E_TEST is not enabled - bypass not requested
  if (!e2eTestEnabled) {
    return { allowed: false };
  }

  // Check if running in production - NEVER allow bypass
  if (nodeEnv === "production") {
    return {
      allowed: false,
      error: new Error(
        "E2E_TEST authentication bypass is NOT allowed in production. " +
        `NODE_ENV is set to "${nodeEnv}". ` +
        "Remove E2E_TEST=true from your environment variables."
      ),
    };
  }

  // Validate hostname is localhost or 127.0.0.1
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (!isLocalhost) {
    return {
      allowed: false,
      error: new Error(
        `E2E_TEST authentication bypass is only allowed on localhost. ` +
        `Current hostname is "${hostname}". ` +
        "This security measure prevents accidental bypass on deployed environments. " +
        "Remove E2E_TEST=true from your environment variables."
      ),
    };
  }

  // All checks passed - emit warning once
  if (!warningEmitted) {
    emitDevBypassWarning("E2E_TEST=true");
    warningEmitted = true;
  }

  return { allowed: true };
}

/**
 * Validates if the video-coach route can bypass authentication.
 * 
 * This is a specialized bypass for the video-coach feature that:
 * - Only works on localhost in development
 * - Does not require SKIP_AUTH (it's always enabled for this route in dev)
 * - Still validates NODE_ENV and hostname
 * 
 * @param {Object} options - Validation options
 * @param {string} options.hostname - The request hostname
 * @returns {Object} Validation result
 * @returns {boolean} returns.allowed - Whether bypass is allowed
 * @returns {Error} [returns.error] - Error if validation failed
 */
export function validateVideoCoachBypass({ hostname }) {
  const nodeEnv = process.env.NODE_ENV;
  const isDevelopment = nodeEnv === "development";
  
  // Check if running in production - NEVER allow bypass
  if (nodeEnv === "production") {
    return {
      allowed: false,
      error: new Error(
        "Video-coach authentication bypass is NOT allowed in production. " +
        `NODE_ENV is set to "${nodeEnv}".`
      ),
    };
  }

  // Check if not in development
  if (!isDevelopment) {
    return {
      allowed: false,
      error: new Error(
        `Video-coach authentication bypass is only allowed in development mode. ` +
        `Current NODE_ENV is "${nodeEnv}".`
      ),
    };
  }

  // Validate hostname is localhost or 127.0.0.1
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  
  if (!isLocalhost) {
    return {
      allowed: false,
      error: new Error(
        `Video-coach authentication bypass is only allowed on localhost. ` +
        `Current hostname is "${hostname}".`
      ),
    };
  }

  // All checks passed - emit warning once
  if (!warningEmitted) {
    emitDevBypassWarning("video-coach feature in development");
    warningEmitted = true;
  }

  return { allowed: true };
}

/**
 * Emits a prominent warning to the console when authentication is disabled.
 * 
 * @param {string} reason - The reason for the bypass
 */
function emitDevBypassWarning(reason) {
  const warning = [
    "",
    "⚠️  WARNING",
    "",
    "Authentication is currently DISABLED for local development.",
    "",
    `Reason: ${reason}`,
    "",
    "This configuration is intended ONLY for local development.",
    "Never deploy with authentication disabled.",
    "",
    "To re-enable authentication, set SKIP_AUTH=false or remove the environment variable.",
    "",
  ].join("\n");

  // Use console.warn for visibility
  console.warn(warning);
}

/**
 * Resets the warning emission flag (useful for testing).
 * This is exported for testing purposes only.
 */
export function _resetWarningFlag() {
  warningEmitted = false;
}
