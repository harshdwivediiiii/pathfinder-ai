/**
 * Simple pseudo-random number generator for predictable traffic maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with synchronized traffic lights.
 */
export function generateTrafficMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Intersections every 5 units
      const isIntersection = (x % 5 === 0) && (y % 5 === 0);
      const cycleLength = 20 + Math.floor(seededRandom(seed + x + y * width) * 20); // 20s to 40s
      const offset = Math.floor(seededRandom(seed * 2 + x + y * width) * cycleLength);
      
      row.push({ 
        isIntersection,
        cycleLength: isIntersection ? cycleLength : 0,
        offset: isIntersection ? offset : 0
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a route optimizing for "Green Wave" synchronization.
 * speedFactor: the time it takes to travel one grid cell.
 */
export function calculateTrafficRoute(start, end, mapData, speedFactor) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  const openSet = [{ x: start.x, y: start.y, t: 0 }];
  const bestTime = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  bestTime[start.y][start.x] = 0;

  const cameFrom = new Map();
  const getMapKey = (node) => `${node.x},${node.y}`;

  const heuristic = (a, b) => (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * speedFactor;

  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].t + heuristic(openSet[i], end) < openSet[currentIdx].t + heuristic(openSet[currentIdx], end)) {
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
      return { path, status: "Green Wave Synchronized Route Found", totalTime: current.t };
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
      
      let nextTime = current.t + speedFactor; 
      
      if (nextNodeData.isIntersection) {
          const currentCycleTime = (nextTime + nextNodeData.offset) % nextNodeData.cycleLength;
          const isGreen = currentCycleTime < (nextNodeData.cycleLength / 2);
          
          if (!isGreen) {
              // Red light, add wait time until it turns green
              nextTime += (nextNodeData.cycleLength - currentCycleTime);
          }
      }
      
      if (nextTime < bestTime[neighbor.y][neighbor.x]) {
        bestTime[neighbor.y][neighbor.x] = nextTime;
        cameFrom.set(getMapKey(neighbor), { x: current.x, y: current.y, t: current.t });
        openSet.push({ x: neighbor.x, y: neighbor.y, t: nextTime });
      }
    }
  }
  
  return { path: [], status: "No Route Found", totalTime: 0 };
}
