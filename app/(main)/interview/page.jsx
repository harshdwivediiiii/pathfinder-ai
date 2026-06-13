import { getAssessments } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";
import { Sparkles, Bot, Mic, Video } from "lucide-react";

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles className="h-3 w-3" />
            Neural Prep Engine
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-4">
              <Bot className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              Interview <span className="text-gradient-primary">Intelligence</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium mt-2 mb-6">
              Master your technique with AI-driven assessments and real-time performance tracking.
            </p>
            <div className="flex gap-4 mt-6">
              <a 
                href="/interview/voice-coach" 
                className="inline-flex items-center justify-center rounded-xl font-bold h-12 px-6 bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
              >
                <Mic className="h-5 w-5 mr-2" />
                Try Voice Coach
              </a>
              <a 
                href="/interview/video-coach" 
                className="inline-flex items-center justify-center rounded-xl font-bold h-12 px-6 bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
              >
                <Video className="h-5 w-5 mr-2" />
                Try Video Coach
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <StatsCards assessments={assessments} />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="glass rounded-[2.5rem] p-1 border border-white/10 shadow-2xl h-full">
                <div className="bg-background/40 backdrop-blur-md rounded-[2.2rem] p-6 h-full">
                  <PerformanceChart assessments={assessments} />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <QuizList assessments={assessments} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
