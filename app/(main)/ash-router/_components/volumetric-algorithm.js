import * as THREE from 'three';

/**
 * Simulates a volcanic ash dispersion forecast.
 * Generates an array of volumetric bounding boxes representing the ash plume.
 * 
 * @param {number} windSpeed - Influences horizontal spread
 * @param {number} eruptionCeiling - Maximum altitude of the ash
 */
export function generateAshCloudVolumes(windSpeed, eruptionCeiling) {
  const volumes = [];
  
  // Volcano is at origin (0,0,0)
  const volcanoPos = new THREE.Vector3(0, 0, 0);
  
  // We'll model the plume as a series of overlapping 3D bounding boxes.
  // As it goes higher, wind pushes it horizontally (along X axis for simplicity) and it disperses (gets wider).
  const segments = 10;
  const heightPerSegment = eruptionCeiling / segments;
  
  for (let i = 0; i < segments; i++) {
    const currentAltitude = i * heightPerSegment;
    const nextAltitude = (i + 1) * heightPerSegment;
    
    // Wind advection (drift)
    // Higher altitude = more time aloft = pushed further by wind
    const driftX = (i * i) * windSpeed * 0.1; 
    
    // Dispersion (spread)
    // Cloud billows outward as it rises
    const spreadRadius = 5 + (i * windSpeed * 0.5);
    
    // Center of this cloud segment
    const center = new THREE.Vector3(volcanoPos.x + driftX, currentAltitude + (heightPerSegment/2), volcanoPos.z);
    
    // Bounding Box Definition
    const min = new THREE.Vector3(
      center.x - spreadRadius,
      currentAltitude,
      center.z - spreadRadius
    );
    
    const max = new THREE.Vector3(
      center.x + spreadRadius,
      nextAltitude,
      center.z + spreadRadius
    );
    
    const box = new THREE.Box3(min, max);
    volumes.push(box);
  }
  
  return volumes;
}

/**
 * 4D Volumetric Avoidance Router (3D A* Variant)
 * Finds an optimal path from Start to Destination while strictly avoiding all ash volumes.
 */
export function calculateVolumetricPath(startPos, endPos, ashVolumes, maxAircraftCeiling) {
  // Discretize the airspace into a 3D grid graph
  const gridSize = 5; // Distance between nodes
  
  // Define bounding volume for our search space
  const minX = -100; const maxX = 100;
  const minY = 0;    const maxY = maxAircraftCeiling;
  const minZ = -100; const maxZ = 100;
  
  // A* Data Structures
  // We'll use a string key for coordinates: "x,y,z"
  const getHash = (v) => `${Math.round(v.x)},${Math.round(v.y)},${Math.round(v.z)}`;
  
  const openSet = new Map();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  
  const startHash = getHash(startPos);
  openSet.set(startHash, startPos);
  gScore.set(startHash, 0);
  fScore.set(startHash, startPos.distanceTo(endPos));
  
  // 26-way adjacency (all surrounding 3D blocks)
  const directions = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        directions.push(new THREE.Vector3(dx * gridSize, dy * gridSize, dz * gridSize));
      }
    }
  }

  let iterations = 0;
  const maxIterations = 5000; // Safety catch

  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest fScore
    let currentHash = null;
    let lowestF = Infinity;
    
    for (const [hash, pos] of openSet.entries()) {
      const score = fScore.get(hash) || Infinity;
      if (score < lowestF) {
        lowestF = score;
        currentHash = hash;
      }
    }
    
    const currentPos = openSet.get(currentHash);
    
    // If we are close enough to the end, finish
    if (currentPos.distanceTo(endPos) <= gridSize * 1.5) {
      const path = [endPos];
      let curr = currentHash;
      while (cameFrom.has(curr)) {
        curr = cameFrom.get(curr);
        // We reconstruct by parsing the string, but a map lookup is better if we stored the Vector3
        const parts = curr.split(',').map(Number);
        path.unshift(new THREE.Vector3(parts[0], parts[1], parts[2]));
      }
      return path;
    }
    
    openSet.delete(currentHash);
    
    // Check neighbors
    for (const dir of directions) {
      const neighborPos = new THREE.Vector3().copy(currentPos).add(dir);
      
      // Bounds check
      if (neighborPos.x < minX || neighborPos.x > maxX ||
          neighborPos.y < minY || neighborPos.y > maxY ||
          neighborPos.z < minZ || neighborPos.z > maxZ) {
        continue;
      }
      
      // Ash Cloud Intersection Check (CRITICAL AVOIDANCE)
      let intersectsAsh = false;
      for (const box of ashVolumes) {
        if (box.containsPoint(neighborPos)) {
          intersectsAsh = true;
          break;
        }
      }
      
      if (intersectsAsh) continue; // Infinite penalty, cannot fly here
      
      const neighborHash = getHash(neighborPos);
      
      // Cost calculation
      // Altitude changes are expensive (fuel penalty)
      const altitudeChange = Math.abs(neighborPos.y - currentPos.y);
      const distance = currentPos.distanceTo(neighborPos);
      const moveCost = distance + (altitudeChange * 2.0); // Climbing/descending is 2x cost of level flight
      
      const tentativeG = gScore.get(currentHash) + moveCost;
      
      if (tentativeG < (gScore.get(neighborHash) || Infinity)) {
        cameFrom.set(neighborHash, currentHash);
        gScore.set(neighborHash, tentativeG);
        fScore.set(neighborHash, tentativeG + neighborPos.distanceTo(endPos));
        if (!openSet.has(neighborHash)) {
          openSet.set(neighborHash, neighborPos);
        }
      }
    }
  }
  
  // No path found (cloud is completely blocking airspace from surface to ceiling)
  return [];
}
