/**
 * Simple pseudo-random number generator for predictable noise
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an elevation map and charging station locations.
 */
export function generateEVMap(width, height, seed = 42) {
  const elevationMap = [];
  const stations = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Elevation
      const nx = x / width;
      const ny = y / height;
      const noise = seededRandom(seed + x + y * width) * 0.2;
      let elev = (Math.sin(nx * 10) + Math.cos(ny * 10)) * 0.5 + 0.5 + noise;
      elev = Math.max(0, Math.min(1, elev)) * 1000; // meters
      row.push(elev);

      // Random charging station (sparse)
      if (seededRandom(seed * 2 + x + y * width) > 0.985) {
        stations.push({ x, y });
      }
    }
    elevationMap.push(row);
  }

  return { elevationMap, stations };
}

/**
 * Calculates a safe EV route avoiding running out of battery using A* pathfinding.
 */
export function calculateEVRoute(start, end, elevationMap, stations, startBattery, maxBattery) {
  const height = elevationMap.length;
  const width = elevationMap[0].length;
  
  const openSet = [{ x: start.x, y: start.y, battery: startBattery, path: [{x: start.x, y: start.y, charge: false}] }];
  const bestBattery = Array(height).fill(null).map(() => Array(width).fill(-Infinity));
  bestBattery[start.y][start.x] = startBattery;

  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  while (openSet.length > 0) {
    openSet.sort((a, b) => {
        const scoreA = a.battery - heuristic(a, end) * 0.1;
        const scoreB = b.battery - heuristic(b, end) * 0.1;
        return scoreB - scoreA;
    });
    
    const current = openSet.shift();
    
    if (current.x === end.x && current.y === end.y) {
      return { path: current.path, status: "Optimal Eco-Route Calculated" };
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

      const currElev = elevationMap[current.y][current.x];
      const nextElev = elevationMap[neighbor.y][neighbor.x];
      const elevDiff = nextElev - currElev;
      
      let energyCost = 1.0;
      if (elevDiff > 0) {
        energyCost += (elevDiff / 100);
      } else {
        energyCost += (elevDiff / 200); // recover some potential energy
      }
      
      energyCost = Math.max(0.1, energyCost); 
      
      let nextBattery = current.battery - energyCost;
      
      if (nextBattery <= 0) continue; 

      let isCharging = false;
      if (stations.some(s => s.x === neighbor.x && s.y === neighbor.y)) {
         nextBattery = maxBattery;
         isCharging = true;
      }
      
      if (nextBattery > bestBattery[neighbor.y][neighbor.x]) {
        bestBattery[neighbor.y][neighbor.x] = nextBattery;
        openSet.push({
            x: neighbor.x, 
            y: neighbor.y, 
            battery: nextBattery,
            path: [...current.path, { x: neighbor.x, y: neighbor.y, charge: isCharging }]
        });
      }
    }
  }
  
  return { path: [], status: "Route Failed: Insufficient Range & Charging Infrastructure" };
}
