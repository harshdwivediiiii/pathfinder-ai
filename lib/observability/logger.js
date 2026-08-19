import process from "node:process";

const LOG_LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;

function formatEntry(entry) {
  const base = {
    traceId: entry.traceId ?? "",
    spanId: entry.spanId ?? "",
    parentSpanId: entry.parentSpanId ?? "",
    timestamp: new Date().toISOString(),
    level: entry.level,
    service: entry.service ?? "unknown",
    message: entry.message,
    context: entry.context ?? {},
  };

  if (entry.error) {
    base.error = {
      name: entry.error.name ?? "Error",
      message: entry.error.message ?? String(entry.error),
      stack: entry.error.stack ?? "",
    };
  }

  return JSON.stringify(base);
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLevel;
}

function createLogger(service) {
  return {
    trace(message, context = {}, error = null) {
      if (!shouldLog("trace")) return;
      console.log(formatEntry({ level: "trace", service, message, context, error }));
    },
    debug(message, context = {}, error = null) {
      if (!shouldLog("debug")) return;
      console.log(formatEntry({ level: "debug", service, message, context, error }));
    },
    info(message, context = {}, error = null) {
      if (!shouldLog("info")) return;
      console.log(formatEntry({ level: "info", service, message, context, error }));
    },
    warn(message, context = {}, error = null) {
      if (!shouldLog("warn")) return;
      console.warn(formatEntry({ level: "warn", service, message, context, error }));
    },
    error(message, context = {}, error = null) {
      if (!shouldLog("error")) return;
      console.error(formatEntry({ level: "error", service, message, context, error }));
    },
    fatal(message, context = {}, error = null) {
      if (!shouldLog("fatal")) return;
      console.error(formatEntry({ level: "fatal", service, message, context, error }));
    },
  };
}

export { createLogger, formatEntry, shouldLog, currentLevel, LOG_LEVELS };
