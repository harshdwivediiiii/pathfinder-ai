export default function ATSFitPanel({ jobs = [] }) {
  const lowScore = jobs.filter((job) => (job.atsScore || 0) < 80);
  const strongest = [...jobs].sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0))[0];

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">
      <h2 className="text-xl font-semibold">ATS Fit Intelligence</h2>
      <p className="mt-1 text-sm text-slate-400">
        Highlight weaker applications and surface the strongest match in your pipeline.
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Strongest Match</p>
        {strongest ? (
          <>
            <p className="mt-2 text-lg font-semibold">{strongest.company}</p>
            <p className="text-sm text-slate-300">{strongest.role}</p>
            <p className="mt-2 text-sm text-emerald-300">ATS Score: {strongest.atsScore}%</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No applications yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Needs Optimization</p>
        {lowScore.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {lowScore.map((job) => (
              <li key={job.id} className="flex items-center justify-between">
                <span>{job.company}</span>
                <span className="text-amber-300">{job.atsScore}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-400">All tracked jobs are above the threshold.</p>
        )}
      </div>
    </section>
  );
}