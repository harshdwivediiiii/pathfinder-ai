"use client";

import { useState, useEffect } from "react";
import { generateLinkedInPosts, getLinkedInPosts } from "@/actions/linkedin-post";
import { Linkedin, Sparkles, Copy, MessageSquareText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function LinkedInPostPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activePosts, setActivePosts] = useState(null);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    async function loadHistory() {
      const res = await getLinkedInPosts();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActivePosts(res.data[0].content.posts);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateLinkedInPosts(topic);
    if (res.success) {
      toast.success("Posts generated!");
      setHistory([res.data, ...history]);
      setActivePosts(res.data.content.posts);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate posts");
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0A66C2]/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#0A66C2] font-bold text-xs uppercase tracking-[0.2em]">
              <Linkedin className="h-3 w-3" />
              Personal Branding
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              LinkedIn <span className="text-[#0A66C2]">Post Generator</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Turn your achievements into engaging, recruiter-magnet LinkedIn posts.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">What did you achieve?</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <MessageSquareText className="h-3.5 w-3.5" /> Topic or Milestone
                  </label>
                  <Textarea
                    placeholder="e.g. I just finished a full-stack React project where I integrated Stripe payments and deployed to Vercel."
                    className="min-h-[250px] rounded-xl resize-none bg-background focus-visible:ring-[#0A66C2] text-sm leading-relaxed"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || topic.length < 10}
                  className="w-full h-12 rounded-xl font-bold bg-[#0A66C2] hover:bg-[#004182] text-white shadow-lg shadow-[#0A66C2]/20"
                >
                  {loading ? "Writing..." : "Generate 3 Posts"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activePosts ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {activePosts.map((post, idx) => (
                  <div key={idx} className="bg-card border border-border p-6 rounded-3xl shadow-md">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#0A66C2]" /> Variation {idx + 1}: {post.style}
                      </h3>
                      <button 
                        onClick={() => copyToClipboard(post.content)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-[#0A66C2] hover:text-white transition-all"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Linkedin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Posts Generated</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter a milestone on the left, and the AI will generate 3 highly engaging posts with hooks, emojis, and hashtags ready for LinkedIn.
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
