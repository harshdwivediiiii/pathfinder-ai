"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Copy, Target, Briefcase, GraduationCap, Code, Sparkles, Plus, AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const SECTION_ICONS = {
  skills: <Code className="w-5 h-5" />,
  experience: <Briefcase className="w-5 h-5" />,
  projects: <Target className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />
};

export default function MatchResult({ result, onReset }) {
  const {
    matchScore = 0,
    matchedKeywords = [],
    missingKeywords = [],
    sectionFeedback = {},
    suggestions = [],
    improvedBulletPoints = []
  } = result;

  const scoreColor = matchScore >= 75 ? "text-green-500" : matchScore >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBgColor = matchScore >= 75 ? "bg-green-500" : matchScore >= 50 ? "bg-amber-500" : "bg-red-500";
  const strokeDashoffset = 283 - (283 * matchScore) / 100;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Top Section: Score & Keywords */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Score Ring */}
        <Card className="glass flex flex-col items-center justify-center p-8 lg:col-span-1 border-border/50 relative overflow-hidden">
          <div className={`absolute top-0 w-full h-1 ${scoreBgColor}`} />
          <h3 className="text-lg font-bold mb-6 text-foreground">Overall Match</h3>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-muted/30 stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
              />
              <motion.circle
                className={`${scoreColor} stroke-current`}
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ strokeDasharray: 283 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-black ${scoreColor}`}>{Math.round(matchScore)}</span>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>
        </Card>

        {/* Keywords */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-border/50 h-full">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> Keyword Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              
              {/* Matched */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-500 font-semibold text-sm uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Matched ({matchedKeywords.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedKeywords.length > 0 ? (
                    matchedKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 rounded-md">
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No matches found.</span>
                  )}
                </div>
              </div>

              {/* Missing */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-semibold text-sm uppercase tracking-wider mb-2">
                  <XCircle className="w-4 h-4" /> Missing ({missingKeywords.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.length > 0 ? (
                    missingKeywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 rounded-md">
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None missing!</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Feedback */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <Briefcase className="w-6 h-6 text-primary" /> Section Feedback
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(sectionFeedback).map(([section, data]) => {
            if (!data || typeof data !== "object" || data.score === undefined || !data.feedback) return null;
            const secScoreColor = data.score >= 75 ? "text-green-500" : data.score >= 50 ? "text-amber-500" : "text-red-500";
            return (
              <Card key={section} className="glass border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base capitalize flex items-center gap-2">
                    {SECTION_ICONS[section] || <Sparkles className="w-4 h-4" />}
                    {section}
                  </CardTitle>
                  <span className={`font-bold ${secScoreColor}`}>{data.score}/100</span>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.feedback}</p>
                  {data.suggestions && (
                    <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Suggestion:
                      </p>
                      <p className="text-xs text-muted-foreground">{data.suggestions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Improved Bullets */}
      {improvedBulletPoints?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="w-6 h-6 text-amber-500" /> Improved Bullet Points
          </h3>
          <div className="grid gap-4">
            {improvedBulletPoints.map((bp, i) => (
              <Card key={i} className="glass border-border/50">
                <CardContent className="p-4 grid md:grid-cols-[1fr_auto_1fr_auto] items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Original</span>
                    <p className="text-sm text-muted-foreground opacity-80">{bp.original}</p>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center text-muted">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-1 relative">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Improved</span>
                    <p className="text-sm text-foreground font-medium">{bp.improved}</p>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(bp.improved)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary justify-self-end md:justify-self-center"
                    title="Copy improved bullet point"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* General Suggestions */}
      {suggestions?.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-foreground">
              <Plus className="w-6 h-6 text-blue-500" /> General Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((sug, i) => (
              <div key={i} className="flex gap-3 text-sm text-muted-foreground bg-background/40 p-3 rounded-lg border border-border/20">
                <span className="font-bold text-primary">{i + 1}.</span>
                <p className="leading-relaxed">{sug}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pt-6">
        <Button 
          onClick={onReset}
          className="rounded-xl h-12 px-8 font-bold shadow-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Analyze Another Job
        </Button>
      </div>

    </motion.div>
  );
}
