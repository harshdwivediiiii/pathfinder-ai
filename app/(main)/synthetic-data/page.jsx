"use client";

import React, { useState } from "react";
import { TabularGAN } from "./_components/gan-algorithm";
import { Database, Sparkles, Download, Settings, TableProperties, AlertCircle, FileJson, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SyntheticDataPage() {
  const [gan] = useState(new TabularGAN());
  const [prompt, setPrompt] = useState("Generate 50 rows of e-commerce transactions with anomalous fraud patterns");
  const [rowCount, setRowCount] = useState(50);
  const [anomalyRate, setAnomalyRate] = useState(0.1);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataset, setDataset] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDataset(null);

    try {
        gan.parsePromptAndInitialize(prompt);
        const result = await gan.generateDataset(rowCount, anomalyRate);
        setDataset(result);
    } catch (e) {
        console.error(e);
        alert(e.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const downloadCSV = () => {
      if (!dataset || !dataset.data || dataset.data.length === 0) return;
      
      const columns = dataset.metadata.schema === 'e_commerce_transactions' 
          ? ['transaction_id', 'user_id', 'amount', 'timestamp', 'is_fraud']
          : ['id', 'feature_1', 'feature_2', 'target'];

      const csvRows = [];
      csvRows.push(columns.join(',')); // Header

      for (const row of dataset.data) {
          const values = columns.map(header => row[header]);
          csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `synthetic_dataset_${dataset.metadata.schema}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Database className="w-10 h-10 text-purple-500" />
            GAN Synthetic Data Studio
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Prompt hyper-specific relational datasets to accelerate your Machine Learning loop.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-purple-500/20 shadow-lg shadow-purple-500/5">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Generator Config
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6 pt-6">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Prompt</label>
                    <textarea 
                        className="w-full bg-background border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-24"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the dataset schema you need..."
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex justify-between">
                        Row Count <span className="text-purple-500">{rowCount}</span>
                    </label>
                    <input 
                        type="range" min="10" max="1000" step="10" 
                        value={rowCount} onChange={(e) => setRowCount(Number(e.target.value))}
                        className="w-full accent-purple-500"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground flex justify-between">
                        Anomaly Injection Rate <span className="text-red-500">{(anomalyRate * 100).toFixed(0)}%</span>
                    </label>
                    <input 
                        type="range" min="0" max="0.5" step="0.01" 
                        value={anomalyRate} onChange={(e) => setAnomalyRate(Number(e.target.value))}
                        className="w-full accent-red-500"
                    />
                </div>

                <Button 
                    size="lg" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !prompt}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 transition-all shadow-md mt-4"
                >
                    {isGenerating ? <Database className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isGenerating ? "Synthesizing Latent Space..." : "Generate Dataset"}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
            <Card className="h-full border-dashed flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TableProperties className="w-5 h-5 text-purple-500" />
                            Data Preview
                        </CardTitle>
                        <CardDescription>
                            {dataset ? `Generated ${dataset.metadata.rowCount} rows (${(dataset.metadata.anomalyRate * 100).toFixed(0)}% anomalies)` : 'Awaiting GAN initialization'}
                        </CardDescription>
                    </div>
                    {dataset && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-2 border-purple-500/30 text-purple-600 hover:bg-purple-500/10">
                                <FileSpreadsheet className="w-4 h-4" /> Export CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alert("JSON export simulated")} className="gap-2">
                                <FileJson className="w-4 h-4" /> Export JSON
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="flex-1 p-0 relative">
                    {!dataset && !isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-muted/30 text-muted-foreground/50 m-4 rounded-xl border border-dashed">
                            <Database className="w-16 h-16 mb-4 opacity-20" />
                            <p>Configure the GAN prompt to generate custom relational data for your models.</p>
                        </div>
                    )}
                    
                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-purple-500/5 m-4 rounded-xl border border-purple-500/20">
                            <Sparkles className="w-16 h-16 mb-4 text-purple-500 animate-pulse" />
                            <p className="font-mono text-sm text-purple-500 animate-pulse">Sampling from latent space distribution...</p>
                        </div>
                    )}

                    {dataset && (
                        <div className="h-[500px] overflow-auto border-t custom-scrollbar animate-in fade-in duration-700">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 sticky top-0 shadow-sm">
                                    <tr>
                                        {Object.keys(dataset.data[0]).map(key => (
                                            <th key={key} className="px-6 py-3 font-semibold text-muted-foreground border-b">{key.replace('_', ' ')}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataset.data.map((row, idx) => {
                                        // Simple heuristic to highlight anomalies for the demo
                                        const isAnomalous = row.is_fraud === 1 || row.target === 1;
                                        return (
                                            <tr key={idx} className={`border-b transition-colors hover:bg-muted/50 ${isAnomalous ? 'bg-red-500/10' : ''}`}>
                                                {Object.values(row).map((val, vIdx) => (
                                                    <td key={vIdx} className={`px-6 py-3 font-mono ${isAnomalous ? 'text-red-500' : ''}`}>
                                                        {val}
                                                        {isAnomalous && vIdx === 0 && <AlertCircle className="w-3 h-3 inline ml-2 mb-0.5" />}
                                                    </td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
