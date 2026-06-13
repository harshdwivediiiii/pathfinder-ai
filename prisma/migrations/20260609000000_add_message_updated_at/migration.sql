-- AlterTable: Add updatedAt to Message model for PATCH/DELETE message tracking
ALTER TABLE "Message" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

