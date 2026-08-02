/**
 * Generates random celestial targets (stars/galaxies) across the sky.
 * Coordinates are represented as Right Ascension (RA) in [0, 2π) and Declination (Dec) in [-π/2, π/2].
 *
 * @param {number} count - Number of targets to generate
 * @returns {Array} Array of target objects
 */
export function generateCelestialTargets(count = 20) {
  const targets = [];
  for (let i = 0; i < count; i++) {
    // Generate RA uniformly between 0 and 2*PI
    const ra = Math.random() * Math.PI * 2;
    // Generate Dec using acos to ensure uniform distribution on a sphere
    const dec = Math.asin(Math.random() * 2 - 1); 
    
    // Convert to 3D Cartesian unit vector
    const x = Math.cos(dec) * Math.cos(ra);
    const y = Math.cos(dec) * Math.sin(ra);
    const z = Math.sin(dec);
    
    targets.push({ id: `Target-${i}`, ra, dec, vector: { x, y, z } });
  }
  return targets;
}

/**
 * Calculates the great-circle angular distance between two unit vectors.
 */
export function calculateAngularDistance(vecA, vecB) {
  // Dot product
  const dot = vecA.x * vecB.x + vecA.y * vecB.y + vecA.z * vecB.z;
  // Clamp between -1 and 1 to avoid NaN from floating point inaccuracies
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/**
 * Calculates the momentum vector imparted by slewing from A to B.
 * The axis of rotation is the cross product of A and B.
 * The magnitude is proportional to the angle of the slew.
 */
export function calculateSlewMomentum(vecA, vecB) {
  const angle = calculateAngularDistance(vecA, vecB);
  
  // Cross product
  let cx = vecA.y * vecB.z - vecA.z * vecB.y;
  let cy = vecA.z * vecB.x - vecA.x * vecB.z;
  let cz = vecA.x * vecB.y - vecA.y * vecB.x;
  
  // Normalize the cross product to get the unit axis of rotation
  const crossMag = Math.sqrt(cx * cx + cy * cy + cz * cz);
  
  if (crossMag < 0.0001) {
    return { x: 0, y: 0, z: 0 };
  }
  
  // The momentum imparted is along the axis of rotation, scaled by the slew angle
  return {
    x: (cx / crossMag) * angle,
    y: (cy / crossMag) * angle,
    z: (cz / crossMag) * angle
  };
}

/**
 * Calculates the total path distance and the final net momentum vector for a given sequence of targets.
 */
export function evaluateSequence(sequence) {
  let totalDistance = 0;
  let netMomentum = { x: 0, y: 0, z: 0 };
  
  for (let i = 0; i < sequence.length - 1; i++) {
    const vecA = sequence[i].vector;
    const vecB = sequence[i+1].vector;
    
    const dist = calculateAngularDistance(vecA, vecB);
    totalDistance += dist;
    
    const momentum = calculateSlewMomentum(vecA, vecB);
    netMomentum.x += momentum.x;
    netMomentum.y += momentum.y;
    netMomentum.z += momentum.z;
  }
  
  const momentumMagnitude = Math.sqrt(netMomentum.x**2 + netMomentum.y**2 + netMomentum.z**2);
  
  return { totalDistance, netMomentum, momentumMagnitude };
}

/**
 * Optimizes the sequence to minimize momentum buildup while keeping total distance reasonable.
 * Uses a heuristic greedy approach with a penalty for momentum alignment.
 *
 * @param {Array} targets - Unordered list of targets
 * @param {number} momentumWeight - How much to prioritize minimizing momentum vs distance
 * @returns {Array} Optimized sequence of targets
 */
export function optimizeObservationSequence(targets, momentumWeight = 1.0) {
  if (!targets || targets.length <= 1) return targets;
  
  // Start from the first target arbitrarily
  const unvisited = [...targets];
  const sequence = [unvisited.shift()];
  
  let currentNetMomentum = { x: 0, y: 0, z: 0 };
  
  while (unvisited.length > 0) {
    const currentTarget = sequence[sequence.length - 1];
    
    let bestScore = Infinity;
    let bestIndex = -1;
    let bestMomentumAdd = null;
    
    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      const dist = calculateAngularDistance(currentTarget.vector, candidate.vector);
      
      const addedMomentum = calculateSlewMomentum(currentTarget.vector, candidate.vector);
      
      // Calculate what the new net momentum would be
      const simulatedNetX = currentNetMomentum.x + addedMomentum.x;
      const simulatedNetY = currentNetMomentum.y + addedMomentum.y;
      const simulatedNetZ = currentNetMomentum.z + addedMomentum.z;
      
      const newMomentumMag = Math.sqrt(simulatedNetX**2 + simulatedNetY**2 + simulatedNetZ**2);
      
      // We want to minimize distance AND minimize the resulting net momentum magnitude
      // The momentumWeight parameter determines the tradeoff
      const score = dist + (newMomentumMag * momentumWeight);
      
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
        bestMomentumAdd = addedMomentum;
      }
    }
    
    // Append the best candidate
    sequence.push(unvisited[bestIndex]);
    
    // Update running momentum
    currentNetMomentum.x += bestMomentumAdd.x;
    currentNetMomentum.y += bestMomentumAdd.y;
    currentNetMomentum.z += bestMomentumAdd.z;
    
    // Remove from unvisited
    unvisited.splice(bestIndex, 1);
  }
  
  return sequence;
}
