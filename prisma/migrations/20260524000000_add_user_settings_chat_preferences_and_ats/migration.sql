-- Align the deployed database with the current Prisma schema used by settings,
-- AI chat preferences, and ATS analysis.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "saveChatHistory" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "dashboardLayout" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ATSAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeContent" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "atsScore" DOUBLE PRECISION NOT NULL,
    "matchedKeywords" TEXT[],
    "missingKeywords" TEXT[],
    "suggestions" JSONB[],
    "overallFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ATSAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE INDEX IF NOT EXISTS "ATSAnalysis_userId_idx" ON "ATSAnalysis"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserSettings_userId_fkey'
    ) THEN
        ALTER TABLE "UserSettings"
        ADD CONSTRAINT "UserSettings_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ATSAnalysis_userId_fkey'
    ) THEN
        ALTER TABLE "ATSAnalysis"
        ADD CONSTRAINT "ATSAnalysis_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
