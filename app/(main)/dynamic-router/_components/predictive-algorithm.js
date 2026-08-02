/**
 * Generates a warehouse-style grid environment with dynamic obstacles (patrolling forklifts).
 * 
 * @param {number} width 
 * @param {number} height 
 */
export function generateDynamicEnvironment(width, height) {
  const grid = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // Add some static obstacles (Warehouse racks)
  for (let y = 3; y < height - 3; y += 4) {
    for (let x = 3; x < width - 3; x += 3) {
      grid[y][x] = 1;
      grid[y+1][x] = 1;
    }
  }

  // Generate dynamic obstacles
  const obstacles = [];
  
  // Obstacle 1: Moving Horizontally back and forth
  obstacles.push({
    id: 1,
    startX: 2, startY: 2,
    path: generatePatrolPath(2, 2, width - 3, 2)
  });

  // Obstacle 2: Moving Vertically
  obstacles.push({
    id: 2,
    startX: 5, startY: 1,
    path: generatePatrolPath(5, 1, 5, height - 2)
  });

  // Obstacle 3: Moving Horizontally
  obstacles.push({
    id: 3,
    startX: width - 3, startY: height - 3,
    path: generatePatrolPath(width - 3, height - 3, 2, height - 3)
  });
  
  // Obstacle 4: Moving Vertically
  obstacles.push({
    id: 4,
    startX: width - 5, startY: height - 2,
    path: generatePatrolPath(width - 5, height - 2, width - 5, 1)
  });

  return { grid, obstacles };
}

/**
 * Helper to generate a ping-pong patrol path for an obstacle
 */
function generatePatrolPath(x1, y1, x2, y2) {
  const path = [];
  let cx = x1, cy = y1;
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  
  // Forward
  while (cx !== x2 || cy !== y2) {
    path.push({x: cx, y: cy});
    cx += dx; cy += dy;
  }
  path.push({x: x2, y: y2});
  
  // Backward
  while (cx !== x1 || cy !== y1) {
    path.push({x: cx, y: cy});
    cx -= dx; cy -= dy;
  }
  // Omitting final point to loop smoothly
  return path;
}

/**
 * Gets the position of an obstacle at a specific time step `t`
 */
export function getObstaclePositionAtTime(obstacle, t) {
  const cycleLength = obstacle.path.length;
  if (cycleLength === 0) return { x: obstacle.startX, y: obstacle.startY };
  return obstacle.path[t % cycleLength];
}

/**
 * Spatio-Temporal A* (Predictive Routing)
 * 
 * @param {Object} start {x, y}
 * @param {Object} target {x, y}
 * @param {Array} grid static grid (0=empty, 1=wall)
 * @param {Array} obstacles array of dynamic obstacles with predictable paths
 * @param {number} maxTimeSteps to prevent infinite loops if trapped
 */
export function calculatePredictivePath(start, target, grid, obstacles, maxTimeSteps = 200) {
  const height = grid.length;
  const width = grid[0].length;
  
  // State: {x, y, t}
  const openSet = [];
  const closedSet = new Set();
  
  const getStateKey = (n) => `${n.x},${n.y},${n.t}`;
  
  const startNode = { x: start.x, y: start.y, t: 0, g: 0, f: 0, parent: null };
  
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  startNode.f = heuristic(startNode, target);
  
  openSet.push(startNode);
  
  // Actions: Up, Down, Left, Right, WAIT (stay in place)
  const actions = [
    {dx: 0, dy: -1}, {dx: 0, dy: 1}, 
    {dx: -1, dy: 0}, {dx: 1, dy: 0},
    {dx: 0, dy: 0} // Wait action
  ];

  let iterations = 0;
  
  while (openSet.length > 0 && iterations < 10000) {
    iterations++;
    
    // Get lowest f
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIdx].f) currentIdx = i;
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    // Check if we hit target (and optionally require staying there safely)
    if (current.x === target.x && current.y === target.y) {
       // Reconstruct path
       const path = [];
       let curr = current;
       while (curr) {
         path.unshift({x: curr.x, y: curr.y, t: curr.t, isWait: curr.parent && curr.x === curr.parent.x && curr.y === curr.parent.y});
         curr = curr.parent;
       }
       return path;
    }
    
    // If we wait too long, abort
    if (current.t >= maxTimeSteps) continue;
    
    closedSet.add(getStateKey(current));
    
    // Expand neighbors (next time step)
    const nextT = current.t + 1;
    
    // Pre-calculate obstacle positions at t and nextT for collision checking
    const obsNextPos = obstacles.map(o => getObstaclePositionAtTime(o, nextT));
    const obsCurrPos = obstacles.map(o => getObstaclePositionAtTime(o, current.t));
    
    for (const action of actions) {
      const nx = current.x + action.dx;
      const ny = current.y + action.dy;
      
      // Bounds check
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      
      // Static obstacle check
      if (grid[ny][nx] === 1) continue;
      
      // Dynamic obstacle checks
      let collision = false;
      for (let i = 0; i < obstacles.length; i++) {
        const nextO = obsNextPos[i];
        const currO = obsCurrPos[i];
        
        // 1. Vertex collision: We move into the same cell the obstacle moves into at nextT
        if (nx === nextO.x && ny === nextO.y) {
          collision = true; break;
        }
        
        // 2. Edge collision (Swapping places): Obstacle moves from A to B, we move from B to A
        if (nx === currO.x && ny === currO.y && current.x === nextO.x && current.y === nextO.y) {
           collision = true; break;
        }
      }
      
      if (collision) continue;
      
      const gNode = current.g + 1; // Time is distance
      const hNode = heuristic({x: nx, y: ny}, target);
      
      const neighbor = {
        x: nx, y: ny, t: nextT,
        g: gNode,
        f: gNode + hNode,
        parent: current
      };
      
      const key = getStateKey(neighbor);
      if (closedSet.has(key)) continue;
      
      const existingIdx = openSet.findIndex(n => n.x === nx && n.y === ny && n.t === nextT);
      if (existingIdx !== -1) {
        if (openSet[existingIdx].g > gNode) {
          openSet[existingIdx] = neighbor;
        }
      } else {
        openSet.push(neighbor);
      }
    }
  }
  
  return []; // No safe path found within maxTimeSteps
}

/**
 * Standard Reactive A* (Baseline comparison)
 * It plans a path assuming dynamic obstacles are static at their *current* position.
 */
export function calculateReactivePath(start, target, grid, currentObstaclePositions) {
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
      
      // Treat dynamic obstacles as static walls at their current position
      const isBlocked = currentObstaclePositions.some(o => o.x === nx && o.y === ny);
      if (isBlocked) continue;
      
      const neighbor = { x: nx, y: ny, g: current.g + 1, f: current.g + 1 + heuristic({x: nx, y: ny}, target), parent: current };
      if (closedSet.has(getStateKey(neighbor))) continue;
      
      const existing = openSet.find(n => n.x === nx && n.y === ny);
      if (!existing) openSet.push(neighbor);
    }
  }
  return [];
}
