"use client";

import React, { useState, useEffect } from "react";
import { simulateVectorSearch } from "./_components/vector-algorithm";
import { Search, Database, Fingerprint, Code, Server, BarChart, Cloud, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e) => {
      e.preventDefault();
      if (!query.trim()) return;
      
      setIsSearching(true);
      
      // Simulate vector database latency
      setTimeout(() => {
          const matched = simulateVectorSearch(query);
          setResults(matched);
          setHasSearched(true);
          setIsSearching(false);
      }, 800);
  };

  const getCategoryIcon = (category) => {
      switch(category) {
          case 'Frontend': return <Code className="w-4 h-4 text-blue-500" />;
          case 'Backend': return <Server className="w-4 h-4 text-emerald-500" />;
          case 'Data Science': return <BarChart className="w-4 h-4 text-violet-500" />;
          case 'DevOps': return <Cloud className="w-4 h-4 text-cyan-500" />;
          default: return <Database className="w-4 h-4" />;
      }
  };

  const sampleQueries = [
      "how to make websites look good",
      "put it on the internet",
      "make an ai chatgpt clone",
      "handle high traffic"
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl">
          <Fingerprint className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semantic Vector Search</h1>
          <p className="text-muted-foreground">Query the curriculum using natural language intent instead of exact keyword matching.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-6 max-w-4xl mx-auto">
        
        <Card className="border shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-fuchsia-500" />
                    Query Vector Space
                </CardTitle>
                <CardDescription>
                    Try asking a natural language question. The embedding model will map your intent to the correct technical pathway.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., 'how do I make a website look pretty?'"
                            className="pl-9 h-12 text-lg"
                        />
                    </div>
                    <Button type="submit" disabled={isSearching} className="h-12 px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                        {isSearching ? <span className="animate-pulse">Embedding...</span> : "Search"}
                    </Button>
                </form>
                
                <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-sm text-muted-foreground mt-1">Try:</span>
                    {sampleQueries.map(q => (
                        <Badge 
                            key={q} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-fuchsia-100 hover:text-fuchsia-800 dark:hover:bg-fuchsia-900/40 font-normal"
                            onClick={() => setQuery(q)}
                        >
                            "{q}"
                        </Badge>
                    ))}
                </div>
                
            </CardContent>
        </Card>

        {hasSearched && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Top Semantic Matches <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{results.length}</Badge>
                </h3>
                
                {results.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-900/30 text-muted-foreground">
                        No semantic matches found above the similarity threshold.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {results.map((result, idx) => (
                            <div key={result.id} className="p-4 rounded-xl border bg-card hover:border-fuchsia-500/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        {getCategoryIcon(result.category)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">{result.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{result.category}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[200px] md:max-w-md">
                                                Tags: {result.intentTags.slice(0, 3).join(', ')}...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 justify-between md:justify-end">
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cosine Similarity</div>
                                        <div className="font-mono font-bold text-emerald-600">
                                            {(result.similarityScore * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="group-hover:bg-fuchsia-50 dark:group-hover:bg-fuchsia-900/20 group-hover:text-fuchsia-600">
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                                
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}
