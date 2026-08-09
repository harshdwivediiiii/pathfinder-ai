"use client";

import React, { useState } from "react";
import { clusterStudyGroups } from "./_components/clustering-algorithm";
import { Users, Globe, Zap, Radar, CheckCircle2, UserPlus, Loader2, Workflow, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudyGroupClusteringPage() {
  const [isClustering, setIsClustering] = useState(false);
  const [result, setResult] = useState(null);

  const currentUser = {
      id: "u_self",
      name: "Mohith",
      currentTopicId: "advanced_react_patterns",
      timezoneOffset: 5.5, // IST
      learningPace: 8 // High pace
  };
  
  // Mock a large pool of active users online right now
  const activeUserPool = [
      { id: "u_1", name: "Sarah K.", currentTopicId: "advanced_react_patterns", timezoneOffset: 5.5, learningPace: 7.5, avatar: "SK" }, // Perfect match
      { id: "u_2", name: "David L.", currentTopicId: "advanced_react_patterns", timezoneOffset: 4.0, learningPace: 8.5, avatar: "DL" }, // Good match
      { id: "u_3", name: "Priya M.", currentTopicId: "advanced_react_patterns", timezoneOffset: 5.5, learningPace: 4.0, avatar: "PM" }, // Same TZ, wrong pace
      { id: "u_4", name: "Alex R.", currentTopicId: "intro_to_python", timezoneOffset: 5.5, learningPace: 8.0, avatar: "AR" }, // Wrong topic
      { id: "u_5", name: "Jin W.", currentTopicId: "advanced_react_patterns", timezoneOffset: 8.0, learningPace: 8.0, avatar: "JW" }, // Decent match
      { id: "u_6", name: "Emma B.", currentTopicId: "advanced_react_patterns", timezoneOffset: -5.0, learningPace: 8.0, avatar: "EB" }  // Wrong TZ completely
  ];

  const handleCluster = () => {
      setIsClustering(true);
      setResult(null);
      
      // Simulate K-Means clustering delay
      setTimeout(() => {
          const outcome = clusterStudyGroups(activeUserPool, currentUser);
          setResult(outcome);
          setIsClustering(false);
      }, 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Workflow className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Study Group Clustering</h1>
          <p className="text-muted-foreground">Dynamically generate micro-study groups based on Topic, Timezone, and Learning Pace.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: User Vector Profile */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Radar className="w-5 h-5 text-violet-500" />
                 Your Active Learning Vector
              </CardTitle>
              <CardDescription>We use these metrics to find your optimal peers.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
              
              <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-950">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                              <CheckCircle2 className="w-4 h-4 text-violet-500" />
                          </div>
                          <span className="font-semibold text-sm">Current Module</span>
                      </div>
                      <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Advanced React Patterns</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-950">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                              <Globe className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="font-semibold text-sm">Timezone (UTC Offset)</span>
                      </div>
                      <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">+{currentUser.timezoneOffset}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-950">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                              <Zap className="w-4 h-4 text-amber-500" />
                          </div>
                          <span className="font-semibold text-sm">Learning Pace</span>
                      </div>
                      <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{currentUser.learningPace} / 10</span>
                  </div>
              </div>
              
              <Button 
                  onClick={handleCluster} 
                  disabled={isClustering}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12"
              >
                  {isClustering ? (
                      <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Running Clustering Algorithm...
                      </>
                  ) : (
                      <>
                          <Users className="w-5 h-5 mr-2" /> Find Micro-Study Group
                      </>
                  )}
              </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Clustered Results */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Users className="w-5 h-5 text-emerald-400" />
                 Generated Peer Group
              </CardTitle>
              <CardDescription className="text-slate-400">Temporary ad-hoc cluster based on your vector.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!result && !isClustering && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <Users className="w-12 h-12 mb-4 opacity-50" />
                      <p>Awaiting clustering request...</p>
                  </div>
              )}
              
              {isClustering && (
                  <div className="text-center flex flex-col items-center text-violet-400">
                      <div className="w-16 h-16 border-4 border-violet-900 border-t-violet-400 rounded-full animate-spin mb-4"></div>
                      <p className="animate-pulse text-sm">Calculating Euclidean distances across {activeUserPool.length} online peers...</p>
                  </div>
              )}
              
              {result && !isClustering && result.group.length === 0 && (
                  <div className="bg-amber-950/40 border border-amber-800 text-amber-400 p-4 rounded-xl text-center">
                      {result.message}
                  </div>
              )}
              
              {result && !isClustering && result.group.length > 0 && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                      
                      <div className="text-center bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg text-emerald-400 text-sm font-semibold">
                          {result.message}
                      </div>
                      
                      <div className="grid gap-4">
                          {/* Self */}
                          <div className="flex items-center justify-between p-4 bg-slate-900 border border-violet-900/50 rounded-xl relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500"></div>
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold">
                                      You
                                  </div>
                                  <div>
                                      <h4 className="font-bold">{currentUser.name}</h4>
                                      <p className="text-xs text-slate-400">Anchor Vector</p>
                                  </div>
                              </div>
                          </div>
                          
                          {/* Clustered Peers */}
                          {result.group.map((peer, idx) => (
                              <div key={peer.id} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                                          {peer.avatar}
                                      </div>
                                      <div>
                                          <h4 className="font-bold">{peer.name}</h4>
                                          <p className="text-xs text-slate-400 flex gap-2">
                                              <span>TZ: {peer.timezoneOffset}</span> • <span>Pace: {peer.learningPace}</span>
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                      <span className="text-xs text-emerald-400 font-mono">Dist: {peer.distance.toFixed(2)}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                          <MessageCircle className="w-4 h-4 mr-2" /> Start Group Session
                      </Button>
                      
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
