"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import SkillGapForm from "./_components/SkillGapForm";
import SkillGapResult from "./_components/SkillGapResult";
import { generateSkillGapAnalysis, getSkillGapAnalysis } from "@/actions/skill-gap";

export default function SkillGapAnalyzerPage() {
  const [data, setData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExistingAnalysis() {
      try {
        const { data: existingData, error } = await getSkillGapAnalysis();
        if (error) {
          console.error(error);
          toast.error("Failed to load previous analysis.");
        } else if (existingData) {
          setData(existingData.analysis);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadExistingAnalysis();
  }, []);

  const onSubmit = async (formData) => {
    setIsGenerating(true);
    try {
      const response = await generateSkillGapAnalysis(formData);
      if (response.error) {
        throw new Error(response.error);
      }
      setData(response.data?.analysis);
      toast.success("Skill Gap Analysis generated successfully!");
      // Optionally scroll to results here
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (error) {
      toast.error(error.message || "Failed to generate analysis.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-12">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Skill Gap Analyzer</h1>
        <p className="text-lg text-muted-foreground">
          Compare your current skills with your target role requirements and get a personalized, actionable learning roadmap to bridge the gap.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <SkillGapForm onSubmit={onSubmit} isGenerating={isGenerating} />
        
        {data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold tracking-tight">Your Analysis Results</h2>
              <button 
                onClick={() => setData(null)} 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Clear Results
              </button>
            </div>
            <SkillGapResult data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
