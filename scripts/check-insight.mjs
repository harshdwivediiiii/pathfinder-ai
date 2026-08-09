import { PrismaClient } from "@prisma/client";
import { loadProjectEnv, requireDatabaseUrl } from "./load-env.mjs";

async function main() {
  loadProjectEnv();
  requireDatabaseUrl("check:insight");

  const industry = process.argv[2] || "tech-software-development";
  const db = new PrismaClient();

  try {
    const insight = await db.industryInsight.findUnique({ where: { industry } });
    console.log(JSON.stringify({ industry, insight }, null, 2));
  } catch (error) {
    console.error("Error querying IndustryInsight:", error.message || error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
