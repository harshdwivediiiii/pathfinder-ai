import { getRoadmap } from "@/actions/roadmap";
import { Map, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import RoadmapView from "./_components/roadmap-view";

export default async function RoadmapPage() {
  const { roadmap, error } = await getRoadmap();

  // Show error state if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3" />
              AI Career Planning
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
                <Map className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                Career <span className="text-gradient-primary">Roadmap</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium mt-2">
                Personalized, step-by-step milestones tailored to your skills and goals.
              </p>
            </div>
          </div>

          <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-6 md:p-10">
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Map className="h-10 w-10 text-red-500" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Unable to load roadmap</h2>
                  <p className="text-muted-foreground">
                    {error || "There was an error loading your roadmap. Please try again."}
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-2xl font-bold">
                  <Link href="/roadmap/generate">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Roadmap
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal render when no error
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            AI Career Planning
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
                <Map className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                Career <span className="text-gradient-primary">Roadmap</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium mt-2">
                Personalized, step-by-step milestones tailored to your skills and goals.
              </p>
            </div>

            <Button asChild
              size="lg"
              className="h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group"
            >
              <Link href="/roadmap/generate">
                <Sparkles className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                {roadmap ? "Regenerate Roadmap" : "Generate Roadmap"}
              </Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-6 md:p-10 min-h-[400px]">
            {roadmap ? (
              <RoadmapView roadmap={roadmap} />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Map className="h-10 w-10 text-primary" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">No roadmap yet</h2>
                  <p className="text-muted-foreground">
                    Generate a personalized career roadmap based on your current profile, skills, and target role.
                    Make sure your profile is complete in Settings first.
                  </p>
                </div>
                <Button asChild size="lg" className="rounded-2xl font-bold">
                  <Link href="/roadmap/generate">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Your Roadmap
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}