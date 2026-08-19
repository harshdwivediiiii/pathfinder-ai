"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Mail, Mic, ChevronRight, Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/misc/utils";
import { motion } from "framer-motion";

export default function RecentDocs({ resumes = [], coverLetters = [], interviews = [] }) {
  const merged = [
    ...resumes.map((r) => ({
      id: r.id,
      name: r.name || "My Resume",
      type: "Resume",
      updatedAt: new Date(r.updatedAt),
      status: r.atsScore ? `ATS ${r.atsScore}%` : null,
      href: "/resume",
    })),
    ...coverLetters.map((c) => ({
      id: c.id,
      name: `${c.jobTitle} at ${c.companyName}`,
      type: "Cover Letter",
      updatedAt: new Date(c.updatedAt),
      status: null,
      href: `/ai-cover-letter/${c.id}`,
    })),
    ...interviews.map((i) => ({
      id: i.id,
      name: `${i.category} Interview`,
      type: "Interview",
      updatedAt: new Date(i.updatedAt),
      status: i.quizScore ? `${i.quizScore}/100` : null,
      href: `/interview/${i.id}`,
    })),
  ]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  if (merged.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Recent Activity</h3>
          <div className="h-px bg-border flex-grow" />
        </div>
        <div className="rounded-[2rem] border border-dashed border-border p-12 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold">No documents yet</p>
            <p className="text-xs text-muted-foreground">Start building your professional profile today.</p>
          </div>
          <Link href="/resume" className="inline-block pt-2">
            <button className="text-xs font-bold text-primary hover:underline">
              Create your first resume →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-grow">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">Recent Activity</h3>
          <div className="h-px bg-border flex-grow" />
        </div>
      </div>

      <div className="space-y-3">
        {merged.map((doc, i) => (
          <motion.div
            key={`${doc.type}-${doc.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={doc.href} className="group block">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300",
                  doc.type === "Resume" && "bg-blue-500/10 text-blue-500",
                  doc.type === "Cover Letter" && "bg-emerald-500/10 text-emerald-500",
                  doc.type === "Interview" && "bg-amber-500/10 text-amber-500"
                )}>
                  {doc.type === "Resume" && <FileText className="h-5 w-5" />}
                  {doc.type === "Cover Letter" && <Mail className="h-5 w-5" />}
                  {doc.type === "Interview" && <Mic className="h-5 w-5" />}
                </div>

                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{doc.type}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    {doc.status && (
                      <span className="text-[10px] font-bold text-primary">{doc.status}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{doc.name}</h4>
                </div>

                <div className="flex flex-col items-end gap-1.5 min-w-[80px]">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(doc.updatedAt)} ago
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <button className="w-full py-3 rounded-2xl border border-border bg-muted/30 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors">
        View All Activity
      </button>
    </div>
  );
}
