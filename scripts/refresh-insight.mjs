import { PrismaClient } from "@prisma/client";
import { loadProjectEnv, requireDatabaseUrl } from "./load-env.mjs";

function printUsage() {
  console.log(`Usage: npm run refresh:insight -- [industry-slug]

Examples:
  npm run refresh:insight
  npm run refresh:insight -- tech-software-development
`);
}

async function main() {
  const industryArg = process.argv[2];

  if (industryArg === "--help" || industryArg === "-h") {
    printUsage();
    return;
  }

  loadProjectEnv();
  requireDatabaseUrl("refresh:insight");

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey || geminiKey === "undefined" || geminiKey === "null") {
    console.warn(
      "Warning: GEMINI_API_KEY is not set. Refresh will fall back to the default estimate snapshot."
    );
  }

  const { refreshIndustryInsight } = await import(
    "../lib/misc/industry-insight-refresh.js"
  );

  const industry = industryArg || "tech-software-development";
  const db = new PrismaClient();

  try {
    console.log(`Refreshing insights for: ${industry}`);
    const { industryInsight, insights } = await refreshIndustryInsight(db, industry);
    console.log(
      JSON.stringify(
        {
          industry,
          isGrounded: insights.isGrounded,
          nextUpdate: industryInsight.nextUpdate,
          topSkills: industryInsight.topSkills,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Error refreshing IndustryInsight:", error.message || error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
