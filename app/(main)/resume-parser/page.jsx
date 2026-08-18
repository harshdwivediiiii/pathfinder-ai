"use client";

import React, { useState } from "react";
import { parseResumeText, generateGapPathway } from "./_components/ner-algorithm";
import { FileText, Cpu, ScanLine, ArrowRight, CheckCircle2, Target, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ResumeParserPage() {
  const [resumeText, setResumeText] = useState("I am a self-taught web developer. I have built several projects using HTML, CSS, and basic JavaScript. I also have some experience using Git for version control on GitHub.");
  const [targetCareer, setTargetCareer] = useState("fullstack");
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState(null);

  const handleParse = () => {
      setIsParsing(true);
      setResult(null);
      
      // Simulate network/processing delay
      setTimeout(() => {
          const extractedSkills = parseResumeText(resumeText);
          const pathwayData = generateGapPathway(extractedSkills, targetCareer);
          setResult(pathwayData);
          setIsParsing(false);
      }, 1500);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
          <ScanLine className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NLP Resume to Pathway</h1>
          <p className="text-muted-foreground">Drop a resume and instantly generate a personalized learning pathway using Named Entity Recognition (NER).</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Left Column: Input */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <FileText className="w-5 h-5 text-cyan-500" />
                 Resume Input
              </CardTitle>
              <CardDescription>Paste your raw resume text below. Our NLP pipeline will extract your current technical skills.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col space-y-6">
              
              <Textarea 
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[250px] font-mono text-sm resize-none flex-grow"
                  placeholder="Paste resume content here..."
              />
              
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Target className="w-4 h-4" /> Select Target Career Goal
                  </label>
                  <Select value={targetCareer} onValueChange={setTargetCareer}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select target career" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fullstack">Fullstack Web Developer</SelectItem>
                      <SelectItem value="data_science">Data Scientist</SelectItem>
                      <SelectItem value="devops">Cloud DevOps Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                      onClick={handleParse} 
                      disabled={isParsing || !resumeText.trim()}
                      className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700"
                  >
                      {isParsing ? (
                          <>
                              <Cpu className="w-4 h-4 mr-2 animate-pulse" /> Parsing via NLP...
                          </>
                      ) : (
                          <>
                              Generate Pathway <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                      )}
                  </Button>
              </div>
              
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output / Generated Pathway */}
        <div className="space-y-6">
          
          {!result && !isParsing && (
              <div className="h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                  <ScanLine className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                  <p>Awaiting resume input.</p>
                  <p className="text-sm">Click "Generate Pathway" to run the NER extraction pipeline.</p>
              </div>
          )}
          
          {isParsing && (
              <div className="h-full border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-card">
                  <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-cyan-200 dark:border-cyan-900 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                      <Cpu className="absolute inset-0 m-auto w-8 h-8 text-cyan-500 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analyzing Resume...</h3>
                  <p className="text-sm text-muted-foreground animate-pulse">Extracting Named Entities & calculating skill gaps</p>
              </div>
          )}
          
          {result && !isParsing && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Extraction Summary */}
                <Card className="border-cyan-500/20 shadow-sm overflow-hidden">
                    <div className="bg-cyan-500 h-2 w-full"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between items-center">
                            <span>Gap Analysis</span>
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-900/50">
                                {result.targetTitle}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Current Readiness</span>
                                <span className="font-bold text-cyan-600">{result.readinessScore}%</span>
                            </div>
                            <Progress value={result.readinessScore} className="h-2" />
                        </div>
                        
                        <div className="space-y-2 pt-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recognized Existing Skills (NER)</span>
                            <div className="flex flex-wrap gap-2">
                                {result.recognizedSkills.length > 0 ? (
                                    result.recognizedSkills.map(skill => (
                                        <Badge key={skill} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none dark:bg-emerald-900/30 dark:text-emerald-400 capitalize">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground italic">No relevant technical skills detected.</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Generated Pathway */}
                <Card className="border shadow-sm">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-500" />
                            Your Auto-Generated Pathway
                        </CardTitle>
                        <CardDescription>
                            We've skipped what you already know. Here is the customized curriculum to reach your goal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        
                        {result.recommendedPathway.length === 0 ? (
                            <div className="text-center p-6 bg-emerald-50 text-emerald-800 rounded-lg dark:bg-emerald-900/20 dark:text-emerald-400">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                <p className="font-semibold">You are fully prepared!</p>
                                <p className="text-sm">Your resume indicates you already possess all the required core skills for this career.</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {result.recommendedPathway.map((module, i) => (
                                    <div key={module.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-200 group-[.is-active]:bg-cyan-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            {i + 1}
                                        </div>
                                        
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold capitalize text-lg">{module.skill} Module</h4>
                                                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{module.difficulty}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Est. time: {module.estimatedHours} hrs</p>
                                        </div>
                                        
                                    </div>
                                ))}
                            </div>
                        )}
                        
                    </CardContent>
                </Card>
                
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
