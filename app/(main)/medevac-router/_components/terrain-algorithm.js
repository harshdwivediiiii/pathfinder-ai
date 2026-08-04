import * as THREE from 'three';

/**
 * Procedurally generates a 3D topographic heightmap.
 */
export function generateTerrain(size = 30) {
  const grid = [];
  
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      // Simulate rolling hills and mountains using Math.sin/cos combinations
      // Center area has a prominent ridge
      let h = Math.sin(x * 0.2) * 4 + Math.cos(y * 0.2) * 4;
      
      // Large central mountain for the radar
      const distFromRadar = Math.sqrt((x - 15)**2 + (y - 15)**2);
      if (distFromRadar < 8) {
        h += (8 - distFromRadar) * 2;
      }
      
      // Deep valley to the right
      const distFromValley = Math.sqrt((x - 22)**2 + (y - 10)**2);
      if (distFromValley < 6) {
        h -= (6 - distFromValley) * 1.5;
      }

      // Base floor to ensure no negative height anomalies
      h = Math.max(0, h);
      
      row.push({ x, y, h });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Calculates which coordinates are within Line of Sight of the radar.
 */
export function calculateViewshed(grid, radarPos, flightAltitude) {
  const size = grid.length;
  const viewshed = Array(size).fill(0).map(() => Array(size).fill(false));

  const radarHeight = grid[radarPos.y][radarPos.x].h + 1; // Radar is slightly above the mountain

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x === radarPos.x && y === radarPos.y) continue;
      
      // Target is at its own terrain height + the aircraft's flight altitude
      const targetHeight = grid[y][x].h + flightAltitude;
      
      // Raycast check: Step along the line from radar to target
      let hasLOS = true;
      const dx = x - radarPos.x;
      const dy = y - radarPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Max radar range
      if (dist > 18) {
        viewshed[y][x] = false;
        continue;
      }

      const steps = Math.ceil(dist * 2);
      
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const cx = Math.round(radarPos.x + dx * t);
        const cy = Math.round(radarPos.y + dy * t);
        
        // Ray height at this point
        const rayHeight = radarHeight + (targetHeight - radarHeight) * t;
        
        // If the terrain here blocks the ray, LOS is broken
        if (grid[cy][cx].h > rayHeight) {
          hasLOS = false;
          break;
        }
      }
      
      viewshed[y][x] = hasLOS;
    }
  }

  return viewshed;
}

/**
 * A* Pathfinding optimized for threat avoidance.
 */
export function calculateStealthPath(grid, viewshed, start, end) {
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
      // Diagonals
      { x: current.x + 1, y: current.y + 1 },
      { x: current.x - 1, y: current.y - 1 },
      { x: current.x - 1, y: current.y + 1 },
      { x: current.x + 1, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= size || neighbor.y < 0 || neighbor.y >= size) continue;
      
      // Massive penalty for flying into a radar viewshed
      const isExposed = viewshed[neighbor.y][neighbor.x];
      const threatCost = isExposed ? 500 : 1;
      
      // Small penalty for steep terrain gradients (helicopters prefer smooth transitions)
      const heightDiff = Math.abs(grid[neighbor.y][neighbor.x].h - grid[current.y][current.x].h);
      const gradientCost = heightDiff * 2;

      const tentativeGScore = gScore.get(toKey(current)) + threatCost + gradientCost;

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
  // Euclidean distance
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
