"use client";

import { useState, useTransition, useRef } from "react";
import { analyzeATS } from "@/actions/ats";
import { extractTextFromFile, ACCEPTED_RESUME_TYPES } from "@/lib/extract-resume-text";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, Briefcase, Sparkles, ClipboardPaste, FileUp, CheckCircle2 } from "lucide-react";

const RESUME_MAX = 5000;
const JD_MAX = 8000;

const getQualityHint = (length, max) => {
  if (length === 0) return null;
  if (length > max) return { text: "🔴 Exceeds limit — please shorten", color: "text-destructive" };
  if (length < 50) return { text: "🔴 Too short — AI needs more context", color: "text-destructive" };
  if (length < 200) return { text: "🟡 Getting there...", color: "text-yellow-500" };
  return { text: "🟢 Good length for AI generation", color: "text-green-500" };
};

export default function ATSForm({ savedResumeContent, onComplete }) {
  const [resumeContent, setResumeContent] = useState(savedResumeContent || "");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef(null);

  const resumeHint = getQualityHint(resumeContent.length, RESUME_MAX);
  const jdHint = getQualityHint(jobDescription.length, JD_MAX);
  const isOverLimit = resumeContent.length > RESUME_MAX || jobDescription.length > JD_MAX;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resumeContent.trim()) {
      toast.error("Please paste your resume content.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please paste the job description.");
      return;
    }
    if (isOverLimit) {
      toast.error("Please shorten your input — character limit exceeded.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await analyzeATS({
          resumeContent,
          jobDescription,
          jobTitle,
          companyName,
        });

        // Surface server-side validation errors or generic error
        if (!result?.success) {
          const errorMessage =
            result?.errors?.resumeContent?.[0] ||
            result?.errors?.jobDescription?.[0] ||
            result?.errors?.jobTitle?.[0] ||
            result?.errors?.companyName?.[0] ||
            result?.errors?._form?.[0] ||
            "Analysis failed. Please review your input and try again.";

          toast.error(errorMessage);
          return;
        }
        toast.success("ATS analysis complete!");
        onComplete(result.data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Analysis failed. Please try again.");
      }
    });
  };

  const handlePreFill = () => {
    if (savedResumeContent) {
      setResumeContent(savedResumeContent);
      setUploadedFileName("");
      toast.success("Resume pre-filled from your saved resume.");
    } else {
      toast.info("No saved resume found. Build one in the Resume section first.");
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setIsExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeContent(text);
      setUploadedFileName(file.name);
      toast.success(`Imported "${file.name}". Review the text below before analyzing.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not read that file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileInputChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isPending || isExtracting) return;
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Job meta row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Job Title <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Company Name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g. Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main input panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume panel */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-blue-500" />
              Your Resume
            </CardTitle>
            <CardDescription>
              Upload a PDF or DOCX, reuse your saved resume, or paste the text.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload resume file"
              onClick={() => { if (!isPending && !isExtracting) fileInputRef.current?.click(); }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isPending && !isExtracting) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); if (!isPending && !isExtracting) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40",
                isPending || isExtracting ? "pointer-events-none opacity-60" : "cursor-pointer"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_RESUME_TYPES}
                onChange={handleFileInputChange}
                className="sr-only"
                disabled={isPending || isExtracting}
              />
              {isExtracting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Extracting text…</span>
                </>
              ) : (
                <>
                  <FileUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Drop your resume here, or{" "}
                    <span className="text-primary underline underline-offset-2">browse</span>
                  </span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, TXT or MD · max 5 MB</span>
                </>
              )}
            </div>

            {savedResumeContent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start flex items-center gap-2 text-xs"
                onClick={handlePreFill}
                disabled={isPending || isExtracting}
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Use My Saved Resume
              </Button>
            )}

            <Textarea
              id="resumeContent"
              placeholder="…or paste your resume content here.\n\nInclude: Work Experience, Skills, Education, Projects, Certifications."
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              className={cn(
                "flex-1 min-h-[300px] resize-none font-mono text-sm leading-relaxed",
                resumeContent.length > RESUME_MAX && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isPending || isExtracting}
              required
            />

            {/* Character counter + quality hint */}
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "transition-colors",
                resumeContent.length > RESUME_MAX ? "text-destructive font-medium" :
                resumeContent.length > RESUME_MAX * 0.8 ? "text-yellow-500" :
                "text-muted-foreground"
              )}>
                {resumeContent.length} / {RESUME_MAX} characters
              </span>
              <div className="flex items-center gap-3">
                {resumeHint && (
                  <span className={cn("transition-colors", resumeHint.color)}>
                    {resumeHint.text}
                  </span>
                )}
                {uploadedFileName && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {uploadedFileName}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job description panel */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-violet-500" />
              Job Description
            </CardTitle>
            <CardDescription>
              Paste the full job description — the more detail, the better the analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here...\n\nInclude: Responsibilities, Requirements, Nice-to-haves, Tech stack."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className={cn(
                "flex-1 min-h-[380px] resize-none font-mono text-sm leading-relaxed",
                jobDescription.length > JD_MAX && "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isPending}
              required
            />

            {/* Character counter + quality hint */}
            <div className="flex items-center justify-between text-xs">
              <span className={cn(
                "transition-colors",
                jobDescription.length > JD_MAX ? "text-destructive font-medium" :
                jobDescription.length > JD_MAX * 0.8 ? "text-yellow-500" :
                "text-muted-foreground"
              )}>
                {jobDescription.length} / {JD_MAX} characters
              </span>
              {jdHint && (
                <span className={cn("transition-colors", jdHint.color)}>
                  {jdHint.text}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={isPending || isExtracting || isOverLimit}
          className="min-w-[220px] h-12 text-base font-semibold flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing with AI…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Analyze My Resume
            </>
          )}
        </Button>
      </div>

      {isOverLimit && (
        <p className="text-center text-sm text-destructive font-medium">
          ⚠️ Please shorten your input before analyzing.
        </p>
      )}

      {isPending && (
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          Gemini AI is scoring your resume — this takes ~10 seconds…
        </p>
      )}
    </form>
  );
}