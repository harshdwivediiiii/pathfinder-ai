"use client";

import { useState, useEffect } from "react";
import { generateProjectIdeas, getProjectIdeas } from "@/actions/portfolio";
import { Lightbulb, Sparkles, Target, Wrench, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ProjectIdeasPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeIdeas, setActiveIdeas] = useState(null);
  
  const [formData, setFormData] = useState({
    targetRole: "Frontend Developer",
    skillGap: "React Native",
  });

  useEffect(() => {
    async function loadHistory() {
      const res = await getProjectIdeas();
      if (res.success && res.data.length > 0) {
        setHistory(res.data);
        setActiveIdeas(res.data[0].ideas);
      }
    }
    loadHistory();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await generateProjectIdeas(formData);
    if (res.success) {
      toast.success("Project ideas generated!");
      setHistory([res.data, ...history]);
      setActiveIdeas(res.data.ideas);
    } else {
      toast.error(res.errors?._form?.[0] || "Failed to generate project ideas");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <Lightbulb className="h-3 w-3" />
              Portfolio Builder
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Project <span className="text-gradient-primary">Ideas</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Turn your skill gaps into impressive resume portfolio projects with step-by-step roadmaps.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
              <h3 className="font-bold text-lg mb-6">What do you want to learn?</h3>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      placeholder="Target Role (e.g. Frontend Developer)"
                      className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                      value={formData.targetRole}
                      onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                    />
                  </div>

                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      placeholder="Skill Gap (e.g. Next.js, Docker)"
                      className="pl-10 h-12 rounded-xl bg-background border-border focus-visible:ring-primary"
                      value={formData.skillGap}
                      onChange={e => setFormData({ ...formData, skillGap: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold"
                >
                  {loading ? "Brainstorming..." : "Generate Ideas"} <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            {activeIdeas ? (
              <div className="space-y-6">
                {activeIdeas.projects?.map((project, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="bg-card border border-border p-8 rounded-3xl shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{project.title}</h2>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${
                          project.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-500' :
                          project.difficulty === 'Intermediate' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {project.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="bg-muted/30 p-5 rounded-2xl border border-border">
                      <h4 className="font-bold text-sm mb-4">Implementation Roadmap</h4>
                      <div className="space-y-3">
                        {project.roadmap?.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-3">
                            <div className="mt-0.5 bg-primary/20 p-1 rounded-full text-primary">
                              <ChevronRight className="h-3 w-3" />
                            </div>
                            <span className="text-sm font-medium">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl text-center">
                <div className="max-w-md space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">No Projects Generated</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter your target role and a skill you want to learn to get custom side-project ideas.
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
