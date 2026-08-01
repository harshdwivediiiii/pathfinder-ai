import "server-only";
import { db } from "@/lib/db/prisma";
import { log } from "@/lib/jobs/logger";
import { adaptCareerRoadmapWithAgent } from "@/lib/ai/roadmap-agent";

let _cronFnPromise;
let _workerFnPromise;

/**
 * Weekly cron to fan out roadmap adaptation requests.
 */
export function getWeeklyRoadmapAdaptationCron() {
  if (!_cronFnPromise) {
    _cronFnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();

      return inngest.createFunction(
        {
          id: "weekly-roadmap-adaptation-cron",
          name: "Weekly Roadmap Adaptation",
        },
        { cron: "0 0 * * 0" }, // Every Sunday at midnight
        async ({ step }) => {
          // Fetch all roadmaps that are active
          const allRoadmaps = await step.run("Fetch roadmaps", async () => {
            return await db.roadmap.findMany({
              select: { id: true, userId: true },
            });
          });

          if (allRoadmaps.length === 0) {
            return { dispatched: 0 };
          }

          await step.sendEvent(
            "Fan out roadmap adaptation events",
            allRoadmaps.map(({ userId }) => ({
              name: "roadmap/adaptation.requested",
              data: { userId },
            }))
          );

          log.info("weekly-roadmap-adaptation-cron", "Fan-out dispatched", {
            dispatched: allRoadmaps.length,
          });

          return { dispatched: allRoadmaps.length };
        }
      );
    })();
  }
  return _cronFnPromise;
}

/**
 * Worker to run the LangChain agent for roadmap adaptation.
 */
export function getProcessRoadmapAdaptation() {
  if (!_workerFnPromise) {
    _workerFnPromise = (async () => {
      const { getInngest } = await import("@/lib/inngest/client");
      const inngest = await getInngest();

      return inngest.createFunction(
        {
          id: "process-roadmap-adaptation",
          name: "Process Roadmap Adaptation",
          concurrency: 5,
          onFailure: async ({ error, event }) => {
            log.error("process-roadmap-adaptation", error, {
              userId: event?.data?.userId,
              eventId: event?.id,
            });
          },
        },
        { event: "roadmap/adaptation.requested" },
        async ({ event, step }) => {
          const { userId } = event.data;
          
          const { user, roadmap } = await step.run("Fetch user and roadmap", async () => {
            const user = await db.user.findUnique({
              where: { id: userId },
              select: { id: true, targetRole: true, industry: true },
            });
            const roadmap = await db.roadmap.findUnique({
              where: { userId },
              include: { milestones: { orderBy: { createdAt: 'asc' } } },
            });
            return { user, roadmap };
          });

          if (!user || !roadmap || !user.targetRole || !user.industry) {
            log.info("process-roadmap-adaptation", "Missing user/roadmap/profile data, skipping", { userId });
            return { skipped: true };
          }

          const currentMilestones = roadmap.milestones.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            skillsToLearn: m.skillsToLearn,
            estimatedDuration: m.estimatedDuration,
            priority: m.priority,
            isCompleted: m.isCompleted,
          }));

          // Run LangChain agent
          const updatedRoadmapData = await step.run("Run LangChain Agent", async () => {
            return await adaptCareerRoadmapWithAgent({
              currentMilestones,
              targetRole: user.targetRole,
              industry: user.industry,
            });
          });

          // Persist the updated milestones
          await step.run("Persist updated roadmap", async () => {
            await db.$transaction(async (tx) => {
              // Delete old milestones
              await tx.roadmapMilestone.deleteMany({
                where: { roadmapId: roadmap.id },
              });

              // Create new ones
              await tx.roadmap.update({
                where: { id: roadmap.id },
                data: {
                  content: updatedRoadmapData,
                  milestones: {
                    create: updatedRoadmapData.milestones.map((m) => ({
                      title: m.title,
                      description: m.description,
                      skillsToLearn: m.skillsToLearn || [],
                      estimatedDuration: m.estimatedDuration,
                      priority: m.priority,
                      isCompleted: m.isCompleted,
                    })),
                  },
                },
              });
            });
          });

          log.info("process-roadmap-adaptation", "Roadmap adapted successfully", { userId });

          return { userId, updated: true };
        }
      );
    })();
  }
  return _workerFnPromise;
}
