"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/misc/utils";

function ComparativeResults({ results, loading }) {
  const [activeTab, setActiveTab] = useState("ranked");

  if (!results && !loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">No results yet. Run a comparative analysis to see results.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm animate-pulse">Running comparative analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const { comparison, results: algorithmResults } = results;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparison Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="ranked">Weighted Ranking</TabsTrigger>
              <TabsTrigger value="pareto">Pareto Frontier</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="ranked" className="mt-4">
              <ComparisonTable ranked={comparison?.weightedRanking ?? []} />
            </TabsContent>

            <TabsContent value="pareto" className="mt-4">
              <ParetoTable frontier={comparison?.paretoFrontier ?? []} />
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <AlgorithmResultsTable algorithmResults={algorithmResults} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {comparison?.bestOverall && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm">Best Overall</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-xs">
              {comparison.bestOverall.algorithm} — Score: {comparison.bestOverall.score.toFixed(4)}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComparisonTable({ ranked }) {
  if (ranked.length === 0) {
    return <p className="text-sm text-muted-foreground">No results to compare.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Algorithm</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Path Length</TableHead>
          <TableHead>Nodes Explored</TableHead>
          <TableHead>Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranked.map((entry, index) => (
          <TableRow key={entry.algorithm} className={cn(index === 0 && "bg-primary/5")}>
            <TableCell className="font-bold">#{index + 1}</TableCell>
            <TableCell>
              <Badge variant="outline">{entry.algorithm}</Badge>
            </TableCell>
            <TableCell>{entry.score.toFixed(4)}</TableCell>
            <TableCell>{entry.cost.toFixed(2)}</TableCell>
            <TableCell>{entry.path?.length ?? 0}</TableCell>
            <TableCell>{entry.nodesExplored ?? 0}</TableCell>
            <TableCell>{entry.durationMs?.toFixed(1)}ms</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ParetoTable({ frontier }) {
  if (frontier.length === 0) {
    return <p className="text-sm text-muted-foreground">No Pareto-optimal results found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Algorithm</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Nodes Explored</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {frontier.map((entry) => (
          <TableRow key={entry.algorithm}>
            <TableCell>
              <Badge variant="secondary">{entry.algorithm}</Badge>
            </TableCell>
            <TableCell>{entry.cost.toFixed(2)}</TableCell>
            <TableCell>{entry.nodesExplored}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AlgorithmResultsTable({ algorithmResults }) {
  if (!algorithmResults || algorithmResults.length === 0) {
    return <p className="text-sm text-muted-foreground">No results available.</p>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Algorithm</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Path Length</TableHead>
            <TableHead>Nodes Explored</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {algorithmResults.map((r) => (
            <TableRow key={r.algorithm}>
              <TableCell className="font-medium">{r.algorithm}</TableCell>
              <TableCell>
                <Badge variant={r.success ? "default" : "destructive"}>
                  {r.success ? "Success" : "Failed"}
                </Badge>
              </TableCell>
              <TableCell>{r.success ? r.cost.toFixed(2) : "N/A"}</TableCell>
              <TableCell>{r.success ? r.path?.length ?? 0 : 0}</TableCell>
              <TableCell>{r.success ? r.nodesExplored : 0}</TableCell>
              <TableCell>{r.durationMs?.toFixed(1)}ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

export { ComparativeResults };