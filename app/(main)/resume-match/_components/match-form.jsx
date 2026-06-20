"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { analyzeResumeMatch } from "@/actions/resume-match";
import { resumeMatchSchema } from "@/lib/schemas/forms";
import { toast } from "sonner";
import { Loader2, FileText, Briefcase, Building, Type, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function MatchForm({ savedResumeContent, onAnalysisComplete }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(resumeMatchSchema),
    defaultValues: {
      resumeContent: "",
      jobDescription: "",
      jobTitle: "",
      companyName: "",
    },
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;

  const resumeText = watch("resumeContent") || "";
  const jdText = watch("jobDescription") || "";

  const onSubmit = (data) => {
    startTransition(async () => {
      try {
        const result = await analyzeResumeMatch(data);
        if (result.success) {
          toast.success("Analysis complete!");
          onAnalysisComplete(result.data);
        } else {
          toast.error(result.errors?._form?.[0] || "Analysis failed. Please try again.");
        }
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  const handleUseSavedResume = () => {
    if (!savedResumeContent) {
      toast.error("No saved resume found in your profile.");
      return;
    }
    setValue("resumeContent", savedResumeContent, { shouldValidate: true });
    toast.success("Loaded saved resume.");
  };

  return (
    <Card className="glass overflow-hidden border-border/50">
      <div className="h-1 w-full bg-gradient-to-r from-primary to-blue-500" />
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="jobTitle" className="flex items-center gap-2 text-foreground font-semibold">
                <Briefcase className="w-4 h-4 text-primary" /> Target Job Title
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Frontend Engineer"
                className="bg-background/50 h-12 rounded-xl border-border/50 focus-visible:ring-primary"
                {...register("jobTitle")}
              />
              {errors.jobTitle && <p className="text-red-500 text-xs font-medium">{errors.jobTitle.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="companyName" className="flex items-center gap-2 text-foreground font-semibold">
                <Building className="w-4 h-4 text-blue-500" /> Target Company
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Google, Stripe"
                className="bg-background/50 h-12 rounded-xl border-border/50 focus-visible:ring-primary"
                {...register("companyName")}
              />
              {errors.companyName && <p className="text-red-500 text-xs font-medium">{errors.companyName.message}</p>}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="resumeContent" className="flex items-center gap-2 text-foreground font-semibold">
                  <FileText className="w-4 h-4 text-amber-500" /> Resume Content <span className="text-red-500">*</span>
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUseSavedResume}
                  className="h-8 text-xs font-semibold rounded-lg bg-background/50 hover:bg-background"
                >
                  Use Saved Resume
                </Button>
              </div>
              <Textarea
                id="resumeContent"
                placeholder="Paste your full resume text here..."
                className="h-64 resize-none bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary p-4"
                {...register("resumeContent")}
              />
              <div className="flex justify-between items-center text-xs font-medium">
                {errors.resumeContent ? (
                  <p className="text-red-500">{errors.resumeContent.message}</p>
                ) : (
                  <span />
                )}
                <span className={`transition-colors ${resumeText.length > 45000 ? 'text-red-500' : resumeText.length > 300 ? 'text-green-500' : 'text-amber-500'}`}>
                  {resumeText.length} chars
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="jobDescription" className="flex items-center gap-2 text-foreground font-semibold">
                <Type className="w-4 h-4 text-emerald-500" /> Job Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the target job description here..."
                className="h-64 resize-none bg-background/50 rounded-xl border-border/50 focus-visible:ring-primary p-4"
                {...register("jobDescription")}
              />
              <div className="flex justify-between items-center text-xs font-medium">
                {errors.jobDescription ? (
                  <p className="text-red-500">{errors.jobDescription.message}</p>
                ) : (
                  <span />
                )}
                <span className={`transition-colors ${jdText.length > 15000 ? 'text-red-500' : jdText.length > 300 ? 'text-green-500' : 'text-amber-500'}`}>
                  {jdText.length} chars
                </span>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full h-14 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Match...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Generate Match Score
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
