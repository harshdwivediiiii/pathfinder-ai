"use client";

import React, { useState } from "react";
import { AgentOrchestrator } from "./_components/review-algorithm";
import { Bot, GitPullRequest, Shield, Zap, Code, AlertCircle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AutonomousCodeReviewPage() {
  const [orchestrator] = useState(new AgentOrchestrator());
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

  const [prDiff, setPrDiff] = useState(`@@ -1,5 +1,6 @@
 function authenticateUser(req) {
-  const token = req.headers.auth;
+  const token = req.headers.authorization;
+  const secret = "super_secret_hardcoded_key"; // Testing only
   
-  for(let i=0; i<users.length; i++) {
-    for(let j=0; j<roles.length; j++) {
+  var isValid = false;
+  for(let i=0; i<users.length; i++) {
+    for(let j=0; j<roles.length; j++) {
       // Check permissions
`);

  const handleReview = async () => {
    setIsReviewing(true);
    setReviewResult(null);

    try {
        const result = await orchestrator.analyzePullRequest({ diff: prDiff });
        setReviewResult(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsReviewing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
        case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
        case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const getAgentIcon = (iconString) => {
      switch(iconString) {
          case 'shield': return <Shield className="w-4 h-4" />;
          case 'zap': return <Zap className="w-4 h-4" />;
          case 'code': return <Code className="w-4 h-4" />;
          default: return <Bot className="w-4 h-4" />;
      }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Bot className="w-10 h-10 text-indigo-500" />
            Autonomous AI Code Reviewers
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            LangChain orchestrated multi-agent system providing granular, persona-driven PR feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5" />
                Pull Request Diff
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <textarea 
                    className="w-full h-80 bg-[#1e1e1e] text-green-400 p-6 font-mono text-sm resize-none focus:outline-none rounded-b-xl custom-scrollbar"
                    value={prDiff}
                    onChange={(e) => setPrDiff(e.target.value)}
                    placeholder="Paste your git diff here..."
                />
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            onClick={handleReview} 
            disabled={isReviewing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all shadow-md hover:shadow-lg h-14 text-lg font-semibold"
          >
            {isReviewing ? (
                <>
                    <Bot className="w-5 h-5 animate-bounce" />
                    Agents Deliberating...
                </>
            ) : (
                <>
                    <Zap className="w-5 h-5" />
                    Request Multi-Agent Review
                </>
            )}
          </Button>
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Agent Feedback
                        </CardTitle>
                        {reviewResult && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                                reviewResult.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                                {reviewResult.status === 'approved' ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                                {reviewResult.status.replace('_', ' ').toUpperCase()}
                            </span>
                        )}
                    </div>
                    <CardDescription>Inline comments synthesized by AI personas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!reviewResult && !isReviewing && (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-64 border rounded-xl bg-muted/30">
                            <Bot className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">Submit your diff to trigger the Strict Security Auditor, Performance Optimizer, and Clean Code Advocate.</p>
                        </div>
                    )}

                    {isReviewing && (
                         <div className="flex flex-col items-center justify-center p-12 text-center h-64 border rounded-xl bg-indigo-500/5">
                            <Bot className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
                            <p className="text-muted-foreground font-medium animate-pulse">Orchestrating {orchestrator.agents.length} LangChain Agents...</p>
                        </div>
                    )}

                    {reviewResult && (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-right-8 duration-500">
                            {reviewResult.comments.map((comment, index) => {
                                const agent = orchestrator.agents.find(a => a.id === comment.agentId);
                                return (
                                <div key={index} className={`p-4 rounded-xl border ${getSeverityColor(comment.severity)} relative overflow-hidden`}>
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-current/10">
                                        {getAgentIcon(agent?.icon)}
                                        <span className="font-bold text-sm">{comment.agentName}</span>
                                        <span className="ml-auto text-xs opacity-80 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Line {comment.line}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        {comment.message}
                                    </p>
                                </div>
                            )})}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
