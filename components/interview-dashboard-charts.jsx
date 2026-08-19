"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { format } from "date-fns";

export function ProgressionChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = [...data].reverse().map((session) => ({
    date: format(new Date(session.createdAt), "MMM dd"),
    score: session.overallScore,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <RechartsTooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            name="Overall Score"
            stroke="#8884d8"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryRadarChart({ data }) {
  if (!data || data.length === 0) return null;

  // Compute average for each category over the last few sessions
  let techTotal = 0, commTotal = 0, gramTotal = 0;
  data.forEach((s) => {
    techTotal += s.technicalScore;
    commTotal += s.communicationScore;
    gramTotal += s.grammarScore;
  });

  const count = data.length;
  const radarData = [
    { subject: "Technical", A: techTotal / count, fullMark: 100 },
    { subject: "Communication", A: commTotal / count, fullMark: 100 },
    { subject: "Grammar", A: gramTotal / count, fullMark: 100 },
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Average Score"
            dataKey="A"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.6}
          />
          <Legend />
          <RechartsTooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
