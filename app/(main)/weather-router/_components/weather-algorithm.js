/**
 * Simple pseudo-random number generator for predictable noise
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an elevation and road material map.
 */
export function generateWeatherMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;
      const noise = seededRandom(seed + x + y * width) * 0.2;
      let elev = (Math.sin(nx * 5) + Math.cos(ny * 5)) * 0.5 + 0.5 + noise;
      elev = Math.max(0, Math.min(1, elev)) * 1000; 

      // Dirt vs Paved roads
      const isDirt = seededRandom(seed * 3 + x + y * width) > 0.6;
      row.push({ elevation: elev, material: isDirt ? 'dirt' : 'paved' });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a safe route factoring in weather severity, slope, and road material.
 */
export function calculateWeatherRoute(start, end, mapData, weatherSeverity) {
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
      return { path, status: "Safe Weather Route Calculated" };
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

      const currNode = mapData[current.y][current.x];
      const nextNode = mapData[neighbor.y][neighbor.x];
      const slope = Math.abs(nextNode.elevation - currNode.elevation);
      
      let baseCost = 1;
      let penalty = 0;
      
      if (nextNode.material === 'dirt') {
          penalty += weatherSeverity * 2; 
          if (slope > 50) {
              penalty += weatherSeverity * 5; 
          }
      }
      
      if (slope > 100) {
          penalty += weatherSeverity * 1.5;
      }
      
      // High penalty for extremely unsafe conditions
      if (nextNode.material === 'dirt' && slope > 80 && weatherSeverity > 7) {
          penalty += 99999;
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
