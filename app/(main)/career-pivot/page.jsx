"use client";

import { useState, useEffect } from "react";
import { generatePivotStrategy, getCareerPivots } from "@/actions/career-pivot";
import { ArrowRightLeft, Sparkles, Map, Target, Briefcase, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CareerPivotPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [formData, setFormData] = useState({ currentRole: "", targetRole: "" });

  useEffect(() => {
    async function loadHistory() {
      const res = await getCareerPivots();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveStrategy(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generatePivotStrategy(formData.currentRole, formData.targetRole);
    if (res.success) {
      toast.success("Pivot strategy generated!");
      setHistory([res.data, ...history]);
      setActiveStrategy(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate pivot strategy");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-[0.2em]">
              <ArrowRightLeft className="h-3 w-3" />
              Career Transitions
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Pivot <span className="text-orange-500">Analyzer</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Map out your transition into a completely new industry or role.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Define Your Pivot</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Current Role
                  </label>
                  <Input
                    placeholder="e.g. High School Teacher"
                    className="h-12 rounded-xl bg-background"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex justify-center my-2">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <ChevronRight className="h-4 w-4 text-orange-500 rotate-90 md:rotate-0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" /> Target Role
                  </label>
                  <Input
                    placeholder="e.g. UX Designer"
                    className="h-12 rounded-xl bg-background border-orange-500/30 focus-visible:ring-orange-500"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.currentRole || !formData.targetRole}
                  className="w-full h-12 rounded-xl font-bold mt-4 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                >
                  {loading ? "Analyzing..." : "Analyze Pivot"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeStrategy ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Transferable Skills */}
                  <div className="bg-card border border-border p-6 rounded-3xl shadow-md">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Transferable Skills
                    </h3>
                    <ul className="space-y-3">
                      {activeStrategy.analysis.transferableSkills?.map((skill, idx) => (
                        <li key={idx} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-sm font-medium leading-relaxed">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Skill Gaps */}
                  <div className="bg-card border border-border p-6 rounded-3xl shadow-md">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4" /> Skill Gaps to Close
                    </h3>
                    <ul className="space-y-3">
                      {activeStrategy.analysis.skillGaps?.map((gap, idx) => (
                        <li key={idx} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-sm font-medium leading-relaxed">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Roadmap */}
                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-xl">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Map className="h-5 w-5 text-orange-500" /> 
                    Step-by-Step Transition Roadmap
                  </h3>
                  
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {activeStrategy.analysis.roadmap?.map((phase, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-orange-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-white font-black text-sm">
                          {idx + 1}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/30 p-5 rounded-2xl border border-border">
                          <h4 className="font-bold text-orange-500 mb-1">{phase.step}</h4>
                          <p className="text-sm text-foreground font-medium">{phase.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowRightLeft className="h-10 w-10 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Pivot?</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter your current role and your dream role. The AI will find your hidden transferable skills and map out exactly how to make the jump.
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
