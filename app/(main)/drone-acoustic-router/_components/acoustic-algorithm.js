/**
 * ZONING TYPES
 * 0: Residential (Strict noise rules at night)
 * 1: Commercial (Moderate noise rules)
 * 2: Industrial (High ambient noise, low penalty)
 * 3: Highway (Very high ambient noise, ideal for drones)
 */

export function generateCityGrid(width = 20, height = 20) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Procedurally generate zones
      let type = 0; // Default Residential
      
      // Highway cutting through the middle
      if (x === 8 || x === 9 || y === 12 || y === 13) {
        type = 3;
      }
      // Industrial zone in the corner
      else if (x > 14 && y > 14) {
        type = 2;
      }
      // Commercial district in the center
      else if (x >= 5 && x <= 12 && y >= 5 && y <= 10) {
        type = 1;
      }
      // Another industrial patch
      else if (x < 4 && y < 4) {
        type = 2;
      }
      
      row.push({ x, y, type });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * A* Pathfinding optimized for acoustic noise avoidance.
 * Cost function changes based on `isNight`.
 */
export function calculateAcousticPath(grid, start, end, isNight) {
  const width = grid[0].length;
  const height = grid.length;

  // Base movement cost
  const MOVE_COST = 1;

  // Noise Penalty Multipliers [Residential, Commercial, Industrial, Highway]
  // At night, residential zones incur a massive 50x penalty
  const penalty = isNight 
    ? [50, 5, 1, 0.5] 
    : [2, 2, 1, 0.5];

  const openSet = [start];
  const cameFrom = new Map();
  
  const gScore = new Map();
  const fScore = new Map();
  
  const toKey = (n) => `${n.x},${n.y}`;
  
  gScore.set(toKey(start), 0);
  fScore.set(toKey(start), heuristic(start, end));

  while (openSet.length > 0) {
    // Get node with lowest fScore
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
    
    // Get neighbors (4-way movement)
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height) continue;
      
      const zoneType = grid[neighbor.y][neighbor.x].type;
      
      // Calculate travel cost to this neighbor
      // It's the base movement cost multiplied by the acoustic penalty of the zone
      const tentativeGScore = gScore.get(toKey(current)) + (MOVE_COST * penalty[zoneType]);

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

  return []; // No path found
}

function heuristic(a, b) {
  // Manhattan distance
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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
