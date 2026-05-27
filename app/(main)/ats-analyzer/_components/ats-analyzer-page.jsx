"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScanText, History } from "lucide-react";
import ATSForm from "./ats-form";
import ATSResult from "./ats-result";
import ATSHistory from "./ats-history";

export default function ATSAnalyzerPage({ initialHistory, savedResumeContent }) {
  const [currentResult, setCurrentResult] = useState(null);
  const [activeTab, setActiveTab] = useState("analyze");
  const [history, setHistory] = useState(
    Array.isArray(initialHistory) ? initialHistory : []
  );

  const handleAnalysisComplete = (result) => {
    setCurrentResult(result);
    // Prepend the new result to the history list
    setHistory((prev) => [result, ...(Array.isArray(prev) ? prev : [])]);
  };

  const handleAnalyzeAgain = () => {
    setCurrentResult(null);
  };

  const handleDeleteFromHistory = (deletedId) => {
    setHistory((prev) =>
      (Array.isArray(prev) ? prev : []).filter((item) => item.id !== deletedId)
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 h-11">
        <TabsTrigger value="analyze" className="flex items-center gap-2 px-6">
          <ScanText className="h-4 w-4" />
          Analyze
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2 px-6">
          <History className="h-4 w-4" />
          History
          {history.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
              {history.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="analyze">
        {currentResult ? (
          <ATSResult result={currentResult} onAnalyzeAgain={handleAnalyzeAgain} />
        ) : (
          <ATSForm
            savedResumeContent={savedResumeContent}
            onComplete={handleAnalysisComplete}
          />
        )}
      </TabsContent>

      <TabsContent value="history">
        <ATSHistory history={history} onDelete={handleDeleteFromHistory} />
      </TabsContent>
    </Tabs>
  );
}
