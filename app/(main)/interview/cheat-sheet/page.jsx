"use client";

import { useState, useEffect } from "react";
import { generateCheatSheet, getCheatSheets } from "@/actions/cheat-sheet";
import { FileSearch, Sparkles, Building2, Briefcase, Download, HelpCircle, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CheatSheetPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [formData, setFormData] = useState({ company: "", role: "" });

  useEffect(() => {
    async function loadHistory() {
      const res = await getCheatSheets();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveSheet(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateCheatSheet(formData.company, formData.role);
    if (res.success) {
      toast.success("Cheat Sheet generated!");
      setHistory([res.data, ...history]);
      setActiveSheet(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate cheat sheet");
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 print:hidden"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <FileSearch className="h-3 w-3" />
              Interview Prep
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Interview <span className="text-gradient-primary">Cheat Sheet</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              The ultimate "Day Before" 1-page briefing to ace your interview.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6 print:hidden">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-4">Target Role</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Company Name
                  </label>
                  <Input
                    placeholder="e.g. Google, Stripe, Local Startup"
                    className="h-12 rounded-xl bg-background"
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
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-12 rounded-xl bg-background"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.company || !formData.role}
                  className="w-full h-12 rounded-xl font-bold mt-4"
                >
                  {loading ? "Researching..." : "Generate Briefing"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeSheet ? (
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

                <div className="bg-white text-black p-8 md:p-12 rounded-lg shadow-xl print:shadow-none print:p-0 min-h-[11in]">
                  <div className="border-b-4 border-black pb-4 mb-6">
                    <h1 className="text-4xl font-serif font-black uppercase mb-2">Interview Briefing</h1>
                    <div className="text-xl font-bold text-gray-700 flex items-center justify-between">
                      <span>Company: {activeSheet.company}</span>
                      <span>Role: {activeSheet.role}</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h2 className="text-lg font-bold uppercase tracking-widest border-b-2 border-gray-300 mb-3 pb-1 flex items-center gap-2">
                        <Building2 className="h-5 w-5" /> Company Overview & Culture
                      </h2>
                      <p className="text-base leading-relaxed">{activeSheet.content.companyOverview}</p>
                    </section>

                    <section>
                      <h2 className="text-lg font-bold uppercase tracking-widest border-b-2 border-gray-300 mb-3 pb-1 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" /> Expected Questions
                      </h2>
                      <ul className="list-disc list-outside ml-5 space-y-2">
                        {activeSheet.content.expectedQuestions?.map((q, idx) => (
                          <li key={idx} className="text-base font-medium">{q}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="bg-gray-100 p-6 rounded-xl border border-gray-300">
                      <h2 className="text-lg font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" /> Strategic Advice
                      </h2>
                      <p className="text-base leading-relaxed italic">"{activeSheet.content.strategicAdvice}"</p>
                    </section>

                    <section>
                      <h2 className="text-lg font-bold uppercase tracking-widest border-b-2 border-gray-300 mb-3 pb-1 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> Killer Questions to Ask
                      </h2>
                      <ul className="space-y-4">
                        {activeSheet.content.questionsToAsk?.map((q, idx) => (
                          <li key={idx} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <span className="font-bold text-blue-800 text-sm uppercase block mb-1">Question {idx + 1}</span>
                            <p className="text-base font-semibold">{q}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSearch className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Briefing Generated</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter the company and role you are interviewing for to generate a comprehensive 1-page cheat sheet.
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
