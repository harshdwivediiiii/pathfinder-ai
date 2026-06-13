"use client";

import { useCareerShortlist } from "@/hooks/use-career-shortlist";
import { motion } from "framer-motion";
import { ArrowLeft, Layers, Check, Trophy, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ComparePage() {
  const { shortlist, toggleShortlist, isLoaded } = useCareerShortlist();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (shortlist.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Layers className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Careers Selected</h2>
        <p className="text-muted-foreground mb-6">You haven't added any careers to compare yet.</p>
        <Link href="/explore">
          <Button>Explore Careers</Button>
        </Link>
      </div>
    );
  }

  // Find max values to highlight
  const highestMatch = Math.max(...shortlist.map(c => c.matchScore));
  const highestSalary = Math.max(...shortlist.map(c => c.salaryValue));
  const highestGrowth = Math.max(...shortlist.map(c => c.growthValue));

  const MetricRow = ({ label, icon: Icon, renderValue }) => (
    <div className="border-b border-border/50 py-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shortlist.map((career, i) => (
          <div key={career.id} className="text-sm">
            {renderValue(career)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <Link href="/explore" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
            <Layers className="h-8 w-8 md:h-12 md:w-12 text-primary" />
            Compare <span className="text-gradient-primary">Careers</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Side-by-side analysis of your top {shortlist.length} career options.
          </p>
        </div>

        <div className="glass rounded-3xl border border-border/50 p-6 md:p-8 bg-card shadow-sm overflow-hidden">
          
          {/* Header Row (Titles) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {shortlist.map((career, i) => (
              <motion.div
                key={career.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl border border-border/50 bg-background shadow-sm"
              >
                <button 
                  onClick={() => toggleShortlist(career)}
                  className="absolute top-4 right-4 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${career.color}`}>
                  <span className="text-xl font-bold">{career.matchScore}%</span>
                </div>
                <h2 className="text-xl font-bold mb-2">{career.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{career.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2">
            <MetricRow 
              label="Match Score" 
              renderValue={(c) => (
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${c.matchScore === highestMatch ? 'text-primary' : 'text-foreground'}`}>
                    {c.matchScore}%
                  </span>
                  {c.matchScore === highestMatch && <Badge className="bg-primary/10 text-primary border-primary/20"><Trophy className="h-3 w-3 mr-1" /> Best Match</Badge>}
                </div>
              )} 
            />

            <MetricRow 
              label="Average Salary" 
              renderValue={(c) => (
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${c.salaryValue === highestSalary ? 'text-emerald-500' : 'text-foreground'}`}>
                    {c.salary}
                  </span>
                  {c.salaryValue === highestSalary && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Highest</Badge>}
                </div>
              )} 
            />

            <MetricRow 
              label="Job Market Growth" 
              renderValue={(c) => (
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${c.growthValue === highestGrowth ? 'text-blue-500' : 'text-foreground'}`}>
                    {c.growth}
                  </span>
                  {c.growthValue === highestGrowth && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Fastest</Badge>}
                </div>
              )} 
            />

            <MetricRow 
              label="Estimated Learning Time" 
              renderValue={(c) => (
                <span className="text-base font-semibold">{c.timeToLearn}</span>
              )} 
            />

            <MetricRow 
              label="Education Requirements" 
              renderValue={(c) => (
                <span className="text-sm font-medium text-muted-foreground">{c.education}</span>
              )} 
            />

            <MetricRow 
              label="Required Skills" 
              renderValue={(c) => (
                <div className="flex flex-wrap gap-1.5">
                  {c.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              )} 
            />

            <MetricRow 
              label="Recommended Courses" 
              renderValue={(c) => (
                <ul className="space-y-2">
                  {c.courses.map((course, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{course}</span>
                    </li>
                  ))}
                </ul>
              )} 
            />

            <MetricRow 
              label="Career Roadmap Summary" 
              renderValue={(c) => (
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-sm leading-relaxed italic text-muted-foreground">
                  "{c.roadmapSummary}"
                </div>
              )} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border/50">
            {shortlist.map((career) => (
              <Link key={`btn-${career.id}`} href={`/roadmap/generate?career=${encodeURIComponent(career.title)}`} className="w-full">
                <Button className="w-full font-bold rounded-xl" variant="outline">
                  Generate {career.title} Roadmap
                </Button>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
