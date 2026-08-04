-- CreateTable
CREATE TABLE "AiResponseCache" (
    "promptHash" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResponseCache_pkey" PRIMARY KEY ("promptHash")
);
