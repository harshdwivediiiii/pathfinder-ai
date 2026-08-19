"use client";

import React, { useState } from "react";
import { CICDProvisioner } from "./_components/provisioning-engine";
import { Rocket, Server, GitBranch, Github, Code2, CloudCog, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CICDProvisioningPage() {
  const [provisioner] = useState(new CICDProvisioner());
  const [repoUrl, setRepoUrl] = useState("https://github.com/anonymous/awesome-portfolio");
  const [stack, setStack] = useState("react");
  const [provider, setProvider] = useState("vercel");
  
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  const handleProvision = async () => {
    setIsProvisioning(true);
    setProvisionResult(null);

    try {
        const result = await provisioner.provisionPipeline(stack, provider, repoUrl);
        setProvisionResult(result);
    } catch (e) {
        console.error(e);
        alert(e.message);
    } finally {
        setIsProvisioning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Rocket className="w-10 h-10 text-cyan-500" />
            1-Click CI/CD Pipeline
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Automatically provision GitHub Actions and Terraform configs to deploy your capstone to production.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" /> Pipeline Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Github className="w-4 h-4"/> Repository URL</label>
                    <input 
                        className="w-full bg-background border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Code2 className="w-4 h-4"/> Tech Stack</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['react', 'node', 'python'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStack(s)}
                                className={`py-2 text-xs font-bold uppercase rounded-md border transition-all ${stack === s ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><CloudCog className="w-4 h-4"/> Cloud Provider (Free Tier)</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['vercel', 'render'].map(p => (
                            <button
                                key={p}
                                onClick={() => setProvider(p)}
                                className={`py-2 text-xs font-bold uppercase rounded-md border transition-all ${provider === p ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-muted/30 text-muted-foreground hover:bg-muted'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <Button 
                    size="lg" 
                    onClick={handleProvision} 
                    disabled={isProvisioning || !repoUrl}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white gap-2 transition-all shadow-md mt-4 h-14"
                >
                    {isProvisioning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                    {isProvisioning ? "Provisioning Infrastructure..." : "Deploy Pipeline"}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
            <Card className="h-full border-dashed flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-cyan-500" />
                        Infrastructure as Code Generation
                    </CardTitle>
                    <CardDescription>
                        Terraform & GitHub Actions configurations are injected into your repository.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-6 relative flex flex-col gap-6">
                    {!provisionResult && !isProvisioning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-muted-foreground/50">
                            <Server className="w-16 h-16 mb-4 opacity-20" />
                            <p>Configure your pipeline on the left to generate IaC files.</p>
                        </div>
                    )}

                    {isProvisioning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-cyan-500">
                            <Rocket className="w-16 h-16 mb-4 animate-bounce" />
                            <p className="font-mono text-sm animate-pulse">Generating Terraform states and GH Actions workflows...</p>
                        </div>
                    )}

                    {provisionResult && (
                        <div className="animate-in slide-in-from-right-8 duration-500 space-y-6 h-full flex flex-col">
                            
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                                    <CheckCircle className="w-6 h-6" />
                                    <div>
                                        <p className="font-bold text-sm">Pipeline Successfully Provisioned</p>
                                        <p className="text-xs opacity-80">Committing IaC files to your repository via GitHub API...</p>
                                    </div>
                                </div>
                                <a href={provisionResult.mockDeploymentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-full hover:bg-green-600 transition-colors">
                                    View Live URL <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                <div className="flex flex-col border rounded-xl overflow-hidden bg-[#1e1e1e]">
                                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 text-xs font-mono text-gray-300 flex justify-between items-center">
                                        <span>.github/workflows/ci.yml</span>
                                        <Github className="w-3 h-3" />
                                    </div>
                                    <pre className="p-4 text-[10px] sm:text-xs text-blue-300 overflow-auto custom-scrollbar flex-1">
                                        {provisionResult.artifacts.githubActions}
                                    </pre>
                                </div>

                                <div className="flex flex-col border rounded-xl overflow-hidden bg-[#1e1e1e]">
                                    <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 text-xs font-mono text-gray-300 flex justify-between items-center">
                                        <span>main.tf</span>
                                        <CloudCog className="w-3 h-3" />
                                    </div>
                                    <pre className="p-4 text-[10px] sm:text-xs text-purple-300 overflow-auto custom-scrollbar flex-1">
                                        {provisionResult.artifacts.terraform}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
