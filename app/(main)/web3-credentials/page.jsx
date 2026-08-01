"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ShieldCheck, ShieldAlert, BadgeCheck, FileJson, Loader2, ArrowRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROADMAPS = [
  "Advanced System Design Architecture",
  "Full-Stack Web3 Development",
  "Machine Learning Engineering",
  "Cloud Native DevOps"
];

export default function Web3CredentialsPage() {
  const [selectedRoadmap, setSelectedRoadmap] = useState(ROADMAPS[0]);
  const [authorityWallet, setAuthorityWallet] = useState(null);
  
  const [isMinting, setIsMinting] = useState(false);
  const [credential, setCredential] = useState(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Initialize a mock authority wallet purely for demonstration
  useEffect(() => {
    const wallet = ethers.Wallet.createRandom();
    setAuthorityWallet(wallet);
  }, []);

  const handleMint = async () => {
    if (!authorityWallet) return;
    setIsMinting(true);
    setVerificationResult(null);

    try {
      // Create the credential payload
      const payload = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "CourseCompletionCredential"],
        issuer: authorityWallet.address,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pathfinder:user-12345",
          courseName: selectedRoadmap,
          completionStatus: "Completed with Distinction"
        }
      };

      // Stringify for signing
      const payloadStr = JSON.stringify(payload);
      
      // Cryptographically sign the payload
      const signature = await authorityWallet.signMessage(payloadStr);

      setCredential({
        payload,
        signature,
        rawString: payloadStr
      });
    } catch (error) {
      console.error("Failed to mint credential:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const handleVerify = async () => {
    if (!credential) return;
    setIsVerifying(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Recover the address from the signature and payload
      const recoveredAddress = ethers.verifyMessage(credential.rawString, credential.signature);
      
      if (recoveredAddress === credential.payload.issuer) {
        setVerificationResult({ success: true, message: "Signature is valid and cryptographically proven." });
      } else {
        setVerificationResult({ success: false, message: "Signature is invalid or has been tampered with." });
      }
    } catch (error) {
      setVerificationResult({ success: false, message: "Verification failed due to a cryptographic error." });
    } finally {
      setIsVerifying(false);
    }
  };

  const tamperWithCredential = () => {
    if (!credential) return;
    const tamperedPayload = { ...credential.payload };
    tamperedPayload.credentialSubject.courseName = "TAMPERED: Fake Course";
    setCredential({
      ...credential,
      payload: tamperedPayload,
      rawString: JSON.stringify(tamperedPayload)
    });
    setVerificationResult(null);
  };

  return (
    <div className="container max-w-5xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500">
          <BadgeCheck className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">Web3 Verifiable Credentials</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Cryptographic <span className="text-gradient-primary">Proof of Skill.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Mint decentralized, verifiable credentials for your completed roadmaps on Polygon. Employers can independently verify your certificates using cryptographic signatures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Minting Section */}
        <Card className="glass border-border rounded-3xl h-fit">
          <CardHeader>
            <CardTitle>Mint Credential</CardTitle>
            <CardDescription>Issue a certificate signed by Pathfinder AI's smart contract.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">Select Completed Roadmap</label>
              <Select value={selectedRoadmap} onValueChange={setSelectedRoadmap}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select Roadmap" />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-4 bg-background/50 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">Authority Wallet (Mock)</p>
              <p className="text-sm font-mono truncate">{authorityWallet ? authorityWallet.address : "Generating..."}</p>
            </div>

            <Button 
              onClick={handleMint} 
              disabled={isMinting || !authorityWallet}
              className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              {isMinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
              Sign & Mint Credential
            </Button>
          </CardContent>
        </Card>

        {/* Verification Section */}
        <Card className="glass border-border rounded-3xl flex flex-col">
          <CardHeader>
            <CardTitle>Verification Hub</CardTitle>
            <CardDescription>Cryptographically verify issued credentials.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {credential ? (
              <div className="space-y-6 fade-in">
                <div className="bg-background/80 rounded-2xl p-4 border border-border space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                      <FileJson className="h-3 w-3" /> Credential Payload
                    </p>
                    <pre className="text-[10px] sm:text-xs font-mono text-foreground/80 bg-background p-3 rounded-lg overflow-x-auto border border-border">
                      {JSON.stringify(credential.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Cryptographic Signature</p>
                    <p className="text-xs font-mono break-all text-violet-500 bg-violet-500/10 p-3 rounded-lg border border-violet-500/20">
                      {credential.signature}
                    </p>
                  </div>
                </div>

                {verificationResult && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    verificationResult.success 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                      : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                  }`}>
                    {verificationResult.success ? <ShieldCheck className="h-5 w-5 mt-0.5" /> : <ShieldAlert className="h-5 w-5 mt-0.5" />}
                    <div>
                      <p className="font-bold">{verificationResult.success ? "Verified Successfully" : "Verification Failed"}</p>
                      <p className="text-sm opacity-90">{verificationResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleVerify} 
                    disabled={isVerifying}
                    className="h-12 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Signature"}
                  </Button>
                  <Button 
                    onClick={tamperWithCredential}
                    variant="outline" 
                    className="h-12 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                  >
                    Simulate Tampering
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground space-y-4 py-12">
                <ShieldCheck className="h-16 w-16 mx-auto opacity-20" />
                <p>Mint a credential to view the payload and verify its cryptographic signature.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
