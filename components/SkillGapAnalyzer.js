"use client";

import React from "react";

export default function SkillGapAnalyzer({ roadmap = [] }) {
  const copyRoadmapToClipboard = (roadmap) => {
    const roadmapText = roadmap
      .map(
        (week, index) =>
          `Week ${index + 1}:\n${week.tasks?.join("\n") || ""}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(roadmapText).catch(() => {});
  };

  return (
    <div>
      <button onClick={() => copyRoadmapToClipboard(roadmap)}>
        Copy Learning Roadmap
      </button>
      <h2>Learning Roadmap</h2>
      {roadmap.map((week, index) => (
        <div key={index}>
          <h3>Week {index + 1}</h3>
          <ul>
            {week.tasks?.map((task, taskIndex) => (
              <li key={taskIndex}>{task}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}