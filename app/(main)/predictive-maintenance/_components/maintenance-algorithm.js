/**
 * Simple pseudo-random number generator
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates a road network with stress values (highways vs local roads) and service depots.
 */
export function generateMaintenanceMap(width, height, seed = 42) {
  const mapData = [];
  const serviceCenters = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      
      const isHighway = (x === Math.floor(width * 0.4) || y === Math.floor(height * 0.6));
      let isServiceCenter = false;
      
      // Place a few service centers
      if (!isHighway && x % 10 === 0 && y % 10 === 0 && x !== 0 && y !== 0) {
          isServiceCenter = true;
          serviceCenters.push({ x, y });
      }
      
      row.push({ 
        isHighway,
        isServiceCenter,
        // Highways are fast (cost 1) but high stress (stress 10).
        // Local roads are slow (cost 3) but low stress (stress 1).
        baseTimeCost: isHighway ? 1 : 3,
        stressFactor: isHighway ? 10 : 1, 
      });
    }
    mapData.push(row);
  }

  return { mapData, serviceCenters };
}

/**
 * Calculates a route to a destination.
 * If faultDetected is true, it finds the nearest service center minimizing stress, not just time.
 */
export function calculatePredictiveMaintenanceRoute(start, destination, faultDetected, mapData, serviceCenters) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  // If fault is detected, destination changes to the optimal service center
  let targets = faultDetected ? serviceCenters : [destination];
  
  let bestGlobalPath = null;
  let bestGlobalCost = Infinity;

  // Evaluate A* for all potential targets
  for (const target of targets) {
      const openSet = [{ x: start.x, y: start.y, cost: 0 }];
      const bestCost = Array(height).fill(null).map(() => Array(width).fill(Infinity));
      bestCost[start.y][start.x] = 0;
    
      const cameFrom = new Map();
      const getMapKey = (node) => `${node.x},${node.y}`;
      
      let foundPath = false;
      let pathCost = Infinity;
    
      while (openSet.length > 0) {
        openSet.sort((a, b) => a.cost - b.cost);
        const current = openSet.shift();
        
        if (current.x === target.x && current.y === target.y) {
          foundPath = true;
          pathCost = current.cost;
          const path = [current];
          let currStr = getMapKey(current);
          while (cameFrom.has(currStr)) {
            const prev = cameFrom.get(currStr);
            path.unshift(prev);
            currStr = getMapKey(prev);
          }
          
          if (pathCost < bestGlobalCost) {
              bestGlobalCost = pathCost;
              bestGlobalPath = path;
          }
          break; // move to next target
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
          
          const nodeData = mapData[neighbor.y][neighbor.x];
          
          // Cost function:
          // Normal mode: purely optimize for time.
          // Fault mode: heavily penalize mechanical stress to prevent breakdown.
          let moveCost = nodeData.baseTimeCost;
          if (faultDetected) {
              moveCost = nodeData.baseTimeCost + (nodeData.stressFactor * 5); // Massive penalty for high stress
          }
    
          let nextCost = current.cost + moveCost;
          
          if (nextCost < bestCost[neighbor.y][neighbor.x]) {
            bestCost[neighbor.y][neighbor.x] = nextCost;
            cameFrom.set(getMapKey(neighbor), current);
            openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
          }
        }
      }
  }
  
  return bestGlobalPath;
}
