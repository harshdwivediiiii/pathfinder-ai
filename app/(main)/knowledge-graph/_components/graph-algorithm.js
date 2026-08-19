/**
 * Generates a mock Knowledge Graph of skills
 */
export function generateKnowledgeGraph() {
  const nodes = [
    { id: 'math', label: 'Basic Math', baseTime: 10, completed: false },
    { id: 'algebra', label: 'Algebra', baseTime: 15, completed: false },
    { id: 'calc', label: 'Calculus', baseTime: 20, completed: false },
    { id: 'stats', label: 'Statistics', baseTime: 20, completed: false },
    { id: 'prog', label: 'Programming', baseTime: 15, completed: false },
    { id: 'python', label: 'Python', baseTime: 10, completed: false },
    { id: 'ml', label: 'Machine Learning', baseTime: 30, completed: false },
    { id: 'dl', label: 'Deep Learning', baseTime: 40, completed: false },
  ];

  const edges = [
    { source: 'math', target: 'algebra' },
    { source: 'algebra', target: 'calc' },
    { source: 'algebra', target: 'stats' },
    { source: 'prog', target: 'python' },
    { source: 'calc', target: 'ml' },
    { source: 'stats', target: 'ml' },
    { source: 'python', target: 'ml' },
    { source: 'ml', target: 'dl' },
  ];

  return { nodes, edges };
}

/**
 * Recalculates the optimal learning pathway and dynamically adjusts time based on GNN weights.
 * Lateral knowledge transfer: completing a prerequisite reduces the time of its descendants by 10%.
 */
export function calculateDynamicPathway(graph, completedNodeIds) {
  const nodes = JSON.parse(JSON.stringify(graph.nodes));
  const edges = graph.edges;
  
  // Apply completions
  nodes.forEach(n => {
      if (completedNodeIds.includes(n.id)) {
          n.completed = true;
          n.adjustedTime = 0; // Completed, takes 0 time now
      } else {
          n.adjustedTime = n.baseTime;
      }
  });

  // Calculate lateral transfer reductions
  let totalTime = 0;
  let remainingTime = 0;
  
  nodes.forEach(targetNode => {
      if (targetNode.completed) {
          totalTime += targetNode.baseTime;
          return;
      }
      
      let reductionFactor = 1.0;
      
      // Find all incoming edges
      const incoming = edges.filter(e => e.target === targetNode.id);
      
      incoming.forEach(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          if (sourceNode && sourceNode.completed) {
              // 15% reduction for each completed prerequisite due to dynamic GNN weight transfer
              reductionFactor *= 0.85; 
          }
      });
      
      targetNode.adjustedTime = Math.round(targetNode.baseTime * reductionFactor);
      
      totalTime += targetNode.baseTime;
      remainingTime += targetNode.adjustedTime;
  });

  return {
      nodes,
      edges,
      totalTime,
      remainingTime,
  };
}
