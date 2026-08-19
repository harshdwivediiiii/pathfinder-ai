"use client";

import React, { useState, useEffect } from "react";
import { ZKProofGenerator } from "./_components/zk-algorithm";
import { ShieldCheck, Fingerprint, Lock, ShieldAlert, Cpu, EyeOff, FileCode2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ZkProofsPage() {
  const [zkGenerator] = useState(new ZKProofGenerator());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [proofData, setProofData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const mockProjectData = {
      repository: "https://github.com/anonymous/capstone-project",
      commitHash: "a1b2c3d4e5f6g7h8i9j0",
      linesOfCode: 1250,
      techStack: ["React", "Node", "PostgreSQL"]
  };

  const mockIdentity = {
      name: "Mohith",
      cohort: "Winter 2026",
      demographics: "International"
  };

  const handleGenerateProof = async () => {
    setIsGenerating(true);
    setProofData(null);
    setVerificationResult(null);

    try {
        const result = await zkGenerator.generateProof(mockProjectData, mockIdentity);
        setProofData(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleVerifyProof = () => {
      setIsVerifying(true);
      
      setTimeout(() => {
          const isValid = zkGenerator.verifyProof(proofData.proof, proofData.publicSignals);
          setVerificationResult(isValid);
          setIsVerifying(false);
      }, 800);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-teal-500" />
            Zero-Knowledge Anonymous Grading
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Use zk-SNARKs to mathematically prove project authenticity without revealing demographic identity.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/30 px-4 py-2 rounded-full border border-border">
          <EyeOff className="w-5 h-5 text-teal-500" />
          <span className="text-sm font-medium">Anti-Bias Protocol Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-teal-500/20 shadow-lg shadow-teal-500/5">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCode2 className="w-4 h-4" /> Public Project Payload
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="bg-[#0a0a0a] p-4 font-mono text-xs text-green-400 overflow-x-auto rounded-b-xl h-48">
                        <pre>{JSON.stringify(mockProjectData, null, 2)}</pre>
                    </div>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 shadow-lg shadow-red-500/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 pointer-events-none"></div>
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-red-500">
                    <Fingerprint className="w-4 h-4" /> Private PII Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="bg-[#0a0a0a] p-4 font-mono text-xs text-red-400 overflow-x-auto rounded-b-xl h-48 filter blur-[2px] hover:blur-none transition-all cursor-not-allowed">
                        <pre>{JSON.stringify(mockIdentity, null, 2)}</pre>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/60 pointer-events-none">
                            <span className="text-white font-bold tracking-widest border-2 border-red-500 px-4 py-1 rotate-12">NEVER TRANSMITTED</span>
                        </div>
                    </div>
                </CardContent>
              </Card>
          </div>

          <Button 
            size="lg" 
            onClick={handleGenerateProof} 
            disabled={isGenerating}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 transition-all shadow-md hover:shadow-lg h-14 text-lg font-semibold"
          >
            {isGenerating ? <Cpu className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {isGenerating ? "Computing zk-SNARK (Groth16)..." : "Generate Zero-Knowledge Proof"}
          </Button>
        </div>

        <div className="space-y-6">
            <Card className="h-full border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        Mentor Dashboard
                    </CardTitle>
                    <CardDescription>What the grader sees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!proofData && (
                        <div className="text-center p-8 bg-muted/50 rounded-lg border border-dashed text-muted-foreground">
                            Generate a proof to submit the project for anonymous grading.
                        </div>
                    )}

                    {proofData && (
                        <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
                            <div className="p-3 bg-secondary/30 rounded border font-mono text-xs break-all text-muted-foreground relative">
                                <span className="absolute -top-2 left-2 bg-background px-1 text-[10px] uppercase text-teal-500 font-bold">Generated Proof</span>
                                pi_a: {proofData.proof.pi_a[0]}...<br/>
                                protocol: {proofData.proof.protocol}<br/>
                                curve: {proofData.proof.curve}
                            </div>
                            
                            <div className="p-3 bg-secondary/30 rounded border font-mono text-xs break-all text-muted-foreground relative mt-4">
                                <span className="absolute -top-2 left-2 bg-background px-1 text-[10px] uppercase text-teal-500 font-bold">Public Signals</span>
                                Hash: {proofData.publicSignals[0]}<br/>
                                Cohort_Flag: {proofData.publicSignals[1]}
                            </div>

                            <Button 
                                onClick={handleVerifyProof} 
                                disabled={isVerifying || verificationResult !== null}
                                variant={verificationResult ? "outline" : "default"}
                                className={`w-full gap-2 ${verificationResult === null ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                            >
                                {isVerifying ? "Verifying Math..." : verificationResult === null ? "Verify Mathematical Proof" : "Proof Verified"}
                            </Button>

                            {verificationResult !== null && (
                                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in zoom-in duration-300 ${
                                    verificationResult ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-600'
                                }`}>
                                    {verificationResult ? <ShieldCheck className="w-8 h-8 shrink-0" /> : <ShieldAlert className="w-8 h-8 shrink-0" />}
                                    <div>
                                        <p className="font-bold">{verificationResult ? "Authenticity Cryptographically Proven" : "Proof Invalid"}</p>
                                        <p className="text-xs mt-1 opacity-80">Mentor can grade the payload with 100% certainty of origin, with 0% knowledge of identity.</p>
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
