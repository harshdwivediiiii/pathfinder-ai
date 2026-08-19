/**
 * Procedurally generates a 3D Lunar Topographic heightmap with deep craters.
 */
export function generateLunarTerrain(size = 30) {
  const grid = [];
  
  // Base elevation
  const baseHeight = 5;

  // Define some craters: { x, y, radius, depth }
  const craters = [
    { cx: 15, cy: 15, r: 8, d: 5 }, // Shackleton-esque central crater
    { cx: 5, cy: 5, r: 4, d: 3 },
    { cx: 25, cy: 8, r: 5, d: 4 },
    { cx: 8, cy: 24, r: 6, d: 4 },
  ];

  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      let h = baseHeight;
      
      // Add slight noise
      h += Math.sin(x * 0.5) * 0.5 + Math.cos(y * 0.5) * 0.5;

      // Apply crater depressions and rim heights
      for (const c of craters) {
        const dist = Math.sqrt((x - c.cx)**2 + (y - c.cy)**2);
        
        if (dist < c.r) {
          // Inside the crater (deep depression)
          // Parabolic bowl shape
          const normalizedDist = dist / c.r;
          const depression = c.d * (1 - Math.pow(normalizedDist, 2));
          h -= depression;
        } else if (dist >= c.r && dist < c.r + 2) {
          // Crater rim (high elevation, Peak of Eternal Light candidate)
          const rimHeight = 2 * (1 - (dist - c.r) / 2);
          h += rimHeight;
        }
      }

      // Ensure no negative heights (floor is 0)
      h = Math.max(0, h);
      
      row.push({ x, y, h });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Calculates which coordinates are in shadow based on the Sun's position.
 * The Sun is modeled as a directional light vector.
 */
export function calculateLunarShadows(grid, sunAngleDeg) {
  const size = grid.length;
  const shadows = Array(size).fill(0).map(() => Array(size).fill(false));

  // The sun is very low on the horizon at the lunar poles (e.g., 2 degrees elevation)
  // For this simulation, we'll exaggerate it slightly to 5 degrees for better visuals
  const sunElevationRad = (5 * Math.PI) / 180;
  const sunAzimuthRad = (sunAngleDeg * Math.PI) / 180;

  // Vector pointing *towards* the sun
  const dx = Math.cos(sunAzimuthRad);
  const dy = Math.sin(sunAzimuthRad);
  const dz = Math.tan(sunElevationRad); // Height change per unit of 2D distance

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inShadow = false;
      const startHeight = grid[y][x].h;

      // Raycast towards the sun
      let cx = x;
      let cy = y;
      let ch = startHeight;

      // Step along the 2D grid
      const steps = 30; // Max ray distance
      for (let i = 1; i < steps; i++) {
        cx += dx;
        cy += dy;
        ch += dz; // The ray goes up into the sky

        const gridX = Math.round(cx);
        const gridY = Math.round(cy);

        // If the ray leaves the map, we assume it hits the sun
        if (gridX < 0 || gridX >= size || gridY < 0 || gridY >= size) {
          break;
        }

        // If the terrain height at the current grid cell is higher than the ray,
        // the terrain blocks the sun.
        if (grid[gridY][gridX].h > ch) {
          inShadow = true;
          break;
        }
      }

      shadows[y][x] = inShadow;
    }
  }

  return shadows;
}

/**
 * A* Pathfinding optimized for staying in the sunlight.
 */
export function calculateSolarPath(grid, shadows, start, end) {
  const size = grid.length;
  const openSet = [start];
  const cameFrom = new Map();
  
  const gScore = new Map();
  const fScore = new Map();
  
  const toKey = (n) => `${n.x},${n.y}`;
  
  gScore.set(toKey(start), 0);
  fScore.set(toKey(start), heuristic(start, end));

  while (openSet.length > 0) {
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if ((fScore.get(toKey(openSet[i])) || Infinity) < (fScore.get(toKey(openSet[currentIdx])) || Infinity)) {
        currentIdx = i;
      }
    }
    
    const current = openSet[currentIdx];

    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(currentIdx, 1);
    
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
      // Diagonals for smoother paths
      { x: current.x + 1, y: current.y + 1 },
      { x: current.x - 1, y: current.y - 1 },
      { x: current.x - 1, y: current.y + 1 },
      { x: current.x + 1, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= size || neighbor.y < 0 || neighbor.y >= size) continue;
      
      // Shadow penalty: If the tile is in shadow, the rover battery drains rapidly.
      // We apply a huge cost to force the rover onto sunlit crater rims.
      const isShadowed = shadows[neighbor.y][neighbor.x];
      const shadowCost = isShadowed ? 1000 : 1;
      
      // Slope penalty: Rovers can't climb vertical cliffs
      const heightDiff = Math.abs(grid[neighbor.y][neighbor.x].h - grid[current.y][current.x].h);
      const slopeCost = heightDiff > 2 ? 500 : heightDiff * 5; // Unpassable if slope > 2

      const tentativeGScore = gScore.get(toKey(current)) + shadowCost + slopeCost;

      if (tentativeGScore < (gScore.get(toKey(neighbor)) || Infinity)) {
        cameFrom.set(toKey(neighbor), current);
        gScore.set(toKey(neighbor), tentativeGScore);
        fScore.set(toKey(neighbor), tentativeGScore + heuristic(neighbor, end));
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return []; 
}

function heuristic(a, b) {
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);
}

function reconstructPath(cameFrom, current) {
  const path = [current];
  const toKey = (n) => `${n.x},${n.y}`;
  
  while (cameFrom.has(toKey(current))) {
    current = cameFrom.get(toKey(current));
    path.unshift(current);
  }
  return path;
}
