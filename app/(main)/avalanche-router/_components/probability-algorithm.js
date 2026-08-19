/**
 * Generates a probability density heatmap of an avalanche debris field.
 * Simulates a Gaussian distribution of debris spreading down a slope from a last known point.
 *
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {Object} lkp - Last Known Point {x, y}
 * @param {number} flowDirection - Angle in radians (0 is right, Math.PI/2 is down)
 * @param {number} spreadAngle - Spread of the debris cone
 * @returns {Array} 2D array [y][x] representing burial probability density (0 to 1)
 */
export function generateDebrisHeatmap(width, height, lkp, flowDirection = Math.PI / 2, spreadAngle = Math.PI / 4) {
  const map = [];
  
  // To normalize probabilities, keep track of the max value
  let maxProb = 0.0001;

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const dx = x - lkp.x;
      const dy = y - lkp.y;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) {
        row.push(1);
        continue;
      }
      
      // Calculate angle of the current point relative to LKP
      const angle = Math.atan2(dy, dx);
      
      // Calculate angular deviation from the main flow direction
      let angleDiff = Math.abs(angle - flowDirection);
      // Normalize angle difference to [0, PI]
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      let prob = 0;
      
      // Only points downhill and within the general spread are considered part of the debris
      if (angleDiff < Math.PI / 2) {
        // Gaussian distribution across the flow width
        const lateralSpread = Math.max(1, distance * Math.tan(spreadAngle / 2));
        // Distance perpendicular to the flow line
        const lateralDistance = distance * Math.sin(angleDiff);
        
        // Probability drops off laterally
        const lateralProb = Math.exp(-(lateralDistance * lateralDistance) / (2 * (lateralSpread * lateralSpread)));
        
        // Probability along the flow: peaks at a certain distance based on avalanche size
        // Assuming peak deposition is at some distance downstream
        const peakDistance = 20; 
        const longitudinalProb = Math.exp(-Math.pow(distance - peakDistance, 2) / (2 * 100)); // Standard deviation of 10
        
        prob = lateralProb * longitudinalProb;
      }
      
      if (prob > maxProb) maxProb = prob;
      row.push(prob);
    }
    map.push(row);
  }
  
  // Normalize the map so the highest probability is 1.0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      map[y][x] = map[y][x] / maxProb;
    }
  }
  
  return map;
}

/**
 * Calculates an optimized search sweep path covering the highest probability zones first.
 * Uses a greedy approach to move to the highest unvisited local maxima, then sweeps around it.
 *
 * @param {Object} startPos - {x, y} Starting position of the rescuer
 * @param {Array} heatmap - 2D probability map
 * @param {number} sweepRadius - How wide the rescuer searches (e.g. transceiver range)
 * @param {number} maxTime - Max path length/time
 * @returns {Object} { path: Array<{x, y}>, coverage: number }
 */
export function calculateSearchPath(startPos, heatmap, sweepRadius = 2, maxTime = 150) {
  const height = heatmap.length;
  const width = heatmap[0].length;
  
  // Clone heatmap to mark visited areas
  const unsearchedMap = heatmap.map(row => [...row]);
  
  const path = [{ ...startPos }];
  let currentPos = { ...startPos };
  let timeElapsed = 0;
  let totalProbCovered = 0;
  
  // Helper to mark an area as searched and accumulate probability
  const searchArea = (pos) => {
    let probFound = 0;
    for (let y = Math.max(0, pos.y - sweepRadius); y <= Math.min(height - 1, pos.y + sweepRadius); y++) {
      for (let x = Math.max(0, pos.x - sweepRadius); x <= Math.min(width - 1, pos.x + sweepRadius); x++) {
        if (Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2)) <= sweepRadius) {
          probFound += unsearchedMap[y][x];
          unsearchedMap[y][x] = 0; // Mark as searched
        }
      }
    }
    return probFound;
  };
  
  // Initial search at start position
  totalProbCovered += searchArea(currentPos);
  
  // Helper to find the next highest probability zone
  const findNextTarget = () => {
    let maxScore = -1;
    let bestTarget = null;
    
    // Scan map in steps to find dense areas quickly
    for (let y = 0; y < height; y += sweepRadius) {
      for (let x = 0; x < width; x += sweepRadius) {
        if (unsearchedMap[y][x] > 0.05) { // Only consider decent probabilities
          // Score is a combination of probability and distance penalty (efficiency)
          const dist = Math.max(1, Math.sqrt(Math.pow(x - currentPos.x, 2) + Math.pow(y - currentPos.y, 2)));
          
          // Estimate probability in that general area
          let localProb = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy * sweepRadius;
              const nx = x + dx * sweepRadius;
              if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                localProb += unsearchedMap[ny][nx];
              }
            }
          }
          
          const score = localProb / Math.sqrt(dist); // Favor closer, high prob areas
          if (score > maxScore) {
            maxScore = score;
            bestTarget = { x, y };
          }
        }
      }
    }
    return bestTarget;
  };

  while (timeElapsed < maxTime) {
    const target = findNextTarget();
    if (!target) break; // Nowhere left worth searching
    
    // Move towards target in steps of sweepRadius
    while (currentPos.x !== target.x || currentPos.y !== target.y) {
      const dx = target.x - currentPos.x;
      const dy = target.y - currentPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= sweepRadius) {
        currentPos = { ...target };
      } else {
        // Move one sweepRadius step towards target
        currentPos = {
          x: Math.round(currentPos.x + (dx / dist) * sweepRadius),
          y: Math.round(currentPos.y + (dy / dist) * sweepRadius)
        };
      }
      
      timeElapsed++;
      path.push({ ...currentPos });
      totalProbCovered += searchArea(currentPos);
      
      if (timeElapsed >= maxTime) break;
    }
  }

  return { path, coverage: totalProbCovered };
}
