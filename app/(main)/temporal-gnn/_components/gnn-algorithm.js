/**
 * Simple pseudo-random number generator
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an urban map with main arterials and local roads.
 */
export function generateTemporalMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      
      const isArterial = (x === Math.floor(width * 0.5) || y === Math.floor(height * 0.5));
      
      row.push({ 
        isArterial,
        baseSpeed: isArterial ? 60 : 30, // km/h
        length: 1 // arbitrary distance unit
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Simulates ETA calculation on a static path.
 * timeOfDay is in hours (0.0 to 24.0)
 */
export function calculateETAs(path, mapData, timeOfDay) {
    let heuristicETA = 0;
    let tgnnETA = 0;
    
    // Rush hour peak is at 17.5 (5:30 PM)
    const rushHourPeak = 17.5;
    const distanceToRushHour = Math.abs(timeOfDay - rushHourPeak);
    
    // Static heuristic just applies a flat global multiplier if within rush hour window (4 PM - 7 PM)
    let globalRushHourMultiplier = 1.0;
    if (timeOfDay >= 16.0 && timeOfDay <= 19.0) {
        globalRushHourMultiplier = 1.4; // 40% slower everywhere
    }
    
    // T-GNN models specific spatial propagation
    // For example, arterials clog up exponentially near the peak, while local roads are mostly fine
    
    for (const node of path) {
        const cell = mapData[node.y][node.x];
        
        // Base time to traverse cell in minutes
        const baseTime = (cell.length / cell.baseSpeed) * 60;
        
        // Heuristic
        heuristicETA += baseTime * globalRushHourMultiplier;
        
        // T-GNN
        let tgnnMultiplier = 1.0;
        
        if (cell.isArterial) {
            if (distanceToRushHour < 3.0) {
                // T-GNN predicts severe arterial clogging (up to 300% slower at exact peak)
                // Curve: 1.0 + 2.0 * (1 - dist/3)^2
                const severity = Math.pow(1 - (distanceToRushHour / 3.0), 2);
                tgnnMultiplier = 1.0 + (2.0 * severity);
            }
        } else {
            if (distanceToRushHour < 3.0) {
                // T-GNN knows local roads only get a little spillover traffic
                tgnnMultiplier = 1.0 + (0.2 * Math.pow(1 - (distanceToRushHour / 3.0), 2));
            }
        }
        
        tgnnETA += baseTime * tgnnMultiplier;
    }
    
    return {
        heuristicETA: Math.round(heuristicETA),
        tgnnETA: Math.round(tgnnETA)
    };
}

/**
 * Basic path generation (L-shape to utilize both local and arterial)
 */
export function getSamplePath(startX, startY, endX, endY) {
    const path = [];
    
    let currX = startX;
    let currY = startY;
    
    path.push({x: currX, y: currY});
    
    while (currX !== endX) {
        currX += Math.sign(endX - currX);
        path.push({x: currX, y: currY});
    }
    while (currY !== endY) {
        currY += Math.sign(endY - currY);
        path.push({x: currX, y: currY});
    }
    
    return path;
}
