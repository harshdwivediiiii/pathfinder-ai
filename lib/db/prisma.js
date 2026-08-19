import "server-only";
import { PrismaClient } from "@prisma/client";
import { getEnv } from "../security/env";

/**
 * Secure logging helper that respects environment-specific logging requirements.
 * 
 * SECURITY NOTE: Database connection strings (including username, hostname, port, and database name)
 * are never logged in any environment. This follows secure logging best practices to prevent
 * inadvertent exposure of infrastructure details in logs.
 * 
 * In development: More verbose lifecycle logging for debugging
 * In production: Minimal logging to reduce log volume and information disclosure
 */
function logPrismaEvent(level, message, metadata = {}) {
  const pid = process.pid;
  const env = getEnv();
  const nodeEnv = env.NODE_ENV || "development";
  const timestamp = new Date().toISOString();

  const logEntry = `[Prisma] [${timestamp}] [PID:${pid}] [ENV:${nodeEnv}] ${message}`;

  if (level === "error") {
    console.error(logEntry);
    if (nodeEnv === "development" && Object.keys(metadata).length > 0) {
      console.error("[Prisma] Additional context:", JSON.stringify(metadata, null, 2));
    }
  } else {
    console.log(logEntry);
    if (nodeEnv === "development" && Object.keys(metadata).length > 0) {
      console.log("[Prisma] Additional context:", JSON.stringify(metadata, null, 2));
    }
  }
}

/**
 * Extracts safe error information from Prisma errors without exposing connection metadata.
 * Returns only error code and a generic message suitable for logging.
 */
function getSafeErrorInfo(error) {
  const errorInfo = {
    code: error.code || "UNKNOWN",
    message: "Database operation failed",
  };

  // Map common Prisma error codes to user-friendly messages
  const errorMessages = {
    P1001: "Unable to reach database server",
    P1002: "Database connection timed out",
    P1003: "Database does not exist",
    P1008: "Connection failed due to network error",
    P1010: "Authentication failed",
    P1011: "Connection limit exceeded",
    P1012: "Transaction failed",
    P1013: "Connection closed unexpectedly",
    P1014: "Database query failed",
    P1015: "Connection pool exhausted",
    P1016: "Query interpretation error",
    P1017: "Query execution error",
    P2010: "Raw query failed",
  };

  if (error.code && errorMessages[error.code]) {
    errorInfo.message = errorMessages[error.code];
  } else if (error.message) {
    // Sanitize error message to remove potential connection strings
    errorInfo.message = error.message
      .replace(/postgres(?:ql)?:\/\/[^@]+@[^\/]+/g, "postgresql://****:****@****")
      .replace(/password=[^&\s]+/g, "password=****")
      .substring(0, 200); // Limit length
  }

  return errorInfo;
}

const prismaClientSingleton = () => {
  const env = getEnv();
  const nodeEnv = env.NODE_ENV || "development";

  // SECURITY: Database URL is never logged to prevent exposure of infrastructure details
  logPrismaEvent("info", "Creating Prisma Client...");

  const client = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: nodeEnv === "development" ? ["error", "warn"] : ["error"],
  });

  logPrismaEvent("info", "Prisma Client created successfully");
  return client;
};

const globalForPrisma = globalThis;
let _db;

function getPrisma() {
  const env = getEnv();
  const nodeEnv = env.NODE_ENV || "development";

  if (nodeEnv === "production") {
    if (!_db) {
      _db = prismaClientSingleton();
    }
    return _db;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClientSingleton();
  }
  return globalForPrisma.prisma;
}

const prismaHandler = {
  get(target, prop, receiver) {
    if (prop === "toString") {
      return () => "[object PrismaClientProxy]";
    }

    const client = getPrisma();

    if (prop === "$connect") {
      return async function(...args) {
        logPrismaEvent("info", "Connecting to database...");
        try {
          const start = Date.now();
          const result = await client.$connect(...args);
          const duration = Date.now() - start;
          logPrismaEvent("info", `Database connection established successfully (${duration}ms)`);
          return result;
        } catch (error) {
          const errorInfo = getSafeErrorInfo(error);
          logPrismaEvent("error", `Database connection failed - ${errorInfo.code}: ${errorInfo.message}`, {
            error: errorInfo.code,
          });
          throw error;
        }
      };
    }

    if (prop === "$disconnect") {
      return async function(...args) {
        logPrismaEvent("info", "Disconnecting from database...");
        try {
          const start = Date.now();
          const result = await client.$disconnect(...args);
          const duration = Date.now() - start;
          logPrismaEvent("info", `Database disconnected successfully (${duration}ms)`);
          return result;
        } catch (error) {
          const errorInfo = getSafeErrorInfo(error);
          logPrismaEvent("error", `Database disconnection failed - ${errorInfo.code}: ${errorInfo.message}`, {
            error: errorInfo.code,
          });
          throw error;
        }
      };
    }

    let targetProp = prop;
    if (typeof prop === "string" && prop.toLowerCase() === "atsanalysis") {
      targetProp = "atsAnalysis";
    }

    const value = client[targetProp];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const client = getPrisma();
    let targetProp = prop;
    if (typeof prop === "string" && prop.toLowerCase() === "atsanalysis") {
      targetProp = "atsAnalysis";
    }
    return Reflect.set(client, targetProp, value, client);
  },
  has(target, prop) {
    const client = getPrisma();
    let targetProp = prop;
    if (typeof prop === "string" && prop.toLowerCase() === "atsanalysis") {
      targetProp = "atsAnalysis";
    }
    return Reflect.has(client, targetProp);
  },
  ownKeys(target) {
    const client = getPrisma();
    return Reflect.ownKeys(client);
  },
  getOwnPropertyDescriptor(target, prop) {
    const client = getPrisma();
    let targetProp = prop;
    if (typeof prop === "string" && prop.toLowerCase() === "atsanalysis") {
      targetProp = "atsAnalysis";
    }
    return Reflect.getOwnPropertyDescriptor(client, targetProp);
  }
};

export const db = new Proxy({}, prismaHandler);
export default db;

