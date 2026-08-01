/**
 * Generates a synthetic 2D cross-section of ocean bathymetry.
 * Simulates a rugged seabed with seamounts and trenches.
 */
export function generateBathymetry(points = 100) {
  const data = [];
  let currentDepth = -3000; // Starting depth (negative is down)
  
  for (let x = 0; x <= points; x++) {
    // Add some random noise and large features
    const noise = (Math.random() - 0.5) * 150;
    
    // Simulate a massive seamount in the middle
    let seamount = 0;
    if (x > 30 && x < 70) {
      seamount = Math.sin((x - 30) / 40 * Math.PI) * 2000;
    }

    // Simulate a deep trench
    let trench = 0;
    if (x > 10 && x < 25) {
       trench = Math.sin((x - 10) / 15 * Math.PI) * -1500;
    }

    currentDepth += (Math.random() - 0.5) * 50; // Drift
    
    data.push({
      distance: x,
      depth: Math.floor(currentDepth + seamount + trench + noise)
    });
  }
  
  return data;
}

/**
 * Calculates a physics-based "drape" of a cable over the bathymetry.
 * The cable cannot stretch perfectly tight over a canyon (too much tension),
 * nor can it bend at a 90-degree angle (violates bend radius).
 * 
 * This uses a basic relaxation heuristic to smooth the cable path.
 */
export function calculateCableDrape(bathymetry, stiffness = 0.2) {
  // Start with the cable lying exactly on the seabed
  let cable = bathymetry.map(p => p.depth);
  
  // Relaxation iterations to simulate stiffness and tension
  const iterations = 50;
  for (let iter = 0; iter < iterations; iter++) {
    const newCable = [...cable];
    for (let i = 1; i < cable.length - 1; i++) {
      // The cable wants to be a straight line between its neighbors (tension)
      const targetDepth = (cable[i - 1] + cable[i + 1]) / 2;
      
      // Apply stiffness to move towards the straight line
      newCable[i] = cable[i] + (targetDepth - cable[i]) * stiffness;
      
      // Collision detection: The cable cannot go *below* the seabed
      if (newCable[i] < bathymetry[i].depth) {
        newCable[i] = bathymetry[i].depth;
      }
    }
    cable = newCable;
  }
  
  // Combine into chart data format
  return bathymetry.map((b, i) => ({
    ...b,
    cableDepth: Math.floor(cable[i])
  }));
}
