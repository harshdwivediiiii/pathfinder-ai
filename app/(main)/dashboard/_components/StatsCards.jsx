export default function StatsCards({ resumes = [], coverLetters = [], interviews = [] }) {
  // Defensive checks to prevent .map crashes if props are not arrays
  const safeResumes = Array.isArray(resumes) ? resumes : [];
  const safeCoverLetters = Array.isArray(coverLetters) ? coverLetters : [];
  const safeInterviews = Array.isArray(interviews) ? interviews : [];

  const bestAtsScore = Math.max(
    0,
    ...safeResumes.map((r) => r.atsScore || 0),
    ...safeResumes.map((r) => r.score || 0) // fallback field name
  );

  const getAtsColor = (score) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    if (score > 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const stats = [
    { label: "Resumes Created", value: safeResumes.length },
    { label: "Mock Interviews", value: safeInterviews.length },
    { 
      label: "Best ATS Score", 
      value: bestAtsScore > 0 ? `${bestAtsScore}%` : "0%",
      color: getAtsColor(bestAtsScore)
    },
    { label: "Cover Letters", value: safeCoverLetters.length },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-muted/50 rounded-lg p-4 border border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-xl font-medium ${stat.color || "text-foreground"}`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
