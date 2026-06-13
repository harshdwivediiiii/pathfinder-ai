"use client";

import { useState, useEffect } from "react";
import { compareOffers, getOfferComparisons } from "@/actions/offer-comparer";
import { Calculator, Sparkles, Plus, Trash2, Building, DollarSign, Percent, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function OfferComparerPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeComparison, setActiveComparison] = useState(null);
  
  const [offers, setOffers] = useState([
    { id: 1, company: "", baseSalary: "", bonus: "", equity: "" },
    { id: 2, company: "", baseSalary: "", bonus: "", equity: "" }
  ]);

  useEffect(() => {
    async function loadHistory() {
      const res = await getOfferComparisons();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveComparison(res.data[0]);
      }
    }
    loadHistory();
  }, []);

  const handleUpdateOffer = (id, field, value) => {
    setOffers(offers.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const addOffer = () => {
    if (offers.length >= 3) {
      toast.error("You can only compare up to 3 offers at once.");
      return;
    }
    setOffers([...offers, { id: Date.now(), company: "", baseSalary: "", bonus: "", equity: "" }]);
  };

  const removeOffer = (id) => {
    if (offers.length <= 2) {
      toast.error("You need at least 2 offers to compare.");
      return;
    }
    setOffers(offers.filter(o => o.id !== id));
  };

  const handleCompare = async () => {
    // Validate
    if (offers.some(o => !o.company || !o.baseSalary)) {
      toast.error("Company and Base Salary are required for all offers.");
      return;
    }

    setLoading(true);
    const res = await compareOffers(offers);
    if (res.success) {
      toast.success("Comparison complete!");
      setHistory([res.data, ...history]);
      setActiveComparison(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to compare offers");
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-[0.2em]">
              <Calculator className="h-3 w-3" />
              Compensation
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Offer <span className="text-emerald-500">Comparer</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Calculate total compensation and get strategic advice on which offer to accept.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Your Offers</h3>
                <Button onClick={addOffer} variant="outline" size="sm" className="rounded-lg h-9">
                  <Plus className="h-4 w-4 mr-2" /> Add Offer
                </Button>
              </div>
              
              <div className="space-y-6">
                {offers.map((offer, index) => (
                  <div key={offer.id} className="relative bg-muted/30 p-5 rounded-2xl border border-border">
                    {offers.length > 2 && (
                      <button 
                        onClick={() => removeOffer(offer.id)}
                        className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all shadow-lg"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-4">Offer {index + 1}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5" /> Company
                        </label>
                        <Input
                          placeholder="e.g. Google"
                          className="h-10 rounded-lg bg-background"
                          value={offer.company}
                          onChange={(e) => handleUpdateOffer(offer.id, 'company', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" /> Base Salary
                        </label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="150000"
                          className="h-10 rounded-lg bg-background"
                          value={offer.baseSalary}
                          onChange={(e) => handleUpdateOffer(offer.id, 'baseSalary', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Percent className="h-3.5 w-3.5" /> Target Bonus ($)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="20000"
                          className="h-10 rounded-lg bg-background"
                          value={offer.bonus}
                          onChange={(e) => handleUpdateOffer(offer.id, 'bonus', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" /> Equity / RSUs (Annual $)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="50000"
                          className="h-10 rounded-lg bg-background"
                          value={offer.equity}
                          onChange={(e) => handleUpdateOffer(offer.id, 'equity', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleCompare}
                disabled={loading}
                className="w-full h-14 rounded-2xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 text-lg"
              >
                {loading ? "Analyzing..." : "Compare & Evaluate"} <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            {activeComparison ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-xl">
                  <h3 className="font-bold text-xl mb-6">Total Compensation</h3>
                  <div className="space-y-4">
                    {activeComparison.offers.map((offer, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center font-black">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold">{offer.company}</h4>
                            <p className="text-xs text-muted-foreground">Base: {formatCurrency(offer.baseSalary || 0)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-xl text-emerald-500">
                            {formatCurrency(offer.totalCompensation)}
                          </div>
                          <p className="text-xs text-muted-foreground">/ year</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Strategic Recommendation
                    </h3>
                    <p className="text-foreground leading-relaxed text-sm md:text-base font-medium">
                      {activeComparison.analysis.recommendation}
                    </p>
                  </div>
                  
                  <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-600 mb-2">
                      Negotiation Leverage
                    </h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                      {activeComparison.analysis.negotiationLeverage}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Awaiting Offers</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter the financial details of your job offers on the left, and the AI will calculate the true total compensation and tell you which one to pick.
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
