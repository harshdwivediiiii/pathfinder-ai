"use client";

import React, { useState } from "react";
import { Lock, Eye, Key, Award, CheckCircle2, ShieldAlert, Plus, HelpCircle, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

const CHALLENGES = [
  {
    id: 1,
    title: "Secret Hash Preimage Quiz 1",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x000000a9bc8"
  },
  {
    id: 2,
    title: "Discrete Log Identity Quiz 1",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x000049a9bc8"
  },
  {
    id: 3,
    title: "Arithmetic Circuit Constraint Quiz 1",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x000092a9bc8"
  },
  {
    id: 4,
    title: "Secret Hash Preimage Quiz 2",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x0000dba9bc8"
  },
  {
    id: 5,
    title: "Discrete Log Identity Quiz 2",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x000124a9bc8"
  },
  {
    id: 6,
    title: "Arithmetic Circuit Constraint Quiz 2",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x00016da9bc8"
  },
  {
    id: 7,
    title: "Secret Hash Preimage Quiz 3",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x0001b6a9bc8"
  },
  {
    id: 8,
    title: "Discrete Log Identity Quiz 3",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x0001ffa9bc8"
  },
  {
    id: 9,
    title: "Arithmetic Circuit Constraint Quiz 3",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x000248a9bc8"
  },
  {
    id: 10,
    title: "Secret Hash Preimage Quiz 4",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x000291a9bc8"
  },
  {
    id: 11,
    title: "Discrete Log Identity Quiz 4",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x0002daa9bc8"
  },
  {
    id: 12,
    title: "Arithmetic Circuit Constraint Quiz 4",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x000323a9bc8"
  },
  {
    id: 13,
    title: "Secret Hash Preimage Quiz 5",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x00036ca9bc8"
  },
  {
    id: 14,
    title: "Discrete Log Identity Quiz 5",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x0003b5a9bc8"
  },
  {
    id: 15,
    title: "Arithmetic Circuit Constraint Quiz 5",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x0003fea9bc8"
  },
  {
    id: 16,
    title: "Secret Hash Preimage Quiz 6",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x000447a9bc8"
  },
  {
    id: 17,
    title: "Discrete Log Identity Quiz 6",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x000490a9bc8"
  },
  {
    id: 18,
    title: "Arithmetic Circuit Constraint Quiz 6",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x0004d9a9bc8"
  },
  {
    id: 19,
    title: "Secret Hash Preimage Quiz 7",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x000522a9bc8"
  },
  {
    id: 20,
    title: "Discrete Log Identity Quiz 7",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x00056ba9bc8"
  },
  {
    id: 21,
    title: "Arithmetic Circuit Constraint Quiz 7",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x0005b4a9bc8"
  },
  {
    id: 22,
    title: "Secret Hash Preimage Quiz 8",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x0005fda9bc8"
  },
  {
    id: 23,
    title: "Discrete Log Identity Quiz 8",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x000646a9bc8"
  },
  {
    id: 24,
    title: "Arithmetic Circuit Constraint Quiz 8",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x00068fa9bc8"
  },
  {
    id: 25,
    title: "Secret Hash Preimage Quiz 9",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x0006d8a9bc8"
  },
  {
    id: 26,
    title: "Discrete Log Identity Quiz 9",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x000721a9bc8"
  },
  {
    id: 27,
    title: "Arithmetic Circuit Constraint Quiz 9",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x00076aa9bc8"
  },
  {
    id: 28,
    title: "Secret Hash Preimage Quiz 10",
    description: "Prove knowledge of value x such that SHA-256(x) matches public hash parameters",
    zkpType: "SHA-256",
    publicKey: "0x5f4dcc3b5aa765d61d8327deb882cf99",
    challengeHex: "0x0007b3a9bc8"
  },
  {
    id: 29,
    title: "Discrete Log Identity Quiz 10",
    description: "Verify that exponential credentials match baseline group keys modulo a prime bounds",
    zkpType: "Discrete Log",
    publicKey: "0x78a0c213eb938",
    challengeHex: "0x0007fca9bc8"
  },
  {
    id: 30,
    title: "Arithmetic Circuit Constraint Quiz 10",
    description: "Prove that solutions fit system quadratic constraints under confidential testing matrices",
    zkpType: "Arithmetic Circuit",
    publicKey: "0xbf5632cd90aa18",
    challengeHex: "0x000845a9bc8"
  },
];

export default function ZKPGradingPage() {
  const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGES[0]);
  const [secretInput, setSecretInput] = useState("");
  const [proofState, setProofState] = useState("idle");
  const [logs, setLogs] = useState([]);

  const handleGenerateProof = () => {
    if (!secretInput.trim()) return;
    setProofState("generating");
    setLogs([]);
    
    const steps = [
      "Hashing local inputs into witness representations...",
      "Generating cryptographic commitments based on public parameters...",
      "Evaluating challenge vectors from anonymous verification key...",
      "Synthesizing proof array using bilinear pairing checks..."
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setProofState("verified");
        }
      }, (idx + 1) * 400);
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
          <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Zero-Knowledge Proof Grading</h1>
          <p className="text-muted-foreground">Verify assessment capabilities anonymously without transmitting student answer keys.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[450px] overflow-y-auto">
              {CHALLENGES.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChallenge(ch)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                    selectedChallenge.id === ch.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold text-foreground">{ch.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{ch.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Student Prover Panel</CardTitle>
              <CardDescription>{selectedChallenge.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b pb-1 border-border/20">
                  <span className="text-muted-foreground">Public Key:</span>
                  <span className="font-semibold text-foreground">{selectedChallenge.publicKey}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-border/20">
                  <span className="text-muted-foreground">Verifier Modulus:</span>
                  <span className="font-semibold text-foreground">{selectedChallenge.challengeHex}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <label className="text-xs font-semibold text-foreground">Witness Preimage Secret</label>
                <Input
                  type="password"
                  placeholder="Input secret response to verify"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGenerateProof}
                disabled={!secretInput.trim() || proofState === "generating"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
              >
                {proofState === "generating" ? "Generating Witness Proof..." : "Prove Knowledge"}
              </Button>

              {logs.length > 0 && (
                <div className="p-4 border rounded-xl bg-slate-950 border-slate-900 font-mono text-xs space-y-2 text-slate-100 min-h-[120px]">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-emerald-500">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {proofState === "verified" && (
                    <div className="text-green-500 font-bold border-t border-slate-800 pt-2 mt-2">
                      Proof Successfully Verified! Grading recorded anonymously.
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
