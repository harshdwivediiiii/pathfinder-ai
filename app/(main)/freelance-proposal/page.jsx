"use client";

import { useState, useEffect } from "react";
import { generateProposal, getFreelanceProposals } from "@/actions/freelance";
import { FileSignature, Sparkles, Copy, Briefcase, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function FreelanceProposalPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeProposal, setActiveProposal] = useState(null);
  
  const [formData, setFormData] = useState({
    projectDetails: "",
    rate: ""
  });

  useEffect(() => {
    async function loadHistory() {
      const res = await getFreelanceProposals();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveProposal(res.data[0].content);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateProposal(formData.projectDetails, formData.rate);
    if (res.success) {
      toast.success("Proposal generated!");
      setHistory([res.data, ...history]);
      setActiveProposal(res.data.content);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate proposal");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (activeProposal) {
      navigator.clipboard.writeText(activeProposal);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-500 font-bold text-xs uppercase tracking-[0.2em]">
              <FileSignature className="h-3 w-3" />
              Contracting & Gig Work
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Freelance <span className="text-teal-500">Proposals</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Draft persuasive, professional project proposals that win high-paying contracts.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Project Parameters</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> Client Needs & Scope
                  </label>
                  <Textarea
                    placeholder="e.g. They need a 5-page marketing website built in Next.js. They want dark mode, a contact form connected to SendGrid, and it needs to be done in 3 weeks."
                    className="min-h-[250px] rounded-xl resize-none bg-background focus-visible:ring-teal-500 text-sm leading-relaxed"
                    value={formData.projectDetails}
                    onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" /> Total Price / Rate
                  </label>
                  <Input
                    placeholder="e.g. $4,500 total or $100/hr"
                    className="h-12 rounded-xl bg-background focus-visible:ring-teal-500"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.projectDetails || !formData.rate}
                  className="w-full h-12 rounded-xl font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 mt-4"
                >
                  {loading ? "Drafting..." : "Generate Proposal"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {activeProposal ? (
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
                    <Copy className="h-4 w-4 mr-2" /> Copy Markdown
                  </Button>
                </div>
                <div className="p-8 grow overflow-y-auto max-h-[800px]">
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground">
                    <ReactMarkdown>{activeProposal}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSignature className="h-10 w-10 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Land the Client</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter what the client needs and what you want to charge. The AI will output a stunning, value-driven proposal that justifies your rate.
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
