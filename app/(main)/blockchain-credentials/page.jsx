"use client";

import React, { useState } from "react";
import { mintCertificateSBT, verifyCertificateOnChain } from "./_components/blockchain-algorithm";
import { Hexagon, Lock, Fingerprint, CheckCircle2, XCircle, Search, Layers, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BlockchainCredentialsPage() {
  const [isMinting, setIsMinting] = useState(false);
  const [certificateData, setCertificateData] = useState(null);
  
  // Verification State
  const [verifyHash, setVerifyHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  const mockUser = "Mohith Reddy";
  const mockPathway = "Full Stack Web3 Architecture";

  const handleMint = () => {
      setIsMinting(true);
      setCertificateData(null);
      
      // Simulate blockchain transaction delay
      setTimeout(() => {
          const result = mintCertificateSBT(mockUser, mockPathway, new Date().toISOString().split('T')[0]);
          setCertificateData(result);
          setVerifyHash(result.txHash); // Auto-fill for convenience
          setIsMinting(false);
      }, 2500);
  };
  
  const handleVerify = (e) => {
      e.preventDefault();
      if (!verifyHash.trim()) return;
      
      const result = verifyCertificateOnChain(verifyHash);
      setVerificationResult(result);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <Hexagon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">On-Chain Credential Verification</h1>
          <p className="text-muted-foreground">Mint immutable pathway certificates as Soulbound Tokens (SBTs) to prevent forgery.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Minting Dashboard */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Layers className="w-5 h-5 text-amber-500" />
                 Pathfinder Minting Authority
              </CardTitle>
              <CardDescription>Issue cryptographic proof of completion.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
              
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-500">Candidate Name</span>
                      <span className="font-bold">{mockUser}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-500">Pathway Completed</span>
                      <span className="font-bold">{mockPathway}</span>
                  </div>
              </div>
              
              <Button 
                  onClick={handleMint} 
                  disabled={isMinting || certificateData}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12"
              >
                  {isMinting ? (
                      <>
                          <Hexagon className="w-5 h-5 mr-2 animate-spin" /> Mining Block...
                      </>
                  ) : certificateData ? (
                      <>
                          <CheckCircle2 className="w-5 h-5 mr-2" /> SBT Minted
                      </>
                  ) : (
                      <>
                          <Lock className="w-5 h-5 mr-2" /> Mint Soulbound Certificate
                      </>
                  )}
              </Button>
              
              {certificateData && (
                  <div className="p-5 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-xl space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-2">
                          <Fingerprint className="w-5 h-5" /> Immutable Record Generated
                      </div>
                      
                      <div className="space-y-2 text-sm font-mono break-all">
                          <div>
                              <span className="text-amber-600/70 dark:text-amber-500/70 uppercase text-xs font-sans font-bold">Transaction Hash</span>
                              <div className="bg-white dark:bg-slate-900 p-2 rounded border">{certificateData.txHash}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                  <span className="text-amber-600/70 dark:text-amber-500/70 uppercase text-xs font-sans font-bold">Block No.</span>
                                  <div className="bg-white dark:bg-slate-900 p-2 rounded border">{certificateData.blockNumber}</div>
                              </div>
                              <div>
                                  <span className="text-amber-600/70 dark:text-amber-500/70 uppercase text-xs font-sans font-bold">Token Type</span>
                                  <div className="bg-white dark:bg-slate-900 p-2 rounded border text-center flex items-center justify-center gap-1">
                                      <Lock className="w-3 h-3"/> Non-Transferable (SBT)
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
              
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Employer Verification Portal */}
        <div className="space-y-6">
          <Card className="border shadow-sm h-full flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Search className="w-5 h-5 text-emerald-400" />
                 Employer Verification Portal
              </CardTitle>
              <CardDescription className="text-slate-400">Cryptographically verify a candidate's certificate.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-grow space-y-6">
              
              <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Enter Certificate Transaction Hash</label>
                      <Input 
                          value={verifyHash}
                          onChange={(e) => setVerifyHash(e.target.value)}
                          placeholder="0x..."
                          className="font-mono bg-slate-900 border-slate-700 text-slate-100"
                      />
                  </div>
                  <Button type="submit" variant="outline" className="w-full border-emerald-500 text-emerald-400 hover:bg-emerald-950">
                      Query Blockchain Ledger
                  </Button>
              </form>
              
              {verificationResult && (
                  <div className={`p-5 rounded-xl border animate-in slide-in-from-bottom-4 ${verificationResult.isValid ? 'bg-emerald-950/40 border-emerald-800' : 'bg-rose-950/40 border-rose-800'}`}>
                      
                      {verificationResult.isValid ? (
                          <div className="space-y-4">
                              <div className="flex items-start gap-3 text-emerald-400">
                                  <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0" />
                                  <div>
                                      <h3 className="font-bold text-lg">Valid Certificate</h3>
                                      <p className="text-sm text-emerald-500/80">{verificationResult.message}</p>
                                  </div>
                              </div>
                              
                              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                                  <div className="flex justify-between border-b border-slate-800 pb-2">
                                      <span className="text-slate-500 text-sm">Issued To</span>
                                      <span className="font-medium text-slate-200">{verificationResult.record.userId}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-800 pb-2">
                                      <span className="text-slate-500 text-sm">Pathway</span>
                                      <span className="font-medium text-slate-200">{verificationResult.record.pathwayName}</span>
                                  </div>
                                  <div className="flex justify-between pb-1">
                                      <span className="text-slate-500 text-sm">Completion Date</span>
                                      <span className="font-medium text-slate-200">{verificationResult.record.completionDate}</span>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-start gap-3 text-rose-400">
                              <XCircle className="w-6 h-6 mt-0.5 shrink-0" />
                              <div>
                                  <h3 className="font-bold text-lg">Verification Failed</h3>
                                  <p className="text-sm text-rose-500/80">{verificationResult.message}</p>
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
