"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCoverLetter } from "@/actions/cover-letter";
import useFetch from "@/hooks/use-fetch";
import { coverLetterSchema } from "@/app/lib/schema";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const JD_MAX = 6000;

const getQualityHint = (length, max) => {
  if (length === 0) return null;
  if (length > max) return { text: "🔴 Exceeds limit — please shorten", color: "text-destructive" };
  if (length < 50) return { text: "🔴 Too short — AI needs more context", color: "text-destructive" };
  if (length < 200) return { text: "🟡 Getting there...", color: "text-yellow-500" };
  return { text: "🟢 Good length for AI generation", color: "text-green-500" };
};

export default function CoverLetterGenerator() {
  const router = useRouter();
  const [jdLength, setJdLength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
  });

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
  } = useFetch(generateCoverLetter);

  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!");
      router.push(`/ai-cover-letter/${generatedLetter.id}`);
      reset();
      setJdLength(0);
    }
  }, [generatedLetter]);

  const jdHint = getQualityHint(jdLength, JD_MAX);
  const isOverLimit = jdLength > JD_MAX;

  const onSubmit = async (data) => {
    if (isOverLimit) {
      toast.error("Please shorten your job description before generating.");
      return;
    }
    try {
      await generateLetterFn(data);
    } catch (error) {
      toast.error(
        error.message?.includes("quota")
          ? "AI quota reached — please try again in a few minutes."
          : error.message || "Failed to generate cover letter"
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide information about the position you're applying for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Enter job title"
                  {...register("jobTitle")}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-500">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here"
                className={cn(
                  "h-32",
                  jdLength > JD_MAX && "border-destructive focus-visible:ring-destructive"
                )}
                {...register("jobDescription", {
                  onChange: (e) => setJdLength(e.target.value.length),
                })}
              />

              {/* Character counter + quality hint */}
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  "transition-colors",
                  jdLength > JD_MAX ? "text-destructive font-medium" :
                  jdLength > JD_MAX * 0.8 ? "text-yellow-500" :
                  "text-muted-foreground"
                )}>
                  {jdLength} / {JD_MAX} characters
                </span>
                {jdHint && (
                  <span className={cn("transition-colors", jdHint.color)}>
                    {jdHint.text}
                  </span>
                )}
              </div>

              {errors.jobDescription && (
                <p className="text-sm text-red-500">
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            {isOverLimit && (
              <p className="text-sm text-destructive font-medium">
                ⚠️ Job description exceeds the limit. Please shorten it before generating.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={generating || isOverLimit}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}