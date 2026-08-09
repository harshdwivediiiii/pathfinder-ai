"use client";

import React, { useState } from "react";
import { executeSmartContract } from "./_components/smart-contract-algorithm";
import { Code2, Cpu, Award, Hexagon, CheckCircle2, XCircle, Terminal, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function MicroCredentialsPage() {
  const [code, setCode] = useState("import React, { useEffect, useState } from 'react';\n\nfunction App() {\n  return <div>Hello</div>;\n}");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);

  const mockTargetSkill = "ReactHooks";

  const handleExecute = () => {
      setIsExecuting(true);
      setResult(null);
      
      // Simulate Web3 contract execution delay
      setTimeout(() => {
          const outcome = executeSmartContract(code, mockTargetSkill);
          setResult(outcome);
          setIsExecuting(false);
      }, 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl">
          <Award className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dynamic Micro-Credentialing</h1>
          <p className="text-muted-foreground">Shorten the feedback loop. Automatically mint on-chain badges for completing granular code milestones.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Code Validator (User Input) */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                     <Terminal className="w-5 h-5 text-slate-500" />
                     Live Code Sandbox
                  </CardTitle>
                  <span className="text-xs font-mono bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300 px-2 py-1 rounded">
                      Target: {mockTargetSkill}
                  </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col space-y-4">
              
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded p-3 text-sm text-amber-800 dark:text-amber-400">
                  <strong>Challenge:</strong> Implement both `useState` and `useEffect` in the component below to unlock this node's micro-credential.
              </div>
              
              <Textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-grow min-h-[300px] font-mono text-sm bg-slate-950 text-emerald-400 border-slate-800 focus:border-fuchsia-500 rounded-lg p-4 resize-none"
                  spellCheck="false"
              />
              
              <Button 
                  onClick={handleExecute} 
                  disabled={isExecuting || !code.trim()}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 h-12"
              >
                  {isExecuting ? (
                      <>
                          <Cpu className="w-5 h-5 mr-2 animate-pulse text-fuchsia-500" /> Executing Smart Contract...
                      </>
                  ) : (
                      <>
                          <Code2 className="w-5 h-5 mr-2" /> Submit Code to Contract
                      </>
                  )}
              </Button>
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Smart Contract Output & NFT Display */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Hexagon className="w-5 h-5 text-fuchsia-400" />
                 Blockchain Verification Node
              </CardTitle>
              <CardDescription className="text-slate-400">Automated ledger response.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow flex flex-col justify-center">
              
              {!result && !isExecuting && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                      <Layers className="w-12 h-12 mb-4 opacity-50" />
                      <p>Awaiting transaction submission...</p>
                  </div>
              )}
              
              {isExecuting && (
                  <div className="text-center flex flex-col items-center text-fuchsia-400">
                      <Hexagon className="w-16 h-16 animate-spin mb-4 opacity-80" />
                      <p className="animate-pulse text-sm font-mono">Validating code against contract conditions...</p>
                  </div>
              )}
              
              {result && !isExecuting && (
                  <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                      
                      {/* Contract Execution Result */}
                      <div className={`p-4 rounded-lg border ${result.success ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400' : 'bg-rose-950/40 border-rose-800/50 text-rose-400'}`}>
                          <div className="flex items-start gap-3">
                              {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                              <div>
                                  <h4 className="font-bold mb-1">{result.success ? 'Transaction Successful' : 'Transaction Reverted'}</h4>
                                  <p className="text-sm opacity-90 font-mono">{result.message}</p>
                              </div>
                          </div>
                      </div>
                      
                      {/* NFT Minting Display */}
                      {result.success && result.credential && (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center relative overflow-hidden shadow-2xl shadow-fuchsia-900/20">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                              
                              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
                                  <Award className="w-12 h-12 text-white" />
                              </div>
                              
                              <h3 className="text-xl font-bold text-white mb-1">Micro-Credential Minted!</h3>
                              <p className="text-fuchsia-400 text-sm font-semibold mb-6">Skill: {result.credential.skillId}</p>
                              
                              <div className="bg-slate-950 rounded-lg p-3 text-left space-y-2 text-xs font-mono border border-slate-800">
                                  <div className="flex justify-between">
                                      <span className="text-slate-500">Token ID:</span>
                                      <span className="text-slate-300">{result.credential.tokenId}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-slate-500">Contract:</span>
                                      <span className="text-slate-300 truncate ml-4">{result.credential.contractAddress}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-slate-500">Timestamp:</span>
                                      <span className="text-slate-300">{result.credential.timestamp}</span>
                                  </div>
                              </div>
                          </div>
                      )}
                      
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
