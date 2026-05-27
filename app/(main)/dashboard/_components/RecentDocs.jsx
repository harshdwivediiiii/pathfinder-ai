import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Mail, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="mb-8">
        <p className="text-sm font-medium text-foreground mb-3">Recent Documents</p>
        <div className="border border-border rounded-lg py-10 text-center text-sm text-muted-foreground">
          No documents yet.{" "}
          <Link href="/resume" className="text-foreground underline underline-offset-2">
            Create your first resume →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-foreground mb-3">Recent Documents</p>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_72px_64px] gap-2 px-4 py-2 bg-muted/50 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Name</span>
          <span>Type</span>
          <span>Updated</span>
          <span>Status</span>
        </div>
        {merged.map((doc) => (
          <Link key={`${doc.type}-${doc.id}`} href={doc.href}>
            <div className="grid grid-cols-[1fr_100px_72px_64px] gap-2 px-4 py-3 border-t border-border text-[13px] items-center hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 truncate">
                {doc.type === "Resume" && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                {doc.type === "Cover Letter" && <Mail className="w-3.5 h-3.5 text-emerald-400" />}
                {doc.type === "Interview" && <Mic className="w-3.5 h-3.5 text-amber-400" />}
                <span className="truncate max-w-[140px]">{doc.name}</span>
              </div>
              <div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-sm font-medium",
                    doc.type === "Resume" && "bg-blue-500/10 text-blue-400",
                    doc.type === "Cover Letter" && "bg-emerald-500/10 text-emerald-400",
                    doc.type === "Interview" && "bg-amber-500/10 text-amber-400"
                  )}
                >
                  {doc.type}
                </span>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(doc.updatedAt)} ago
              </div>
              <div>
                {doc.status ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-sm font-medium bg-muted text-muted-foreground">
                    {doc.status}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
