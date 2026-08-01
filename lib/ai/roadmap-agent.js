import "server-only";
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";

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

// Mock Job Market API Tool
export const fetchTrendingSkillsTool = tool(
  async ({ role, industry }) => {
    // In a production environment, this would call Adzuna, SerpAPI, etc.
    // Here we provide a realistic simulated response for demonstration.
    console.log(`[Mock API] Fetching trending skills for ${role} in ${industry}`);
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
  },
  {
    name: "fetch_trending_job_market_skills",
    description: "Fetches real-time trending, high-demand skills and market shifts for a specific role and industry.",
    schema: z.object({
      role: z.string(),
      industry: z.string(),
    }),
  }
);

/**
 * Runs the LangChain agent to adapt a user's roadmap based on market data.
 */
export async function adaptCareerRoadmapWithAgent({ currentMilestones, targetRole, industry }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Initialize the LLM with structured output capabilities
  const llm = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-pro",
    temperature: 0.2,
    maxOutputTokens: 8192,
  });

  // We use the tool-calling capability (also known as binding tools) 
  // and then force a structured output at the end.
  const llmWithTools = llm.bindTools([fetchTrendingSkillsTool]);

  const systemPrompt = PromptTemplate.fromTemplate(`You are an autonomous Career Roadmap Agent.
Your task is to dynamically restructure a user's learning roadmap based on real-time industry shifts.

User Profile:
- Target Role: {targetRole}
- Industry: {industry}

Current Roadmap Milestones:
{currentMilestones}

Instructions:
1. Use the \`fetch_trending_job_market_skills\` tool to find what is currently trending for the user's target role.
2. Analyze the trending skills returned by the tool.
3. Inject these high-demand skills into the user's curriculum by either updating existing incomplete milestones or adding new, highly relevant milestones.
4. Ensure the milestones progress logically from fundamental to advanced.
5. You MUST preserve any milestones that the user has already completed (isCompleted: true).

Begin!`);

  const promptValue = await systemPrompt.invoke({
    targetRole,
    industry,
    currentMilestones: JSON.stringify(currentMilestones, null, 2),
  });

  // Execute Tool Call
  const response = await llmWithTools.invoke(promptValue);
  
  let trendingData = "";
  if (response.tool_calls && response.tool_calls.length > 0) {
    const toolCall = response.tool_calls[0];
    if (toolCall.name === "fetch_trending_job_market_skills") {
      trendingData = await fetchTrendingSkillsTool.invoke(toolCall.args);
    }
  }

  // Final generation with Structured Output
  const structuredLlm = llm.withStructuredOutput(roadmapAdaptationSchema);
  
  const finalPrompt = PromptTemplate.fromTemplate(`You are an autonomous Career Roadmap Agent.
Your task is to dynamically restructure a user's learning roadmap based on real-time industry shifts.

User Profile:
- Target Role: {targetRole}
- Industry: {industry}

Current Roadmap Milestones:
{currentMilestones}

Market Data Insights:
{trendingData}

Instructions:
1. Inject the trending skills from the Market Data Insights into the user's curriculum by either updating existing incomplete milestones or adding new, highly relevant milestones.
2. Ensure the milestones progress logically from fundamental to advanced.
3. You MUST preserve any milestones that the user has already completed (isCompleted: true).
4. Return the fully updated list of milestones in the required JSON structure.`);

  const finalResponse = await structuredLlm.invoke(await finalPrompt.invoke({
    targetRole,
    industry,
    currentMilestones: JSON.stringify(currentMilestones, null, 2),
    trendingData,
  }));

  return finalResponse;
}
