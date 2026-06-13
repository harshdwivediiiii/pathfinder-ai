"use client";

import { useState, useEffect } from "react";
import { generateAssessmentStrategy, getBehavioralPreps } from "@/actions/behavioral-prep";
import { BrainCircuit, Sparkles, Building2, UserCircle2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function BehavioralPrepPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activePrep, setActivePrep] = useState(null);
  const [formData, setFormData] = useState({ company: "", assessmentType: "" });

  useEffect(() => {
    async function loadHistory() {
      const res = await getBehavioralPreps();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActivePrep(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateAssessmentStrategy(formData.company, formData.assessmentType);
    if (res.success) {
      toast.success("Assessment strategy generated!");
      setHistory([res.data, ...history]);
      setActivePrep(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate strategy");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-[0.2em]">
              <BrainCircuit className="h-3 w-3" />
              Interview Testing
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Behavioral <span className="text-rose-500">Prep</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Demystify corporate personality tests (Pymetrics, PI, etc.) and learn what traits they want.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">The Assessment</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Company Name
                  </label>
                  <Input
                    placeholder="e.g. Goldman Sachs"
                    className="h-12 rounded-xl bg-background"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <UserCircle2 className="h-3.5 w-3.5" /> Test Type
                  </label>
                  <Input
                    placeholder="e.g. Pymetrics, Myers-Briggs"
                    className="h-12 rounded-xl bg-background"
                    value={formData.assessmentType}
                    onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.company || !formData.assessmentType}
                  className="w-full h-12 rounded-xl font-bold mt-4 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                >
                  {loading ? "Analyzing..." : "Decode Assessment"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activePrep ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Psychology Summary */}
                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-xl">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <BrainCircuit className="h-5 w-5 text-rose-500" /> The Psychology Behind It
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {activePrep.content.whatTheyAreTesting}
                  </p>
                </div>

                {/* Ideal Traits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePrep.content.idealTraits?.map((trait, idx) => (
                    <div key={idx} className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-rose-500" />
                        <h4 className="font-bold text-rose-600 dark:text-rose-400">{trait.trait}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{trait.description}</p>
                    </div>
                  ))}
                </div>

                {/* Strategies */}
                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-md">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-green-500" /> How to Approach the Test
                  </h3>
                  <ul className="space-y-4">
                    {activePrep.content.strategies?.map((strategy, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-muted/50 p-4 rounded-xl">
                        <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm md:text-base font-medium leading-relaxed">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BrainCircuit className="h-10 w-10 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Beat the Algorithm</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter the company and the type of behavioral test. The AI will decode the psychology behind it so you know exactly what traits they are looking for.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
