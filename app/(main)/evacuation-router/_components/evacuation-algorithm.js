/**
 * Simple pseudo-random number generator
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with varying road capacities (highways vs secondary roads).
 */
export function generateEvacuationMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      
      // Create a few vertical and horizontal "highways"
      const isVerticalHighway = (x === Math.floor(width * 0.3) || x === Math.floor(width * 0.7));
      const isHorizontalHighway = (y === Math.floor(height * 0.3) || y === Math.floor(height * 0.7));
      
      const isHighway = isVerticalHighway || isHorizontalHighway;
      
      row.push({ 
        isHighway,
        baseCost: isHighway ? 1 : 3, // Highways are faster
        capacity: isHighway ? 20 : 5, // Highways can hold more cars before clogging
        currentLoad: 0
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Routes a batch of vehicles out of a danger zone to the edges of the map.
 * @param {Array} mapData The grid
 * @param {Array} vehicles List of starting {x, y} coordinates for vehicles
 * @param {Boolean} enableLoadBalancing If true, routes dynamically update congestion cost
 */
export function calculateEvacuationRoutes(mapData, vehicles, enableLoadBalancing) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  // Clone map to track load without mutating the original reference
  const simMap = mapData.map(row => row.map(cell => ({ ...cell })));
  
  const routes = [];
  
  for (const v of vehicles) {
      
      const openSet = [{ x: v.x, y: v.y, cost: 0 }];
      const bestCost = Array(height).fill(null).map(() => Array(width).fill(Infinity));
      bestCost[v.y][v.x] = 0;
    
      const cameFrom = new Map();
      const getMapKey = (node) => `${node.x},${node.y}`;
      
      let foundPath = false;
      let finalNode = null;
    
      while (openSet.length > 0) {
        // Sort to get lowest cost
        openSet.sort((a, b) => a.cost - b.cost);
        const current = openSet.shift();
        
        // Escape condition: Reached any edge of the map
        if (current.x === 0 || current.x === width - 1 || current.y === 0 || current.y === height - 1) {
            finalNode = current;
            foundPath = true;
            break;
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
    
          const nextNodeData = simMap[neighbor.y][neighbor.x];
          
          let dynamicCost = nextNodeData.baseCost;
          if (enableLoadBalancing) {
              // As load approaches capacity, cost skyrockets exponentially
              const loadFactor = nextNodeData.currentLoad / nextNodeData.capacity;
              dynamicCost += Math.pow(loadFactor, 2) * 10;
          }
          
          let nextCost = current.cost + dynamicCost;
          
          if (nextCost < bestCost[neighbor.y][neighbor.x]) {
            bestCost[neighbor.y][neighbor.x] = nextCost;
            cameFrom.set(getMapKey(neighbor), current);
            openSet.push({ x: neighbor.x, y: neighbor.y, cost: nextCost });
          }
        }
      }
      
      if (foundPath) {
          const path = [finalNode];
          let currStr = getMapKey(finalNode);
          while (cameFrom.has(currStr)) {
            const prev = cameFrom.get(currStr);
            path.unshift(prev);
            currStr = getMapKey(prev);
          }
          
          // Apply load to the map for subsequent vehicles
          if (enableLoadBalancing) {
              for (const p of path) {
                  simMap[p.y][p.x].currentLoad += 1;
              }
          }
          routes.push(path);
      }
  }
  
  return { routes, simMap };
}
