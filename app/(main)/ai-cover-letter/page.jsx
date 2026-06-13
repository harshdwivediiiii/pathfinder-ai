import { getCoverLetters } from "@/actions/cover-letter";
import Link from "next/link";
import { Plus, Sparkles, PenBox } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            AI Content Generator
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
                <PenBox className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                Your <span className="text-gradient-primary">Cover Letters</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium mt-2">
                Persuasive, tailored, and professionally structured letters for every application.
              </p>
            </div>
            
            <Button asChild size="lg" className="h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group">
              <Link href="/ai-cover-letter/new">
                <Plus className="h-5 w-5 mr-2 transition-transform group-hover:rotate-90" />
                Create New Letter
              </Link>
            </Button>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-6 md:p-10 min-h-[400px]">
            <CoverLetterList coverLetters={coverLetters} />
          </div>
        </div>
      </div>
    </div>
  );
}
