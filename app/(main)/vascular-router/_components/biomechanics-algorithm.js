/**
 * Generates a synthetic but medically plausible 2D vascular network graph.
 * 
 * Includes Major Arteries (thick, high flow), Veins (medium, medium flow),
 * and a dense Capillary bed (thin, low flow).
 */
export function generateVascularNetwork() {
  const nodes = [];
  const edges = [];
  
  // Create a grid-like structure but distorted to look organic
  const width = 800;
  const height = 600;
  
  const cols = 15;
  const rows = 10;
  
  // 1. Generate Nodes
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Add some organic noise to positions
      const xOffset = (Math.random() - 0.5) * (width / cols) * 0.8;
      const yOffset = (Math.random() - 0.5) * (height / rows) * 0.8;
      
      const x = (c / (cols - 1)) * width + xOffset;
      const y = (r / (rows - 1)) * height + yOffset;
      
      nodes.push({
        id: `n_${r}_${c}`,
        x: Math.max(20, Math.min(width - 20, x)),
        y: Math.max(20, Math.min(height - 20, y)),
        col: c,
        row: r
      });
    }
  }
  
  // 2. Generate Edges (Vessels)
  // We'll define a few main "arterial" lines that run horizontally,
  // and everything else is capillary mesh.
  
  const getNode = (r, c) => nodes.find(n => n.row === r && n.col === c);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const current = getNode(r, c);
      if (!current) continue;
      
      // Connect Right
      if (c < cols - 1) {
        const right = getNode(r, c + 1);
        if (right) {
          const isArtery = r === 2 || r === 7;
          const isVein = r === 5;
          
          edges.push({
            id: `e_${current.id}_${right.id}`,
            source: current.id,
            target: right.id,
            type: isArtery ? 'artery' : (isVein ? 'vein' : 'capillary'),
            // Arteries flow left-to-right strongly
            // Veins flow right-to-left
            // Capillaries flow down
            flowDir: isArtery ? 1 : (isVein ? -1 : 0),
            baseFlowVelocity: isArtery ? 8.0 : (isVein ? 4.0 : 1.0),
            diameter: isArtery ? 12 : (isVein ? 8 : 3),
            distance: Math.hypot(right.x - current.x, right.y - current.y)
          });
        }
      }
      
      // Connect Down (Capillaries)
      if (r < rows - 1) {
        const down = getNode(r + 1, c);
        if (down) {
          edges.push({
            id: `e_${current.id}_${down.id}`,
            source: current.id,
            target: down.id,
            type: 'capillary',
            flowDir: 1, // Flow down
            baseFlowVelocity: 1.5,
            diameter: 3,
            distance: Math.hypot(down.x - current.x, down.y - current.y)
          });
        }
      }
      
      // Connect Diagonal (Organic feel)
      if (r < rows - 1 && c < cols - 1 && Math.random() > 0.6) {
        const diag = getNode(r + 1, c + 1);
        if (diag) {
          edges.push({
            id: `e_${current.id}_${diag.id}`,
            source: current.id,
            target: diag.id,
            type: 'capillary',
            flowDir: 1,
            baseFlowVelocity: 1.0,
            diameter: 2,
            distance: Math.hypot(diag.x - current.x, diag.y - current.y)
          });
        }
      }
    }
  }
  
  // Make the graph undirected in terms of pure connectivity,
  // but flow direction dictates resistance.
  const undirectedEdges = [];
  edges.forEach(e => {
    // Forward edge
    undirectedEdges.push({...e});
    // Reverse edge
    undirectedEdges.push({
      ...e,
      id: `e_${e.target}_${e.source}_rev`,
      source: e.target,
      target: e.source,
      flowDir: -e.flowDir // If flow was 1 (with us), going reverse means flow is -1 (against us)
    });
  });

  return { nodes, edges: undirectedEdges };
}

/**
 * Calculates fluid resistance (drag) based on a simplified Reynold's number concept.
 * 
 * @param {number} distance - Length of the vessel
 * @param {number} diameter - Width of the vessel
 * @param {number} relativeVelocity - (Bot Velocity + Blood Flow Velocity)
 * @returns {number} The energy cost to traverse
 */
function calculateFluidDrag(distance, diameter, relativeVelocity) {
  // Drag equation: Fd = 1/2 * p * u^2 * Cd * A
  // Simplified for our graph routing:
  // If relative velocity is negative (current is pushing us back faster than we can swim), cost is Infinity
  if (relativeVelocity <= 0.1) return Infinity; 
  
  // Narrow vessels have higher resistance due to sheer stress on walls (Poiseuille's Law influence)
  const wallFriction = 10 / diameter;
  
  // Drag increases squarely with velocity we need to output to overcome the flow
  const dragForce = Math.pow(1 / relativeVelocity, 2);
  
  return distance * (wallFriction + dragForce);
}

/**
 * Biomechanical A* Routing Engine
 * Routes a micro-bot through the vascular graph minimizing energy expenditure.
 * 
 * @param {Object} graph - { nodes, edges }
 * @param {string} startId - Injection node ID
 * @param {string} goalId - Tumor node ID
 * @param {number} botPropulsion - Max velocity the bot can achieve
 * @param {number} bloodPressureModifier - Scales global flow velocities
 */
export function calculateBiomechanicalPath(graph, startId, goalId, botPropulsion, bloodPressureModifier) {
  const { nodes, edges } = graph;
  
  const getNeighbors = (nodeId) => edges.filter(e => e.source === nodeId);
  
  const gScore = new Map(); // Energy expenditure from start
  const fScore = new Map(); // Estimated total energy
  const cameFrom = new Map();
  
  nodes.forEach(n => {
    gScore.set(n.id, Infinity);
    fScore.set(n.id, Infinity);
  });
  
  gScore.set(startId, 0);
  fScore.set(startId, 0); // Simplified heuristic: we'll just use Dijkstra disguised as A* for complex drag
  
  const openSet = new Set([startId]);
  
  while (openSet.size > 0) {
    // Get node in openSet with lowest fScore
    let currentId = null;
    let lowestF = Infinity;
    
    for (const id of openSet) {
      const score = fScore.get(id);
      if (score < lowestF) {
        lowestF = score;
        currentId = id;
      }
    }
    
    if (currentId === goalId) {
      // Reconstruct path
      const path = [currentId];
      let curr = currentId;
      let totalEnergy = gScore.get(goalId);
      
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr);
        path.unshift(curr);
      }
      return { path, totalEnergy };
    }
    
    openSet.delete(currentId);
    
    const neighbors = getNeighbors(currentId);
    
    for (const edge of neighbors) {
      const neighborId = edge.target;
      
      // Calculate effective flow velocity
      // flowDir is 1 if flow is going from source to target, -1 if against
      const actualFlowVelocity = edge.baseFlowVelocity * bloodPressureModifier * edge.flowDir;
      
      // Relative velocity: how fast are we actually moving?
      const relativeVelocity = botPropulsion + actualFlowVelocity;
      
      // If the current is too strong pushing against us, we can't go this way
      if (relativeVelocity <= 0.1) continue;
      
      const traversalCost = calculateFluidDrag(edge.distance, edge.diameter, relativeVelocity);
      
      const tentativeG = gScore.get(currentId) + traversalCost;
      
      if (tentativeG < gScore.get(neighborId)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG); // A* heuristic omitted for true cost finding in fluid dynamic graphs
        openSet.add(neighborId);
      }
    }
  }
  
  // No path found (blood pressure too high, propulsion too low)
  return { path: [], totalEnergy: Infinity };
}
