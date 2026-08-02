/**
 * Generates random coral planting sites on a simulated bathymetric reef.
 * Depths range from -5m to -30m.
 */
export function generateReefSites(numSites) {
  const sites = [];
  for (let i = 0; i < numSites; i++) {
    sites.push({
      id: i,
      x: Math.floor(Math.random() * 100), // meters distance on X
      y: Math.floor(Math.random() * 100), // meters distance on Y
      depth: -(Math.floor(Math.random() * 25) + 5), // negative depth in meters
    });
  }
  return sites;
}

/**
 * Calculates a simplified No-Decompression Limit (NDL) based on depth.
 * (A very simplified approximation of PADI/Bühlmann dive tables).
 * Returns NDL in minutes.
 */
function getNDL(depthMeters) {
  const depth = Math.abs(depthMeters);
  if (depth <= 10) return 219;
  if (depth <= 12) return 147;
  if (depth <= 15) return 72;
  if (depth <= 18) return 56;
  if (depth <= 22) return 37;
  if (depth <= 25) return 29;
  if (depth <= 30) return 20;
  return 10; // deeper than 30m, very short NDL
}

/**
 * Simulates and optimizes a dive profile.
 * Standard Scuba Practice: "Start Deep, Work Shallow"
 * 
 * @param {Array} sites - Array of planting sites {x, y, depth}
 * @param {number} startingAirBar - Starting tank pressure in bar (usually 200)
 * @returns {Object} { profile: [], totalTime, remainingAir, sitesPlanted, status }
 */
export function calculateDiveProfile(sites, startingAirBar = 200) {
  // 1. Optimize sequence: Sort by depth (deepest first), then by proximity
  // Deepest means smallest negative number or largest absolute value
  let remainingSites = [...sites].sort((a, b) => a.depth - b.depth); 
  
  const profile = []; // Tracks the time/depth/air over the dive
  
  // Dive Constants
  const swimSpeed = 15; // meters per minute
  const descentRate = 18; // meters per minute
  const ascentRate = 9; // meters per minute (safety limit)
  const plantingTime = 3; // minutes to plant one coral
  const surfaceAirConsumption = 20; // liters per minute (SAC rate)
  const tankVolume = 11; // liters (standard AL80 is ~11.1L)
  const reserveAir = 50; // bar (must surface with this)
  
  let currentAir = startingAirBar * tankVolume; // Total free liters of air
  let currentTime = 0;
  let currentDepth = 0; // Surface
  let currentX = 0;
  let currentY = 0;
  
  let sitesPlanted = 0;
  let accumulatedNitrogen = 0; // Simplified NDL tracker (0 to 1)
  let status = "Dive Complete";
  
  // Helper to record profile point
  const recordPoint = (event) => {
    profile.push({
      time: currentTime,
      depth: currentDepth,
      airBar: Math.floor(currentAir / tankVolume),
      event
    });
  };
  
  recordPoint("Surface Entry");

  for (let i = 0; i < remainingSites.length; i++) {
    const target = remainingSites[i];
    
    // Calculate transit to target
    // Distance includes 3D swim: horizontal + vertical
    const horizontalDist = Math.sqrt(
      Math.pow(target.x - currentX, 2) + Math.pow(target.y - currentY, 2)
    );
    const verticalDist = Math.abs(target.depth - currentDepth);
    
    // Time to reach target
    const swimTime = horizontalDist / swimSpeed;
    const depthChangeTime = verticalDist / (target.depth < currentDepth ? descentRate : ascentRate);
    const transitTime = Math.max(swimTime, depthChangeTime); // Assume diagonal swimming
    
    // Calculate air consumption during transit (average depth)
    const avgDepthTransit = (currentDepth + target.depth) / 2;
    const ataTransit = (Math.abs(avgDepthTransit) / 10) + 1; // Atmospheres Absolute
    const airUsedTransit = surfaceAirConsumption * ataTransit * transitTime;
    
    // Calculate air consumption while planting (at target depth)
    const ataTarget = (Math.abs(target.depth) / 10) + 1;
    const airUsedPlanting = surfaceAirConsumption * ataTarget * plantingTime;
    
    // Check constraints before committing to this site
    const projectedAir = currentAir - (airUsedTransit + airUsedPlanting);
    
    // We need enough air to ascend + do a 3min safety stop at 5m from target depth
    const ascentTime = Math.abs(target.depth) / ascentRate;
    const avgDepthAscent = target.depth / 2;
    const ataAscent = (Math.abs(avgDepthAscent) / 10) + 1;
    const airUsedAscent = surfaceAirConsumption * ataAscent * ascentTime;
    const airUsedSafetyStop = surfaceAirConsumption * 1.5 * 3; // 3 mins at 1.5 ATA (5m)
    
    const requiredReserve = (reserveAir * tankVolume) + airUsedAscent + airUsedSafetyStop;
    
    // Simplified NDL check (fraction of NDL time consumed)
    const targetNDL = getNDL(target.depth);
    const nitrogenAdded = plantingTime / targetNDL;
    
    if (projectedAir < requiredReserve) {
      status = "Turned dive (Air Reserve reached)";
      break; // Abort dive, surface now
    }
    
    if (accumulatedNitrogen + nitrogenAdded >= 0.95) {
      status = "Turned dive (NDL limit approached)";
      break; // Abort dive, surface now
    }
    
    // --- Commit to Site ---
    
    // Transit
    currentTime += transitTime;
    currentDepth = target.depth;
    currentX = target.x;
    currentY = target.y;
    currentAir -= airUsedTransit;
    
    // Plant
    currentTime += plantingTime;
    currentAir -= airUsedPlanting;
    accumulatedNitrogen += nitrogenAdded;
    sitesPlanted++;
    
    recordPoint(`Planted Coral #${target.id}`);
  }
  
  // Ascent sequence
  // 1. Ascend to safety stop (5 meters)
  const finalAscentTime = Math.abs(currentDepth + 5) / ascentRate;
  const ataAscent = (Math.abs((currentDepth - 5)/2) / 10) + 1;
  
  currentTime += finalAscentTime;
  currentAir -= (surfaceAirConsumption * ataAscent * finalAscentTime);
  currentDepth = -5;
  recordPoint("Begin Safety Stop");
  
  // 2. Safety Stop (3 mins)
  currentTime += 3;
  currentAir -= (surfaceAirConsumption * 1.5 * 3);
  recordPoint("End Safety Stop");
  
  // 3. Surface
  const surfaceTime = 5 / ascentRate;
  currentTime += surfaceTime;
  currentAir -= (surfaceAirConsumption * 1.25 * surfaceTime);
  currentDepth = 0;
  recordPoint("Surfaced");
  
  return {
    profile,
    totalTime: Math.ceil(currentTime),
    remainingAirBar: Math.floor(currentAir / tankVolume),
    sitesPlanted,
    totalSites: sites.length,
    status
  };
}
