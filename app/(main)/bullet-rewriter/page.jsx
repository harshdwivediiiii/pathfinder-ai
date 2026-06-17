"use client";

import { useState } from "react";
import { rewriteResumeBullet } from "@/actions/bullet-rewriter";
import { Sparkles, FileText, CheckCircle2, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function BulletRewriterPage() {
  const [loading, setLoading] = useState(false);
  const [bulletText, setBulletText] = useState("");
  const [roleContext, setRoleContext] = useState("");
  const [result, setResult] = useState(null);

  const handleRewrite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await rewriteResumeBullet(bulletText, roleContext);
      if (res.success) {
        toast.success("Bullets rewritten!");
        setResult(res.data);
      } else {
        toast.error(res.errors?._form?.[0] || "Failed to rewrite bullet");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Resume Bullet <span className="text-indigo-500">Rewriter</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Transform weak resume bullets into achievement-oriented statements that impress recruiters and pass ATS systems.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">Enter Your Bullet Point</h3>
              <form onSubmit={handleRewrite} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="role-context" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Role Context (optional)
                  </label>
                  <Input
                    id="role-context"
                    placeholder="e.g. Software Engineer, Marketing Manager"
                    value={roleContext}
                    onChange={(e) => setRoleContext(e.target.value)}
                    className="rounded-xl"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bullet-text" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Weak Bullet Point
                  </label>
                  <Textarea
                    id="bullet-text"
                    placeholder="e.g. Worked on customer support tickets."
                    className="min-h-[150px] rounded-xl resize-none bg-background focus-visible:ring-indigo-500 text-sm leading-relaxed"
                    value={bulletText}
                    onChange={(e) => setBulletText(e.target.value)}
                    required
                    maxLength={500}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || bulletText.trim().length < 10}
                  className="w-full h-12 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                >
                  {loading ? "Rewriting..." : "Rewrite Bullet"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border p-8 rounded-3xl shadow-xl space-y-8"
              >
                <h2 className="text-2xl font-black text-indigo-500 border-b border-border/50 pb-4">Rewritten Bullets</h2>
                <div className="space-y-4">
                  {result.rewrites?.map((item, idx) => (
                    <div key={idx} className="bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20 space-y-2">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="font-semibold text-sm">{item.bullet}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-8">{item.explanation}</p>
                    </div>
                  ))}
                </div>
                {result.tips && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" /> Quick Tips
                    </h3>
                    {result.tips.map((tip, idx) => (
                      <div key={idx} className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-sm font-medium">
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-20 w-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-indigo-500" />
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Rewrite?</h3>
                  <p className="text-muted-foreground text-sm">
                    Paste a weak resume bullet on the left and get 3 powerful, achievement-oriented alternatives instantly.
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
