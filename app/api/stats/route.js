import { db } from "@/lib/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";

export async function GET() {
  try {
    const [totalUsers, usersWithAssessments, assessmentStats] = await Promise.all([
      db.user.count(),
      db.assessment.groupBy({
        by: ["userId"],
        _count: { id: true },
      }),
      db.assessment.aggregate({
        _avg: { quizScore: true },
        _count: { id: true },
      }),
    ]);

    const careerMatchCount = usersWithAssessments.length;
    const careerMatchRate =
      totalUsers > 0 ? Math.round((careerMatchCount / totalUsers) * 100) : 0;

    const avgScore = assessmentStats._avg.quizScore ?? 0;
    const successRate = Math.round(avgScore);
    const avgRating = avgScore > 0 ? (avgScore / 20).toFixed(1) : "0.0";

    const studentsGuided =
      totalUsers >= 1000
        ? `${(totalUsers / 1000).toFixed(1).replace(/\.0$/, "")}k+`
        : String(totalUsers);

    const stats = {
      studentsGuided,
      careerMatches: `${careerMatchRate}%`,
      successRate: `${successRate}%`,
      avgRating,
    };

    return Response.json(stats);
  } catch (err) {
    console.error("[api/stats]", err);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to load stats");
  }
}
