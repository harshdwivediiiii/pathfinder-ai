-- Change JobApplication foreign key constraints from SET NULL to RESTRICT
-- This prevents orphaned references when ATS Analysis or Cover Letter records are deleted

-- Drop existing foreign key constraints
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_atsAnalysisId_fkey";
ALTER TABLE "JobApplication" DROP CONSTRAINT "JobApplication_coverLetterId_fkey";

-- Add new foreign key constraints with RESTRICT behavior
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_atsAnalysisId_fkey" 
  FOREIGN KEY ("atsAnalysisId") REFERENCES "ATSAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_coverLetterId_fkey" 
  FOREIGN KEY ("coverLetterId") REFERENCES "CoverLetter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
