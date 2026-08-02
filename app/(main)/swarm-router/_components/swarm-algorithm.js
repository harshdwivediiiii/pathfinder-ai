/**
 * Generates a highly constrained grid environment (like a fulfillment center).
 * Many bottlenecks (corridors that are only 1 cell wide) to force agent conflicts.
 */
export function generateSwarmEnvironment() {
  const width = 15;
  const height = 15;
  const grid = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // Create a massive central block with only a cross-shaped corridor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y][x] = 1; // Default to wall
    }
  }

  // Horizontal Corridors
  for (let x = 1; x < width - 1; x++) {
    grid[3][x] = 0;
    grid[7][x] = 0; // Central H
    grid[11][x] = 0;
  }
  
  // Vertical Corridors
  for (let y = 1; y < height - 1; y++) {
    grid[y][3] = 0;
    grid[y][7] = 0; // Central V
    grid[y][11] = 0;
  }

  // Open up some corners for spawn points
  grid[1][1] = 0; grid[1][2] = 0; grid[2][1] = 0; // Top-Left
  grid[1][13] = 0; grid[1][12] = 0; grid[2][13] = 0; // Top-Right
  grid[13][1] = 0; grid[13][2] = 0; grid[12][1] = 0; // Bot-Left
  grid[13][13] = 0; grid[13][12] = 0; grid[12][13] = 0; // Bot-Right

  // Define 4 Agents with intersecting paths
  const agents = [
    { id: 'A', color: '#ef4444', start: {x: 3, y: 1}, target: {x: 11, y: 13} }, // Red: Top-Left to Bot-Right
    { id: 'B', color: '#3b82f6', start: {x: 11, y: 13}, target: {x: 3, y: 1} }, // Blue: Bot-Right to Top-Left
    { id: 'C', color: '#10b981', start: {x: 13, y: 3}, target: {x: 1, y: 11} }, // Green: Top-Right to Bot-Left
    { id: 'D', color: '#f59e0b', start: {x: 1, y: 11}, target: {x: 13, y: 3} }  // Yellow: Bot-Left to Top-Right
  ];

  return { grid, agents };
}


/**
 * Baseline: Independent A* (Reactive)
 * Agents plan paths ignoring everyone else. When running, if two agents want the same cell, 
 * they deadlock.
 */
export function calculateIndependentPaths(agents, grid) {
  const allPaths = {};
  
  for (const agent of agents) {
    // Standard 2D A*
    const path = runStandardAStar(agent.start, agent.target, grid);
    allPaths[agent.id] = path;
  }
  
  return allPaths;
}

function runStandardAStar(start, target, grid) {
  const height = grid.length;
  const width = grid[0].length;
  
  const openSet = [{x: start.x, y: start.y, g: 0, f: 0, parent: null}];
  const closedSet = new Set();
  const getStateKey = (n) => `${n.x},${n.y}`;
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  
  openSet[0].f = heuristic(start, target);
  const actions = [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}];
  
  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIdx].f) currentIdx = i;
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    if (current.x === target.x && current.y === target.y) {
       const path = [];
       let curr = current;
       while (curr) { path.unshift({x: curr.x, y: curr.y}); curr = curr.parent; }
       return path;
    }
    
    closedSet.add(getStateKey(current));
    
    for (const action of actions) {
      const nx = current.x + action.dx;
      const ny = current.y + action.dy;
      
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (grid[ny][nx] === 1) continue;
      
      const neighbor = { x: nx, y: ny, g: current.g + 1, f: current.g + 1 + heuristic({x: nx, y: ny}, target), parent: current };
      if (closedSet.has(getStateKey(neighbor))) continue;
      
      const existing = openSet.find(n => n.x === nx && n.y === ny);
      if (!existing) {
        openSet.push(neighbor);
      } else if (neighbor.g < existing.g) {
        existing.g = neighbor.g;
        existing.parent = neighbor.parent;
      }
    }
  }
  return [];
}


/**
 * Multi-Agent Pathfinding (Cooperative A* with Space-Time Reservations)
 * Solves sequentially. Agents respect previous agents' reservations in time and space.
 */
export function calculateMAPF(agents, grid) {
  const allPaths = {};
  // Reservation Table: Map of "x,y,t" -> agentId
  // This stores where agents WILL be, preventing others from moving there.
  const reservations = new Map();
  
  // Prioritize agents based on some metric (here, just sequence).
  // In advanced MAPF, you iterate to find the optimal ordering.
  for (const agent of agents) {
    const path = runCooperativeAStar(agent.start, agent.target, grid, reservations);
    
    if (path.length > 0) {
      allPaths[agent.id] = path;
      // Lock in reservations for this agent
      for (let t = 0; t < path.length; t++) {
        const pt = path[t];
        reservations.set(`${pt.x},${pt.y},${t}`, agent.id);
        
        // Agents stay at their target indefinitely, so reserve future times heavily
        // (Prevent others from walking *through* a parked agent)
        if (t === path.length - 1) {
          for (let futureT = t + 1; futureT < t + 100; futureT++) {
            reservations.set(`${pt.x},${pt.y},${futureT}`, agent.id);
          }
        }
      }
    } else {
      // Failed to find a path for this agent given the current reservations
      allPaths[agent.id] = []; 
    }
  }
  
  return allPaths;
}

function runCooperativeAStar(start, target, grid, reservations) {
  const height = grid.length;
  const width = grid[0].length;
  const maxTimeSteps = 200; // Limit
  
  const openSet = [{x: start.x, y: start.y, t: 0, g: 0, f: 0, parent: null}];
  const closedSet = new Set();
  
  const getStateKey = (n) => `${n.x},${n.y},${n.t}`;
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  
  openSet[0].f = heuristic(start, target);
  
  // Includes 'Wait' action (0,0)
  const actions = [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}, {dx: 0, dy: 0}];
  
  let iterations = 0;
  
  while (openSet.length > 0 && iterations < 15000) {
    iterations++;
    
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIdx].f) currentIdx = i;
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    if (current.x === target.x && current.y === target.y) {
       // Validate that we can safely stay here (not reserved in the future)
       // Simplified: if it's reserved right after we arrive, we shouldn't stop here yet
       let safeToPark = true;
       for (let futureT = current.t + 1; futureT < current.t + 10; futureT++) {
         if (reservations.has(`${current.x},${current.y},${futureT}`)) {
           safeToPark = false; break;
         }
       }
       
       if (safeToPark) {
         const path = [];
         let curr = current;
         while (curr) { path.unshift({x: curr.x, y: curr.y}); curr = curr.parent; }
         return path;
       }
    }
    
    if (current.t >= maxTimeSteps) continue;
    closedSet.add(getStateKey(current));
    
    const nextT = current.t + 1;
    
    for (const action of actions) {
      const nx = current.x + action.dx;
      const ny = current.y + action.dy;
      
      // Bounds & Walls
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (grid[ny][nx] === 1) continue;
      
      // RESERVATION CHECK
      
      // 1. Vertex Collision: Is someone else occupying the target cell at nextT?
      if (reservations.has(`${nx},${ny},${nextT}`)) continue;
      
      // 2. Edge Collision (Swapping): 
      // If we move from A->B, is someone else moving B->A at the exact same time?
      // Meaning: at current.t, they were at B (nx, ny). At nextT, they are at A (current.x, current.y).
      const theirIdAtTargetNow = reservations.get(`${nx},${ny},${current.t}`);
      const theirIdAtStartNext = reservations.get(`${current.x},${current.y},${nextT}`);
      
      if (theirIdAtTargetNow && theirIdAtStartNext && theirIdAtTargetNow === theirIdAtStartNext) {
        // Someone is swapping places with us
        continue;
      }
      
      const neighbor = { x: nx, y: ny, t: nextT, g: current.g + 1, f: current.g + 1 + heuristic({x: nx, y: ny}, target), parent: current };
      
      if (closedSet.has(getStateKey(neighbor))) continue;
      
      const existing = openSet.find(n => n.x === nx && n.y === ny && n.t === nextT);
      if (!existing) openSet.push(neighbor);
    }
  }
  
  return []; // Trapped or timed out
}
