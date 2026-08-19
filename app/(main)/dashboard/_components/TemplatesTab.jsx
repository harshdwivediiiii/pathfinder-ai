"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, FileText, Mail, Layout } from "lucide-react";
import { cn } from "@/lib/misc/utils";
import { motion, AnimatePresence } from "framer-motion";

const TEMPLATES = [
  { id:"harvard",      type:"resume",  name:"Harvard Classic", 
    tag:"Clean & minimal",    badge:"ATS Ready",  badgeColor:"emerald",
    href:"/resume?template=harvard" },
  { id:"split",        type:"resume",  name:"Modern Split", 
    tag:"Two column",       badge:"Popular",    badgeColor:"blue",
    href:"/resume?template=split" },
  { id:"tech",         type:"resume",  name:"Tech Pro", 
    tag:"For engineers",    badge:null,         badgeColor:null,
    href:"/resume?template=tech" },
  { id:"professional", type:"cover",   name:"Professional", 
    tag:"Formal tone",      badge:"New",        badgeColor:"blue",
    href:"/ai-cover-letter?template=professional" },
  { id:"startup",      type:"cover",   name:"Startup Pitch", 
    tag:"Casual & bold",    badge:null,         badgeColor:null,
    href:"/ai-cover-letter?template=startup" },
  { id:"minimal",      type:"cover",   name:"Minimal Line", 
    tag:"Clean design",     badge:null,         badgeColor:null,
    href:"/ai-cover-letter?template=minimal" },
];

function TemplatePreview({ id, type }) {
  return (
    <div className="w-[100px] h-[140px] bg-background border border-border rounded-xl p-3 flex flex-col gap-2 shadow-sm overflow-hidden transition-transform duration-500 group-hover:scale-105">
      <div className={cn("h-1.5 w-full rounded-full", type === "resume" ? "bg-blue-500/20" : "bg-primary/20")} />
      <div className="h-1.5 w-[70%] bg-muted/40 rounded-full" />
      <div className="flex gap-1.5 mt-1">
        <div className="h-1.5 w-1/2 bg-muted/40 rounded-full" />
        <div className="h-1.5 w-1/4 bg-muted/40 rounded-full" />
      </div>
      <div className="h-1.5 w-full bg-muted/20 rounded-full mt-3" />
      <div className="h-1.5 w-full bg-muted/20 rounded-full" />
      <div className="h-1.5 w-[85%] bg-muted/20 rounded-full" />
      
      {id === "split" && (
        <div className="flex gap-2 mt-3">
          <div className="w-1/3 h-10 bg-muted/30 rounded-lg" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-1.5 w-full bg-muted/20 rounded-full" />
            <div className="h-1.5 w-full bg-muted/20 rounded-full" />
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
    if (filter === "Letters") return t.type === "cover";
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            Smart Templates
          </h2>
          <p className="text-sm text-muted-foreground">Premium layouts powered by AI precision.</p>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-xl border border-border w-fit">
          {["All", "Resumes", "Letters"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === f 
                  ? "bg-background text-foreground shadow-sm border border-border" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((t, i) => (
          <motion.div 
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(t.id)}
            className={cn(
              "group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer border-2 transition-all duration-300",
              selected === t.id 
                ? "border-primary bg-primary/[0.02] shadow-xl ring-4 ring-primary/5" 
                : "border-transparent bg-card border-border hover:border-border/80 hover:shadow-lg"
            )}
          >
            <div className="h-44 bg-muted/30 flex items-center justify-center relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <TemplatePreview id={t.id} type={t.type} />
              
              {t.badge && (
                <span className={cn(
                  "absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm",
                  t.badgeColor === "emerald" 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                )}>
                  {t.badge}
                </span>
              )}

              {selected === t.id && (
                <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                  <Check className="h-3 w-3 stroke-[3px]" />
                </div>
              )}
            </div>

            <div className="p-5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                {t.type === "resume" ? <FileText className="h-3 w-3 text-muted-foreground" /> : <Mail className="h-3 w-3 text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground font-medium">{t.tag}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 rounded-3xl border border-primary/20 bg-primary/[0.02] flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Check className="h-6 w-6 stroke-[3px]" />
              </div>
              <div>
                <p className="font-bold text-foreground">Template Selected</p>
                <p className="text-xs text-muted-foreground">Proceed to build your {TEMPLATES.find(t => t.id === selected)?.type === "resume" ? "resume" : "cover letter"} with AI filling.</p>
              </div>
            </div>
            
            <Link href={TEMPLATES.find(t => t.id === selected)?.href || "#"} className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
                Continue to Builder
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
