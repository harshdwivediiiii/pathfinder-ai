/**
 * Generates the physical catenary curve of a suspended power line between two towers.
 * 
 * @param {Object} startTower {x, y}
 * @param {Object} endTower {x, y}
 * @param {number} numSegments How many points to generate along the wire
 * @returns {Array} Array of {x, y} points representing the drooping wire
 */
export function generatePowerLines(startTower, endTower, numSegments = 50) {
  const points = [];
  
  const dx = endTower.x - startTower.x;
  // Span distance determines how much the wire sags
  const span = Math.abs(dx);
  
  // Catenary constant (higher = less sag). Let's base it on span for visual effect.
  const a = span * 1.5; 
  
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const x = startTower.x + (dx * t);
    
    // We want the sag to be in the middle (t=0.5)
    // Catenary formula: y = a * cosh(x/a) - a
    // We normalize x to be centered around 0 for the formula
    const normalizedX = (t - 0.5) * span;
    const sag = a * (Math.cosh(normalizedX / a) - 1);
    
    // Y represents height, but on a canvas Y increases downwards, so we ADD the sag 
    // (towers are higher up (smaller y), wire sags down (larger y))
    
    // Linear interpolation for tower height difference
    const baseLineY = startTower.y + (endTower.y - startTower.y) * t;
    
    const y = baseLineY + sag;
    
    points.push({ x, y });
  }
  
  return points;
}

/**
 * Calculates the dangerous Electromagnetic Interference (EMI) radius around the wire.
 * 
 * @param {number} voltageKV - Line voltage in kilovolts (e.g., 69 to 765)
 * @param {number} humidityPercent - Atmospheric relative humidity (0 to 100)
 * @returns {number} Radius of the keep-out zone in pixels/meters
 */
export function calculateEmiRadius(voltageKV, humidityPercent) {
  // Base EMF field radius scales somewhat linearly with voltage
  // E.g., 500kV requires much more clearance than 69kV
  const baseRadius = voltageKV / 20; 
  
  // Humidity increases air conductivity, exponentially increasing the risk of arcing
  // (Corona discharge risk)
  const humidityFactor = 1 + Math.pow(humidityPercent / 100, 2) * 1.5;
  
  return baseRadius * humidityFactor;
}

/**
 * Calculates the optimal flight path for the drone.
 * It must parallel the wire while strictly remaining outside the EMI radius + a physical standoff buffer.
 * 
 * @param {Array} wirePoints - The physical wire curve
 * @param {number} emiRadius - The calculated EMI danger zone
 * @param {number} targetStandoff - How far the camera *wants* to be for a good photo
 * @returns {Array} Array of {x, y} flight path waypoints
 */
export function calculateInspectionRoute(wirePoints, emiRadius, targetStandoff = 30) {
  const flightPath = [];
  
  // The actual flight radius must be the maximum of the danger zone or the desired camera distance
  const safeRadius = Math.max(emiRadius + 5, targetStandoff); // +5 is a safety margin
  
  for (let i = 0; i < wirePoints.length; i++) {
    const current = wirePoints[i];
    
    // To fly parallel, we need the normal vector to the curve
    let dx = 0;
    let dy = 0;
    
    if (i === 0) {
      dx = wirePoints[i+1].x - current.x;
      dy = wirePoints[i+1].y - current.y;
    } else if (i === wirePoints.length - 1) {
      dx = current.x - wirePoints[i-1].x;
      dy = current.y - wirePoints[i-1].y;
    } else {
      dx = wirePoints[i+1].x - wirePoints[i-1].x;
      dy = wirePoints[i+1].y - wirePoints[i-1].y;
    }
    
    // Normalize tangent vector
    const length = Math.sqrt(dx*dx + dy*dy);
    const nx = dx / length;
    const ny = dy / length;
    
    // Normal vector is perpendicular (-ny, nx)
    // We want the drone to fly *above* the wire, so on canvas (Y increases down), we subtract
    const normalX = -ny;
    const normalY = nx;
    
    // Position the drone along the normal vector at the safe radius
    flightPath.push({
      x: current.x + (normalX * safeRadius),
      y: current.y - Math.abs(normalY * safeRadius) // Force it above the wire for better visibility
    });
  }
  
  return flightPath;
}
