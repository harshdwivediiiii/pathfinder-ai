-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('Running', 'Completed', 'Failed', 'Cancelled');

-- CreateEnum
CREATE TYPE "ProjectActivityType" AS ENUM ('CREATED', 'UPDATED', 'NOTE_ADDED', 'NOTE_UPDATED', 'NOTE_DELETED', 'PIN_TOGGLED', 'AGENT_OUTPUT_SAVED');

-- CreateTable
CREATE TABLE "RoadmapMilestone" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skillsToLearn" TEXT[],
    "estimatedDuration" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoadmapMilestone_roadmapId_idx" ON "RoadmapMilestone"("roadmapId");

-- CreateTable
CREATE TABLE "PathfindingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "algorithmType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PathfindingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PathfindingSession_userId_idx" ON "PathfindingSession"("userId");

-- CreateIndex
CREATE INDEX "PathfindingSession_status_idx" ON "PathfindingSession"("status");

-- CreateTable
CREATE TABLE "PathfindingVersion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "state" JSONB NOT NULL,
    "snapshotLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathfindingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PathfindingVersion_sessionId_versionNumber_key" ON "PathfindingVersion"("sessionId", "versionNumber");

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_userId_idx" ON "Issue"("userId");

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "output" JSONB,
    "status" "AgentRunStatus" NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentRun_userId_startedAt_idx" ON "AgentRun"("userId", "startedAt" DESC);

-- CreateTable
CREATE TABLE "ProjectWorkspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectWorkspace_userId_idx" ON "ProjectWorkspace"("userId");

-- CreateTable
CREATE TABLE "ProjectNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectNote_workspaceId_idx" ON "ProjectNote"("workspaceId");

-- CreateTable
CREATE TABLE "ProjectAgentOutput" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "agentRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAgentOutput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAgentOutput_workspaceId_idx" ON "ProjectAgentOutput"("workspaceId");

-- CreateTable
CREATE TABLE "ProjectActivity" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "ProjectActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectActivity_workspaceId_idx" ON "ProjectActivity"("workspaceId");

-- AddForeignKey
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathfindingSession" ADD CONSTRAINT "PathfindingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathfindingVersion" ADD CONSTRAINT "PathfindingVersion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PathfindingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkspace" ADD CONSTRAINT "ProjectWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ProjectWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAgentOutput" ADD CONSTRAINT "ProjectAgentOutput_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ProjectWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAgentOutput" ADD CONSTRAINT "ProjectAgentOutput_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "ProjectWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
