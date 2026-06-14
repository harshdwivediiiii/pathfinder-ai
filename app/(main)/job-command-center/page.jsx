import CommandCenterHeader from "./_components/CommandCenterHeader";
import ApplicationPipeline from "./_components/ApplicationPipeline";
import ATSFitPanel from "./_components/ATSFitPanel";
import NextBestActions from "./_components/NextBestActions";
import FollowUpTimeline from "./_components/FollowUpTimeline";

export default function JobCommandCenterPage() {
  const jobs = [
    {
      id: 1,
      company: "Notion",
      role: "Growth Associate",
      status: "Applied",
      atsScore: 87,
      resumeReady: true,
      coverLetterReady: true,
      interviewReady: false,
      nextAction: "Send recruiter follow-up email",
      deadline: "2026-06-20",
    },
    {
      id: 2,
      company: "Linear",
      role: "Operations Manager",
      status: "Saved",
      atsScore: 78,
      resumeReady: true,
      coverLetterReady: false,
      interviewReady: false,
      nextAction: "Tailor cover letter to role keywords",
      deadline: "2026-06-18",
    },
    {
      id: 3,
      company: "Stripe",
      role: "Product Operations Analyst",
      status: "Interviewing",
      atsScore: 93,
      resumeReady: true,
      coverLetterReady: true,
      interviewReady: true,
      nextAction: "Practice behavioral interview set",
      deadline: "2026-06-22",
    },
  ];

  const timeline = [
    { date: "2026-06-11", label: "Saved target role at Notion" },
    { date: "2026-06-12", label: "Tailored resume for Stripe application" },
    { date: "2026-06-13", label: "Submitted application to Notion" },
    { date: "2026-06-14", label: "Interview round scheduled with Stripe" },
  ];

  const actions = [
    "Prioritize jobs with ATS score below 80",
    "Send follow-up for applications older than 5 days",
    "Generate missing cover letters for saved jobs",
    "Start mock interview practice for interviewing-stage roles",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 lg:px-8">
        <CommandCenterHeader jobs={jobs} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ApplicationPipeline jobs={jobs} />
            <FollowUpTimeline timeline={timeline} />
          </div>
          <div className="space-y-6">
            <ATSFitPanel jobs={jobs} />
            <NextBestActions actions={actions} />
          </div>
        </div>
      </div>
    </div>
  );
}