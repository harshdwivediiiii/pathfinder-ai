"use client";

import { useState, useEffect } from "react";
import { generateResignationLetter, getResignationLetters } from "@/actions/resignation";
import { DoorOpen, Sparkles, Copy, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ResignationLetterPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeLetter, setActiveLetter] = useState(null);
  
  const [formData, setFormData] = useState({
    circumstance: "",
    lastDay: ""
  });

  useEffect(() => {
    async function loadHistory() {
      const res = await getResignationLetters();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveLetter(res.data[0].content);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateResignationLetter(formData.circumstance, formData.lastDay);
    if (res.success) {
      toast.success("Resignation letter drafted!");
      setHistory([res.data, ...history]);
      setActiveLetter(res.data.content);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate letter");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (activeLetter) {
      navigator.clipboard.writeText(activeLetter);
      toast.success("Copied to clipboard");
    }
  };

  const templates = [
    "Standard 2 weeks notice, loved working here.",
    "Short notice (1 week), leaving due to personal family reasons.",
    "Leaving to join a competitor, need to be professional but cautious.",
    "Leaving a toxic environment, want to keep it strictly brief and legally safe."
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-[0.2em]">
              <DoorOpen className="h-3 w-3" />
              Career Transitions
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Resignation <span className="text-red-500">Letter Generator</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Quit your job professionally and securely, without burning bridges.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Your Departure Details</h3>
              
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Circumstance / Tone
                  </label>
                  <Textarea
                    placeholder="e.g. Standard 2 weeks notice. I loved the team but found a better opportunity."
                    className="min-h-[120px] rounded-xl resize-none bg-background focus-visible:ring-red-500 text-sm"
                    value={formData.circumstance}
                    onChange={(e) => setFormData({ ...formData, circumstance: e.target.value })}
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    {templates.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, circumstance: t })}
                        className="text-[10px] md:text-xs bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500 px-3 py-1.5 rounded-full transition-colors text-left"
                      >
                        {t.substring(0, 40)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Last Day of Work
                  </label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl bg-background focus-visible:ring-red-500"
                    value={formData.lastDay}
                    onChange={(e) => setFormData({ ...formData, lastDay: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.circumstance || !formData.lastDay}
                  className="w-full h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 mt-4"
                >
                  {loading ? "Drafting..." : "Draft Letter"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeLetter ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col h-full"
              >
                <div className="bg-muted/50 border-b border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <Button onClick={copyToClipboard} variant="ghost" size="sm" className="h-8 font-bold">
                    <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
                  </Button>
                </div>
                <div className="p-8 grow">
                  <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {activeLetter}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DoorOpen className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold">Ready to Quit?</h3>
                  <p className="text-muted-foreground text-sm">
                    Fill out your circumstances on the left. The AI will draft a legally safe, perfectly professional resignation letter you can hand to your boss.
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
