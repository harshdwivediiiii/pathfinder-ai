"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  { id:"harvard",      type:"resume",  name:"Harvard Classic", 
    tag:"Clean minimal",    badge:"ATS Ready",  badgeColor:"emerald",
    href:"/resume?template=harvard" },
  { id:"split",        type:"resume",  name:"Modern Split", 
    tag:"Two column",       badge:"Popular",    badgeColor:"blue",
    href:"/resume?template=split" },
  { id:"tech",         type:"resume",  name:"Tech Pro", 
    tag:"For engineers",    badge:null,         badgeColor:null,
    href:"/resume?template=tech" },
  { id:"professional", type:"cover",   name:"Professional", 
    tag:"Formal tone",      badge:"New",        badgeColor:"blue",
    href:"/cover-letter?template=professional" },
  { id:"startup",      type:"cover",   name:"Startup Pitch", 
    tag:"Casual & bold",    badge:null,         badgeColor:null,
    href:"/cover-letter?template=startup" },
  { id:"minimal",      type:"cover",   name:"Minimal Line", 
    tag:"Clean design",     badge:null,         badgeColor:null,
    href:"/cover-letter?template=minimal" },
];

function TemplatePreview({ id }) {
  // Simple mockup using divs
  return (
    <div className="w-[76px] h-[100px] bg-background border border-border rounded-sm p-2 flex flex-col gap-1.5 shadow-sm overflow-hidden">
      <div className={cn("h-1 w-full rounded-full", id.includes("resume") || id === "harvard" || id === "split" || id === "tech" ? "bg-blue-400/30" : "bg-emerald-400/30")} />
      <div className="h-1 w-[60%] bg-muted-foreground/20 rounded-full" />
      <div className="flex gap-1 mt-1">
        <div className="h-1 w-1/2 bg-muted-foreground/20 rounded-full" />
        <div className="h-1 w-1/4 bg-muted-foreground/20 rounded-full" />
      </div>
      <div className="h-1 w-full bg-muted-foreground/10 rounded-full mt-2" />
      <div className="h-1 w-full bg-muted-foreground/10 rounded-full" />
      <div className="h-1 w-full bg-muted-foreground/10 rounded-full" />
      {id === "split" && (
        <div className="flex gap-1 mt-2">
          <div className="w-1/3 h-8 bg-muted/50 rounded-sm" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1 w-full bg-muted-foreground/10 rounded-full" />
            <div className="h-1 w-full bg-muted-foreground/10 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplatesTab() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = TEMPLATES.filter((t) => {
    if (filter === "All") return true;
    if (filter === "Resumes") return t.type === "resume";
    if (filter === "Cover Letters") return t.type === "cover";
    return true;
  });

  return (
    <div>
      <h1 className="text-lg font-medium text-foreground mb-1">Templates</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Pick a starting point — AI fills in your details
      </p>

      <div className="flex gap-2 mb-6">
        {["All", "Resumes", "Cover Letters"].map((f) => (
          <div
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-md border border-border cursor-pointer transition-colors",
              filter === f 
                ? "bg-muted text-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div 
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={cn(
              "border rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-foreground/30",
              selected === t.id 
                ? "border-blue-500/60 ring-1 ring-blue-500/20" 
                : "border-border"
            )}
          >
            <div className="h-28 bg-muted flex items-center justify-center relative">
              <TemplatePreview id={t.id} />
              {t.badge && (
                <span className={cn(
                  "absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-sm font-medium",
                  t.badgeColor === "emerald" 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-blue-500/10 text-blue-400"
                )}>
                  {t.badge}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-[12px] font-medium text-foreground">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.tag}</p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-5 flex items-center justify-between px-4 py-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
          <span className="text-sm text-blue-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Template selected — AI will pre-fill your profile data.
          </span>
          <Link href={TEMPLATES.find(t => t.id === selected)?.href || "#"}>
            <button className="text-xs font-medium text-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors">
              Use Template →
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
