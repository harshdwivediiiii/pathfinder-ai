/**
 * Generates a 3D grid representing a space station module in zero gravity.
 * 0 = empty space, 1 = solid obstacle (rack, handrail, astronaut)
 *
 * @param {number} sizeX 
 * @param {number} sizeY 
 * @param {number} sizeZ 
 * @param {number} obstacleDensity - 0.0 to 1.0
 */
export function generateStationModule(sizeX, sizeY, sizeZ, obstacleDensity = 0.15) {
  const grid = Array(sizeZ).fill(null).map(() => 
    Array(sizeY).fill(null).map(() => 
      Array(sizeX).fill(0)
    )
  );
  
  const obstacles = [];
  
  // Add random floating and wall-mounted obstacles
  for (let z = 0; z < sizeZ; z++) {
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        // Keep the center somewhat clear like a main aisle, but still allow obstacles
        const isCenter = (x > sizeX/3 && x < (sizeX*2)/3) && (y > sizeY/3 && y < (sizeY*2)/3);
        const adjustedDensity = isCenter ? obstacleDensity * 0.3 : obstacleDensity;
        
        if (Math.random() < adjustedDensity) {
          grid[z][y][x] = 1;
          obstacles.push({ x, y, z });
        }
      }
    }
  }
  
  // Ensure start and end are clear (we'll assume start is 0,0,0 and end is max,max,max)
  grid[0][0][0] = 0;
  grid[sizeZ-1][sizeY-1][sizeX-1] = 0;
  
  return { grid, obstacles };
}

/**
 * 6DOF Volumetric Pathfinding (A* in 3D Space)
 * Expands neighbors in 26 volumetric directions.
 */
export function calculate6DOFRoute(start, end, grid) {
  const sizeZ = grid.length;
  const sizeY = grid[0].length;
  const sizeX = grid[0][0].length;
  
  // Quick bounds check
  if (grid[start.z][start.y][start.x] === 1 || grid[end.z][end.y][end.x] === 1) {
    return { path: [], status: "Start or End is blocked by an obstacle." };
  }

  const openSet = [start];
  const cameFrom = new Map();
  
  // 3D array for gScore and fScore
  const gScore = Array(sizeZ).fill(null).map(() => 
    Array(sizeY).fill(null).map(() => Array(sizeX).fill(Infinity))
  );
  gScore[start.z][start.y][start.x] = 0;
  
  const fScore = Array(sizeZ).fill(null).map(() => 
    Array(sizeY).fill(null).map(() => Array(sizeX).fill(Infinity))
  );
  
  // 3D Euclidean distance heuristic
  const heuristic = (a, b) => Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
  );
  
  fScore[start.z][start.y][start.x] = heuristic(start, end);
  
  const getMapKey = (node) => `${node.x},${node.y},${node.z}`;
  
  // All 26 directions in a 3x3x3 cube (excluding 0,0,0)
  const directions = [];
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        directions.push({ dx, dy, dz });
      }
    }
  }
  
  let iterations = 0;
  const maxIterations = 50000; // Safety breakout

  while (openSet.length > 0) {
    iterations++;
    if (iterations > maxIterations) {
      return { path: [], status: "Pathfinding timed out (too complex)." };
    }
    
    // Find node with lowest fScore
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const a = openSet[i];
      const b = openSet[currentIdx];
      if (fScore[a.z][a.y][a.x] < fScore[b.z][b.y][b.x]) {
        currentIdx = i;
      }
    }
    
    const current = openSet[currentIdx];
    
    // Reached destination
    if (current.x === end.x && current.y === end.y && current.z === end.z) {
      const path = [current];
      let currStr = getMapKey(current);
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = getMapKey(prev);
      }
      return { path, status: "6DOF Route Calculated", nodesExplored: iterations };
    }
    
    // Remove current from openSet
    openSet.splice(currentIdx, 1);
    
    // Check 26 neighbors
    for (const dir of directions) {
      const neighbor = {
        x: current.x + dir.dx,
        y: current.y + dir.dy,
        z: current.z + dir.dz
      };
      
      // Bounds check
      if (
        neighbor.x < 0 || neighbor.x >= sizeX ||
        neighbor.y < 0 || neighbor.y >= sizeY ||
        neighbor.z < 0 || neighbor.z >= sizeZ
      ) {
        continue;
      }
      
      // Obstacle check
      if (grid[neighbor.z][neighbor.y][neighbor.x] === 1) {
        continue;
      }
      
      // Calculate true 3D distance cost
      const stepCost = Math.sqrt(Math.abs(dir.dx) + Math.abs(dir.dy) + Math.abs(dir.dz)); 
      // 1 for straight, 1.414 for 2D diagonal, 1.732 for 3D diagonal
      
      const tentativeGScore = gScore[current.z][current.y][current.x] + stepCost;
      
      if (tentativeGScore < gScore[neighbor.z][neighbor.y][neighbor.x]) {
        cameFrom.set(getMapKey(neighbor), current);
        gScore[neighbor.z][neighbor.y][neighbor.x] = tentativeGScore;
        fScore[neighbor.z][neighbor.y][neighbor.x] = tentativeGScore + heuristic(neighbor, end);
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y && n.z === neighbor.z)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  return { path: [], status: "No valid route. The robot is trapped.", nodesExplored: iterations };
}
