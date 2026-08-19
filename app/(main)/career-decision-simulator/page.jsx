"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowRightLeft, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { simulateCareerDecision, getCareerDecisionSimulations } from "@/actions/career-decision-simulator";
import { careerDecisionSchema } from "@/lib/schemas/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/misc/utils";

const FADE_UP_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export default function CareerDecisionSimulatorPage() {
  const [history, setHistory] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionsList, setOptionsList] = useState([
    { id: "init-1", value: "" },
    { id: "init-2", value: "" }
  ]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(careerDecisionSchema),
    defaultValues: {
      question: "",
      options: ["", ""],
    },
  });

  const question = watch("question");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await getCareerDecisionSimulations();
        if (res?.success && res.data?.length > 0) {
          setHistory(res.data);
          setActiveSimulation(res.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    }
    fetchHistory();
  }, []);

  const addOption = () => {
    if (optionsList.length >= 5) {
      toast.error("Maximum 5 options allowed.");
      return;
    }
    const newList = [...optionsList, { id: Date.now().toString() + Math.random(), value: "" }];
    setOptionsList(newList);
    setValue("options", newList.map(o => o.value));
  };

  const removeOption = (index) => {
    if (optionsList.length <= 2) {
      toast.error("You need at least 2 options.");
      return;
    }
    const newList = optionsList.filter((_, i) => i !== index);
    setOptionsList(newList);
    setValue("options", newList.map(o => o.value));
  };

  const handleOptionChange = (index, value) => {
    const newList = [...optionsList];
    newList[index] = { ...newList[index], value };
    setOptionsList(newList);
    setValue("options", newList.map(o => o.value));
  };

  const onSubmit = async (data) => {
    // Client side check for empty options just in case
    if (data.options.some(opt => opt.trim() === "")) {
      toast.error("Please fill in all option fields or remove empty ones.");
      return;
    }

    setLoading(true);
    toast.info("Analyzing career options...");
    
    try {
      const res = await simulateCareerDecision(data);
      
      if (res?.success && res.data) {
        toast.success("Analysis complete!");
        setHistory(prev => [res.data, ...prev]);
        setActiveSimulation(res.data);
        reset();
        setOptionsList([
          { id: Date.now().toString() + Math.random(), value: "" },
          { id: Date.now().toString() + Math.random(), value: "" }
        ]);
      } else {
        toast.error(res?.errors?._form?.[0] || "Failed to generate simulation. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === "Low") return "bg-green-500/10 text-green-500 border-green-500/20";
    if (risk === "Medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (risk === "High") return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <ArrowRightLeft className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Career Decision Simulator</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Map out the pros, cons, and risks of your toughest career choices, and let AI help you find the best path forward.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card/50 backdrop-blur-xl border shadow-sm rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              New Simulation
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">What decision are you facing?</Label>
                <Textarea
                  id="question"
                  placeholder="e.g. Should I stay at my current startup or take the offer from a FAANG company?"
                  className="resize-none min-h-[100px] bg-background/50 focus:bg-background transition-colors"
                  {...register("question")}
                />
                {errors.question && <p className="text-sm text-destructive font-medium">{errors.question.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Your Options</Label>
                  <span className="text-xs text-muted-foreground">{optionsList.length} / 5</span>
                </div>
                <AnimatePresence>
                  {optionsList.map((opt, idx) => (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={opt.value}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="bg-background/50 focus:bg-background transition-colors"
                        aria-label={`Option ${idx + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeOption(idx)}
                        aria-label={`Remove Option ${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {errors.options && <p className="text-sm text-destructive font-medium">{errors.options.message}</p>}
                
                {optionsList.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={addOption}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Option
                  </Button>
                )}
              </div>

              <Button type="submit" className="w-full shadow-lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  "Simulate Outcome"
                )}
              </Button>
            </form>
          </div>
          
          {/* History Selection */}
          {history.length > 0 && (
            <div className="bg-card/50 backdrop-blur-xl border shadow-sm rounded-3xl p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Past Simulations</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {history.map((sim) => (
                  <button
                    key={sim.id}
                    onClick={() => setActiveSimulation(sim)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200 border",
                      activeSimulation?.id === sim.id
                        ? "bg-primary/10 border-primary/20 text-foreground shadow-sm"
                        : "bg-background/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="font-medium truncate mb-1">{sim.question}</div>
                    <div className="text-xs opacity-70">
                      {new Date(sim.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {sim.analysis?.optionsAnalysis?.length || 0} options
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {!activeSimulation && !loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl text-center">
              <ArrowRightLeft className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Simulation Active</h3>
              <p className="text-muted-foreground max-w-sm">
                Enter your toughest career dilemma and options on the left to see the AI analysis here.
              </p>
            </div>
          ) : !activeSimulation && loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl text-center">
              <Loader2 className="w-12 h-12 text-primary/50 animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Simulating Scenarios...</h3>
              <p className="text-muted-foreground max-w-sm">
                Evaluating the pros, cons, and potential impacts of your career choices.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeSimulation && (
                <motion.div
                  key={activeSimulation.id}
                  variants={FADE_UP_ANIMATION_VARIANTS}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  <div className="bg-card/50 backdrop-blur-xl border shadow-sm rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <TrendingUp className="w-32 h-32" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-6 pr-12">{activeSimulation.question}</h2>
                    
                    {/* Recommendation Highlight */}
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg shrink-0 mt-1">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-primary mb-1">Recommended Path</h3>
                          <p className="font-semibold text-foreground mb-2 text-xl">{activeSimulation.analysis?.recommendedOption}</p>
                          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                            {activeSimulation.analysis?.reasoning}
                          </p>
                          <div className="bg-background/50 rounded-xl p-4 border border-primary/10">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">Concrete Next Step</span>
                            <span className="text-sm font-medium">{activeSimulation.analysis?.nextStep}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Analysis Confidence</span>
                        <span className="font-bold">{activeSimulation.analysis?.confidenceScore}%</span>
                      </div>
                      <Progress 
                        value={activeSimulation.analysis?.confidenceScore} 
                        className="h-2.5 bg-muted" 
                        indicatorClassName={cn(
                          activeSimulation.analysis?.confidenceScore > 75 ? "bg-green-500" : 
                          activeSimulation.analysis?.confidenceScore > 50 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        aria-label={`Confidence score: ${activeSimulation.analysis?.confidenceScore} percent`} 
                      />
                    </div>

                    {/* Options Breakdown */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold border-b pb-2">Options Breakdown</h3>
                      <div className="grid gap-6">
                        {activeSimulation.analysis?.optionsAnalysis?.map((opt, idx) => (
                          <div key={idx} className="bg-background rounded-2xl border p-5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b pb-4">
                              <h4 className="font-bold text-lg">{opt.option}</h4>
                              <div className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit", getRiskColor(opt.riskLevel))}>
                                {opt.riskLevel === 'High' && <AlertTriangle className="w-3.5 h-3.5" />}
                                {opt.riskLevel === 'Low' && <ShieldCheck className="w-3.5 h-3.5" />}
                                {opt.riskLevel} Risk
                              </div>
                            </div>
                            
                            <div className="grid sm:grid-cols-2 gap-6 mb-6">
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-green-500 mb-2 flex items-center gap-1.5">
                                  <Plus className="w-3.5 h-3.5" /> Pros
                                </h5>
                                <ul className="space-y-1.5">
                                  {opt.pros && opt.pros.length > 0 ? opt.pros.map((pro, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-green-500 mt-0.5">•</span> {pro}
                                    </li>
                                  )) : <li className="text-sm text-muted-foreground">None identified.</li>}
                                </ul>
                              </div>
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                                  <Trash2 className="w-3.5 h-3.5" /> Cons
                                </h5>
                                <ul className="space-y-1.5">
                                  {opt.cons && opt.cons.length > 0 ? opt.cons.map((con, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-red-500 mt-0.5">•</span> {con}
                                    </li>
                                  )) : <li className="text-sm text-muted-foreground">None identified.</li>}
                                </ul>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 bg-muted/30 rounded-xl p-4 mb-4">
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground block mb-1">Short-term Impact</span>
                                <span className="text-sm">{opt.shortTermImpact}</span>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground block mb-1">Long-term Impact</span>
                                <span className="text-sm">{opt.longTermImpact}</span>
                              </div>
                            </div>

                            {opt.skillsRequired && opt.skillsRequired.length > 0 && (
                              <div>
                                <span className="text-xs font-semibold text-muted-foreground block mb-2">Skills Required</span>
                                <div className="flex flex-wrap gap-2">
                                  {opt.skillsRequired.map((skill, i) => (
                                    <span key={i} className="bg-primary/5 text-primary border border-primary/10 text-xs px-2.5 py-1 rounded-md font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
