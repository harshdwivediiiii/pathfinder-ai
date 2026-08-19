/**
 * Simple pseudo-random number generator for predictable maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with road anomalies (potholes, debris).
 */
export function generateAnomalyMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const anomalyChance = seededRandom(seed + x + y * width);
      
      let anomalyType = 'none';
      let severity = 0; // 0 to 10
      
      if (anomalyChance > 0.95) {
          anomalyType = 'crater'; // Huge pothole/debris
          severity = 10;
      } else if (anomalyChance > 0.85) {
          anomalyType = 'pothole'; // Standard pothole
          severity = 5;
      } else if (anomalyChance > 0.75) {
          anomalyType = 'rough'; // Rough road surface
          severity = 2;
      }

      row.push({ 
        anomalyType,
        severity
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a route optimizing for vehicle preservation by avoiding road anomalies.
 * @param {Object} start {x, y}
 * @param {Object} end {x, y}
 * @param {Array} mapData 2D array of nodes
 * @param {Number} sensitivity Multiplier for anomaly severity (0 to 10)
 */
export function calculatePotholeRoute(start, end, mapData, sensitivity) {
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
      return { path, status: "Vehicle-Preserving Route Calculated" };
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
      
      // Calculate damage risk penalty
      let damagePenalty = nextNodeData.severity * sensitivity;
      
      let nextCost = current.cost + baseCost + damagePenalty;
      
      if (nextCost < bestCost[neighbor.y][neighbor.x]) {
        bestCost[neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "No Route Found" };
}
