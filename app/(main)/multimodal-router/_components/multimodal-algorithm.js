/**
 * Simple pseudo-random number generator
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban grid with varying transportation mode networks.
 */
export function generateMultimodalMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      
      const isTransitStation = (x % 15 === 0) && (y % 15 === 0);
      const isTransitLine = (x === 15 || y === 15);
      const isBikeLane = (x % 5 === 0) || (y % 5 === 0);
      
      row.push({ 
        isTransitStation,
        isTransitLine,
        isBikeLane,
        // Everyone can walk everywhere in this simple grid
        isWalkable: true 
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Calculates a route optimizing for total time using mixed transit modes.
 * Mode speeds (cells per arbitrary time unit):
 * Walk: 1
 * Bike: 3
 * Transit: 10
 */
export function calculateMultimodalRoute(start, end, mapData, allowBikes, allowTransit) {
  const height = mapData.length;
  const width = mapData[0].length;
  
  // State space includes x, y, and CURRENT MODE
  // Modes: 0=Walk, 1=Bike, 2=Transit
  const MODES = { WALK: 0, BIKE: 1, TRANSIT: 2 };
  
  const openSet = [{ x: start.x, y: start.y, mode: MODES.WALK, cost: 0 }];
  const bestCost = new Map();
  const getMapKey = (n) => `${n.x},${n.y},${n.mode}`;
  
  bestCost.set(getMapKey({ x: start.x, y: start.y, mode: MODES.WALK }), 0);

  const cameFrom = new Map();
  const getSimpleKey = (n) => `${n.x},${n.y}`;

  const heuristic = (a, b) => {
      // Optimistic heuristic: straight line using transit speed
      return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * 0.1;
  };

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.cost + heuristic(a, end)) - (b.cost + heuristic(b, end)));
    const current = openSet.shift();
    
    if (current.x === end.x && current.y === end.y) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "Multimodal Route Optimized" };
    }
    
    const nodeData = mapData[current.y][current.x];
    
    // Generate valid next states (spatial movement + mode switching)
    const nextStates = [];
    
    // Spatial movement in current mode
    const spatialNeighbors = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];
    
    for (const n of spatialNeighbors) {
        const nx = current.x + n.dx;
        const ny = current.y + n.dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nextNodeData = mapData[ny][nx];
            
            // Check if movement is valid in current mode
            let isValid = false;
            let moveCost = 0;
            
            if (current.mode === MODES.WALK) {
                isValid = nextNodeData.isWalkable;
                moveCost = 1.0;
            } else if (current.mode === MODES.BIKE) {
                isValid = nextNodeData.isBikeLane;
                moveCost = 0.33; // 3x faster than walking
            } else if (current.mode === MODES.TRANSIT) {
                isValid = nextNodeData.isTransitLine;
                moveCost = 0.1; // 10x faster than walking
            }
            
            if (isValid) {
                nextStates.push({ x: nx, y: ny, mode: current.mode, costAdd: moveCost });
            }
        }
    }
    
    // Mode Switching at current location (costs time to switch)
    if (allowBikes && current.mode === MODES.WALK && nodeData.isBikeLane) {
        nextStates.push({ x: current.x, y: current.y, mode: MODES.BIKE, costAdd: 1.0 }); // 1 unit time to unlock bike
    }
    if (current.mode === MODES.BIKE) {
        nextStates.push({ x: current.x, y: current.y, mode: MODES.WALK, costAdd: 0.5 }); // Park bike
    }
    if (allowTransit && current.mode === MODES.WALK && nodeData.isTransitStation) {
        nextStates.push({ x: current.x, y: current.y, mode: MODES.TRANSIT, costAdd: 2.0 }); // Wait for train
    }
    if (current.mode === MODES.TRANSIT && nodeData.isTransitStation) {
        nextStates.push({ x: current.x, y: current.y, mode: MODES.WALK, costAdd: 0.5 }); // Exit station
    }
    
    // Process next states
    for (const ns of nextStates) {
      let nextCost = current.cost + ns.costAdd;
      const nsKey = getMapKey(ns);
      
      if (!bestCost.has(nsKey) || nextCost < bestCost.get(nsKey)) {
        bestCost.set(nsKey, nextCost);
        cameFrom.set(nsKey, current);
        openSet.push({ x: ns.x, y: ns.y, mode: ns.mode, cost: nextCost });
      }
    }
  }
  
  return { path: [], status: "No Route Found" };
}
