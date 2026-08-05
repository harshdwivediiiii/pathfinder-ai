/**
 * Generates a 2D grid map representing the nuclear facility floorplan.
 * Calculates radiation intensity using an inverse-square law from multiple hotspots.
 *
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {Array} hotspots - Array of objects { x, y, intensity }
 * @returns {Array} 2D array [y][x] representing the ambient radiation (Sieverts/hr)
 */
export function generateDosimeterMap(width, height, hotspots) {
  const map = [];
  
  // Background radiation (very low)
  const backgroundRadiation = 0.1; // Sv/hr
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      let totalIntensity = backgroundRadiation;
      
      // Calculate contribution from each hotspot (Inverse Square Law)
      for (const spot of hotspots) {
        const dx = x - spot.x;
        const dy = y - spot.y;
        // Add a small constant to distance squared to avoid division by zero
        const distanceSq = (dx * dx) + (dy * dy) + 1; 
        
        // Intensity decreases with the square of the distance
        totalIntensity += spot.intensity / distanceSq;
      }
      
      row.push(totalIntensity);
    }
    map.push(row);
  }
  
  return map;
}

/**
 * Radiation-Aware Pathfinding Algorithm (A* Variant)
 * Minimizes cumulative radiation dose instead of geometric distance.
 *
 * @param {Object} start - {x, y}
 * @param {Object} end - {x, y}
 * @param {Array} dosimeterMap - 2D array of radiation intensities (Sv/hr)
 * @param {number} robotSpeed - Speed of the robot (cells/hr). 
 *                              Lower speed = more time spent in cell = higher dose.
 * @param {number} maxSieverts - Maximum cumulative dose before failure
 * @returns {Object} { path: Array<{x, y}>, totalDose: number, status: string }
 */
export function calculateRadiationPath(start, end, dosimeterMap, robotSpeed, maxSieverts) {
  const height = dosimeterMap.length;
  const width = dosimeterMap[0].length;
  
  // Helper to convert {x, y} to a string key
  const toKey = (x, y) => `${x},${y}`;
  
  // Open set for A* (could be optimized with a PriorityQueue, using an Array here for simplicity since grid is small)
  const openSet = []; 
  
  // cameFrom[key] = parentKey
  const cameFrom = new Map();
  
  // gScore[key] = cumulative radiation dose from start to this node
  const gScore = new Map();
  
  // fScore[key] = gScore + heuristic (estimated dose to end)
  const fScore = new Map();
  
  const startKey = toKey(start.x, start.y);
  openSet.push(start);
  gScore.set(startKey, 0);
  
  // Heuristic: Straight-line distance * Background Radiation / Speed (Optimistic estimate)
  const heuristic = (node) => {
    const dx = Math.abs(node.x - end.x);
    const dy = Math.abs(node.y - end.y);
    const dist = Math.sqrt(dx*dx + dy*dy);
    // Best case scenario: travelling through only background radiation
    return (dist / robotSpeed) * 0.1; 
  };
  
  fScore.set(startKey, heuristic(start));
  
  const getGScore = (key) => gScore.has(key) ? gScore.get(key) : Infinity;
  const getFScore = (key) => fScore.has(key) ? fScore.get(key) : Infinity;
  
  // 8-way movement
  const neighbors = [
    {dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1},
    {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: -1, dy: -1}
  ];

  let iterations = 0;
  const maxIterations = width * height * 4; // Safety bailout

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node in openSet with lowest fScore
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const iKey = toKey(openSet[i].x, openSet[i].y);
      const curKey = toKey(openSet[currentIdx].x, openSet[currentIdx].y);
      if (getFScore(iKey) < getFScore(curKey)) {
        currentIdx = i;
      }
    }
    
    const current = openSet[currentIdx];
    const currentKey = toKey(current.x, current.y);
    
    // Did we reach the destination?
    if (current.x === end.x && current.y === end.y) {
      const finalDose = getGScore(currentKey);
      
      // Check if we survived
      if (finalDose > maxSieverts) {
         return {
           path: reconstructPath(cameFrom, currentKey),
           totalDose: finalDose,
           status: "Lethal Dose Exceeded"
         };
      }
      
      return {
        path: reconstructPath(cameFrom, currentKey),
        totalDose: finalDose,
        status: "Success"
      };
    }
    
    // Remove current from openSet
    openSet.splice(currentIdx, 1);
    
    // Explore neighbors
    for (const dir of neighbors) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      
      // Bounds check
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      
      const neighborKey = toKey(nx, ny);
      
      // Cost calculation: 
      // How much radiation do we absorb while moving into this cell?
      // Dose = Intensity (Sv/hr) * Time (hr)
      // Time = Distance / Speed
      // Diagonal distance is sqrt(2) ≈ 1.414, Orthogonal is 1
      const isDiagonal = Math.abs(dir.dx) === 1 && Math.abs(dir.dy) === 1;
      const distanceToMove = isDiagonal ? 1.414 : 1.0;
      const timeSpent = distanceToMove / robotSpeed;
      
      const cellIntensity = dosimeterMap[ny][nx];
      const doseIncurred = cellIntensity * timeSpent;
      
      const tentativeGScore = getGScore(currentKey) + doseIncurred;
      
      // Optimization/Pruning: If this tentative dose already kills the robot, 
      // don't even bother exploring this path further unless we are desperate.
      // (Strict A* would still explore it if we just wanted the *lowest* dose possible, 
      // but pruning saves massive time if the map is heavily radiated).
      // We will let it explore so we can show the user the "best" failing path if necessary.
      
      if (tentativeGScore < getGScore(neighborKey)) {
        // This path is better than any previous path to this neighbor
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic({x: nx, y: ny}));
        
        // Add to openSet if not already there
        if (!openSet.some(n => n.x === nx && n.y === ny)) {
          openSet.push({x: nx, y: ny});
        }
      }
    }
  }

  return { path: [], totalDose: 0, status: "No Path Found" };
}

// Helper to reconstruct path from map
function reconstructPath(cameFrom, currentKey) {
  const path = [];
  let curr = currentKey;
  while (cameFrom.has(curr)) {
    const parts = curr.split(',');
    path.unshift({ x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) });
    curr = cameFrom.get(curr);
  }
  // Add start node (not in cameFrom map as a value)
  // We don't strictly need the start node, but it's nice for drawing
  return path;
}
