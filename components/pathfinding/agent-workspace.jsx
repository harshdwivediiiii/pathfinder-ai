"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Play, RotateCcw } from "lucide-react";

function AgentWorkspace({ agents, onAgentChange, onRunCoordination, onAddAgent, onRemoveAgent, loading }) {
  const [newAgent, setNewAgent] = useState({
    id: `agent-${Date.now()}`,
    start: "",
    goal: "",
    priority: 1,
    constraints: {},
    objectives: {},
  });

  const handleAddAgent = () => {
    if (!newAgent.start || !newAgent.goal) return;
    onAddAgent({ ...newAgent });
    setNewAgent((prev) => ({ ...prev, id: `agent-${Date.now()}`, start: "", goal: "" }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Start Node</Label>
              <Input
                value={newAgent.start}
                onChange={(e) => setNewAgent((prev) => ({ ...prev, start: e.target.value }))}
                placeholder="Node A"
              />
            </div>
            <div>
              <Label>Goal Node</Label>
              <Input
                value={newAgent.goal}
                onChange={(e) => setNewAgent((prev) => ({ ...prev, goal: e.target.value }))}
                placeholder="Node B"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={String(newAgent.priority)}
                onValueChange={(v) => setNewAgent((prev) => ({ ...prev, priority: Number.parseInt(v, 10) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Highest</SelectItem>
                  <SelectItem value="2">2 — High</SelectItem>
                  <SelectItem value="3">3 — Medium</SelectItem>
                  <SelectItem value="4">4 — Low</SelectItem>
                  <SelectItem value="5">5 — Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddAgent} size="sm" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Active Agents ({agents.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={onRunCoordination}
              disabled={loading || agents.length < 2}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Coordinate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents added yet. Add at least 2 agents to coordinate.</p>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{agent.id}</Badge>
                      <span className="text-sm font-medium">
                        {agent.start} → {agent.goal}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Priority: {agent.priority}</span>
                      <span>Status: {agent.status}</span>
                      <span>Path: {agent.currentPath?.length ?? 0} nodes</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAgent(agent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { AgentWorkspace };