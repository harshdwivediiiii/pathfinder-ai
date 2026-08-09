"use client";

import React, { useState, useEffect, useRef } from "react";
import { Network, Terminal, CheckCircle2, Sliders, RefreshCw, BarChart2, Plus, FileText, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const DOCUMENT_DB = [
  {
    id: 1,
    title: "Nextjs App Router Architecture Document 1",
    content: "The App Router uses file-system based routing organized in directories. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Nextjs", group: "Entity" },
      { id: "App Router", group: "Entity" },
      { id: "Nextjs", group: "Domain" }
    ],
    edges: [
      { source: "Nextjs", target: "App Router", label: "Routing" },
      { source: "App Router", target: "Nextjs", label: "PartOf" }
    ]
  },
  {
    id: 2,
    title: "Database Replication Patterns Document 1",
    content: "Primary database replica node propagates transactions to secondary replicas asynchronously. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Primary DB", group: "Entity" },
      { id: "Secondary DB", group: "Entity" },
      { id: "Database", group: "Domain" }
    ],
    edges: [
      { source: "Primary DB", target: "Secondary DB", label: "Replication" },
      { source: "Secondary DB", target: "Database", label: "PartOf" }
    ]
  },
  {
    id: 3,
    title: "OAuth2 Authentication Handshake Document 1",
    content: "Access tokens grant restricted scope API actions to authorized clients. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Auth Client", group: "Entity" },
      { id: "Auth Server", group: "Entity" },
      { id: "OAuth2", group: "Domain" }
    ],
    edges: [
      { source: "Auth Client", target: "Auth Server", label: "OAuth2" },
      { source: "Auth Server", target: "OAuth2", label: "PartOf" }
    ]
  },
  {
    id: 4,
    title: "Docker Container Layer Caching Document 1",
    content: "Docker images build cache files using layer caching instructions. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Docker Build", group: "Entity" },
      { id: "Layer Cache", group: "Entity" },
      { id: "Docker", group: "Domain" }
    ],
    edges: [
      { source: "Docker Build", target: "Layer Cache", label: "Docker" },
      { source: "Layer Cache", target: "Docker", label: "PartOf" }
    ]
  },
  {
    id: 5,
    title: "Redis Memory Clustering Options Document 1",
    content: "Redis clusters shard key slots across multiple primary master nodes. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Redis Cluster", group: "Entity" },
      { id: "Shard Master", group: "Entity" },
      { id: "Redis", group: "Domain" }
    ],
    edges: [
      { source: "Redis Cluster", target: "Shard Master", label: "Clustering" },
      { source: "Shard Master", target: "Redis", label: "PartOf" }
    ]
  },
  {
    id: 6,
    title: "Nextjs App Router Architecture Document 2",
    content: "The App Router uses file-system based routing organized in directories. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Nextjs", group: "Entity" },
      { id: "App Router", group: "Entity" },
      { id: "Nextjs", group: "Domain" }
    ],
    edges: [
      { source: "Nextjs", target: "App Router", label: "Routing" },
      { source: "App Router", target: "Nextjs", label: "PartOf" }
    ]
  },
  {
    id: 7,
    title: "Database Replication Patterns Document 2",
    content: "Primary database replica node propagates transactions to secondary replicas asynchronously. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Primary DB", group: "Entity" },
      { id: "Secondary DB", group: "Entity" },
      { id: "Database", group: "Domain" }
    ],
    edges: [
      { source: "Primary DB", target: "Secondary DB", label: "Replication" },
      { source: "Secondary DB", target: "Database", label: "PartOf" }
    ]
  },
  {
    id: 8,
    title: "OAuth2 Authentication Handshake Document 2",
    content: "Access tokens grant restricted scope API actions to authorized clients. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Auth Client", group: "Entity" },
      { id: "Auth Server", group: "Entity" },
      { id: "OAuth2", group: "Domain" }
    ],
    edges: [
      { source: "Auth Client", target: "Auth Server", label: "OAuth2" },
      { source: "Auth Server", target: "OAuth2", label: "PartOf" }
    ]
  },
  {
    id: 9,
    title: "Docker Container Layer Caching Document 2",
    content: "Docker images build cache files using layer caching instructions. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Docker Build", group: "Entity" },
      { id: "Layer Cache", group: "Entity" },
      { id: "Docker", group: "Domain" }
    ],
    edges: [
      { source: "Docker Build", target: "Layer Cache", label: "Docker" },
      { source: "Layer Cache", target: "Docker", label: "PartOf" }
    ]
  },
  {
    id: 10,
    title: "Redis Memory Clustering Options Document 2",
    content: "Redis clusters shard key slots across multiple primary master nodes. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Redis Cluster", group: "Entity" },
      { id: "Shard Master", group: "Entity" },
      { id: "Redis", group: "Domain" }
    ],
    edges: [
      { source: "Redis Cluster", target: "Shard Master", label: "Clustering" },
      { source: "Shard Master", target: "Redis", label: "PartOf" }
    ]
  },
  {
    id: 11,
    title: "Nextjs App Router Architecture Document 3",
    content: "The App Router uses file-system based routing organized in directories. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Nextjs", group: "Entity" },
      { id: "App Router", group: "Entity" },
      { id: "Nextjs", group: "Domain" }
    ],
    edges: [
      { source: "Nextjs", target: "App Router", label: "Routing" },
      { source: "App Router", target: "Nextjs", label: "PartOf" }
    ]
  },
  {
    id: 12,
    title: "Database Replication Patterns Document 3",
    content: "Primary database replica node propagates transactions to secondary replicas asynchronously. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Primary DB", group: "Entity" },
      { id: "Secondary DB", group: "Entity" },
      { id: "Database", group: "Domain" }
    ],
    edges: [
      { source: "Primary DB", target: "Secondary DB", label: "Replication" },
      { source: "Secondary DB", target: "Database", label: "PartOf" }
    ]
  },
  {
    id: 13,
    title: "OAuth2 Authentication Handshake Document 3",
    content: "Access tokens grant restricted scope API actions to authorized clients. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Auth Client", group: "Entity" },
      { id: "Auth Server", group: "Entity" },
      { id: "OAuth2", group: "Domain" }
    ],
    edges: [
      { source: "Auth Client", target: "Auth Server", label: "OAuth2" },
      { source: "Auth Server", target: "OAuth2", label: "PartOf" }
    ]
  },
  {
    id: 14,
    title: "Docker Container Layer Caching Document 3",
    content: "Docker images build cache files using layer caching instructions. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Docker Build", group: "Entity" },
      { id: "Layer Cache", group: "Entity" },
      { id: "Docker", group: "Domain" }
    ],
    edges: [
      { source: "Docker Build", target: "Layer Cache", label: "Docker" },
      { source: "Layer Cache", target: "Docker", label: "PartOf" }
    ]
  },
  {
    id: 15,
    title: "Redis Memory Clustering Options Document 3",
    content: "Redis clusters shard key slots across multiple primary master nodes. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Redis Cluster", group: "Entity" },
      { id: "Shard Master", group: "Entity" },
      { id: "Redis", group: "Domain" }
    ],
    edges: [
      { source: "Redis Cluster", target: "Shard Master", label: "Clustering" },
      { source: "Shard Master", target: "Redis", label: "PartOf" }
    ]
  },
  {
    id: 16,
    title: "Nextjs App Router Architecture Document 4",
    content: "The App Router uses file-system based routing organized in directories. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Nextjs", group: "Entity" },
      { id: "App Router", group: "Entity" },
      { id: "Nextjs", group: "Domain" }
    ],
    edges: [
      { source: "Nextjs", target: "App Router", label: "Routing" },
      { source: "App Router", target: "Nextjs", label: "PartOf" }
    ]
  },
  {
    id: 17,
    title: "Database Replication Patterns Document 4",
    content: "Primary database replica node propagates transactions to secondary replicas asynchronously. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Primary DB", group: "Entity" },
      { id: "Secondary DB", group: "Entity" },
      { id: "Database", group: "Domain" }
    ],
    edges: [
      { source: "Primary DB", target: "Secondary DB", label: "Replication" },
      { source: "Secondary DB", target: "Database", label: "PartOf" }
    ]
  },
  {
    id: 18,
    title: "OAuth2 Authentication Handshake Document 4",
    content: "Access tokens grant restricted scope API actions to authorized clients. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Auth Client", group: "Entity" },
      { id: "Auth Server", group: "Entity" },
      { id: "OAuth2", group: "Domain" }
    ],
    edges: [
      { source: "Auth Client", target: "Auth Server", label: "OAuth2" },
      { source: "Auth Server", target: "OAuth2", label: "PartOf" }
    ]
  },
  {
    id: 19,
    title: "Docker Container Layer Caching Document 4",
    content: "Docker images build cache files using layer caching instructions. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Docker Build", group: "Entity" },
      { id: "Layer Cache", group: "Entity" },
      { id: "Docker", group: "Domain" }
    ],
    edges: [
      { source: "Docker Build", target: "Layer Cache", label: "Docker" },
      { source: "Layer Cache", target: "Docker", label: "PartOf" }
    ]
  },
  {
    id: 20,
    title: "Redis Memory Clustering Options Document 4",
    content: "Redis clusters shard key slots across multiple primary master nodes. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Redis Cluster", group: "Entity" },
      { id: "Shard Master", group: "Entity" },
      { id: "Redis", group: "Domain" }
    ],
    edges: [
      { source: "Redis Cluster", target: "Shard Master", label: "Clustering" },
      { source: "Shard Master", target: "Redis", label: "PartOf" }
    ]
  },
  {
    id: 21,
    title: "Nextjs App Router Architecture Document 5",
    content: "The App Router uses file-system based routing organized in directories. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Nextjs", group: "Entity" },
      { id: "App Router", group: "Entity" },
      { id: "Nextjs", group: "Domain" }
    ],
    edges: [
      { source: "Nextjs", target: "App Router", label: "Routing" },
      { source: "App Router", target: "Nextjs", label: "PartOf" }
    ]
  },
  {
    id: 22,
    title: "Database Replication Patterns Document 5",
    content: "Primary database replica node propagates transactions to secondary replicas asynchronously. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Primary DB", group: "Entity" },
      { id: "Secondary DB", group: "Entity" },
      { id: "Database", group: "Domain" }
    ],
    edges: [
      { source: "Primary DB", target: "Secondary DB", label: "Replication" },
      { source: "Secondary DB", target: "Database", label: "PartOf" }
    ]
  },
  {
    id: 23,
    title: "OAuth2 Authentication Handshake Document 5",
    content: "Access tokens grant restricted scope API actions to authorized clients. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Auth Client", group: "Entity" },
      { id: "Auth Server", group: "Entity" },
      { id: "OAuth2", group: "Domain" }
    ],
    edges: [
      { source: "Auth Client", target: "Auth Server", label: "OAuth2" },
      { source: "Auth Server", target: "OAuth2", label: "PartOf" }
    ]
  },
  {
    id: 24,
    title: "Docker Container Layer Caching Document 5",
    content: "Docker images build cache files using layer caching instructions. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Docker Build", group: "Entity" },
      { id: "Layer Cache", group: "Entity" },
      { id: "Docker", group: "Domain" }
    ],
    edges: [
      { source: "Docker Build", target: "Layer Cache", label: "Docker" },
      { source: "Layer Cache", target: "Docker", label: "PartOf" }
    ]
  },
  {
    id: 25,
    title: "Redis Memory Clustering Options Document 5",
    content: "Redis clusters shard key slots across multiple primary master nodes. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Redis Cluster", group: "Entity" },
      { id: "Shard Master", group: "Entity" },
      { id: "Redis", group: "Domain" }
    ],
    edges: [
      { source: "Redis Cluster", target: "Shard Master", label: "Clustering" },
      { source: "Shard Master", target: "Redis", label: "PartOf" }
    ]
  },
  {
    id: 26,
    title: "Nextjs App Router Architecture Document 6",
    content: "The App Router uses file-system based routing organized in directories. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Nextjs", group: "Entity" },
      { id: "App Router", group: "Entity" },
      { id: "Nextjs", group: "Domain" }
    ],
    edges: [
      { source: "Nextjs", target: "App Router", label: "Routing" },
      { source: "App Router", target: "Nextjs", label: "PartOf" }
    ]
  },
  {
    id: 27,
    title: "Database Replication Patterns Document 6",
    content: "Primary database replica node propagates transactions to secondary replicas asynchronously. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Primary DB", group: "Entity" },
      { id: "Secondary DB", group: "Entity" },
      { id: "Database", group: "Domain" }
    ],
    edges: [
      { source: "Primary DB", target: "Secondary DB", label: "Replication" },
      { source: "Secondary DB", target: "Database", label: "PartOf" }
    ]
  },
  {
    id: 28,
    title: "OAuth2 Authentication Handshake Document 6",
    content: "Access tokens grant restricted scope API actions to authorized clients. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Auth Client", group: "Entity" },
      { id: "Auth Server", group: "Entity" },
      { id: "OAuth2", group: "Domain" }
    ],
    edges: [
      { source: "Auth Client", target: "Auth Server", label: "OAuth2" },
      { source: "Auth Server", target: "OAuth2", label: "PartOf" }
    ]
  },
  {
    id: 29,
    title: "Docker Container Layer Caching Document 6",
    content: "Docker images build cache files using layer caching instructions. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Docker Build", group: "Entity" },
      { id: "Layer Cache", group: "Entity" },
      { id: "Docker", group: "Domain" }
    ],
    edges: [
      { source: "Docker Build", target: "Layer Cache", label: "Docker" },
      { source: "Layer Cache", target: "Docker", label: "PartOf" }
    ]
  },
  {
    id: 30,
    title: "Redis Memory Clustering Options Document 6",
    content: "Redis clusters shard key slots across multiple primary master nodes. This architecture ensures reliability, low latency, and robust system integrity.",
    nodes: [
      { id: "Redis Cluster", group: "Entity" },
      { id: "Shard Master", group: "Entity" },
      { id: "Redis", group: "Domain" }
    ],
    edges: [
      { source: "Redis Cluster", target: "Shard Master", label: "Clustering" },
      { source: "Shard Master", target: "Redis", label: "PartOf" }
    ]
  },
];

export default function DocKnowledgeGraphPage() {
  const [selectedDoc, setSelectedDoc] = useState(DOCUMENT_DB[0]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    setNodes([]);
    setEdges([]);
  }, [selectedDoc]);

  const handleExtract = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setNodes(selectedDoc.nodes);
      setEdges(selectedDoc.edges);
      setIsExtracting(false);
    }, 1000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const positions = {};
    nodes.forEach((node, idx) => {
      const angle = (idx / nodes.length) * Math.PI * 2;
      positions[node.id] = {
        x: width / 2 + Math.cos(angle) * 120,
        y: height / 2 + Math.sin(angle) * 120
      };
    });
    
    // Draw edges
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 2;
    ctx.font = "8px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    
    edges.forEach(edge => {
      const start = positions[edge.source];
      const end = positions[edge.target];
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        ctx.fillText(edge.label, mx, my - 4);
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const pos = positions[node.id];
      if (!pos) return;
      
      ctx.fillStyle = node.group === "Domain" ? "#4f46e5" : "#0ea5e9";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(node.id.substring(0, 8), pos.x, pos.y + 3);
    });
  }, [nodes, edges]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Network className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Knowledge Graph Extractor</h1>
          <p className="text-muted-foreground">Parse unstructured documentation libraries into interactive node-relationship maps.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Article Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[450px] overflow-y-auto">
              {DOCUMENT_DB.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                    selectedDoc.id === doc.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                      : "border-border hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold text-foreground">{doc.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{doc.content}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Extraction Workbench</CardTitle>
              <CardDescription>Analyze syntax models using client parsing libraries.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Documentation Input
                </h3>
                <Textarea
                  value={selectedDoc.content}
                  readOnly
                  className="font-sans text-xs min-h-[160px] leading-relaxed border border-border bg-muted/10"
                />
                <Button
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Parsing Relations...
                    </>
                  ) : (
                    "Extract Graph Nodes"
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Database className="w-4 h-4 text-teal-500" />
                  Graph Visualizer Model
                </h3>
                <div className="bg-slate-900 rounded-lg p-2 flex justify-center items-center">
                  <canvas ref={canvasRef} width={300} height={260} className="max-w-full rounded bg-slate-950 border border-slate-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
