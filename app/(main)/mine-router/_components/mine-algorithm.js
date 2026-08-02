/**
 * Generates a simple 2D maze representing an underground mine network.
 * 0 = wall/rock, 1 = open tunnel
 */
export function generateMineNetwork(width, height) {
  // Initialize with solid rock
  const network = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // Create a main vertical shaft (elevator)
  const shaftX = Math.floor(width / 2);
  for (let y = 0; y < height; y++) {
    network[y][shaftX] = 1;
    network[y][shaftX - 1] = 1; // wide shaft
  }
  
  // Create horizontal mining levels
  const numLevels = 6;
  const levelSpacing = Math.floor(height / numLevels);
  
  for (let i = 1; i < numLevels; i++) {
    const levelY = i * levelSpacing;
    for (let x = 2; x < width - 2; x++) {
      network[levelY][x] = 1;
    }
    
    // Create random vertical connections between levels (ladders/vent shafts)
    const numConnections = 3;
    for (let c = 0; c < numConnections; c++) {
      const connX = Math.floor(Math.random() * (width - 4)) + 2;
      for (let y = levelY; y < levelY + levelSpacing; y++) {
        if (y < height) network[y][connX] = 1;
      }
    }
  }
  
  return network;
}

/**
 * Simulates the diffusion of toxic gas and clean air through the tunnels.
 * Returns a 2D array of gas concentration [0.0 to 1.0].
 * 
 * @param {Array} network - The mine network (1 = tunnel, 0 = rock)
 * @param {Array} gasLeaks - Array of {x, y, intensity}
 * @param {Array} activeFans - Array of {x, y, power}
 * @returns {Array} gasMap - Gas concentration at each cell
 */
export function simulateAirflow(network, gasLeaks, activeFans) {
  const height = network.length;
  const width = network[0].length;
  
  // Initialize gas map
  let gasMap = Array(height).fill(null).map(() => Array(width).fill(0));
  
  // Simple diffusion simulation (cellular automata style)
  const iterations = 30; // Let the gas spread
  
  for (let iter = 0; iter < iterations; iter++) {
    const nextGasMap = Array(height).fill(null).map(() => Array(width).fill(0));
    
    // 1. Inject gas from leaks
    for (const leak of gasLeaks) {
      if (network[leak.y] && network[leak.y][leak.x]) {
        gasMap[leak.y][leak.x] += leak.intensity;
      }
    }
    
    // 2. Diffuse gas to neighbors
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (network[y][x] === 0) continue; // Rock doesn't hold gas
        
        const currentGas = gasMap[y][x];
        if (currentGas <= 0.01) continue;
        
        const neighbors = [];
        if (y > 0 && network[y-1][x] === 1) neighbors.push({x, y: y-1});
        if (y < height-1 && network[y+1][x] === 1) neighbors.push({x, y: y+1});
        if (x > 0 && network[y][x-1] === 1) neighbors.push({x: x-1, y});
        if (x < width-1 && network[y][x+1] === 1) neighbors.push({x: x+1, y});
        
        // Distribute gas
        const retained = currentGas * 0.4;
        const spread = (currentGas * 0.6) / Math.max(1, neighbors.length);
        
        nextGasMap[y][x] += retained;
        for (const n of neighbors) {
          nextGasMap[n.y][n.x] += spread;
        }
      }
    }
    
    // 3. Clear gas near active ventilation fans
    for (const fan of activeFans) {
      if (!fan.active) continue;
      // Fans clear out gas in a radius
      const clearRadius = fan.power;
      for (let dy = -clearRadius; dy <= clearRadius; dy++) {
        for (let dx = -clearRadius; dx <= clearRadius; dx++) {
          const ny = fan.y + dy;
          const nx = fan.x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width && network[ny][nx] === 1) {
            // Distance attenuation
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist <= clearRadius) {
              const clearFactor = 1 - (dist / clearRadius);
              nextGasMap[ny][nx] *= (1 - (clearFactor * 0.8)); // Reduce gas
            }
          }
        }
      }
    }
    
    gasMap = nextGasMap;
  }
  
  // Clamp values to [0, 1]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      gasMap[y][x] = Math.min(1.0, gasMap[y][x]);
    }
  }
  
  return gasMap;
}

/**
 * Calculates the safest route to the surface avoiding toxic gas.
 * Uses A* pathfinding with gas concentration heavily penalizing edge weights.
 */
export function calculateSafeVentilationRoute(start, end, network, gasMap) {
  const height = network.length;
  const width = network[0].length;
  
  const lethalThreshold = 0.7; // Gas concentration above this is instant death
  
  // Check if start or end are valid
  if (network[start.y][start.x] === 0 || gasMap[start.y][start.x] >= lethalThreshold) {
    return { path: [], status: "Trapped! Lethal gas at origin." };
  }
  if (network[end.y][end.x] === 0) {
    return { path: [], status: "Invalid destination." };
  }

  const openSet = [start];
  const cameFrom = new Map();
  
  const gScore = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  gScore[start.y][start.x] = 0;
  
  const fScore = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  
  fScore[start.y][start.x] = heuristic(start, end);
  
  const getMapKey = (node) => `${node.x},${node.y}`;
  
  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const a = openSet[i];
      const b = openSet[currentIdx];
      if (fScore[a.y][a.x] < fScore[b.y][b.x]) {
        currentIdx = i;
      }
    }
    
    const current = openSet[currentIdx];
    
    if (current.x === end.x && current.y === end.y) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "Safe route found" };
    }
    
    openSet.splice(currentIdx, 1);
    
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y }
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) continue;
      if (network[neighbor.y][neighbor.x] === 0) continue; // Wall
      
      const gasLevel = gasMap[neighbor.y][neighbor.x];
      
      if (gasLevel >= lethalThreshold) continue; // Impassable
      
      // Cost penalty scales exponentially with gas concentration to heavily favor clean air
      const gasPenalty = Math.pow(gasLevel * 10, 2);
      const baseCost = 1;
      
      const tentativeGScore = gScore[current.y][current.x] + baseCost + gasPenalty;
      
      if (tentativeGScore < gScore[neighbor.y][neighbor.x]) {
        cameFrom.set(getMapKey(neighbor), current);
        gScore[neighbor.y][neighbor.x] = tentativeGScore;
        fScore[neighbor.y][neighbor.x] = tentativeGScore + heuristic(neighbor, end);
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  return { path: [], status: "No safe route available. Evacuation impossible." };
}
