"use client";

import React, { useState, useEffect } from "react";
import { applyCRDTOperations } from "./_components/crdt-algorithm";
import { Users, Globe, Terminal, Code, Activity, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function PairProgrammingPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const initialCode = `function calculateTotal(items) {\n  let total = 0;\n  for (let item of items) {\n    total += item.price;\n  }\n  return total;\n}`;

  const peerOperations = [
    { peerId: "peer_A", timestamp: 1629800000, type: "insert", index: 110, value: "\n    // applying discount\n    if (item.discount) total -= item.discount;" },
    { peerId: "peer_B", timestamp: 1629800001, type: "insert", index: 32, value: " = 0" }, // Conflict simulation
    { peerId: "peer_A", timestamp: 1629800005, type: "delete", index: 15, length: 5 },
  ];

  const handleConnect = () => {
    setIsConnecting(true);
    setSimulationResult(null);
    setSyncProgress(0);

    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const result = applyCRDTOperations(initialCode, peerOperations);
          setSimulationResult(result);
          setIsConnecting(false);
          setIsConnected(true);
          return 100;
        }
        return prev + 20;
      });
    }, 500);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-500" />
            WebRTC Pair Programming
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Collaborate on code in real-time with zero latency using WebRTC and CRDTs.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/30 px-4 py-2 rounded-full border border-border">
          <Globe className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">Peer-to-Peer Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Code Editor Simulation
                </CardTitle>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="flex h-3 w-3 rounded-full bg-yellow-500"></span>
                    <span className="flex h-3 w-3 rounded-full bg-green-500"></span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="bg-[#1e1e1e] p-6 font-mono text-sm text-gray-300 rounded-b-xl overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                        {simulationResult ? simulationResult.finalText : initialCode}
                    </pre>
                </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
                size="lg" 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all shadow-md hover:shadow-lg"
            >
              {isConnecting ? (
                <>
                  <Activity className="w-5 h-5 animate-pulse" />
                  Syncing CRDTs...
                </>
              ) : isConnected ? (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Resync Peers
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Connect to Peers
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Connection Status</CardTitle>
              <CardDescription>WebRTC P2P mesh network details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConnecting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exchanging SDP offers...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}

              {simulationResult ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6" />
                    <div>
                      <h4 className="font-semibold">Connection Established</h4>
                      <p className="text-sm">Direct peer connections active.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">CRDT Event Log:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {simulationResult.historyLog.map((log, index) => (
                            <div key={index} className="text-xs p-2 bg-secondary rounded border border-border/50 font-mono">
                                {log}
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/50 rounded-lg border border-dashed">
                  <Globe className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Click connect to simulate incoming peer operations via WebRTC.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
