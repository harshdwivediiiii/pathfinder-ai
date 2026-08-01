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
      atsAnalysis: {
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
        atsAnalysis: {
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
    const { db } = await import("../lib/db/prisma.js");
    
    // The constructor should not have been called yet
    expect(mocks.mockPrismaClientConstructor).not.toHaveBeenCalled();
  });

  it("should instantiate PrismaClient when a property is accessed", async () => {
    const { db } = await import("../lib/db/prisma.js");
    
    // Accessing any property should trigger instantiation
    const userModel = db.user;
    expect(mocks.mockPrismaClientConstructor).toHaveBeenCalledTimes(1);
    expect(userModel).toBeDefined();
  });

  it("should reuse the same PrismaClient instance on repeated access (singleton pattern)", async () => {
    const { db } = await import("../lib/db/prisma.js");
    
    const userModel1 = db.user;
    const userModel2 = db.user;
    
    expect(mocks.mockPrismaClientConstructor).toHaveBeenCalledTimes(1);
  });

  it("should log connection lifecycle events during $connect and $disconnect", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { db } = await import("../lib/db/prisma.js");

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
    const { db } = await import("../lib/db/prisma.js");
    
    // Retrieve $connect and execute it standalone (loss of context check)
    const connectFn = db.$connect;
    await expect(connectFn()).resolves.toBeUndefined();
    expect(mocks.mockConnect).toHaveBeenCalledTimes(1);
  });

  it("should handle case-insensitive property access for atsAnalysis", async () => {
    const { db } = await import("../lib/db/prisma.js");
    
    // Accessing different capitalizations of atsAnalysis
    expect(db.atsAnalysis).toBeDefined();
    expect(db.aTSAnalysis).toBeDefined();
    expect(db.ATSAnalysis).toBeDefined();
    expect(db.atsanalysis).toBeDefined();
    
    // They should all resolve to the same mock model client.atsAnalysis
    const client = db.atsAnalysis;
    expect(db.aTSAnalysis).toBe(client);
    expect(db.ATSAnalysis).toBe(client);
    expect(db.atsanalysis).toBe(client);
  });
});

describe("Secure Logging Behavior", () => {
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
        atsAnalysis: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
      return instance;
    });

    mocks.mockPrismaClientConstructor.mockClear();
    mocks.mockConnect.mockClear();
    mocks.mockDisconnect.mockClear();
    
    delete globalThis.prisma;
  });

  afterEach(() => {
    delete globalThis.prisma;
  });

  it("should never log database connection strings or URLs", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Set a realistic DATABASE_URL
    process.env.DATABASE_URL = "postgresql://admin:secret@prod-db.company.com:5432/pathfinder";

    const { db } = await import("../lib/db/prisma.js");

    // Trigger instantiation
    const userModel = db.user;

    const allLogs = [...consoleLogSpy.mock.calls, ...consoleErrorSpy.mock.calls];
    const logMessages = allLogs.map(call => call[0]).join(" ");

    // Verify no connection string components are logged
    expect(logMessages).not.toContain("postgresql://");
    expect(logMessages).not.toContain("prod-db.company.com");
    expect(logMessages).not.toContain("5432");
    expect(logMessages).not.toContain("pathfinder");
    expect(logMessages).not.toContain("admin");
    expect(logMessages).not.toContain("secret");

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.DATABASE_URL = "postgresql://dummy@localhost/dummy";
  });

  it("should log connection duration without exposing connection details", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { db } = await import("../lib/db/prisma.js");

    await db.$connect();
    
    const connectLogs = consoleLogSpy.mock.calls.filter(call => 
      call[0].includes("Database connection established")
    );
    
    expect(connectLogs.length).toBeGreaterThan(0);
    expect(connectLogs[0][0]).toMatch(/\d+ms/); // Should contain duration
    expect(connectLogs[0][0]).not.toContain("postgresql://");

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should log safe error information without exposing connection details", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockError = new Error("Can't reach database server at postgresql://admin:secret@db.example.com:5432/mydb");
    mockError.code = "P1001";
    mocks.mockConnect.mockRejectedValue(mockError);

    const { db } = await import("../lib/db/prisma.js");

    await expect(db.$connect()).rejects.toThrow();

    const errorLogs = consoleErrorSpy.mock.calls;
    const errorMessages = errorLogs.map(call => call[0]).join(" ");

    // Should log error code and safe message
    expect(errorMessages).toContain("P1001");
    expect(errorMessages).toContain("Database connection failed");

    // Should NOT expose connection details
    expect(errorMessages).not.toContain("postgresql://");
    expect(errorMessages).not.toContain("db.example.com");
    expect(errorMessages).not.toContain("secret");
    expect(errorMessages).not.toContain("5432");
    expect(errorMessages).not.toContain("mydb");

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should sanitize error messages containing connection strings", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockError = new Error("Connection failed: postgresql://user:pass@host:5432/db");
    mockError.code = "P1008";
    mocks.mockConnect.mockRejectedValue(mockError);

    const { db } = await import("../lib/db/prisma.js");

    await expect(db.$connect()).rejects.toThrow();

    const errorLogs = consoleErrorSpy.mock.calls;
    const errorMessages = errorLogs.map(call => call[0]).join(" ");

    // Should sanitize the connection string
    expect(errorMessages).not.toContain("postgresql://user:pass@host:5432/db");
    expect(errorMessages).not.toContain("user");
    expect(errorMessages).not.toContain("pass");
    expect(errorMessages).not.toContain("host");

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should include timestamp and PID in log messages", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { db } = await import("../lib/db/prisma.js");

    await db.$connect();

    const logs = consoleLogSpy.mock.calls;
    expect(logs.length).toBeGreaterThan(0);
    
    // Check for timestamp format (ISO 8601)
    expect(logs[0][0]).toMatch(/\d{4}-\d{2}-\d{2}T/);
    
    // Check for PID
    expect(logs[0][0]).toMatch(/PID:\d+/);

    consoleLogSpy.mockRestore();
  });

  it("should include environment in log messages", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    process.env.NODE_ENV = "test";

    const { db } = await import("../lib/db/prisma.js");

    await db.$connect();

    const logs = consoleLogSpy.mock.calls;
    expect(logs.length).toBeGreaterThan(0);
    
    // Check for environment indicator
    expect(logs[0][0]).toContain("ENV:test");

    consoleLogSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  it("should log disconnection errors safely", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockError = new Error("Disconnect failed: connection to postgresql://admin:pass@db.com:5432/app still active");
    mockError.code = "P1013";
    mocks.mockDisconnect.mockRejectedValue(mockError);

    const { db } = await import("../lib/db/prisma.js");

    await expect(db.$disconnect()).rejects.toThrow();

    const errorLogs = consoleErrorSpy.mock.calls;
    const errorMessages = errorLogs.map(call => call[0]).join(" ");

    // Should log error code
    expect(errorMessages).toContain("P1013");

    // Should NOT expose connection details
    expect(errorMessages).not.toContain("postgresql://");
    expect(errorMessages).not.toContain("db.com");
    expect(errorMessages).not.toContain("pass");

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
