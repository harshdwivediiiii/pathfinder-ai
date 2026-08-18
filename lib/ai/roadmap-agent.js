import "server-only";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  MARKET_SKILLS_CATALOG_VERSION,
  resolveMarketSkills,
} from "@/lib/ai/market-skills-catalog";

// The schema matching the roadmap milestones expected by the DB
export const roadmapAdaptationSchema = z.object({
  milestones: z.array(
    z.object({
      title: z.string().min(3).max(100),
      description: z.string().min(10).max(500),
      skillsToLearn: z.array(z.string().min(1).max(50)).min(1).max(10),
      estimatedDuration: z.string().min(1).max(50),
      priority: z.enum(["high", "medium", "low"]),
      isCompleted: z.boolean().default(false),
    })
  )
    .min(3, "At least 3 milestones are required.")
    .max(20, "Too many milestones provided."),
  summary: z.string().min(10).max(1000).optional(),
});

/**
 * LangChain tool backed by the versioned curated catalog / insight resolver.
 * Explicitly not a live job-board API.
 */
export const fetchTrendingSkillsTool = tool(
  async ({ role, industry }) => {
    // In a production environment, this would call Adzuna, SerpAPI, etc.
    // Here we provide a realistic simulated response for demonstration.
    console.info(`[Mock API] Fetching trending skills for ${role} in ${industry}`);
    const lowerRole = role.toLowerCase();
    
    if (lowerRole.includes("software") || lowerRole.includes("developer") || lowerRole.includes("engineer")) {
      return JSON.stringify({
        trending_skills: ["Rust", "Generative AI", "RAG (Retrieval-Augmented Generation)", "Go", "Kubernetes"],
        declining_skills: ["jQuery", "AngularJS", "PHP (Legacy)"],
        market_shift: "Strong demand for developers with AI integration skills and systems programming (Rust/Go)."
      });
    } else if (lowerRole.includes("data")) {
      return JSON.stringify({
        trending_skills: ["LLMOps", "Vector Databases (Pinecone/Milvus)", "PyTorch", "Apache Iceberg"],
        declining_skills: ["Hadoop", "MapReduce"],
        market_shift: "Shift towards real-time analytics and managing large language models (LLMOps)."
      });
    }
    
    return JSON.stringify({
      trending_skills: ["AI Tools Literacy", "Data-Driven Decision Making", "Remote Collaboration"],
      market_shift: "General shift towards AI-augmented workflows across all industries."
    });
    const market = resolveMarketSkills({ role, industry });
    return JSON.stringify(market);
  },
  {
    name: "fetch_trending_job_market_skills",
    description:
      `Returns curated, versioned market-skill guidance (${MARKET_SKILLS_CATALOG_VERSION}) for a role and industry. ` +
      "This is not a real-time job-board feed.",
    schema: z.object({
      role: z.string(),
      industry: z.string(),
    }),
  }
);

/**
 * Runs the LangChain agent to adapt a user's roadmap based on curated market data.
 * When market data cannot be resolved, returns adapted:false and preserves milestones.
 */
export async function adaptCareerRoadmapWithAgent({
  currentMilestones,
  targetRole,
  industry,
  industryInsight = null,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const market = resolveMarketSkills({
    role: targetRole,
    industry,
    industryInsight,
  });

  if (!market.available) {
    return {
      adapted: false,
      reason: market.reason || "Market skills data unavailable.",
      catalogVersion: market.catalogVersion || MARKET_SKILLS_CATALOG_VERSION,
      milestones: currentMilestones,
      summary: `Adaptation skipped: ${market.reason || "market skills data unavailable"}. Existing roadmap preserved.`,
    };
  }

  const llm = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-pro",
    temperature: 0.2,
    maxOutputTokens: 8192,
  });

  const llmWithTools = llm.bindTools([fetchTrendingSkillsTool]);

  const systemPrompt = PromptTemplate.fromTemplate(`You are an autonomous Career Roadmap Agent.
Your task is to restructure a user's learning roadmap using curated market-skill guidance (not a live job-board feed).

User Profile:
- Target Role: {targetRole}
- Industry: {industry}

Current Roadmap Milestones:
{currentMilestones}

Pre-resolved market guidance (source: {sourceLabel}):
{marketData}

Instructions:
1. You may call \`fetch_trending_job_market_skills\` to re-check the curated catalog, but treat it as versioned guidance, not real-time intelligence.
2. Prefer the pre-resolved market guidance above when adapting milestones.
3. Inject high-demand skills into incomplete milestones or add relevant new milestones.
4. Ensure the milestones progress logically from fundamental to advanced.
5. You MUST preserve any milestones that the user has already completed (isCompleted: true).
6. If the market guidance is empty or unusable, do not invent live market claims.

Begin!`);

  const promptValue = await systemPrompt.invoke({
    targetRole,
    industry,
    currentMilestones: JSON.stringify(currentMilestones, null, 2),
    sourceLabel: market.sourceLabel,
    marketData: JSON.stringify(market, null, 2),
  });

  const response = await llmWithTools.invoke(promptValue);

  let trendingData = JSON.stringify(market);
  if (response.tool_calls && response.tool_calls.length > 0) {
    const toolCall = response.tool_calls[0];
    if (toolCall.name === "fetch_trending_job_market_skills") {
      trendingData = await fetchTrendingSkillsTool.invoke(toolCall.args);
      const parsed = typeof trendingData === "string" ? JSON.parse(trendingData) : trendingData;
      if (parsed && parsed.available === false) {
        return {
          adapted: false,
          reason: parsed.reason || "Market skills data unavailable.",
          catalogVersion: parsed.catalogVersion || MARKET_SKILLS_CATALOG_VERSION,
          milestones: currentMilestones,
          summary: `Adaptation skipped: ${parsed.reason || "market skills data unavailable"}. Existing roadmap preserved.`,
        };
      }
    }
  }

  const structuredLlm = llm.withStructuredOutput(roadmapAdaptationSchema);

  const finalPrompt = PromptTemplate.fromTemplate(`You are an autonomous Career Roadmap Agent.
Your task is to restructure a user's learning roadmap using curated market-skill guidance.

User Profile:
- Target Role: {targetRole}
- Industry: {industry}

Current Roadmap Milestones:
{currentMilestones}

Curated market guidance (not real-time job-board data):
{trendingData}

Instructions:
1. Inject trending skills from the curated guidance into incomplete milestones or add relevant new milestones.
2. Ensure the milestones progress logically from fundamental to advanced.
3. You MUST preserve any milestones that the user has already completed (isCompleted: true).
4. Do not claim the guidance is live market intelligence.
5. Return the fully updated list of milestones in the required JSON structure.`);

  const finalResponse = await structuredLlm.invoke(
    await finalPrompt.invoke({
      targetRole,
      industry,
      currentMilestones: JSON.stringify(currentMilestones, null, 2),
      trendingData,
    })
  );

  return {
    adapted: true,
    reason: null,
    catalogVersion: market.catalogVersion,
    source: market.source,
    ...finalResponse,
  };
}
