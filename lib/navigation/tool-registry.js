import {
  FileText,
  ScanSearch,
  Mail,
  MessageSquare,
  Brain,
  BriefcaseBusiness,
  Target,
  Map,
} from "lucide-react";

/**
 * Canonical registry for dashboard career tools.
 *
 * Keep href values aligned with the actual routes
 * under app/(main)/.
 */
export const TOOL_REGISTRY = [
  {
    href: "/resume",
    label: "Resume Builder",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    href: "/ats-analyzer",
    label: "ATS Analyzer",
    icon: ScanSearch,
    color: "text-purple-500",
  },
  {
    href: "/cover-letter",
    label: "Cover Letter Generator",
    icon: Mail,
    color: "text-green-500",
  },
  {
    href: "/interview",
    label: "Interview Prep",
    icon: MessageSquare,
    color: "text-orange-500",
  },
  {
    href: "/mock-interview",
    label: "Mock Interview",
    icon: Brain,
    color: "text-pink-500",
  },
  {
    href: "/job-tracker",
    label: "Job Tracker",
    icon: BriefcaseBusiness,
    color: "text-cyan-500",
  },
  {
    href: "/career-roadmap",
    label: "Career Roadmap",
    icon: Target,
    color: "text-indigo-500",
  },
  {
    href: "/career-map",
    label: "Career Map",
    icon: Map,
    color: "text-emerald-500",
  },
];

/**
 * Resolve a stored route to its tool metadata.
 */
export function getToolByHref(href) {
  if (!href) return null;

  return TOOL_REGISTRY.find((tool) => tool.href === href) ?? null;
}