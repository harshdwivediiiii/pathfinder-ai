"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Send, AlertTriangle, TrendingUp, Info, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { decodeEquityOffer, getEquityAnalyses } from "@/actions/equity";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EquityDecoderPage() {
  const [offerDetails, setOfferDetails] = useState({
    equityType: "",
    numberOfShares: "",
    strikePrice: "",
    currentValuation: "",
    vestingSchedule: "Standard 4-year (1-year cliff)"
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getEquityAnalyses();
    if (res.success && res.data.length > 0) {
      setHistory(res.data);
      setCurrentAnalysis(res.data[0]);
    }
  };

  const handleGenerate = async () => {
    if (!offerDetails.equityType || !offerDetails.numberOfShares) {
      toast.error("Please fill in at least the equity type and number of shares.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await decodeEquityOffer(offerDetails);
      if (res.success) {
        toast.success("Offer decoded successfully!");
        setCurrentAnalysis(res.data);
        loadHistory();
      } else {
        toast.error(res.errors._form?.[0] || "Failed to decode equity offer.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-5xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
          <Calculator className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Equity Decoder</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Know What Your <span className="text-gradient-primary">Shares Are Worth.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Startup equity is incredibly confusing. Input your offer details below to translate ISOs, NSOs, and RSUs into real dollars and scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 glass rounded-3xl border border-border">
            <h3 className="text-lg font-bold mb-4">Offer Details</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Equity Type</label>
                <Select
                  value={offerDetails.equityType}
                  onValueChange={(val) => setOfferDetails(prev => ({ ...prev, equityType: val }))}
                >
                  <SelectTrigger className="bg-background/50 h-12 rounded-xl">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISOs (Incentive Stock Options)">ISOs (Options)</SelectItem>
                    <SelectItem value="NSOs (Non-Qualified Stock Options)">NSOs (Options)</SelectItem>
                    <SelectItem value="RSUs (Restricted Stock Units)">RSUs</SelectItem>
                    <SelectItem value="I don't know (need help figuring it out)">I don&apos;t know</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Number of Shares/Units</label>
                <Input 
                  type="number"
                  placeholder="e.g. 10000" 
                  value={offerDetails.numberOfShares}
                  onChange={(e) => setOfferDetails(prev => ({ ...prev, numberOfShares: e.target.value }))}
                  className="bg-background/50 h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1 flex items-center justify-between">
                  <span>Strike Price (Options Only)</span>
                </label>
                <Input 
                  type="text"
                  placeholder="e.g. $1.50" 
                  value={offerDetails.strikePrice}
                  onChange={(e) => setOfferDetails(prev => ({ ...prev, strikePrice: e.target.value }))}
                  className="bg-background/50 h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Current Preferred Price (Optional)</label>
                <Input 
                  type="text"
                  placeholder="e.g. $5.00" 
                  value={offerDetails.currentValuation}
                  onChange={(e) => setOfferDetails(prev => ({ ...prev, currentValuation: e.target.value }))}
                  className="bg-background/50 h-12 rounded-xl"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !offerDetails.equityType || !offerDetails.numberOfShares}
                className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold mt-2"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                Decode Offer
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {currentAnalysis ? (
              <motion.div
                key={currentAnalysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 glass rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
                  <h3 className="text-xl font-bold text-indigo-500 flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5" />
                    Plain English Translation
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{currentAnalysis.analysis.plainEnglishExplanation}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentAnalysis.analysis.scenarios.map((scenario, idx) => (
                    <div key={idx} className="p-5 glass rounded-2xl border border-border flex flex-col items-center text-center justify-center space-y-2 hover:border-indigo-500/50 transition-colors">
                      <TrendingUp className="h-6 w-6 text-emerald-500 mb-1" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{scenario.name}</p>
                      <p className="text-2xl font-black text-foreground">{scenario.value}</p>
                      <p className="text-xs text-muted-foreground">{scenario.description}</p>
                    </div>
                  ))}
                </div>

                {currentAnalysis.analysis.redFlags?.length > 0 && (
                  <div className="p-6 glass rounded-3xl border border-rose-500/30 bg-rose-500/5">
                    <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5" />
                      Red Flags to Watch Out For
                    </h3>
                    <ul className="space-y-3">
                      {currentAnalysis.analysis.redFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-rose-500 mt-1">•</span>
                          <span className="text-sm text-rose-700 dark:text-rose-300">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-6 glass rounded-3xl border border-border">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Send className="h-5 w-5 text-blue-500" />
                    Questions to Ask HR Before Signing
                  </h3>
                  <ul className="space-y-3">
                    {currentAnalysis.analysis.questionsToAskHR.map((q, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="font-bold text-blue-500">{idx + 1}.</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-dashed border-border">
                <Calculator className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No equity decoded yet.</p>
                <p className="text-sm text-muted-foreground/60 max-w-sm mt-2">Enter your startup offer details to see what your shares could be worth.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
