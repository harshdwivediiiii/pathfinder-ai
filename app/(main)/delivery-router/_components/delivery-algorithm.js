/**
 * Simple pseudo-random number generator
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with legal parking zones and building entrances.
 */
export function generateDeliveryMap(width, height, seed = 42) {
  const mapData = [];
  const parkingSpots = [];
  const buildingEntrances = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      
      const isRoad = (x % 10 === 0) || (y % 10 === 0);
      const isBuildingEdge = !isRoad && ((x % 10 === 1) || (x % 10 === 9) || (y % 10 === 1) || (y % 10 === 9));
      
      let isParking = false;
      let isEntrance = false;
      
      // Assign parking spots on roads
      if (isRoad) {
          if (seededRandom(seed + x + y * width) > 0.95) {
              isParking = true;
              parkingSpots.push({ x, y });
          }
      }
      
      // Assign building entrances on building edges
      if (isBuildingEdge) {
          if (seededRandom(seed * 2 + x + y * width) > 0.96) {
              isEntrance = true;
              buildingEntrances.push({ x, y });
          }
      }
      
      row.push({ 
        isRoad,
        isParking,
        isEntrance,
        isWalkable: isRoad || isBuildingEdge || seededRandom(seed*3+x) > 0.2 // Some grassy areas between buildings are walkable
      });
    }
    mapData.push(row);
  }

  return { mapData, parkingSpots, buildingEntrances };
}

/**
 * Calculates shortest walking path from A to B.
 */
function getWalkingDistance(start, end, mapData) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  const openSet = [{ x: start.x, y: start.y, cost: 0 }];
  const bestCost = Array(height).fill(null).map(() => Array(width).fill(Infinity));
  bestCost[start.y][start.x] = 0;

  const cameFrom = new Map();
  const getMapKey = (node) => `${node.x},${node.y}`;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.cost - b.cost);
    const current = openSet.shift();
    
    if (current.x === end.x && current.y === end.y) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return path;
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
      
      if (!mapData[neighbor.y][neighbor.x].isWalkable) continue;

      let nextCost = current.cost + 1;
      
      if (nextCost < bestCost[neighbor.y][neighbor.x]) {
        bestCost[neighbor.y][neighbor.x] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
      }
    }
  }
  
  return null;
}

/**
 * Finds the optimal parking spot that minimizes total walking distance to all dropoffs.
 */
export function optimizeLastMileDelivery(mapData, parkingSpots, dropoffs) {
    let bestSpot = null;
    let bestTotalDistance = Infinity;
    let bestPaths = [];
    
    for (const spot of parkingSpots) {
        let totalDistance = 0;
        let pathsForSpot = [];
        let canReachAll = true;
        
        for (const dropoff of dropoffs) {
            const path = getWalkingDistance(spot, dropoff, mapData);
            if (!path) {
                canReachAll = false;
                break;
            }
            totalDistance += path.length;
            pathsForSpot.push(path);
        }
        
        if (canReachAll && totalDistance < bestTotalDistance) {
            bestTotalDistance = totalDistance;
            bestSpot = spot;
            bestPaths = pathsForSpot;
        }
    }
    
    return {
        optimalParking: bestSpot,
        totalWalkingDistance: bestTotalDistance !== Infinity ? bestTotalDistance : 0,
        paths: bestPaths
    };
}
