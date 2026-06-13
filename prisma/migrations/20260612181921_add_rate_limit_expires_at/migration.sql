/*
  Warnings:

  - Added the required column `expiresAt` to the `AiRateLimit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiRateLimit" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'chat';

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "careerGoals" TEXT,
ADD COLUMN     "currentRole" TEXT,
ADD COLUMN     "targetRole" TEXT;

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Wishlist',
    "url" TEXT,
    "salary" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "atsAnalysisId" TEXT,
    "coverLetterId" TEXT,
    "interviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInOptimization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileContent" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedInOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkingEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientName" TEXT,
    "company" TEXT,
    "goal" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkingEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectIdea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "skillGap" TEXT NOT NULL,
    "ideas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StarStory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawExperience" TEXT NOT NULL,
    "starContent" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalEmail" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "replyContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewCheatSheet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewCheatSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedInPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offers" JSONB NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerPivot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerPivot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "planContent" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResignationLetter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "circumstance" TEXT NOT NULL,
    "lastDay" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResignationLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelanceProposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectDetails" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreelanceProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralPrep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralPrep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LayoffStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "planContent" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LayoffStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoffeeChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "chatHistory" JSONB NOT NULL,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoffeeChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquityAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offerDetails" JSONB NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquityAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentGrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "gradeData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurnoutAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "workload" TEXT NOT NULL,
    "assessment" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BurnoutAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideHustleIdea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "ideasData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SideHustleIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemoteWorkPitch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "objections" TEXT NOT NULL,
    "pitchData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemoteWorkPitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalTransfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentRole" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "reasons" TEXT NOT NULL,
    "transferData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerBreakPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "returnGoals" TEXT NOT NULL,
    "planData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerBreakPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "concerns" TEXT NOT NULL,
    "strategyData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisaStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelocationAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "targetCity" TEXT NOT NULL,
    "salary" TEXT NOT NULL,
    "analysisData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelocationAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorOutreach" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "targetIndustry" TEXT NOT NULL,
    "outreachData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_userId_key" ON "Roadmap"("userId");

-- CreateIndex
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");

-- CreateIndex
CREATE INDEX "LinkedInOptimization_userId_idx" ON "LinkedInOptimization"("userId");

-- CreateIndex
CREATE INDEX "NetworkingEmail_userId_idx" ON "NetworkingEmail"("userId");

-- CreateIndex
CREATE INDEX "ProjectIdea_userId_idx" ON "ProjectIdea"("userId");

-- CreateIndex
CREATE INDEX "ResumeGeneration_userId_idx" ON "ResumeGeneration"("userId");

-- CreateIndex
CREATE INDEX "StarStory_userId_idx" ON "StarStory"("userId");

-- CreateIndex
CREATE INDEX "RecruiterEmail_userId_idx" ON "RecruiterEmail"("userId");

-- CreateIndex
CREATE INDEX "InterviewCheatSheet_userId_idx" ON "InterviewCheatSheet"("userId");

-- CreateIndex
CREATE INDEX "LinkedInPost_userId_idx" ON "LinkedInPost"("userId");

-- CreateIndex
CREATE INDEX "OfferComparison_userId_idx" ON "OfferComparison"("userId");

-- CreateIndex
CREATE INDEX "CareerPivot_userId_idx" ON "CareerPivot"("userId");

-- CreateIndex
CREATE INDEX "OnboardingPlan_userId_idx" ON "OnboardingPlan"("userId");

-- CreateIndex
CREATE INDEX "ResignationLetter_userId_idx" ON "ResignationLetter"("userId");

-- CreateIndex
CREATE INDEX "PromotionStrategy_userId_idx" ON "PromotionStrategy"("userId");

-- CreateIndex
CREATE INDEX "FreelanceProposal_userId_idx" ON "FreelanceProposal"("userId");

-- CreateIndex
CREATE INDEX "BehavioralPrep_userId_idx" ON "BehavioralPrep"("userId");

-- CreateIndex
CREATE INDEX "LayoffStrategy_userId_idx" ON "LayoffStrategy"("userId");

-- CreateIndex
CREATE INDEX "CoffeeChatSession_userId_idx" ON "CoffeeChatSession"("userId");

-- CreateIndex
CREATE INDEX "EquityAnalysis_userId_idx" ON "EquityAnalysis"("userId");

-- CreateIndex
CREATE INDEX "AssignmentGrade_userId_idx" ON "AssignmentGrade"("userId");

-- CreateIndex
CREATE INDEX "BurnoutAssessment_userId_idx" ON "BurnoutAssessment"("userId");

-- CreateIndex
CREATE INDEX "SideHustleIdea_userId_idx" ON "SideHustleIdea"("userId");

-- CreateIndex
CREATE INDEX "RemoteWorkPitch_userId_idx" ON "RemoteWorkPitch"("userId");

-- CreateIndex
CREATE INDEX "InternalTransfer_userId_idx" ON "InternalTransfer"("userId");

-- CreateIndex
CREATE INDEX "CareerBreakPlan_userId_idx" ON "CareerBreakPlan"("userId");

-- CreateIndex
CREATE INDEX "VisaStrategy_userId_idx" ON "VisaStrategy"("userId");

-- CreateIndex
CREATE INDEX "RelocationAnalysis_userId_idx" ON "RelocationAnalysis"("userId");

-- CreateIndex
CREATE INDEX "MentorOutreach_userId_idx" ON "MentorOutreach"("userId");

-- CreateIndex
CREATE INDEX "AiRateLimit_expiresAt_idx" ON "AiRateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_atsAnalysisId_fkey" FOREIGN KEY ("atsAnalysisId") REFERENCES "ATSAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "CoverLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInOptimization" ADD CONSTRAINT "LinkedInOptimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkingEmail" ADD CONSTRAINT "NetworkingEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIdea" ADD CONSTRAINT "ProjectIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeGeneration" ADD CONSTRAINT "ResumeGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarStory" ADD CONSTRAINT "StarStory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterEmail" ADD CONSTRAINT "RecruiterEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewCheatSheet" ADD CONSTRAINT "InterviewCheatSheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInPost" ADD CONSTRAINT "LinkedInPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferComparison" ADD CONSTRAINT "OfferComparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerPivot" ADD CONSTRAINT "CareerPivot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingPlan" ADD CONSTRAINT "OnboardingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResignationLetter" ADD CONSTRAINT "ResignationLetter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionStrategy" ADD CONSTRAINT "PromotionStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelanceProposal" ADD CONSTRAINT "FreelanceProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralPrep" ADD CONSTRAINT "BehavioralPrep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LayoffStrategy" ADD CONSTRAINT "LayoffStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoffeeChatSession" ADD CONSTRAINT "CoffeeChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquityAnalysis" ADD CONSTRAINT "EquityAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurnoutAssessment" ADD CONSTRAINT "BurnoutAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideHustleIdea" ADD CONSTRAINT "SideHustleIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemoteWorkPitch" ADD CONSTRAINT "RemoteWorkPitch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTransfer" ADD CONSTRAINT "InternalTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerBreakPlan" ADD CONSTRAINT "CareerBreakPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaStrategy" ADD CONSTRAINT "VisaStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelocationAnalysis" ADD CONSTRAINT "RelocationAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorOutreach" ADD CONSTRAINT "MentorOutreach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
