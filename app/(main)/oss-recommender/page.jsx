"use client";

import { useState } from "react";
import { searchOpenSourceIssues } from "@/actions/github";
import { Github, Search, ExternalLink, MessageCircle, Star, GitMerge, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

const POPULAR_LANGUAGES = ["JavaScript", "Python", "TypeScript", "Java", "Go", "C++", "Ruby", "Rust"];

export default function OSSRecommenderPage() {
  const [language, setLanguage] = useState("JavaScript");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isSearching, setIsSearching] = useState(false);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    
    const res = await searchOpenSourceIssues({
      languages: [language],
      difficulty: difficulty
    });

    if (res.success) {
      setIssues(res.data);
    } else {
      setError(res.error);
      setIssues([]);
    }
    
    setIsSearching(false);
  };

  return (
    <div className="container max-w-6xl py-12 px-4 md:px-6">
      <div className="space-y-4 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <Github className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-widest">OSS Recommender</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Find Your Next <span className="text-gradient-primary">Open Source</span> Contribution.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We scan GitHub in real-time to find issues tailored to your tech stack and experience level, helping you build your resume with real-world impact.
        </p>
      </div>

      <Card className="glass border-border rounded-3xl mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Primary Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-12 rounded-xl bg-background/50">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Experience Level</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-12 rounded-xl bg-background/50">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner ("Good First Issue")</SelectItem>
                  <SelectItem value="intermediate">Intermediate ("Help Wanted")</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="w-full md:w-auto h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {isSearching ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Find Issues</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-6 mb-8 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {hasSearched && !isSearching && !error && issues.length === 0 && (
        <div className="text-center py-12 glass rounded-3xl border border-dashed border-border">
          <GitMerge className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No issues found</h3>
          <p className="text-muted-foreground mt-1">Try selecting a different language or experience level.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.map(issue => (
          <Card key={issue.id} className="glass border-border rounded-3xl flex flex-col hover:border-primary/50 transition-colors duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-background/80 font-mono text-xs">
                  {issue.repository}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  {issue.comments}
                </div>
              </div>
              <CardTitle className="line-clamp-2 text-lg hover:text-primary transition-colors">
                <a href={issue.url} target="_blank" rel="noopener noreferrer">
                  {issue.title}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 flex-1">
              <div className="flex flex-wrap gap-2">
                {issue.labels.slice(0, 4).map((label, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-[10px] border-border/50"
                    style={{ borderLeftColor: `#${label.color}`, borderLeftWidth: '3px' }}
                  >
                    {label.name}
                  </Badge>
                ))}
                {issue.labels.length > 4 && (
                  <Badge variant="outline" className="text-[10px] border-border/50">
                    +{issue.labels.length - 4} more
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex items-center justify-between border-t border-border/50 mt-4 px-6 py-4">
              <div className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(issue.updatedAt))} ago
              </div>
              <a 
                href={issue.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-primary hover:underline"
              >
                View on GitHub <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
