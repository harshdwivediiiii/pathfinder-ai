/**
 * Simple pseudo-random number generator
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban 3D airspace map.
 */
export function generateAirspaceMap(width, height, maxAltitude, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      
      const isResidential = seededRandom(seed + x + y * width) > 0.7;
      
      // Generate some skyscrapers (impassable at certain altitudes)
      let buildingHeight = 0;
      if (seededRandom(seed * 2 + x * y) > 0.9) {
          buildingHeight = Math.floor(seededRandom(seed * 3 + x) * (maxAltitude - 2)) + 1;
      }
      
      row.push({ 
        isResidential,
        buildingHeight
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a 4D trajectory (3D space + time/cost) for an eVTOL.
 * Avoids buildings and penalizes low-altitude flight over residential zones for noise mitigation.
 */
export function calculate3DAirspaceRoute(start, end, mapData, maxAltitude, enforceNoiseLimits) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  const openSet = [{ x: start.x, y: start.y, z: start.z, cost: 0 }];
  
  // 3D best cost array
  const bestCost = Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => 
          Array(maxAltitude).fill(Infinity)
      )
  );
  
  bestCost[start.y][start.x][start.z] = 0;

  const cameFrom = new Map();
  const getMapKey = (node) => `${node.x},${node.y},${node.z}`;
  
  const heuristic = (a, b) => {
      return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
  };

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.cost + heuristic(a, end)) - (b.cost + heuristic(b, end)));
    const current = openSet.shift();
    
    if (current.x === end.x && current.y === end.y && current.z === end.z) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return path;
    }
    
    // 3D Neighbors (x, y, z movement)
    const neighbors = [
      { x: current.x, y: current.y - 1, z: current.z },
      { x: current.x, y: current.y + 1, z: current.z },
      { x: current.x - 1, y: current.y, z: current.z },
      { x: current.x + 1, y: current.y, z: current.z },
      { x: current.x, y: current.y, z: current.z - 1 },
      { x: current.x, y: current.y, z: current.z + 1 }
    ];
    
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= width || 
          neighbor.y < 0 || neighbor.y >= height ||
          neighbor.z < 0 || neighbor.z >= maxAltitude) {
        continue;
      }
      
      const nodeData = mapData[neighbor.y][neighbor.x];
      
      // Physical Collision Check
      if (neighbor.z <= nodeData.buildingHeight) {
          continue; // Crashed into a building
      }
      
      let moveCost = 1;
      
      // Noise Deconfliction Check
      if (enforceNoiseLimits && nodeData.isResidential) {
          // If flying low over residential, huge penalty.
          // Requires aircraft to climb to higher altitudes before crossing.
          if (neighbor.z < maxAltitude * 0.5) {
              moveCost += 20; 
          }
      }
      
      // Altitude changing penalty (climbing costs energy)
      if (neighbor.z > current.z) moveCost += 1.5;

      let nextCost = current.cost + moveCost;
      
      if (nextCost < bestCost[neighbor.y][neighbor.x][neighbor.z]) {
        bestCost[neighbor.y][neighbor.x][neighbor.z] = nextCost;
        cameFrom.set(getMapKey(neighbor), current);
        openSet.push({ x: neighbor.x, y: neighbor.y, z: neighbor.z, cost: nextCost });
      }
    }
  }
  
  return null;
}
