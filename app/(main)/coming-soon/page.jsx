import Link from "next/link";
import { Sparkles, ArrowRight, Clock } from "lucide-react";

export const metadata = { title: "Coming Soon - Pathfinder AI" };

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-violet-600/8 via-transparent to-blue-600/5 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-xs font-semibold uppercase tracking-widest">
          <Clock size={12} />Coming Soon
        </div>
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-600/30">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Pricing plans launching soon</h1>
          <p className="text-white/50 text-lg leading-relaxed">We are building flexible, value-driven plans to match every stage of your career. Join the waitlist to get early access.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold transition-colors">
            Start Free <ArrowRight size={16} />
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium transition-colors">
            Back to Home
          </Link>
        </div>
        <p className="text-sm text-white/30">Pathfinder AI is free to use during the beta period.</p>
      </div>
    </div>
  );
}
