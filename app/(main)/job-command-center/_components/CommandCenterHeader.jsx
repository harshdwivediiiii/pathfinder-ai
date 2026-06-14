export default function CommandCenterHeader({ jobs = [] }) {
  const interviewing = jobs.filter((job) => job.status === "Interviewing").length;
  const applied = jobs.filter((job) => job.status === "Applied").length;
  const avgAts = jobs.length
    ? Math.round(jobs.reduce((sum, job) => sum + (job.atsScore || 0), 0) / jobs.length)
    : 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 shadow-2xl">
      <div className="grid gap-6 px-6 py-8 md:grid-cols-2 md:px-8">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
            Smart Workflow Hub
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Job Application Command Center
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
            A unified dashboard for tracking applications, readiness signals, ATS fit,
            interview momentum, and next-best actions across your job search.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/70">Applications</p>
            <p className="mt-2 text-3xl font-bold">{jobs.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/70">Interviewing</p>
            <p className="mt-2 text-3xl font-bold">{interviewing}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/70">Avg ATS</p>
            <p className="mt-2 text-3xl font-bold">{avgAts}%</p>
          </div>
          <div className="col-span-3 rounded-2xl bg-black/20 p-4">
            <p className="text-sm font-medium text-white/90">
              Applied roles: <span className="font-bold">{applied}</span>
            </p>
            <p className="mt-1 text-sm text-white/70">
              Focus next on low-score jobs, pending follow-ups, and interview-stage prep.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}