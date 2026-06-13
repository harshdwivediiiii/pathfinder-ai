"use client";

import { useCareerShortlist } from "@/hooks/use-career-shortlist";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, TrendingUp, DollarSign, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function CareerCard({ career }) {
  const { isShortlisted, toggleShortlist } = useCareerShortlist();
  const saved = isShortlisted(career.id);

  return (
    <Card className="h-full flex flex-col hover:shadow-xl hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${career.color}`}>
            <span className="text-xl font-bold">{career.matchScore}%</span>
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
        <CardTitle className="text-xl font-bold">{career.title}</CardTitle>
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
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {career.skills.slice(0, 3).map(skill => (
              <Badge key={skill} variant="secondary" className="text-[10px]">
                {skill}
              </Badge>
            ))}
            {career.skills.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">+{career.skills.length - 3}</Badge>
            )}
          </div>
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
