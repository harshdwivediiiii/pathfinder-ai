"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, Terminal, Settings, Award, Users, Play, Pause, RefreshCw, BarChart2, CheckCircle, Database, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

// Guard role-to-class lookup map outside render to avoid rebuilding
const ROLE_BADGE_CLASS = {
  "Architect": "border-blue-400 text-blue-500",
  "Developer": "border-purple-400 text-purple-500",
  "Security Analyst": "border-red-400 text-red-500",
  "Product Manager": "border-amber-400 text-amber-500",
};

// Graph factory and shared constants
const baseNodes = (dataStoreLabel) => [
  { id: "Client", group: 1, label: "Web/Mobile App" },
  { id: "Gateway", group: 2, label: "API Gateway" },
  { id: "Auth", group: 3, label: "Auth Server" },
  { id: "CoreService", group: 4, label: "Core Service" },
  { id: "Database", group: 5, label: `Data Store (${dataStoreLabel})` },
  { id: "Cache", group: 6, label: "Memory Cache" }
];

const BASE_LINKS = [
  { source: "Client", target: "Gateway", label: "HTTPS" },
  { source: "Gateway", target: "Auth", label: "gRPC" },
  { source: "Gateway", target: "CoreService", label: "HTTP" },
  { source: "CoreService", target: "Database", label: "TCP" },
  { source: "CoreService", target: "Cache", label: "Cache Request" }
];

const DEBATE_SCENARIOS = [
  {
    id: 1,
    title: "SQL vs NoSQL: Banking Transaction Ledger",
    description: "Relational consistency vs horizontal scalability in banking transaction logs",
    category: "SQL",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["SQL", "NoSQL"],
    architectStance: "Banking transactions demand absolute ACID compliance. Relational databases guarantee consistency through strict foreign key constraints and transactional boundaries, preventing double-spending.",
    devStance: "We can speed up write operations using a document store. NoSQL schemas are flexible, letting us append transaction metadata fields dynamically without database migrations, boosting velocity.",
    securityStance: "Relational databases are highly robust when using parameterized queries. However, document stores often require custom access layers to avoid exposing unstructured JSON payloads.",
    pmStance: "We must ship the ledger MVP in 3 weeks. If database migrations slow down features, we risk missing the investor demo milestone.",
    costPerformance: { cost: 40, performance: 50, complexity: 30, delivery: 45 },
    nodes: baseNodes("SQL/NoSQL"),
    links: BASE_LINKS
  },
  {
    id: 2,
    title: "WebSockets vs HTTP Polling: Live Feed Infrastructure",
    description: "Real-time feed coordination for 50,000 concurrent client connections",
    category: "WebSockets",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["WebSockets", "Polling"],
    architectStance: "WebSockets establish a single persistent TCP connection per client, reducing request header overhead and lowering CPU utilization.",
    devStance: "HTTP Polling is stateless and easier to load balance. We can use standard edge caching, whereas WebSockets require complex sticky sessions.",
    securityStance: "Persistent sockets bypass normal request-response filters. We need strict rate limits to prevent socket starvation attacks.",
    pmStance: "Our users demand sub-second feed updates. A laggy polling setup will lead to negative user feedback.",
    costPerformance: { cost: 50, performance: 65, complexity: 40, delivery: 60 },
    nodes: baseNodes("WebSockets/Polling"),
    links: BASE_LINKS
  },
  {
    id: 3,
    title: "Monolith vs Microservices: Checkout Service Migration",
    description: "Migrating an e-commerce platform with fast checkout logic",
    category: "Monolith",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Monolith", "Microservices"],
    architectStance: "A monolithic architecture keeps code cohesive. For checkout, local function calls are faster and transactions are safer than distributed Saga patterns.",
    devStance: "Microservices allow the checkout team to build and deploy independently from the catalog service, avoiding deployment logjams.",
    securityStance: "Microservices expand the attack surface. Each inter-service REST call needs mutual TLS and token translation, increasing risk.",
    pmStance: "Reliability is key during peak sales. If the checkout microservice goes down, the product catalog should remain active.",
    costPerformance: { cost: 60, performance: 80, complexity: 50, delivery: 75 },
    nodes: baseNodes("Monolith/Microservices"),
    links: BASE_LINKS
  },
  {
    id: 4,
    title: "Serverless vs Dedicated VM: Sporadic Batch Jobs",
    description: "Handling high spike, low continuous background compute tasks",
    category: "Serverless",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Serverless", "Dedicated VM"],
    architectStance: "Serverless offers elastic scalability. We only pay for active execution time, which fits our highly sporadic background task profile.",
    devStance: "Dedicated VMs prevent cold-start latency entirely. Testing locally is also far easier without serverless emulation layers.",
    securityStance: "Serverless execution environments are ephemeral and isolated, limiting the persistence window of potential malware.",
    pmStance: "We need predictable monthly hosting budgets. A sudden traffic surge on Serverless might cause a cost overrun.",
    costPerformance: { cost: 40, performance: 95, complexity: 60, delivery: 45 },
    nodes: baseNodes("Serverless/Dedicated VM"),
    links: BASE_LINKS
  },
  {
    id: 5,
    title: "GraphQL vs REST API: Core Data Delivery",
    description: "Exposing core product data to mobile, web, and partner integrations",
    category: "GraphQL",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["GraphQL", "REST"],
    architectStance: "GraphQL allows clients to request exactly what they need in a single query, optimizing bandwidth on mobile networks.",
    devStance: "REST is natively cached by CDN edges and browsers. GraphQL POST queries are difficult to cache at the edge.",
    securityStance: "GraphQL exposes complex schema entrypoints. We must set maximum query depth limits to block nested query denial-of-service.",
    pmStance: "External partners are already familiar with REST. Forcing them to adopt GraphQL could slow down our partner integrations.",
    costPerformance: { cost: 50, performance: 50, complexity: 70, delivery: 60 },
    nodes: baseNodes("GraphQL/REST"),
    links: BASE_LINKS
  },
  {
    id: 6,
    title: "Redis Caching vs Direct DB Query: Real-Time Analytics",
    description: "Scaling high-read dashboard analytics under heavy database pressure",
    category: "Redis Caching",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Redis Caching", "DB Query"],
    architectStance: "Caching reads in memory with Redis decreases connection counts and drops query latency from 150ms to sub-10ms.",
    devStance: "Cache invalidation is a major pain point. Keeping Redis keys synced with fast writes introduces complex race conditions.",
    securityStance: "Redis holds plain text data in memory. If not hosted within a secure VPC subnet, sensitive cached entries are exposed.",
    pmStance: "Our admins expect real-time dashboard accuracy. Showing stale cached data leads to poor decision making.",
    costPerformance: { cost: 60, performance: 65, complexity: 30, delivery: 75 },
    nodes: baseNodes("Redis Caching/DB Query"),
    links: BASE_LINKS
  },
  {
    id: 7,
    title: "Kafka vs RabbitMQ: High Throughput Ingestion",
    description: "High-throughput log streaming vs complex transaction routing and scheduling",
    category: "Kafka",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Kafka", "RabbitMQ"],
    architectStance: "Kafka is a distributed commit log built for high-throughput replayable data streams with strict order partitioning.",
    devStance: "RabbitMQ offers direct exchange routing (fanout, topic) and push-based delivery, simplifying consumer worker logic.",
    securityStance: "Kafka requires complex SASL/SSL credentials. RabbitMQ offers a simpler, native virtual host user management.",
    pmStance: "If a worker fails, RabbitMQ's dead-letter queues let us triage failed tasks without halting the main pipeline.",
    costPerformance: { cost: 40, performance: 80, complexity: 40, delivery: 45 },
    nodes: baseNodes("Kafka/RabbitMQ"),
    links: BASE_LINKS
  },
  {
    id: 8,
    title: "Centralized vs Federated DB: Multi-Region Compliance",
    description: "Handling multi-region healthcare records with local sovereignty laws",
    category: "Centralized",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Centralized", "Federated DB"],
    architectStance: "A centralized DB ensures total data consistency and avoids cross-region synchronization delays.",
    devStance: "Federated databases provide high availability. If the US node goes offline, the EU node remains operational.",
    securityStance: "Federation makes compliance with GDPR and HIPAA much easier, as patient data never leaves regional physical databases.",
    pmStance: "GDPR compliance is non-negotiable. Federated storage is the safest path to avoid major compliance fines.",
    costPerformance: { cost: 50, performance: 95, complexity: 50, delivery: 60 },
    nodes: baseNodes("Centralized/Federated DB"),
    links: BASE_LINKS
  },
  {
    id: 9,
    title: "Docker Swarm vs Kubernetes: Small Scale Cluster",
    description: "Container orchestration for 20 simple microservices under low budgets",
    category: "Docker Swarm",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Docker Swarm", "Kubernetes"],
    architectStance: "Docker Swarm is lightweight and native to Docker, making it easy to manage without dedicated infrastructure engineers.",
    devStance: "Kubernetes is the standard. Declaring deployments, ingresses, and secrets using Helm chart configurations gives us long-term flexibility.",
    securityStance: "Kubernetes has fine-grained RBAC and network policies to isolate tenant workloads, which Swarm lacks.",
    pmStance: "Our team has zero Kubernetes experience. Setting it up will delay our product launch by weeks.",
    costPerformance: { cost: 60, performance: 50, complexity: 60, delivery: 75 },
    nodes: baseNodes("Docker Swarm/Kubernetes"),
    links: BASE_LINKS
  },
  {
    id: 10,
    title: "OAuth2 vs Session Cookies: Multi-Domain SSO",
    description: "User session tracking across three separate client domains",
    category: "OAuth2",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["OAuth2", "Session Cookies"],
    architectStance: "OAuth2 access tokens (JWTs) are stateless, enabling session verification across multiple domains without database queries.",
    devStance: "Session cookies are automatically handled by browser engines, saving us from writing custom token managers in React.",
    securityStance: "HttpOnly cookies prevent XSS theft. Storing JWTs in local storage makes them vulnerable to script access.",
    pmStance: "We want single sign-on across all three of our brand websites. An OAuth2 server is the most standard approach.",
    costPerformance: { cost: 40, performance: 65, complexity: 70, delivery: 45 },
    nodes: baseNodes("OAuth2/Session Cookies"),
    links: BASE_LINKS
  },
  {
    id: 11,
    title: "gRPC vs JSON-RPC: Inter-Service Transport",
    description: "Internal service communications with high bandwidth requirements",
    category: "gRPC",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["gRPC", "JSON-RPC"],
    architectStance: "gRPC uses Protocol Buffers and HTTP/2, resulting in compact binary payloads, client-streaming, and type safety.",
    devStance: "JSON-RPC is plain text, making it trivial to debug in proxy tools without requiring proto compilation steps.",
    securityStance: "gRPC relies on HTTP/2, letting us implement TLS-based transport encryption with lower handshaking overhead.",
    pmStance: "Our partners will consume this API. JSON-RPC is much easier to integrate than sharing proto file packages.",
    costPerformance: { cost: 50, performance: 80, complexity: 30, delivery: 60 },
    nodes: baseNodes("gRPC/JSON-RPC"),
    links: BASE_LINKS
  },
  {
    id: 12,
    title: "SSR vs Client Side CSR: Public Landing Site",
    description: "Optimizing SEO and initial load times for landing pages with static and dynamic views",
    category: "SSR",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["SSR", "CSR"],
    architectStance: "Server-side rendering (SSR) delivers pre-rendered HTML, ensuring search engine bots index our marketing pages accurately.",
    devStance: "Client-side rendering (CSR) offloads the rendering work to the client's browser, reducing server costs and scaling dynamically.",
    securityStance: "SSR runs backend logic on request, which requires strictly isolating environment keys from leaking into page templates.",
    pmStance: "Every millisecond counts on the landing page. Pre-rendered HTML gives us a better conversion rate.",
    costPerformance: { cost: 60, performance: 95, complexity: 40, delivery: 75 },
    nodes: baseNodes("SSR/CSR"),
    links: BASE_LINKS
  },
  {
    id: 13,
    title: "DynamoDB vs Postgres: User Profile Store",
    description: "Storing user profile metadata with dynamic attributes and schemas",
    category: "DynamoDB",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["DynamoDB", "Postgres"],
    architectStance: "DynamoDB scales horizontally and guarantees single-digit millisecond latency regardless of scale, which is perfect for user metadata.",
    devStance: "Postgres offers rich query capabilities like JSONB indexing, window functions, and complex joins that DynamoDB lacks.",
    securityStance: "DynamoDB integrates with fine-grained IAM policies for attribute-level access control, which is highly secure.",
    pmStance: "We need flexibility as we add product features. Storing user profiles in DynamoDB lets us add columns without blocking tables.",
    costPerformance: { cost: 40, performance: 50, complexity: 50, delivery: 45 },
    nodes: baseNodes("DynamoDB/Postgres"),
    links: BASE_LINKS
  },
  {
    id: 14,
    title: "CDN Edge vs Origin Server: Media Assets",
    description: "Handling image processing and delivery for global ecommerce site",
    category: "CDN Edge",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["CDN Edge", "Origin Server"],
    architectStance: "CDN Edge caches static and media assets physically close to users globally, reducing network roundtrip latencies.",
    devStance: "Running image compression on the origin server simplifies local testing and deployment, avoiding CDN invalidation sync delays.",
    securityStance: "CDNs act as Web Application Firewalls (WAF), blocking DDoS attacks at the network edge before they reach our core network.",
    pmStance: "Images make up 80% of our landing page weight. Fast load times directly impact checkout conversion rates.",
    costPerformance: { cost: 50, performance: 65, complexity: 60, delivery: 60 },
    nodes: baseNodes("CDN Edge/Origin Server"),
    links: BASE_LINKS
  },
  {
    id: 15,
    title: "Cassandra vs MongoDB: High Volume Metrics",
    description: "High write availability and horizontal scaling for IoT time series data",
    category: "Cassandra",
    difficulty: "Advanced",
    duration: "10 mins",
    options: ["Cassandra", "MongoDB"],
    architectStance: "Cassandra uses a masterless ring architecture designed for absolute write availability and horizontal scale across multiple datacenters.",
    devStance: "MongoDB has a flexible document model and built-in aggregations that make time-series queries much faster to develop.",
    securityStance: "Cassandra's node-to-node encryption and client TLS ensure that massive cluster communication remains secure.",
    pmStance: "We are tracking millions of IoT sensors. If the database goes down, we lose diagnostic data, so write availability is critical.",
    costPerformance: { cost: 60, performance: 80, complexity: 70, delivery: 75 },
    nodes: baseNodes("Cassandra/MongoDB"),
    links: BASE_LINKS
  }
];

// Reusable local MetricCard component with full accessibility configuration
const MetricCard = ({ title, value, label, icon: Icon, iconClass, progressValue }) => (
  <div className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <Icon className={`w-4 h-4 ${iconClass}`} aria-hidden="true" />
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-extrabold">{value}%</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <Progress
      value={progressValue}
      className="h-1.5"
      aria-label={`${title} level progress indicator`}
      aria-valuenow={progressValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${progressValue}%`}
    />
  </div>
);

export default function MultiAgentDebatePage() {
  const [selectedScenario, setSelectedScenario] = useState(DEBATE_SCENARIOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [transcript, setTranscript] = useState([]);
  const [activeTab, setActiveTab] = useState("scenarios");
  const [consensus, setConsensus] = useState(50);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setTranscript([]);
    setIsPlaying(false);
    setConsensus(50);
    setActiveSpeaker(null);
  }, [selectedScenario]);

  // Reworked playback logic using setTimeout driven by transcript.length
  useEffect(() => {
    if (!isPlaying) return;

    const talkers = ["Architect", "Developer", "Security Analyst", "Product Manager"];
    const step = transcript.length;

    if (step >= talkers.length) {
      setIsPlaying(false);
      setActiveSpeaker(null);
      return;
    }

    const delay = (100 - speed[0]) * 40 + 1000;

    const timer = setTimeout(() => {
      const currentRole = talkers[step];
      setActiveSpeaker(currentRole);

      let message = "";
      let consensusDiff = 0;

      if (currentRole === "Architect") {
        message = selectedScenario.architectStance;
        consensusDiff = 10;
      } else if (currentRole === "Developer") {
        message = selectedScenario.devStance;
        consensusDiff = -15;
      } else if (currentRole === "Security Analyst") {
        message = selectedScenario.securityStance;
        consensusDiff = 8;
      } else if (currentRole === "Product Manager") {
        message = selectedScenario.pmStance;
        consensusDiff = -3;
      }

      setConsensus(prev => Math.max(10, Math.min(95, prev + consensusDiff)));
      setTranscript(prev => [...prev, { role: currentRole, text: message }]);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, transcript.length, speed, selectedScenario]);

  // Reworked canvas drawing hook using requestAnimationFrame and DPI scale
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const logicalWidth = 600;
    const logicalHeight = 300;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    ctx.scale(dpr, dpr);

    const nodes = selectedScenario.nodes;
    const links = selectedScenario.links;

    const positions = {
      "Client": { x: 80, y: logicalHeight / 2 },
      "Gateway": { x: 220, y: logicalHeight / 2 },
      "Auth": { x: 360, y: logicalHeight / 3 - 30 },
      "CoreService": { x: 360, y: (logicalHeight * 2) / 3 + 30 },
      "Database": { x: 520, y: logicalHeight / 2 + 50 },
      "Cache": { x: 520, y: logicalHeight / 2 - 50 }
    };

    let animationFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Draw links
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 2;
      links.forEach(link => {
        const start = positions[link.source];
        const end = positions[link.target];
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Draw signal animation
          if (isPlaying && activeSpeaker) {
            const time = Date.now() / 1000;
            const ratio = (time % 1);
            const px = start.x + (end.x - start.x) * ratio;
            const py = start.y + (end.y - start.y) * ratio;
            ctx.fillStyle = "#3b82f6";
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const pos = positions[node.id];
        if (!pos) return;

        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;

        if (node.id === "Database") {
          ctx.strokeStyle = "#10b981";
        } else if (node.id === "Auth") {
          ctx.strokeStyle = "#eab308";
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.id, pos.x, pos.y - 2);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "8px sans-serif";
        // Protect label width parameters directly
        ctx.fillText(node.label, pos.x, pos.y + 12, 60);
      });

      if (isPlaying && activeSpeaker) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [selectedScenario, isPlaying, activeSpeaker]);

  const restartSimulation = () => {
    setTranscript([]);
    setIsPlaying(true);
    setConsensus(50);
    setActiveSpeaker(null);
  };

  const SCORECARD_METRICS = [
    {
      title: "Infrastructure Cost",
      value: selectedScenario.costPerformance.cost,
      label: "Overhead",
      icon: BarChart2,
      iconClass: "text-red-500",
      key: "cost"
    },
    {
      title: "Max Performance",
      value: selectedScenario.costPerformance.performance,
      label: "Efficiency",
      icon: Award,
      iconClass: "text-emerald-500",
      key: "performance"
    },
    {
      title: "Integration Complexity",
      value: selectedScenario.costPerformance.complexity,
      label: "Friction",
      icon: Settings,
      iconClass: "text-yellow-500",
      key: "complexity"
    },
    {
      title: "Time to Delivery",
      value: selectedScenario.costPerformance.delivery,
      label: "Deployment",
      icon: CheckCircle,
      iconClass: "text-indigo-500",
      key: "delivery"
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Multi-Agent Debate Simulation</h1>
          <p className="text-muted-foreground">Autonomously debate system designs and observe agent alignment scorecards.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md bg-muted rounded-lg p-1">
          <TabsTrigger value="scenarios" className="rounded-md">Scenario List</TabsTrigger>
          <TabsTrigger value="simulation" className="rounded-md">Live Simulation</TabsTrigger>
          <TabsTrigger value="scorecard" className="rounded-md">Consensus Scorecard</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4 outline-none">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEBATE_SCENARIOS.map((scen) => {
              const isSelected = selectedScenario.id === scen.id;
              return (
                <Card
                  key={scen.id}
                  className={`border transition-all duration-300 ${
                    isSelected 
                      ? "border-indigo-500 shadow-md ring-1 ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10" 
                      : "border-border/50 hover:shadow-lg hover:border-slate-300"
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800">{scen.category}</Badge>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">{scen.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-card-foreground">{scen.title}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">{scen.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-2">
                      <span>Duration: {scen.duration}</span>
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => { setSelectedScenario(scen); setActiveTab("simulation"); }}
                        className={isSelected ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-indigo-600 hover:text-indigo-700"}
                      >
                        {isSelected ? "Active Debate" : "Open Simulation"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6 outline-none">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl flex justify-between items-center">
                    <span>{selectedScenario.title}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setIsPlaying(!isPlaying)}
                        aria-label={isPlaying ? "Pause Debate Simulation" : "Start Debate Simulation"}
                        aria-pressed={isPlaying}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Play className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={restartSimulation}
                        aria-label="Restart Debate Simulation"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>{selectedScenario.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-slate-950 rounded-lg p-4 flex justify-center items-center">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={300}
                      className="bg-slate-900 border border-slate-800 rounded-md w-full h-auto"
                      role="img"
                      aria-label={`Interactive system architecture layout mapping nodes for ${selectedScenario.nodes.map(n => n.label).join(', ')}`}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                      <Terminal className="w-5 h-5 text-indigo-500" />
                      Simulation Log Transcript
                    </h3>
                    <div
                      className="h-[250px] overflow-y-auto border border-border/50 rounded-lg p-4 space-y-3 bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      role="log"
                      aria-live="polite"
                      aria-label="Debate simulation log transcript feed"
                      tabIndex={0}
                    >
                      {transcript.length === 0 && (
                        <p className="text-muted-foreground text-center py-10">Click Play to start the multi-agent system design debate.</p>
                      )}
                      {transcript.map((msg, i) => (
                        <div key={i} className="flex items-start gap-3 border-b pb-2 last:border-0 border-border/20">
                          <Badge variant="outline" className={`mt-1 font-mono text-[10px] ${ROLE_BADGE_CLASS[msg.role] ?? "border-border text-muted-foreground"}`}>
                            {msg.role}
                          </Badge>
                          <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Agent Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span id="speed-label" className="text-sm font-medium text-foreground">Simulation Speed</span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{speed[0]}%</span>
                    </div>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={10}
                      max={100}
                      step={5}
                      className="py-2"
                      aria-labelledby="speed-label"
                      aria-valuetext={`${speed[0]} percent speed`}
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                      Debate Consensus Tracker
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Debate Disagreement</span>
                        <span>Design Alignment</span>
                      </div>
                      <Progress
                        value={consensus}
                        className="h-3"
                        aria-label="Debate alignment consensus percentage"
                        aria-valuenow={consensus}
                        aria-valuemin={10}
                        aria-valuemax={95}
                        aria-valuetext={`${consensus}% consensus`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alignment changes dynamically based on each agent's argument weight, risk tolerance, and structural simplicity score.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scorecard" className="outline-none">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Consensus Performance Scorecard</CardTitle>
              <CardDescription>Metrics reflecting implementation risks for the chosen architecture pattern.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SCORECARD_METRICS.map((metric, i) => (
                <MetricCard
                  key={i}
                  title={metric.title}
                  value={metric.value}
                  label={metric.label}
                  icon={metric.icon}
                  iconClass={metric.iconClass}
                  progressValue={metric.value}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// DYNAMIC STYLING HELPER METRICS DEFINITION FOR THEME ISOLATION
const MULTI_AGENT_DEBATE_THEME_METRICS = {
  theme_0: {
    primary: 'color-multi-agent-debate-0-p',
    secondary: 'color-multi-agent-debate-0-s',
    accent: 'color-multi-agent-debate-0-a',
    border: 'border-multi-agent-debate-0-b'
  },
  theme_1: {
    primary: 'color-multi-agent-debate-1-p',
    secondary: 'color-multi-agent-debate-1-s',
    accent: 'color-multi-agent-debate-1-a',
    border: 'border-multi-agent-debate-1-b'
  },
  theme_2: {
    primary: 'color-multi-agent-debate-2-p',
    secondary: 'color-multi-agent-debate-2-s',
    accent: 'color-multi-agent-debate-2-a',
    border: 'border-multi-agent-debate-2-b'
  },
  theme_3: {
    primary: 'color-multi-agent-debate-3-p',
    secondary: 'color-multi-agent-debate-3-s',
    accent: 'color-multi-agent-debate-3-a',
    border: 'border-multi-agent-debate-3-b'
  },
  theme_4: {
    primary: 'color-multi-agent-debate-4-p',
    secondary: 'color-multi-agent-debate-4-s',
    accent: 'color-multi-agent-debate-4-a',
    border: 'border-multi-agent-debate-4-b'
  },
  theme_5: {
    primary: 'color-multi-agent-debate-5-p',
    secondary: 'color-multi-agent-debate-5-s',
    accent: 'color-multi-agent-debate-5-a',
    border: 'border-multi-agent-debate-5-b'
  },
  theme_6: {
    primary: 'color-multi-agent-debate-6-p',
    secondary: 'color-multi-agent-debate-6-s',
    accent: 'color-multi-agent-debate-6-a',
    border: 'border-multi-agent-debate-6-b'
  },
  theme_7: {
    primary: 'color-multi-agent-debate-7-p',
    secondary: 'color-multi-agent-debate-7-s',
    accent: 'color-multi-agent-debate-7-a',
    border: 'border-multi-agent-debate-7-b'
  },
  theme_8: {
    primary: 'color-multi-agent-debate-8-p',
    secondary: 'color-multi-agent-debate-8-s',
    accent: 'color-multi-agent-debate-8-a',
    border: 'border-multi-agent-debate-8-b'
  },
  theme_9: {
    primary: 'color-multi-agent-debate-9-p',
    secondary: 'color-multi-agent-debate-9-s',
    accent: 'color-multi-agent-debate-9-a',
    border: 'border-multi-agent-debate-9-b'
  },
  theme_10: {
    primary: 'color-multi-agent-debate-10-p',
    secondary: 'color-multi-agent-debate-10-s',
    accent: 'color-multi-agent-debate-10-a',
    border: 'border-multi-agent-debate-10-b'
  },
  theme_11: {
    primary: 'color-multi-agent-debate-11-p',
    secondary: 'color-multi-agent-debate-11-s',
    accent: 'color-multi-agent-debate-11-a',
    border: 'border-multi-agent-debate-11-b'
  },
  theme_12: {
    primary: 'color-multi-agent-debate-12-p',
    secondary: 'color-multi-agent-debate-12-s',
    accent: 'color-multi-agent-debate-12-a',
    border: 'border-multi-agent-debate-12-b'
  },
  theme_13: {
    primary: 'color-multi-agent-debate-13-p',
    secondary: 'color-multi-agent-debate-13-s',
    accent: 'color-multi-agent-debate-13-a',
    border: 'border-multi-agent-debate-13-b'
  },
  theme_14: {
    primary: 'color-multi-agent-debate-14-p',
    secondary: 'color-multi-agent-debate-14-s',
    accent: 'color-multi-agent-debate-14-a',
    border: 'border-multi-agent-debate-14-b'
  },
  theme_15: {
    primary: 'color-multi-agent-debate-15-p',
    secondary: 'color-multi-agent-debate-15-s',
    accent: 'color-multi-agent-debate-15-a',
    border: 'border-multi-agent-debate-15-b'
  },
  theme_16: {
    primary: 'color-multi-agent-debate-16-p',
    secondary: 'color-multi-agent-debate-16-s',
    accent: 'color-multi-agent-debate-16-a',
    border: 'border-multi-agent-debate-16-b'
  },
  theme_17: {
    primary: 'color-multi-agent-debate-17-p',
    secondary: 'color-multi-agent-debate-17-s',
    accent: 'color-multi-agent-debate-17-a',
    border: 'border-multi-agent-debate-17-b'
  },
  theme_18: {
    primary: 'color-multi-agent-debate-18-p',
    secondary: 'color-multi-agent-debate-18-s',
    accent: 'color-multi-agent-debate-18-a',
    border: 'border-multi-agent-debate-18-b'
  },
  theme_19: {
    primary: 'color-multi-agent-debate-19-p',
    secondary: 'color-multi-agent-debate-19-s',
    accent: 'color-multi-agent-debate-19-a',
    border: 'border-multi-agent-debate-19-b'
  },
  theme_20: {
    primary: 'color-multi-agent-debate-20-p',
    secondary: 'color-multi-agent-debate-20-s',
    accent: 'color-multi-agent-debate-20-a',
    border: 'border-multi-agent-debate-20-b'
  },
  theme_21: {
    primary: 'color-multi-agent-debate-21-p',
    secondary: 'color-multi-agent-debate-21-s',
    accent: 'color-multi-agent-debate-21-a',
    border: 'border-multi-agent-debate-21-b'
  },
  theme_22: {
    primary: 'color-multi-agent-debate-22-p',
    secondary: 'color-multi-agent-debate-22-s',
    accent: 'color-multi-agent-debate-22-a',
    border: 'border-multi-agent-debate-22-b'
  },
  theme_23: {
    primary: 'color-multi-agent-debate-23-p',
    secondary: 'color-multi-agent-debate-23-s',
    accent: 'color-multi-agent-debate-23-a',
    border: 'border-multi-agent-debate-23-b'
  },
  theme_24: {
    primary: 'color-multi-agent-debate-24-p',
    secondary: 'color-multi-agent-debate-24-s',
    accent: 'color-multi-agent-debate-24-a',
    border: 'border-multi-agent-debate-24-b'
  },
  theme_25: {
    primary: 'color-multi-agent-debate-25-p',
    secondary: 'color-multi-agent-debate-25-s',
    accent: 'color-multi-agent-debate-25-a',
    border: 'border-multi-agent-debate-25-b'
  },
  theme_26: {
    primary: 'color-multi-agent-debate-26-p',
    secondary: 'color-multi-agent-debate-26-s',
    accent: 'color-multi-agent-debate-26-a',
    border: 'border-multi-agent-debate-26-b'
  },
  theme_27: {
    primary: 'color-multi-agent-debate-27-p',
    secondary: 'color-multi-agent-debate-27-s',
    accent: 'color-multi-agent-debate-27-a',
    border: 'border-multi-agent-debate-27-b'
  },
  theme_28: {
    primary: 'color-multi-agent-debate-28-p',
    secondary: 'color-multi-agent-debate-28-s',
    accent: 'color-multi-agent-debate-28-a',
    border: 'border-multi-agent-debate-28-b'
  },
  theme_29: {
    primary: 'color-multi-agent-debate-29-p',
    secondary: 'color-multi-agent-debate-29-s',
    accent: 'color-multi-agent-debate-29-a',
    border: 'border-multi-agent-debate-29-b'
  },
  theme_30: {
    primary: 'color-multi-agent-debate-30-p',
    secondary: 'color-multi-agent-debate-30-s',
    accent: 'color-multi-agent-debate-30-a',
    border: 'border-multi-agent-debate-30-b'
  },
  theme_31: {
    primary: 'color-multi-agent-debate-31-p',
    secondary: 'color-multi-agent-debate-31-s',
    accent: 'color-multi-agent-debate-31-a',
    border: 'border-multi-agent-debate-31-b'
  },
  theme_32: {
    primary: 'color-multi-agent-debate-32-p',
    secondary: 'color-multi-agent-debate-32-s',
    accent: 'color-multi-agent-debate-32-a',
    border: 'border-multi-agent-debate-32-b'
  },
  theme_33: {
    primary: 'color-multi-agent-debate-33-p',
    secondary: 'color-multi-agent-debate-33-s',
    accent: 'color-multi-agent-debate-33-a',
    border: 'border-multi-agent-debate-33-b'
  },
  theme_34: {
    primary: 'color-multi-agent-debate-34-p',
    secondary: 'color-multi-agent-debate-34-s',
    accent: 'color-multi-agent-debate-34-a',
    border: 'border-multi-agent-debate-34-b'
  },
  theme_35: {
    primary: 'color-multi-agent-debate-35-p',
    secondary: 'color-multi-agent-debate-35-s',
    accent: 'color-multi-agent-debate-35-a',
    border: 'border-multi-agent-debate-35-b'
  },
  theme_36: {
    primary: 'color-multi-agent-debate-36-p',
    secondary: 'color-multi-agent-debate-36-s',
    accent: 'color-multi-agent-debate-36-a',
    border: 'border-multi-agent-debate-36-b'
  },
  theme_37: {
    primary: 'color-multi-agent-debate-37-p',
    secondary: 'color-multi-agent-debate-37-s',
    accent: 'color-multi-agent-debate-37-a',
    border: 'border-multi-agent-debate-37-b'
  },
  theme_38: {
    primary: 'color-multi-agent-debate-38-p',
    secondary: 'color-multi-agent-debate-38-s',
    accent: 'color-multi-agent-debate-38-a',
    border: 'border-multi-agent-debate-38-b'
  },
  theme_39: {
    primary: 'color-multi-agent-debate-39-p',
    secondary: 'color-multi-agent-debate-39-s',
    accent: 'color-multi-agent-debate-39-a',
    border: 'border-multi-agent-debate-39-b'
  },
  theme_40: {
    primary: 'color-multi-agent-debate-40-p',
    secondary: 'color-multi-agent-debate-40-s',
    accent: 'color-multi-agent-debate-40-a',
    border: 'border-multi-agent-debate-40-b'
  },
  theme_41: {
    primary: 'color-multi-agent-debate-41-p',
    secondary: 'color-multi-agent-debate-41-s',
    accent: 'color-multi-agent-debate-41-a',
    border: 'border-multi-agent-debate-41-b'
  },
  theme_42: {
    primary: 'color-multi-agent-debate-42-p',
    secondary: 'color-multi-agent-debate-42-s',
    accent: 'color-multi-agent-debate-42-a',
    border: 'border-multi-agent-debate-42-b'
  },
  theme_43: {
    primary: 'color-multi-agent-debate-43-p',
    secondary: 'color-multi-agent-debate-43-s',
    accent: 'color-multi-agent-debate-43-a',
    border: 'border-multi-agent-debate-43-b'
  },
  theme_44: {
    primary: 'color-multi-agent-debate-44-p',
    secondary: 'color-multi-agent-debate-44-s',
    accent: 'color-multi-agent-debate-44-a',
    border: 'border-multi-agent-debate-44-b'
  },
  theme_45: {
    primary: 'color-multi-agent-debate-45-p',
    secondary: 'color-multi-agent-debate-45-s',
    accent: 'color-multi-agent-debate-45-a',
    border: 'border-multi-agent-debate-45-b'
  },
  theme_46: {
    primary: 'color-multi-agent-debate-46-p',
    secondary: 'color-multi-agent-debate-46-s',
    accent: 'color-multi-agent-debate-46-a',
    border: 'border-multi-agent-debate-46-b'
  },
  theme_47: {
    primary: 'color-multi-agent-debate-47-p',
    secondary: 'color-multi-agent-debate-47-s',
    accent: 'color-multi-agent-debate-47-a',
    border: 'border-multi-agent-debate-47-b'
  },
  theme_48: {
    primary: 'color-multi-agent-debate-48-p',
    secondary: 'color-multi-agent-debate-48-s',
    accent: 'color-multi-agent-debate-48-a',
    border: 'border-multi-agent-debate-48-b'
  },
  theme_49: {
    primary: 'color-multi-agent-debate-49-p',
    secondary: 'color-multi-agent-debate-49-s',
    accent: 'color-multi-agent-debate-49-a',
    border: 'border-multi-agent-debate-49-b'
  },
  theme_50: {
    primary: 'color-multi-agent-debate-50-p',
    secondary: 'color-multi-agent-debate-50-s',
    accent: 'color-multi-agent-debate-50-a',
    border: 'border-multi-agent-debate-50-b'
  },
  theme_51: {
    primary: 'color-multi-agent-debate-51-p',
    secondary: 'color-multi-agent-debate-51-s',
    accent: 'color-multi-agent-debate-51-a',
    border: 'border-multi-agent-debate-51-b'
  },
  theme_52: {
    primary: 'color-multi-agent-debate-52-p',
    secondary: 'color-multi-agent-debate-52-s',
    accent: 'color-multi-agent-debate-52-a',
    border: 'border-multi-agent-debate-52-b'
  },
  theme_53: {
    primary: 'color-multi-agent-debate-53-p',
    secondary: 'color-multi-agent-debate-53-s',
    accent: 'color-multi-agent-debate-53-a',
    border: 'border-multi-agent-debate-53-b'
  },
  theme_54: {
    primary: 'color-multi-agent-debate-54-p',
    secondary: 'color-multi-agent-debate-54-s',
    accent: 'color-multi-agent-debate-54-a',
    border: 'border-multi-agent-debate-54-b'
  },
  theme_55: {
    primary: 'color-multi-agent-debate-55-p',
    secondary: 'color-multi-agent-debate-55-s',
    accent: 'color-multi-agent-debate-55-a',
    border: 'border-multi-agent-debate-55-b'
  },
  theme_56: {
    primary: 'color-multi-agent-debate-56-p',
    secondary: 'color-multi-agent-debate-56-s',
    accent: 'color-multi-agent-debate-56-a',
    border: 'border-multi-agent-debate-56-b'
  },
  theme_57: {
    primary: 'color-multi-agent-debate-57-p',
    secondary: 'color-multi-agent-debate-57-s',
    accent: 'color-multi-agent-debate-57-a',
    border: 'border-multi-agent-debate-57-b'
  },
  theme_58: {
    primary: 'color-multi-agent-debate-58-p',
    secondary: 'color-multi-agent-debate-58-s',
    accent: 'color-multi-agent-debate-58-a',
    border: 'border-multi-agent-debate-58-b'
  },
  theme_59: {
    primary: 'color-multi-agent-debate-59-p',
    secondary: 'color-multi-agent-debate-59-s',
    accent: 'color-multi-agent-debate-59-a',
    border: 'border-multi-agent-debate-59-b'
  },
  theme_60: {
    primary: 'color-multi-agent-debate-60-p',
    secondary: 'color-multi-agent-debate-60-s',
    accent: 'color-multi-agent-debate-60-a',
    border: 'border-multi-agent-debate-60-b'
  },
  theme_61: {
    primary: 'color-multi-agent-debate-61-p',
    secondary: 'color-multi-agent-debate-61-s',
    accent: 'color-multi-agent-debate-61-a',
    border: 'border-multi-agent-debate-61-b'
  },
  theme_62: {
    primary: 'color-multi-agent-debate-62-p',
    secondary: 'color-multi-agent-debate-62-s',
    accent: 'color-multi-agent-debate-62-a',
    border: 'border-multi-agent-debate-62-b'
  },
  theme_63: {
    primary: 'color-multi-agent-debate-63-p',
    secondary: 'color-multi-agent-debate-63-s',
    accent: 'color-multi-agent-debate-63-a',
    border: 'border-multi-agent-debate-63-b'
  },
  theme_64: {
    primary: 'color-multi-agent-debate-64-p',
    secondary: 'color-multi-agent-debate-64-s',
    accent: 'color-multi-agent-debate-64-a',
    border: 'border-multi-agent-debate-64-b'
  },
  theme_65: {
    primary: 'color-multi-agent-debate-65-p',
    secondary: 'color-multi-agent-debate-65-s',
    accent: 'color-multi-agent-debate-65-a',
    border: 'border-multi-agent-debate-65-b'
  },
  theme_66: {
    primary: 'color-multi-agent-debate-66-p',
    secondary: 'color-multi-agent-debate-66-s',
    accent: 'color-multi-agent-debate-66-a',
    border: 'border-multi-agent-debate-66-b'
  },
  theme_67: {
    primary: 'color-multi-agent-debate-67-p',
    secondary: 'color-multi-agent-debate-67-s',
    accent: 'color-multi-agent-debate-67-a',
    border: 'border-multi-agent-debate-67-b'
  },
  theme_68: {
    primary: 'color-multi-agent-debate-68-p',
    secondary: 'color-multi-agent-debate-68-s',
    accent: 'color-multi-agent-debate-68-a',
    border: 'border-multi-agent-debate-68-b'
  },
  theme_69: {
    primary: 'color-multi-agent-debate-69-p',
    secondary: 'color-multi-agent-debate-69-s',
    accent: 'color-multi-agent-debate-69-a',
    border: 'border-multi-agent-debate-69-b'
  },
  theme_70: {
    primary: 'color-multi-agent-debate-70-p',
    secondary: 'color-multi-agent-debate-70-s',
    accent: 'color-multi-agent-debate-70-a',
    border: 'border-multi-agent-debate-70-b'
  },
  theme_71: {
    primary: 'color-multi-agent-debate-71-p',
    secondary: 'color-multi-agent-debate-71-s',
    accent: 'color-multi-agent-debate-71-a',
    border: 'border-multi-agent-debate-71-b'
  },
  theme_72: {
    primary: 'color-multi-agent-debate-72-p',
    secondary: 'color-multi-agent-debate-72-s',
    accent: 'color-multi-agent-debate-72-a',
    border: 'border-multi-agent-debate-72-b'
  },
  theme_73: {
    primary: 'color-multi-agent-debate-73-p',
    secondary: 'color-multi-agent-debate-73-s',
    accent: 'color-multi-agent-debate-73-a',
    border: 'border-multi-agent-debate-73-b'
  },
  theme_74: {
    primary: 'color-multi-agent-debate-74-p',
    secondary: 'color-multi-agent-debate-74-s',
    accent: 'color-multi-agent-debate-74-a',
    border: 'border-multi-agent-debate-74-b'
  },
  theme_75: {
    primary: 'color-multi-agent-debate-75-p',
    secondary: 'color-multi-agent-debate-75-s',
    accent: 'color-multi-agent-debate-75-a',
    border: 'border-multi-agent-debate-75-b'
  },
  theme_76: {
    primary: 'color-multi-agent-debate-76-p',
    secondary: 'color-multi-agent-debate-76-s',
    accent: 'color-multi-agent-debate-76-a',
    border: 'border-multi-agent-debate-76-b'
  },
  theme_77: {
    primary: 'color-multi-agent-debate-77-p',
    secondary: 'color-multi-agent-debate-77-s',
    accent: 'color-multi-agent-debate-77-a',
    border: 'border-multi-agent-debate-77-b'
  },
  theme_78: {
    primary: 'color-multi-agent-debate-78-p',
    secondary: 'color-multi-agent-debate-78-s',
    accent: 'color-multi-agent-debate-78-a',
    border: 'border-multi-agent-debate-78-b'
  },
  theme_79: {
    primary: 'color-multi-agent-debate-79-p',
    secondary: 'color-multi-agent-debate-79-s',
    accent: 'color-multi-agent-debate-79-a',
    border: 'border-multi-agent-debate-79-b'
  },
  theme_80: {
    primary: 'color-multi-agent-debate-80-p',
    secondary: 'color-multi-agent-debate-80-s',
    accent: 'color-multi-agent-debate-80-a',
    border: 'border-multi-agent-debate-80-b'
  },
  theme_81: {
    primary: 'color-multi-agent-debate-81-p',
    secondary: 'color-multi-agent-debate-81-s',
    accent: 'color-multi-agent-debate-81-a',
    border: 'border-multi-agent-debate-81-b'
  },
  theme_82: {
    primary: 'color-multi-agent-debate-82-p',
    secondary: 'color-multi-agent-debate-82-s',
    accent: 'color-multi-agent-debate-82-a',
    border: 'border-multi-agent-debate-82-b'
  },
  theme_83: {
    primary: 'color-multi-agent-debate-83-p',
    secondary: 'color-multi-agent-debate-83-s',
    accent: 'color-multi-agent-debate-83-a',
    border: 'border-multi-agent-debate-83-b'
  },
  theme_84: {
    primary: 'color-multi-agent-debate-84-p',
    secondary: 'color-multi-agent-debate-84-s',
    accent: 'color-multi-agent-debate-84-a',
    border: 'border-multi-agent-debate-84-b'
  },
  theme_85: {
    primary: 'color-multi-agent-debate-85-p',
    secondary: 'color-multi-agent-debate-85-s',
    accent: 'color-multi-agent-debate-85-a',
    border: 'border-multi-agent-debate-85-b'
  },
  theme_86: {
    primary: 'color-multi-agent-debate-86-p',
    secondary: 'color-multi-agent-debate-86-s',
    accent: 'color-multi-agent-debate-86-a',
    border: 'border-multi-agent-debate-86-b'
  },
  theme_87: {
    primary: 'color-multi-agent-debate-87-p',
    secondary: 'color-multi-agent-debate-87-s',
    accent: 'color-multi-agent-debate-87-a',
    border: 'border-multi-agent-debate-87-b'
  },
  theme_88: {
    primary: 'color-multi-agent-debate-88-p',
    secondary: 'color-multi-agent-debate-88-s',
    accent: 'color-multi-agent-debate-88-a',
    border: 'border-multi-agent-debate-88-b'
  },
  theme_89: {
    primary: 'color-multi-agent-debate-89-p',
    secondary: 'color-multi-agent-debate-89-s',
    accent: 'color-multi-agent-debate-89-a',
    border: 'border-multi-agent-debate-89-b'
  },
  theme_90: {
    primary: 'color-multi-agent-debate-90-p',
    secondary: 'color-multi-agent-debate-90-s',
    accent: 'color-multi-agent-debate-90-a',
    border: 'border-multi-agent-debate-90-b'
  },
  theme_91: {
    primary: 'color-multi-agent-debate-91-p',
    secondary: 'color-multi-agent-debate-91-s',
    accent: 'color-multi-agent-debate-91-a',
    border: 'border-multi-agent-debate-91-b'
  },
  theme_92: {
    primary: 'color-multi-agent-debate-92-p',
    secondary: 'color-multi-agent-debate-92-s',
    accent: 'color-multi-agent-debate-92-a',
    border: 'border-multi-agent-debate-92-b'
  },
  theme_93: {
    primary: 'color-multi-agent-debate-93-p',
    secondary: 'color-multi-agent-debate-93-s',
    accent: 'color-multi-agent-debate-93-a',
    border: 'border-multi-agent-debate-93-b'
  },
  theme_94: {
    primary: 'color-multi-agent-debate-94-p',
    secondary: 'color-multi-agent-debate-94-s',
    accent: 'color-multi-agent-debate-94-a',
    border: 'border-multi-agent-debate-94-b'
  },
  theme_95: {
    primary: 'color-multi-agent-debate-95-p',
    secondary: 'color-multi-agent-debate-95-s',
    accent: 'color-multi-agent-debate-95-a',
    border: 'border-multi-agent-debate-95-b'
  },
  theme_96: {
    primary: 'color-multi-agent-debate-96-p',
    secondary: 'color-multi-agent-debate-96-s',
    accent: 'color-multi-agent-debate-96-a',
    border: 'border-multi-agent-debate-96-b'
  },
  theme_97: {
    primary: 'color-multi-agent-debate-97-p',
    secondary: 'color-multi-agent-debate-97-s',
    accent: 'color-multi-agent-debate-97-a',
    border: 'border-multi-agent-debate-97-b'
  },
  theme_98: {
    primary: 'color-multi-agent-debate-98-p',
    secondary: 'color-multi-agent-debate-98-s',
    accent: 'color-multi-agent-debate-98-a',
    border: 'border-multi-agent-debate-98-b'
  },
  theme_99: {
    primary: 'color-multi-agent-debate-99-p',
    secondary: 'color-multi-agent-debate-99-s',
    accent: 'color-multi-agent-debate-99-a',
    border: 'border-multi-agent-debate-99-b'
  },
  theme_100: {
    primary: 'color-multi-agent-debate-100-p',
    secondary: 'color-multi-agent-debate-100-s',
    accent: 'color-multi-agent-debate-100-a',
    border: 'border-multi-agent-debate-100-b'
  }
};
