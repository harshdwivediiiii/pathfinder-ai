/**
 * Simple pseudo-random number generator for predictable terrain maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates a 3D airspace map with elevation, thermals, and turbulence.
 */
export function generateAirspaceMap(width, height, maxAltitude, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;
      
      // Terrain elevation (0 to maxAltitude / 2)
      const noise = seededRandom(seed + x + y * width) * 0.2;
      let elev = (Math.sin(nx * 8) + Math.cos(ny * 8)) * 0.5 + 0.5 + noise;
      const terrainHeight = Math.floor(elev * (maxAltitude / 2)); 
      
      // Updrafts and turbulence
      const hasThermal = seededRandom(seed * 2 + x + y * width) > 0.9;
      const hasTurbulence = seededRandom(seed * 3 + x + y * width) > 0.85;

      row.push({ 
        terrainHeight,
        hasThermal,
        hasTurbulence
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates an altitude-variable 3D flight path optimizing for battery and safety.
 */
export function calculateDroneRoute(start, end, mapData, maxAltitude, batteryWeight) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  // Node state: x, y, z (altitude)
  const openSet = [{ x: start.x, y: start.y, z: start.z, cost: 0 }];
  
  // 3D cost array
  const bestCost = Array(maxAltitude + 1).fill(null).map(() => 
      Array(height).fill(null).map(() => Array(width).fill(Infinity))
  );
  bestCost[start.z][start.y][start.x] = 0;

  const cameFrom = new Map();
  const getMapKey = (node) => `${node.x},${node.y},${node.z}`;

  // 3D Manhattan heuristic
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].cost + heuristic(openSet[i], end) < openSet[currentIdx].cost + heuristic(openSet[currentIdx], end)) {
            currentIdx = i;
        }
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    if (current.x === end.x && current.y === end.y && current.z === end.z) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "Optimal Flight Path Established" };
    }
    
    // Possible moves: N, S, E, W, Up, Down
    const neighbors = [
      { x: current.x, y: current.y - 1, z: current.z },
      { x: current.x, y: current.y + 1, z: current.z },
      { x: current.x - 1, y: current.y, z: current.z },
      { x: current.x + 1, y: current.y, z: current.z },
      { x: current.x, y: current.y, z: current.z + 1 },
      { x: current.x, y: current.y, z: current.z - 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (
          neighbor.x < 0 || neighbor.x >= width || 
          neighbor.y < 0 || neighbor.y >= height ||
          neighbor.z < 0 || neighbor.z > maxAltitude
      ) {
        continue;
      }

      const nextNodeData = mapData[neighbor.y][neighbor.x];
      
      // Crash avoidance: Cannot fly below terrain height
      if (neighbor.z <= nextNodeData.terrainHeight) {
          continue; 
      }
      
      let baseCost = 1; // Movement cost
      
      // Ascending costs more battery, descending costs less (or regens slightly)
      if (neighbor.z > current.z) baseCost += batteryWeight; 
      if (neighbor.z < current.z) baseCost -= (batteryWeight * 0.5);
      
      // Thermal updrafts heavily reduce cost of maintaining or gaining altitude
      if (nextNodeData.hasThermal) {
          baseCost -= (batteryWeight * 2);
      }
      
      // Turbulence drastically increases cost/risk
      if (nextNodeData.hasTurbulence) {
          baseCost += 50; 
      }
      
      // Ensure cost never goes strictly negative to prevent infinite loops in A* (unless using Bellman-Ford, but here we clamp)
      if (baseCost < 0.1) baseCost = 0.1;
      
      let nextCost = current.cost + baseCost;
      
      if (nextCost < bestCost[neighbor.z][neighbor.y][neighbor.x]) {
        bestCost[neighbor.z][neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, z: neighbor.z, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "No Safe Flight Path Found" };
}
