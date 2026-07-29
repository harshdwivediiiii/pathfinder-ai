"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Server, Smartphone, ArrowRight, ShieldCheck, Download, Upload } from "lucide-react";

export default function FederatedLearningEdge() {
  const [globalModel, setGlobalModel] = useState(null);
  const [localTraining, setLocalTraining] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingEpochs, setTrainingEpochs] = useState(0);
  const [clientDeltas, setClientDeltas] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchGlobalModel = async () => {
    try {
      const res = await fetch("/api/ml/federated");
      if (!res.ok) throw new Error("Failed to fetch global model");
      const data = await res.json();
      setGlobalModel(data);
      addLog(`Downloaded Global Model v${data.version}`);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  useEffect(() => {
    fetchGlobalModel();
  }, []);

  const addLog = (message) => {
    setTrainingLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const startLocalTraining = () => {
    if (!globalModel) return;
    setLocalTraining(true);
    setTrainingEpochs(0);
    setClientDeltas(null);
    addLog("Started local training on edge device data...");
    
    // Simulate training epochs
    let epochs = 0;
    const interval = setInterval(() => {
      epochs += 10;
      setTrainingEpochs(epochs);
      addLog(`Training epoch ${epochs}/100...`);
      
      if (epochs >= 100) {
        clearInterval(interval);
        setLocalTraining(false);
        addLog("Local training complete. Generating weight deltas.");
        simulateDeltas();
      }
    }, 500);
  };

  const simulateDeltas = () => {
    // Generate simulated deltas based on local device training
    const deltas = [];
    for (let layer of globalModel.layers) {
      const layerDeltas = new Array(layer).fill(0).map(() => (Math.random() - 0.5) * 0.05);
      deltas.push(layerDeltas);
    }
    setClientDeltas(deltas);
    addLog("Encrypted deltas ready for aggregation.");
  };

  const uploadDeltas = async () => {
    if (!clientDeltas) return;
    setSyncing(true);
    addLog("Uploading encrypted weight deltas to central server...");
    
    try {
      const res = await fetch("/api/ml/federated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDeltas,
          samplesTrained: 500 // simulated local samples
        })
      });
      
      if (!res.ok) throw new Error("Failed to upload updates");
      const data = await res.json();
      
      addLog(`Server aggregated updates successfully (Participants: ${data.result.participantsTotal})`);
      setSuccessMsg("Federated Learning weights updated securely!");
      setErrorMsg(null);
      setClientDeltas(null);
      
      // Fetch new global model
      setTimeout(() => fetchGlobalModel(), 1000);
    } catch (err) {
      addLog(`Error: ${err.message}`);
      setErrorMsg(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container max-w-5xl py-12 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-green-600" />
          Federated Learning (Edge AI)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Train route prediction models locally on your device. Only privacy-preserving model weight updates are sent to the server.
        </p>
        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-md border border-green-200">
            {successMsg}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="col-span-1 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Central Aggregator
            </CardTitle>
            <CardDescription>Global model architecture hosted on cloud</CardDescription>
          </CardHeader>
          <CardContent>
            {globalModel ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Model Version</p>
                  <p className="font-mono text-sm">{globalModel.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Neural Network Topology</p>
                  <div className="flex gap-2 mt-1">
                    {globalModel.layers.map((l, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs">
                        L{i}: {l} neurons
                      </span>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={fetchGlobalModel}
                  disabled={syncing || localTraining}
                >
                  <Download className="mr-2 h-4 w-4" /> Pull Latest Model
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-500" />
              Edge Device Simulation (Local)
            </CardTitle>
            <CardDescription>Your local telemetry stays on device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                onClick={startLocalTraining} 
                disabled={!globalModel || localTraining || syncing || clientDeltas}
                className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              >
                {localTraining ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Training ({trainingEpochs}%)...</>
                ) : (
                  "Start Local Training"
                )}
              </Button>

              <ArrowRight className="h-6 w-6 text-slate-300 dark:text-slate-700" />

              <Button 
                onClick={uploadDeltas} 
                disabled={!clientDeltas || syncing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {syncing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Upload Secure Deltas</>
                )}
              </Button>
            </div>

            <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto">
              {trainingLogs.length === 0 ? (
                <span className="text-slate-600">Waiting to begin training on local edge node...</span>
              ) : (
                trainingLogs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
