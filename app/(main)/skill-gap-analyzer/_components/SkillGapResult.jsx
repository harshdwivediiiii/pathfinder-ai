"use client";

import { CheckCircle2, AlertTriangle, Lightbulb, Map, Target, CalendarDays, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function SkillGapResult({ data }) {
  if (!data) return null;

  const {
    matchPercentage,
    matchedSkills,
    missingSkills,
    weeklyRoadmap,
    suggestedProjects,
    interviewFocus,
  } = data;

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Match Score */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="8"
                  cx="64"
                  cy="64"
                  r="56"
                  fill="transparent"
                ></circle>
                <circle
                  className="text-primary stroke-current transition-all duration-1000 ease-in-out"
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="64"
                  cy="64"
                  r="56"
                  fill="transparent"
                  strokeDasharray="351.86"
                  strokeDashoffset={351.86 - (351.86 * matchPercentage) / 100}
                ></circle>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{matchPercentage}%</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Match</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold">Skill Alignment Score</h3>
              <p className="text-muted-foreground">
                Based on your current profile and the target role requirements, you have a {matchPercentage}% skill match. 
                Focus on the high-priority missing skills to improve your chances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Matched Skills
            </CardTitle>
            <CardDescription>Skills you already possess</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchedSkills?.length > 0 ? (
                matchedSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No matched skills found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Missing Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Skill Gaps
            </CardTitle>
            <CardDescription>Skills you need to learn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingSkills?.length > 0 ? (
                missingSkills.map((item, index) => (
                  <Badge key={index} variant="outline" className={`px-3 py-1 border-0 ${getPriorityColor(item.priority)}`}>
                    {item.skill}
                    <span className="ml-2 text-[10px] uppercase opacity-70 font-bold">{item.priority}</span>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No missing skills found. You're fully prepared!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Map className="w-5 h-5 text-primary" />
            Learning Roadmap
          </CardTitle>
          <CardDescription>A structured plan to acquire missing skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {weeklyRoadmap?.map((week, index) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <CalendarDays className="w-3 h-3" />
                </div>
                
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">{week.week}</span>
                    </div>
                    <h4 className="font-bold text-base mt-1">{week.focus}</h4>
                    <ul className="mt-3 space-y-2">
                      {week.tasks?.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Target className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects & Interview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Suggested Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {suggestedProjects?.map((project, index) => (
                <AccordionItem key={index} value={`project-${index}`}>
                  <AccordionTrigger className="text-left font-semibold hover:text-primary">
                    {project.name}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.skillsPracticed?.map((skill, idx) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="w-5 h-5 text-purple-500" />
              Interview Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {interviewFocus?.map((focus, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-secondary">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm">{focus}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
