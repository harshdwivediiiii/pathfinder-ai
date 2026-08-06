"use client";

import { useCareerShortlist } from "@/hooks/use-career-shortlist";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, TrendingUp, DollarSign, Clock } from "lucide-react";

export function CareerCard({ career }) {
  const { isShortlisted, toggleShortlist } = useCareerShortlist();
  const saved = isShortlisted(career.id);
  const isPersonalized = Boolean(career.isPersonalized);
  const hasMatchScore = typeof career.matchScore === "number";
  const showMatched = isPersonalized && career.matchedSkills?.length > 0;
  const primarySkills = showMatched ? career.matchedSkills : career.skills;

  return (
    <Card className="h-full flex flex-col hover:shadow-xl hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${career.color}`}>
            {hasMatchScore ? (
              <span className="text-xl font-bold">{career.matchScore}%</span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1 text-center leading-tight">
                Example
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleShortlist(career)}
            className={`rounded-full ${saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Save Career"
          >
            {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl font-bold">{career.title}</CardTitle>
          {!isPersonalized && (
            <Badge variant="outline" className="shrink-0 text-[10px] font-semibold">
              Browse
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">{career.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-foreground">{career.salary}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-foreground">{career.growth}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>{career.timeToLearn}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {showMatched ? "Matched Skills" : "Key Skills"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {primarySkills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px]">
                {skill}
              </Badge>
            ))}
            {primarySkills.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{primarySkills.length - 3}
              </Badge>
            )}
          </div>
          {isPersonalized && career.missingSkills?.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Skills to build
              </p>
              <div className="flex flex-wrap gap-1.5">
                {career.missingSkills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px]">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant={saved ? "secondary" : "default"}
          className="w-full rounded-xl font-bold"
          onClick={() => toggleShortlist(career)}
        >
          {saved ? "Remove from Shortlist" : "Add to Shortlist"}
        </Button>
      </CardFooter>
    </Card>
  );
}
