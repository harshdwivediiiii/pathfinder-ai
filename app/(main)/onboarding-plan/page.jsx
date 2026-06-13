"use client";

import { useState, useEffect } from "react";
import { generateOnboardingPlan, getOnboardingPlans } from "@/actions/onboarding";
import { Rocket, Sparkles, Building2, Briefcase, CalendarClock, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function OnboardingPlanPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [formData, setFormData] = useState({ company: "", role: "" });

  useEffect(() => {
    async function loadHistory() {
      const res = await getOnboardingPlans();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActivePlan(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateOnboardingPlan(formData.company, formData.role);
    if (res.success) {
      toast.success("Onboarding plan generated!");
      setHistory([res.data, ...history]);
      setActivePlan(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate plan");
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderPhase = (title, days, data, colorClass, bgClass, borderClass) => (
    <div className={`p-6 rounded-3xl border-2 ${borderClass} ${bgClass} shadow-sm break-inside-avoid mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-12 w-12 rounded-2xl ${colorClass} text-white flex items-center justify-center font-black text-xl shadow-inner`}>
          {days}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-sm font-semibold opacity-80 uppercase tracking-widest">{data.focus}</p>
        </div>
      </div>
      <ul className="space-y-3 mt-6">
        {data.goals?.map((goal, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm md:text-base font-medium">
            <div className={`mt-1.5 h-2 w-2 rounded-full ${colorClass} shrink-0`} />
            <span className="leading-relaxed">{goal}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 print:hidden"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em]">
              <Rocket className="h-3 w-3" />
              New Job Success
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              30-60-90 <span className="text-indigo-500">Day Plan</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Generate a strategic onboarding document to hand to your new manager on Day 1.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6 print:hidden">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Your New Job</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Company Name
                  </label>
                  <Input
                    placeholder="e.g. Netflix"
                    className="h-12 rounded-xl bg-background focus-visible:ring-indigo-500"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Job Title
                  </label>
                  <Input
                    placeholder="e.g. Senior Product Manager"
                    className="h-12 rounded-xl bg-background focus-visible:ring-indigo-500"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.company || !formData.role}
                  className="w-full h-12 rounded-xl font-bold mt-4 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                >
                  {loading ? "Strategizing..." : "Generate Strategy"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activePlan ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-end print:hidden">
                  <Button onClick={handlePrint} variant="outline" className="rounded-xl font-bold">
                    <Download className="mr-2 h-4 w-4" /> Save as PDF
                  </Button>
                </div>

                <div className="bg-white text-black p-8 md:p-12 rounded-[2rem] shadow-xl print:shadow-none print:p-0">
                  <div className="text-center mb-10 pb-10 border-b-2 border-gray-100">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Onboarding Strategy</h1>
                    <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full text-indigo-700 font-bold text-sm md:text-base">
                      <span>{activePlan.role}</span>
                      <span>@</span>
                      <span>{activePlan.company}</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {renderPhase("Phase 1: Learn & Absorb", "30", activePlan.planContent.day30, "bg-blue-500", "bg-blue-50", "border-blue-100")}
                    {renderPhase("Phase 2: Contribute & Build", "60", activePlan.planContent.day60, "bg-indigo-500", "bg-indigo-50", "border-indigo-100")}
                    {renderPhase("Phase 3: Lead & Innovate", "90", activePlan.planContent.day90, "bg-purple-500", "bg-purple-50", "border-purple-100")}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarClock className="h-10 w-10 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Plan Your Success</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter your new job details on the left, and the AI will draft a comprehensive 30-60-90 day success plan for you to impress your new team.
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
