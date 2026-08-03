import { PrismaClient } from '@prisma/client';
import { generateIndustryInsightData, getIndustryInsightRefreshTime } from '../lib/misc/industry-insights.js';

const db = new PrismaClient();
const industry = process.argv[2] || 'tech-software-development';

async function main(){
  try{
    console.log(`Refreshing insights for: ${industry}`);
    const insights = await generateIndustryInsightData(industry);
    const nextUpdate = getIndustryInsightRefreshTime();

    const industryInsight = await db.industryInsight.upsert({
      where: { industry },
      create: {
        industry,
        salaryRanges: insights.salaryRanges,
        growthRate: insights.growthRate,
        demandLevel: insights.demandLevel,
        topSkills: insights.topSkills,
        marketOutlook: insights.marketOutlook,
        keyTrends: insights.keyTrends,
        recommendedSkills: insights.recommendedSkills,
        isGrounded: insights.isGrounded,
        lastUpdated: new Date(),
        nextUpdate,
      },
      update: {
        salaryRanges: insights.salaryRanges,
        growthRate: insights.growthRate,
        demandLevel: insights.demandLevel,
        topSkills: insights.topSkills,
        marketOutlook: insights.marketOutlook,
        keyTrends: insights.keyTrends,
        recommendedSkills: insights.recommendedSkills,
        isGrounded: insights.isGrounded,
        lastUpdated: new Date(),
        nextUpdate,
      }
    });

    console.log(JSON.stringify({ industry, industryInsight }, null, 2));
  }catch(e){
    console.error('Error refreshing IndustryInsight:', e);
    process.exitCode = 1;
  }finally{
    await db.$disconnect();
  }
}

main();
