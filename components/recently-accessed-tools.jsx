"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Clock, History } from "lucide-react";

import { useRecentTools } from "@/hooks/use-recent-tools";
import { getToolByHref } from "@/lib/navigation/tool-registry";

export default function RecentlyAccessedTools() {
  const { recentTools, isLoaded } = useRecentTools();

  if (!isLoaded || recentTools.length === 0) {
    return null;
  }

  const tools = recentTools
    .map((entry) => {
      const tool = getToolByHref(entry.href);

      if (!tool) {
        return null;
      }

      return {
        ...entry,
        ...tool,
      };
    })
    .filter(Boolean);

  if (tools.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recent-tools-heading"
      className="mb-6 rounded-2xl border border-border/50 bg-card p-4 shadow-soft sm:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <History className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h2
            id="recent-tools-heading"
            className="text-lg font-semibold"
          >
            Recently Accessed Tools
          </h2>

          <p className="text-sm text-muted-foreground">
            Quickly continue where you left off
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              key={tool.href}
              href={tool.href}
              aria-label={`Open ${tool.label}`}
              className="group rounded-xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon
                    className={`h-5 w-5 ${tool.color}`}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-semibold group-hover:text-primary">
                  {tool.label}
                </h3>

                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock
                    className="h-3 w-3"
                    aria-hidden="true"
                  />

                  <span>
                    {formatDistanceToNow(
                      new Date(tool.accessedAt),
                      {
                        addSuffix: true,
                      }
                    )}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}