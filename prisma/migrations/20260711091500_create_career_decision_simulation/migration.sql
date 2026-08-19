-- CreateTable
CREATE TABLE "CareerDecisionSimulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerDecisionSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerDecisionSimulation_userId_idx" ON "CareerDecisionSimulation"("userId");

-- AddForeignKey
ALTER TABLE "CareerDecisionSimulation" ADD CONSTRAINT "CareerDecisionSimulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
