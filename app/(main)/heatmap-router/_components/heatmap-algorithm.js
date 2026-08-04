/**
 * Simple pseudo-random number generator for predictable maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with historical accident heat values.
 */
export function generateHeatMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Create some spatial clustering for accidents
      const nx = x / width;
      const ny = y / height;
      
      const noise1 = seededRandom(seed + x + y * width) * 0.2;
      const noise2 = seededRandom(seed * 2 + x + y * width);
      
      // Clusters
      let heat = Math.max(0, (Math.sin(nx * 10) * Math.cos(ny * 10)) + noise1);
      
      // Some random spikes for terrible intersections
      if (noise2 > 0.95) {
          heat = 1.0;
      }

      row.push({ 
        heat: Math.min(1.0, heat)
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a route optimizing for safety based on historical accident heat.
 */
export function calculateSafeRoute(start, end, mapData, riskAversion) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  const openSet = [{ x: start.x, y: start.y, cost: 0 }];
  const bestCost = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  bestCost[start.y][start.x] = 0;

  const cameFrom = new Map();
  const getMapKey = (node) => `${node.x},${node.y}`;

  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].cost + heuristic(openSet[i], end) < openSet[currentIdx].cost + heuristic(openSet[currentIdx], end)) {
            currentIdx = i;
        }
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    if (current.x === end.x && current.y === end.y) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "Safest Route Calculated" };
    }
    
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y }
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) {
        continue;
      }

      const nextNodeData = mapData[neighbor.y][neighbor.x];
      
      let baseCost = 1; 
      
      // Apply penalty based on heat and risk aversion
      // Aversion of 0 means we only care about distance.
      // Aversion of 10 means heat matters 10x more than distance.
      let heatPenalty = nextNodeData.heat * riskAversion;
      
      let nextCost = current.cost + baseCost + heatPenalty;
      
      if (nextCost < bestCost[neighbor.y][neighbor.x]) {
        bestCost[neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "No Route Found" };
}
