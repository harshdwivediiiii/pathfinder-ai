/**
 * Simple pseudo-random number generator for predictable noise
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates a topological elevation map simulating a city grid.
 * Uses a simplistic cellular noise generator to create organic high and low ground.
 *
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {number} seed - Random seed for map generation
 * @returns {Array} 2D array [y][x] representing elevation in meters (0 to 100)
 */
export function generateElevationMap(width, height, seed = 42) {
  const map = [];
  
  // Base elevation gradient (e.g., sloping towards a river or coast)
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Create some organic rolling hills using combined sine waves
      const nx = x / width;
      const ny = y / height;
      
      const wave1 = Math.sin(nx * Math.PI * 4 + seed) * Math.cos(ny * Math.PI * 3 + seed);
      const wave2 = Math.sin(nx * Math.PI * 2 - seed) * Math.sin(ny * Math.PI * 5 + seed);
      const noise = seededRandom(seed + x + y * width) * 0.2;
      
      // Combine and normalize to 0-1
      let elevationNormalized = (wave1 + wave2) / 4 + 0.5 + noise;
      
      // Add a general slope (e.g., lower on the right side)
      elevationNormalized -= (x / width) * 0.4;
      
      // Clamp between 0 and 1
      elevationNormalized = Math.max(0, Math.min(1, elevationNormalized));
      
      // Map to 0-100 meters
      row.push(elevationNormalized * 100);
    }
    map.push(row);
  }
  
  return map;
}

/**
 * Calculates a safe evacuation route avoiding flooded areas using A* pathfinding.
 *
 * @param {Object} start - {x, y}
 * @param {Object} end - {x, y}
 * @param {Array} elevationMap - 2D array of elevations
 * @param {number} waterLevel - Current flood water level in meters
 * @returns {Object} { path: Array<{x, y}>, status: string }
 */
export function calculateSafeRoute(start, end, elevationMap, waterLevel) {
  const height = elevationMap.length;
  const width = elevationMap[0].length;
  
  // Check if start or end are already underwater
  if (elevationMap[start.y][start.x] <= waterLevel) {
    return { path: [], status: "Start point is flooded!" };
  }
  if (elevationMap[end.y][end.x] <= waterLevel) {
    return { path: [], status: "Destination is flooded!" };
  }

  // A* implementation
  const openSet = [start];
  const cameFrom = new Map();
  
  const gScore = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  gScore[start.y][start.x] = 0;
  
  const fScore = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
  
  fScore[start.y][start.x] = heuristic(start, end);
  
  const getMapKey = (node) => `${node.x},${node.y}`;
  
  while (openSet.length > 0) {
    // Find node in openSet with lowest fScore
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
      // Reconstruct path
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "Safe route found" };
    }
    
    // Remove current from openSet
    openSet.splice(currentIdx, 1);
    
    // Check neighbors (up, down, left, right)
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y }
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) {
        continue; // Out of bounds
      }
      
      const nodeElevation = elevationMap[neighbor.y][neighbor.x];
      
      // Core Logic: Invalidate flooded edges
      if (nodeElevation <= waterLevel) {
        continue; // Impassable!
      }
      
      // Calculate traversal cost
      // Base cost is 1. Add penalty for being close to water level to encourage higher ground routes
      const safetyBuffer = nodeElevation - waterLevel;
      let costPenalty = 0;
      if (safetyBuffer < 5) {
        costPenalty = 10 - safetyBuffer; // High penalty if water is within 5 meters
      }
      
      const tentativeGScore = gScore[current.y][current.x] + 1 + costPenalty;
      
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
  
  return { path: [], status: "No safe route available. High ground isolated." };
}
