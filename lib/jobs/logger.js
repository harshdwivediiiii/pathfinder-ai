import "server-only";

/**
 * Structured logger for the jobs layer.
 *
 * All methods emit a JSON-tagged line so that log aggregators (e.g. Datadog,
 * Vercel Log Drains) can filter on the `[jobs]` prefix or parse the payload
 * as structured data.
 *
 * Usage:
 *   import { log } from "@/lib/jobs/logger";
 *   log.info("process-industry-insight", "Starting update", { industry });
 *   log.error("process-industry-insight", error);
 */

function serialize(context, message, meta) {
  const payload = {
    layer: "jobs",
    fn: context,
    msg: message,
    ts: new Date().toISOString(),
    ...(meta && typeof meta === "object" ? meta : {}),
  };
  return `[jobs] ${JSON.stringify(payload)}`;
}

function serializeError(context, error, meta) {
  const payload = {
    layer: "jobs",
    fn: context,
    msg: error?.message ?? String(error),
    name: error?.name,
    stack: error?.stack?.split("\n").slice(0, 6).join(" | "),
    ts: new Date().toISOString(),
    ...(meta && typeof meta === "object" ? meta : {}),
  };
  return `[jobs] ${JSON.stringify(payload)}`;
}

export const log = {
  /**
   * @param {string} context - The Inngest function id / caller name.
   * @param {string} message
   * @param {Record<string, unknown>} [meta]
   */
  info(context, message, meta) {
    console.log(serialize(context, message, meta));
  },

  /**
   * @param {string} context
   * @param {string} message
   * @param {Record<string, unknown>} [meta]
   */
  warn(context, message, meta) {
    console.warn(serialize(context, message, meta));
  },

  /**
   * @param {string} context
   * @param {Error | unknown} error
   * @param {Record<string, unknown>} [meta]
   */
  error(context, error, meta) {
    console.error(serializeError(context, error, meta));
  },
};
