import Link from "next/link";
import { ScanSearch, Mic, FileText, Mail, Bot, Briefcase } from "lucide-react";

const TOOLS = [
  {
    name: "ATS Analyzer",
    desc: "Score resume vs JD",
    icon: ScanSearch,
    iconColor: "text-blue-400",
    href: "/ats-analyzer",
  },
  {
    name: "Mock Interview",
    desc: "AI-powered practice",
    icon: Mic,
    iconColor: "text-emerald-400",
    href: "/interview/mock",
  },
  {
    name: "AI Assistant",
    desc: "Personal career coach",
    icon: Bot,
    iconColor: "text-purple-400",
    href: "/ai-assistant",
  },
  {
    name: "Resume Builder",
    desc: "Create or update resume",
    icon: FileText,
    iconColor: "text-amber-400",
    href: "/resume",
  },
  {
    name: "Cover Letter",
    desc: "Generate tailored letters",
    icon: Mail,
    iconColor: "text-red-400",
    href: "/ai-cover-letter",
  },
  {
    name: "Interview Prep",
    desc: "Reviews and insights",
    icon: Briefcase,
    iconColor: "text-blue-400",
    href: "/interview",
  },
];

export default function GrowthToolsGrid() {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-foreground mb-3">Growth Tools</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TOOLS.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <div className="border border-border rounded-lg p-4 cursor-pointer hover:border-border/80 hover:bg-muted/30 transition-colors group">
              <tool.icon className={`w-5 h-5 mb-2.5 ${tool.iconColor}`} />
              <p className="text-[13px] font-medium text-foreground mb-0.5">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
