function StatusBadge({ status }) {
  const map = {
    Saved: "bg-slate-700 text-slate-100",
    Applied: "bg-blue-600/20 text-blue-300",
    Interviewing: "bg-emerald-600/20 text-emerald-300",
    Offer: "bg-violet-600/20 text-violet-300",
    Rejected: "bg-rose-600/20 text-rose-300",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${map[status] || "bg-white/10 text-white"}`}>
      {status}
    </span>
  );
}

function ReadinessPill({ label, active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? "bg-emerald-600/20 text-emerald-300" : "bg-slate-800 text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}

export default function ApplicationPipeline({ jobs = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Application Pipeline</h2>
        <p className="text-sm text-slate-400">
          Track company status, readiness signals, and recommended next actions.
        </p>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-400/40 hover:shadow-lg"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{job.company}</h3>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-1 text-sm text-slate-300">{job.role}</p>
                <p className="mt-2 text-xs text-slate-500">Deadline: {job.deadline}</p>
              </div>

              <div className="min-w-[180px]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">ATS Fit</span>
                  <span className="font-semibold text-white">{job.atsScore}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${job.atsScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ReadinessPill label="Resume Ready" active={job.resumeReady} />
              <ReadinessPill label="Cover Letter Ready" active={job.coverLetterReady} />
              <ReadinessPill label="Interview Ready" active={job.interviewReady} />
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="text-xs uppercase tracking-wide text-cyan-300">Next Best Action</p>
              <p className="mt-1 text-sm text-slate-200">{job.nextAction}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}