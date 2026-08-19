"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generatePortfolio, updatePortfolio } from "@/actions/portfolio-builder";
import { toast } from "sonner";
import { Globe, Lock, Wand2, MonitorPlay, Palette, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import PortfolioPreview from "./portfolio-preview";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioContentEditor from "./portfolio-content-editor";

export default function PortfolioBuilderPage({ initialPortfolio, user }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [slug, setSlug] = useState(initialPortfolio?.slug || "");
  const [theme, setTheme] = useState(initialPortfolio?.theme || "modern");
  const [isPublished, setIsPublished] = useState(initialPortfolio?.isPublished || false);

  const handleGenerate = async () => {
    setLoading(true);
    toast.loading("Generating your AI portfolio...", { id: "generate" });
    const res = await generatePortfolio(portfolio?.slug);
    if (res.success) {
      toast.success("Portfolio generated successfully!", { id: "generate" });
      setPortfolio(res.data);
      setSlug(res.data.slug);
      setTheme(res.data.theme);
      setIsPublished(res.data.isPublished);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate.", { id: "generate" });
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!portfolio) return;
    setSaving(true);
    const res = await updatePortfolio({ slug, theme, isPublished });
    if (res.success) {
      toast.success("Settings saved successfully!");
      setPortfolio(res.data);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to save settings.");
    }
    setSaving(false);
  };

  if (!portfolio && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="bg-primary/10 p-6 rounded-full inline-block mb-4">
          <Presentation className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">You don't have a portfolio yet</h2>
        <p className="text-muted-foreground max-w-md">
          We can automatically build a complete, stunning portfolio website for you based on the data in your resume.
        </p>
        <Button onClick={handleGenerate} size="lg" className="rounded-full gap-2 px-8">
          <Wand2 className="h-5 w-5" /> Generate My AI Portfolio
        </Button>
      </div>
    );
  }

  if (loading && !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="animate-spin text-primary">
          <MonitorPlay className="h-16 w-16" />
        </div>
        <h2 className="text-2xl font-bold animate-pulse text-gradient-primary">Crafting your portfolio...</h2>
        <p className="text-muted-foreground">Our AI is reading your resume and structuring your website.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Settings/Content Sidebar */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border p-6 rounded-3xl shadow-sm h-full"
        >
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-0" forceMount>
              <PortfolioContentEditor 
                portfolio={portfolio} 
                onUpdate={(updatedData) => setPortfolio(updatedData)} 
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              <div className="space-y-1 border-b border-border/50 pb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Appearance
                </h3>
                <p className="text-sm text-muted-foreground">Choose how your portfolio looks.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {['modern', 'minimal'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`py-3 px-4 rounded-xl border-2 transition-all font-semibold capitalize ${
                        theme === t 
                          ? "border-primary bg-primary/10 text-primary shadow-sm" 
                          : "border-border hover:border-primary/50 text-muted-foreground bg-background"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 border-b border-border/50 pb-4 pt-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Publishing
                </h3>
                <p className="text-sm text-muted-foreground">Manage your public link.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">URL Slug</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="pl-9 h-11 rounded-xl"
                    placeholder="your-name"
                  />
                </div>
                <p className="text-xs text-muted-foreground break-all">
                  pathfinder-ai.vercel.app/p/<span className="text-primary font-bold">{slug || '...'}</span>
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visibility</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPublished(true)}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      isPublished 
                        ? "border-green-500 bg-green-500/10 text-green-500" 
                        : "border-border hover:border-green-500/50 text-muted-foreground"
                    }`}
                  >
                    <Globe className="h-5 w-5 mb-1" />
                    <span className="text-sm font-bold">Public</span>
                  </button>
                  <button
                    onClick={() => setIsPublished(false)}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      !isPublished 
                        ? "border-amber-500 bg-amber-500/10 text-amber-500" 
                        : "border-border hover:border-amber-500/50 text-muted-foreground"
                    }`}
                  >
                    <Lock className="h-5 w-5 mb-1" />
                    <span className="text-sm font-bold">Private</span>
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings} 
                disabled={saving || (theme === portfolio.theme && slug === portfolio.slug && isPublished === portfolio.isPublished)}
                className="w-full rounded-xl h-12 font-bold"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>

              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                variant="outline"
                className="w-full rounded-xl h-12 mt-2 gap-2"
              >
                <Wand2 className="h-4 w-4" /> Regenerate Content
              </Button>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Live Preview */}
      <div className="lg:col-span-7 xl:col-span-8 h-[calc(100vh-120px)] lg:sticky lg:top-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between bg-muted/50 p-4 rounded-t-3xl border border-b-0 border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="text-sm font-mono text-muted-foreground bg-background px-4 py-1 rounded-full border border-border">
              Preview Mode • {theme}
            </div>
            {isPublished && slug ? (
               <a 
                href={`/p/${slug}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
               >
                 View Live <LinkIcon className="h-3 w-3" />
               </a>
            ) : (
              <div className="w-20" /> // spacer
            )}
          </div>
          
          <div className="flex-1 border border-border rounded-b-3xl overflow-hidden bg-background relative min-h-[600px]">
            <PortfolioPreview data={portfolio.content} theme={theme} user={user} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Add Presentation icon here to avoid import error
import { Presentation } from "lucide-react";
