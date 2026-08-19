/**
 * Generates a road network representing a city grid.
 * 
 * @param {number} width 
 * @param {number} height 
 */
export function generateRoadNetwork(width, height) {
  const grid = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // 0 = Building/Un-routable
  // 1 = Local Road (cost 1)
  // 2 = Highway/Arterial (cost 0.5)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y][x] = 0; // Solid buildings everywhere initially
    }
  }

  // Create grid of local roads (every 4th cell is a road)
  for (let y = 2; y < height - 2; y += 4) {
    for (let x = 2; x < width - 2; x++) grid[y][x] = 1;
  }
  for (let x = 2; x < width - 2; x += 4) {
    for (let y = 2; y < height - 2; y++) grid[y][x] = 1;
  }

  // Create two major highways
  // Highway 1: Horizontal through the middle
  const hw1_y = Math.floor(height / 2);
  for (let x = 2; x < width - 2; x++) grid[hw1_y][x] = 2;
  
  // Highway 2: Vertical
  const hw2_x = Math.floor(width / 3);
  for (let y = 2; y < height - 2; y++) grid[y][hw2_x] = 2;

  // Generate Historical Traffic Grid (The Quantized Edge Model)
  // Edge model knows the central highway intersection is typically busy at this hour (cost +3)
  const historicalTrafficGrid = Array(height).fill(null).map(() => Array(width).fill(0));
  for (let y = hw1_y - 2; y <= hw1_y + 2; y++) {
    for (let x = hw2_x - 2; x <= hw2_x + 2; x++) {
      if (grid[y][x] > 0) historicalTrafficGrid[y][x] = 3.0; // Known historical bottleneck
    }
  }

  // Generate Live Traffic Grid (Cloud Model Only)
  // Cloud model knows about a spontaneous accident on the secondary route
  const liveTrafficGrid = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // Add the historical traffic to live traffic (live encompasses historical base)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      liveTrafficGrid[y][x] = historicalTrafficGrid[y][x];
    }
  }

  // Inject unexpected live incident: Massive pile-up on local road (cost +50)
  const accidentX = hw2_x + 8;
  const accidentY = hw1_y - 4;
  
  for (let y = accidentY - 1; y <= accidentY + 1; y++) {
    for (let x = accidentX - 1; x <= accidentX + 1; x++) {
      if (y >= 0 && y < height && x >= 0 && x < width && grid[y][x] > 0) {
        liveTrafficGrid[y][x] = 50.0;
      }
    }
  }

  return { grid, historicalTrafficGrid, liveTrafficGrid };
}


/**
 * Cloud Route Calculation (Full Live Connectivity)
 */
export function calculateCloudRoute(start, target, grid, liveTrafficGrid) {
  return runAStar(start, target, grid, liveTrafficGrid);
}

/**
 * Offline Edge Route Calculation (Quantized Historical Fallback)
 * The device lost connection, cannot see the live accident, but CAN use cached historical data
 * to avoid the central highway bottleneck.
 */
export function calculateEdgeRoute(start, target, grid, historicalTrafficGrid) {
  return runAStar(start, target, grid, historicalTrafficGrid);
}

/**
 * Dumb Static Route Calculation (No AI/No Traffic)
 * If the app had no edge model, it would just route based on speed limits (Highway vs Local)
 */
export function calculateDumbRoute(start, target, grid) {
  const noTrafficGrid = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(0));
  return runAStar(start, target, grid, noTrafficGrid);
}


function runAStar(start, target, grid, trafficCostGrid) {
  const height = grid.length;
  const width = grid[0].length;
  
  const openSet = [{x: start.x, y: start.y, g: 0, f: 0, parent: null}];
  const closedSet = new Set();
  const getStateKey = (n) => `${n.x},${n.y}`;
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
  
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
      
      const roadType = grid[ny][nx];
      if (roadType === 0) continue; // Building
      
      // Base road cost (Highway is faster, lower cost)
      const baseCost = roadType === 2 ? 0.5 : 1.5;
      
      // Dynamic/Historical traffic cost overlay
      const trafficPenalty = trafficCostGrid[ny][nx];
      
      const stepCost = baseCost + trafficPenalty;
      
      const neighbor = { x: nx, y: ny, g: current.g + stepCost, f: current.g + stepCost + heuristic({x: nx, y: ny}, target), parent: current };
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
