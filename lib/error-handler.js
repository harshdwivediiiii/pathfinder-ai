import * as Sentry from "@sentry/nextjs";
import { AppError } from "./app-error";

/**
 * Centralized error handler for Server Actions.
 * - Safe/expected errors (AppError) return their message to the client.
 * - Unexpected/system errors are logged securely to Sentry and a generic message is returned.
 *
 * @param {Error} error - The caught error object
 * @param {string} actionName - Name of the action for better tracking
 * @returns {object} Formatted error response { success: false, errors: { _form: [string] } }
 */
export function handleServerError(error, actionName = "UnknownAction") {
  if (error instanceof AppError) {
    return {
      success: false,
      errors: { _form: [error.message] },
    };
  }

  // Log to console in development for debugging
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Server Action Error] ${actionName}:`, error);
  }

  // Log to Sentry
  Sentry.captureException(error, {
    tags: { action: actionName },
  });

  return {
    success: false,
    errors: { _form: ["An unexpected error occurred. Our team has been notified."] },
  };
}
