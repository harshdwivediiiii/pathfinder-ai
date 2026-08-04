/**
 * Simple pseudo-random number generator for predictable indoor maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban map with lighting and incident density data.
 */
export function generateSafetyMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const isLit = seededRandom(seed + x + y * width) > 0.4; // 60% well-lit
      const incidentDensity = seededRandom(seed * 3 + x + y * width); // 0.0 to 1.0
      
      row.push({ 
        isLit,
        incidentDensity: incidentDensity > 0.8 ? 'high' : incidentDensity > 0.5 ? 'medium' : 'low' 
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a route optimizing for safety constraints.
 */
export function calculateSafetyRoute(start, end, mapData, safetyWeight, isNightTime) {
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
      return { path, status: "Secure Route Identified" };
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

      const nextNode = mapData[neighbor.y][neighbor.x];
      
      let baseCost = 1;
      let penalty = 0;
      
      if (nextNode.incidentDensity === 'high') {
          penalty += safetyWeight * 3;
      } else if (nextNode.incidentDensity === 'medium') {
          penalty += safetyWeight * 1;
      }
      
      if (isNightTime && !nextNode.isLit) {
          penalty += safetyWeight * 4;
      }
      
      let nextCost = current.cost + baseCost + penalty;
      
      if (nextCost < bestCost[neighbor.y][neighbor.x]) {
        bestCost[neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "Route Failed: Unsafe Conditions" };
}
