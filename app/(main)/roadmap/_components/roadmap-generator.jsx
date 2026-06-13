"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Map, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateCareerRoadmap } from "@/actions/roadmap";
import useFetch from "@/hooks/use-fetch";

export default function RoadmapGenerator() {
  const router = useRouter();

  const {
    loading: generating,
    fn: generateRoadmapFn,
    data: generatedRoadmap,
    error,
  } = useFetch(generateCareerRoadmap);

  useEffect(() => {
    if (generatedRoadmap) {
      toast.success("Career roadmap generated successfully!");
      router.push("/roadmap");
    }
  }, [generatedRoadmap, router]);

  useEffect(() => {
    if (error) {
      toast.error(
        error.message?.includes("quota")
          ? "AI quota reached — please try again in a few minutes."
          : error.message || "Failed to generate roadmap"
      );
    }
  }, [error]);

  const handleGenerate = async () => {
    try {
      await generateRoadmapFn();
    } catch (err) {
      // Error already handled by useFetch toast
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Generate Career Roadmap</CardTitle>
              <CardDescription className="text-sm">
                AI will analyze your profile to create a personalized step-by-step roadmap
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="glass rounded-2xl p-5 border border-border/30 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              What will be used
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Your current role and target role
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Your skills and experience level
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Your career goals and industry
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Your professional bio
              </li>
            </ul>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Make sure your profile is complete in{" "}
              <a href="/settings" className="text-primary hover:underline font-medium">Settings</a>{" "}
              for the most accurate roadmap.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
              className="h-14 px-10 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Generating your roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Roadmap
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
