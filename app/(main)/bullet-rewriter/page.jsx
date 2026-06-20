"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle2, Sparkles, PenLine } from "lucide-react";
import { rewriteBullet } from "@/actions/bullet-rewriter";

export default function BulletRewriterPage() {
  const [bulletText, setBulletText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [rewriteData, setRewriteData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bulletText.trim().length < 10) return;
    
    setLoading(true);
    setRewriteData(null);
    try {
      const response = await rewriteBullet({
        bulletText: bulletText.trim(),
        targetRole: targetRole.trim(),
      });

      if (response.success) {
        setRewriteData(response.data.rewrites);
        toast.success("Bullet point rewritten successfully!");
      } else {
        const errorMsg = response.errors?._form?.[0] || "Failed to rewrite bullet.";
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <PenLine className="h-8 w-8 text-amber-500" />
          Resume Bullet Rewriter
        </h1>
        <p className="text-muted-foreground text-lg">
          Transform your weak resume bullets into strong, ATS-friendly accomplishments using the Action-Task-Result framework.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Bullet Point</CardTitle>
              <CardDescription>
                Paste a bullet point from your resume. We&apos;ll make it quantifiable and impactful.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bulletText">Current Bullet Text</Label>
                  <Textarea
                    id="bulletText"
                    placeholder="e.g., Handled customer complaints and helped increase sales."
                    value={bulletText}
                    onChange={(e) => setBulletText(e.target.value)}
                    className="min-h-[150px] resize-y"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be between 10 and 500 characters.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target Role (Optional)</Label>
                  <Input
                    id="targetRole"
                    placeholder="e.g., Senior Product Manager"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps tailor the language to your desired position.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || bulletText.trim().length < 10}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Rewrite Bullet
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output */}
        <div className="space-y-6">
          {!rewriteData ? (
            <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 border-dashed">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                Awaiting Input
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Enter your bullet point and target role on the left, then click rewrite to see AI-powered suggestions here.
              </p>
            </Card>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold mb-4">Suggested Rewrites</h2>
              {rewriteData.map((item, index) => (
                <Card key={index} className="overflow-hidden border-l-4 border-l-amber-500 transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <p className="text-base font-medium leading-relaxed">
                        {item.bullet}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(item.bullet, index)}
                        title="Copy to clipboard"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy to clipboard</span>
                      </Button>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground/80 mr-1">Why it works:</span>
                        {item.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
