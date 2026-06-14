export default function NextBestActions({ actions = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">
      <h2 className="text-xl font-semibold">Next Best Actions</h2>
      <p className="mt-1 text-sm text-slate-400">
        Practical recommendations to improve pipeline momentum.
      </p>

      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
          >
            <div className="flex gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
                {index + 1}
              </div>
              <p className="text-sm text-slate-200">{action}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}