import { PrismaClient } from "@prisma/client";
import { getEnv } from "./env";

/**
 * Prisma Client Singleton for Next.js
 * 
 * In development, we use globalThis to persist the Prisma instance 
 * across Hot Module Replacement (HMR) to avoid "too many connections" errors.
 * In production, we ensure a clean instance but still use the singleton 
 * pattern for serverless cold-start efficiency.
 */

const prismaClientSingleton = () => {
  const env = getEnv();

  return new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Add connection timeout for serverless environments
  });
};

const globalForPrisma = globalThis;

/** @type {PrismaClient} */
export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Graceful shutdown handling (optional but good for long-lived processes)
// process.on('beforeExit', () => db.$disconnect());
