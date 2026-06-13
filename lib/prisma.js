import "server-only";
import { PrismaClient } from "@prisma/client";
import { getEnv } from "./env";

const prismaClientSingleton = () => {
  const env = getEnv();
  const pid = process.pid;
  const nodeEnv = env.NODE_ENV || "development";

  // Mask sensitive database URL for diagnostic logs
  const dbUrl = env.DATABASE_URL || "";
  const maskedUrl = dbUrl.replace(/:[^@]+@/, ":****@");

  console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Creating new Prisma Client singleton instance...`);
  console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Database URL: ${maskedUrl}`);

  const client = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: nodeEnv === "development" ? ["error", "warn"] : ["error"],
  });

  console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Prisma Client singleton instance created successfully.`);
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
        const pid = process.pid;
        const env = getEnv();
        const nodeEnv = env.NODE_ENV || "development";
        console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Connecting to database...`);
        try {
          const start = Date.now();
          const result = await client.$connect(...args);
          const duration = Date.now() - start;
          console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Database connection established successfully in ${duration}ms.`);
          return result;
        } catch (error) {
          console.error(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Database connection failed:`, error);
          throw error;
        }
      };
    }

    if (prop === "$disconnect") {
      return async function(...args) {
        const pid = process.pid;
        const env = getEnv();
        const nodeEnv = env.NODE_ENV || "development";
        console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Disconnecting from database...`);
        try {
          const start = Date.now();
          const result = await client.$disconnect(...args);
          const duration = Date.now() - start;
          console.log(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Database disconnected successfully in ${duration}ms.`);
          return result;
        } catch (error) {
          console.error(`[Prisma] [PID:${pid}] [ENV:${nodeEnv}] Database disconnection failed:`, error);
          throw error;
        }
      };
    }

    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const client = getPrisma();
    return Reflect.set(client, prop, value, client);
  },
  has(target, prop) {
    const client = getPrisma();
    return Reflect.has(client, prop);
  },
  ownKeys(target) {
    const client = getPrisma();
    return Reflect.ownKeys(client);
  },
  getOwnPropertyDescriptor(target, prop) {
    const client = getPrisma();
    return Reflect.getOwnPropertyDescriptor(client, prop);
  }
};

export const db = new Proxy({}, prismaHandler);

