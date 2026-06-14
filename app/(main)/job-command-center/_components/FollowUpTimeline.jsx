export default function FollowUpTimeline({ timeline = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">
      <h2 className="text-xl font-semibold">Activity & Follow-Up Timeline</h2>
      <p className="mt-1 text-sm text-slate-400">
        Review the latest pipeline events and keep follow-ups on track.
      </p>

      <div className="mt-4 space-y-4">
        {timeline.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-cyan-400" />
              <div className="mt-1 h-full min-h-[28px] w-px bg-white/10" />
            </div>
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.date}</p>
              <p className="mt-1 text-sm text-slate-200">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}