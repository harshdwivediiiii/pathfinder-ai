/**
 * Simple pseudo-random number generator for predictable maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with accessibility metadata (incline, stairs, curbs).
 */
export function generateAccessibilityMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Create some spatial clustering for terrain
      const nx = x / width;
      const ny = y / height;
      
      const noise1 = seededRandom(seed + x + y * width);
      const noise2 = seededRandom(seed * 2 + x + y * width);
      const noise3 = seededRandom(seed * 3 + x + y * width);
      
      // Incline (0 to 15 degrees)
      let incline = Math.floor((Math.sin(nx * 10) * Math.cos(ny * 10) + 1) * 7.5);
      
      // 5% chance of stairs
      const hasStairs = noise1 > 0.95;
      
      // 10% chance of missing curb cut (if it's an intersection)
      const isIntersection = (x % 4 === 0) && (y % 4 === 0);
      const missingCurbCut = isIntersection && noise2 > 0.9;
      
      row.push({ 
        incline,
        hasStairs,
        missingCurbCut
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates an ADA-compliant route.
 */
export function calculateAccessibleRoute(start, end, mapData, maxIncline) {
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
      return { path, status: "Accessible Route Verified" };
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
      
      // Strict Accessibility Checks
      if (nextNodeData.hasStairs) continue;
      if (nextNodeData.missingCurbCut) continue;
      if (nextNodeData.incline > maxIncline) continue;
      
      let baseCost = 1 + (nextNodeData.incline * 0.5); // Steep inclines (even if valid) take more effort
      
      let nextCost = current.cost + baseCost;
      
      if (nextCost < bestCost[neighbor.y][neighbor.x]) {
        bestCost[neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "No Accessible Route Found" };
}
