/**
 * Simple pseudo-random number generator for predictable indoor maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an indoor map with multiple floors, walls, and stairs.
 */
export function generateIndoorMap(width, height, floors, seed = 42) {
  const mapData = [];
  for (let f = 0; f < floors; f++) {
    const floorMap = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const isWall = seededRandom(seed * 3 + x + y * width + f * 100) > 0.7;
        const isStairs = !isWall && seededRandom(seed * 7 + x + y * width + f * 100) > 0.95;
        row.push({ 
            wall: isWall, 
            stairs: isStairs 
        });
      }
      floorMap.push(row);
    }
    mapData.push(floorMap);
  }
  return mapData;
}

/**
 * Calculates a route through an indoor environment across multiple floors.
 */
export function calculateARRoute(start, end, mapData) {
  const floors = mapData.length;
  const height = mapData[0].length;
  const width = mapData[0][0].length;
  
  const openSet = [{ x: start.x, y: start.y, f: start.f, cost: 0 }];
  const bestCost = Array(floors).fill(null).map(() => Array(height).fill(null).map(() => Array(width).fill(Infinity)));
  bestCost[start.f][start.y][start.x] = 0;

  const cameFrom = new Map();
  const getMapKey = (node) => `${node.x},${node.y},${node.f}`;

  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.f - b.f) * 10;

  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].cost + heuristic(openSet[i], end) < openSet[currentIdx].cost + heuristic(openSet[currentIdx], end)) {
            currentIdx = i;
        }
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    if (current.x === end.x && current.y === end.y && current.f === end.f) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "AR Waypoints Generated" };
    }
    
    const neighbors = [
      { x: current.x, y: current.y - 1, f: current.f },
      { x: current.x, y: current.y + 1, f: current.f },
      { x: current.x - 1, y: current.y, f: current.f },
      { x: current.x + 1, y: current.y, f: current.f }
    ];

    const currNode = mapData[current.f][current.y][current.x];
    if (currNode.stairs) {
        if (current.f < floors - 1) neighbors.push({ x: current.x, y: current.y, f: current.f + 1 });
        if (current.f > 0) neighbors.push({ x: current.x, y: current.y, f: current.f - 1 });
    }
    
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) {
        continue;
      }

      const nextNode = mapData[neighbor.f][neighbor.y][neighbor.x];
      
      // Allow passing through the end point even if it randomly became a wall
      if (nextNode.wall && !(neighbor.x === end.x && neighbor.y === end.y && neighbor.f === end.f)) {
          continue; 
      }
      
      let nextCost = current.cost + (neighbor.f !== current.f ? 10 : 1);
      
      if (nextCost < bestCost[neighbor.f][neighbor.y][neighbor.x]) {
        bestCost[neighbor.f][neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, f: neighbor.f, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "Destination Unreachable" };
}
