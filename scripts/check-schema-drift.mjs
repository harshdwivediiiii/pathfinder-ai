import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tables declared in prisma/schema.prisma that used to have no migration.
// If any of these is missing after `npx prisma migrate deploy`, the deploy is
// broken and the Prisma client will fail on every query against it, so fail the
// boot immediately instead of crashing on the first real request.
const REQUIRED_TABLES = [
  ['RoadmapMilestone', () => prisma.roadmapMilestone.count()],
  ['PathfindingSession', () => prisma.pathfindingSession.count()],
  ['PathfindingVersion', () => prisma.pathfindingVersion.count()],
  ['Issue', () => prisma.issue.count()],
  ['AgentRun', () => prisma.agentRun.count()],
  ['ProjectWorkspace', () => prisma.projectWorkspace.count()],
  ['ProjectNote', () => prisma.projectNote.count()],
  ['ProjectAgentOutput', () => prisma.projectAgentOutput.count()],
  ['ProjectActivity', () => prisma.projectActivity.count()],
];

async function main() {
  const missing = [];

  for (const [table, query] of REQUIRED_TABLES) {
    try {
      await query();
      console.log(`[schema-drift-check] OK: "${table}" table exists.`);
    } catch (error) {
      missing.push(table);
      console.error(`[schema-drift-check] FAIL: "${table}" table is missing (${error?.message || error}).`);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[schema-drift-check] Schema drift detected: ${missing.join(', ')} table(s) are missing from the database. ` +
        'Run `npx prisma migrate deploy` against the latest migrations or add a migration for these models.'
    );
    process.exitCode = 1;
  } else {
    console.log('[schema-drift-check] All required tables exist. Schema is in sync.');
  }
}

main()
  .catch((error) => {
    console.error('[schema-drift-check] Failed to run schema smoke check:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
