import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => {
  const mockConnect = vi.fn().mockResolvedValue(undefined);
  const mockDisconnect = vi.fn().mockResolvedValue(undefined);
  
  const mockPrismaClientConstructor = vi.fn().mockImplementation(() => {
    const instance = {
      $connect: mockConnect,
      $disconnect: mockDisconnect,
      user: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    return instance;
  });

  return {
    mockConnect,
    mockDisconnect,
    mockPrismaClientConstructor,
  };
});

// Mock @prisma/client before any tests run
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: mocks.mockPrismaClientConstructor,
  };
});

describe("Prisma Client Lifecycle Handling", () => {
  beforeEach(() => {
    vi.resetModules();
    
    mocks.mockConnect.mockResolvedValue(undefined);
    mocks.mockDisconnect.mockResolvedValue(undefined);
    
    mocks.mockPrismaClientConstructor.mockImplementation(() => {
      const instance = {
        $connect: mocks.mockConnect,
        $disconnect: mocks.mockDisconnect,
        user: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
      return instance;
    });

    mocks.mockPrismaClientConstructor.mockClear();
    mocks.mockConnect.mockClear();
    mocks.mockDisconnect.mockClear();
    
    // Clear globalThis.prisma to ensure a clean state
    delete globalThis.prisma;
  });

  afterEach(() => {
    delete globalThis.prisma;
  });

  it("should not instantiate PrismaClient on module import", async () => {
    // Import db lazily
    const { db } = await import("../lib/prisma.js");
    
    // The constructor should not have been called yet
    expect(mocks.mockPrismaClientConstructor).not.toHaveBeenCalled();
  });

  it("should instantiate PrismaClient when a property is accessed", async () => {
    const { db } = await import("../lib/prisma.js");
    
    // Accessing any property should trigger instantiation
    const userModel = db.user;
    expect(mocks.mockPrismaClientConstructor).toHaveBeenCalledTimes(1);
    expect(userModel).toBeDefined();
  });

  it("should reuse the same PrismaClient instance on repeated access (singleton pattern)", async () => {
    const { db } = await import("../lib/prisma.js");
    
    const userModel1 = db.user;
    const userModel2 = db.user;
    
    expect(mocks.mockPrismaClientConstructor).toHaveBeenCalledTimes(1);
  });

  it("should log connection lifecycle events during $connect and $disconnect", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { db } = await import("../lib/prisma.js");

    await db.$connect();
    expect(mocks.mockConnect).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Connecting to database..."));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Database connection established successfully"));

    await db.$disconnect();
    expect(mocks.mockDisconnect).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Disconnecting from database..."));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Database disconnected successfully"));

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should bind methods to the Prisma Client instance", async () => {
    const { db } = await import("../lib/prisma.js");
    
    // Retrieve $connect and execute it standalone (loss of context check)
    const connectFn = db.$connect;
    await expect(connectFn()).resolves.toBeUndefined();
    expect(mocks.mockConnect).toHaveBeenCalledTimes(1);
  });
});
