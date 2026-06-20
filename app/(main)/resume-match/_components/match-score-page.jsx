"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import MatchForm from "./match-form";
import MatchResult from "./match-result";
import MatchHistory from "./match-history";

export default function MatchScorePage({ initialHistory = [], savedResumeContent = "" }) {
  const [activeTab, setActiveTab] = useState("analyze");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState(initialHistory);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    // Add to history list at the top
    setHistory((prev) => [result, ...prev]);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHistorySelect = (item) => {
    setAnalysisResult(item);
    setActiveTab("analyze");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 p-1 bg-muted/50 rounded-2xl mb-8">
          <TabsTrigger 
            value="analyze" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-semibold"
          >
            Analyze
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-semibold flex items-center gap-2"
          >
            History
            {history.length > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="analyze" className="m-0 border-none p-0 outline-none">
                {!analysisResult ? (
                  <MatchForm 
                    savedResumeContent={savedResumeContent}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                ) : (
                  <MatchResult 
                    result={analysisResult} 
                    onReset={handleReset}
                  />
                )}
              </TabsContent>

              <TabsContent value="history" className="m-0 border-none p-0 outline-none">
                <MatchHistory 
                  history={history}
                  setHistory={setHistory}
                  onSelect={handleHistorySelect}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}
