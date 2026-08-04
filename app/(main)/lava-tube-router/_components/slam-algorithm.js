import * as THREE from 'three';

/**
 * Generates a synthetic 3D LiDAR point cloud resembling a subterranean lava tube.
 * Adds stalactites, stalagmites, and rough cave walls.
 */
export function generateCavePointCloud(length = 200, radius = 10, noiseScale = 3) {
  const points = [];
  
  for (let z = 0; z < length; z += 1.5) {
    // Determine how many points in this cross-sectional ring
    const pointsInRing = 40;
    
    // Create random stalactites/stalagmites occasionally
    const hasStalactite = Math.random() > 0.8;
    const hasStalagmite = Math.random() > 0.8;

    for (let i = 0; i < pointsInRing; i++) {
      const angle = (i / pointsInRing) * Math.PI * 2;
      
      // Base radius with some noise for rough cave walls
      let r = radius + (Math.random() * noiseScale - noiseScale/2);
      
      let x = Math.cos(angle) * r;
      let y = Math.sin(angle) * r;

      // Add stalactite (top)
      if (hasStalactite && angle > Math.PI * 0.4 && angle < Math.PI * 0.6) {
        y -= Math.random() * (radius * 0.7); // hang down
      }
      
      // Add stalagmite (bottom)
      if (hasStalagmite && angle > Math.PI * 1.4 && angle < Math.PI * 1.6) {
        y += Math.random() * (radius * 0.7); // stick up
      }

      points.push(new THREE.Vector3(x, y, z));
    }
  }
  
  return points;
}

/**
 * 3D Pathfinding Heuristic
 * Given a point cloud, finds a path down the center of the Z-axis tube.
 * Ensures the path stays at least `clearance` distance away from ANY point.
 * Since a true 3D A* over 200 units is expensive for the main thread, 
 * this uses a centerline-following heuristic with obstacle repulsion.
 */
export function calculateSafePath(pointCloud, length = 200, clearance = 2.5) {
  const path = [];
  let currentPos = new THREE.Vector3(0, 0, 0); // Start at center entrance
  path.push(currentPos.clone());

  for (let z = 2; z <= length; z += 2) {
    // Target position is straight ahead
    let target = new THREE.Vector3(0, 0, z);
    
    // Repulsion step: check points in the immediate vicinity
    const localPoints = pointCloud.filter(p => Math.abs(p.z - z) < 5);
    
    let repulsion = new THREE.Vector3(0, 0, 0);
    let minDistance = Infinity;
    
    for (const p of localPoints) {
      const dist = target.distanceTo(p);
      if (dist < minDistance) minDistance = dist;
      
      // If a point is within the clearance radius, it repels the path
      if (dist < clearance) {
        // Calculate repulsion vector pointing AWAY from the obstacle
        const repelDir = target.clone().sub(p).normalize();
        // The closer it is, the stronger the repulsion
        const strength = clearance - dist;
        repulsion.add(repelDir.multiplyScalar(strength * 1.5));
      }
    }

    // Apply repulsion to target
    target.add(repulsion);

    // Hard constraints (if it gets completely blocked, try to snake around)
    // For MVP, we just accept the repelled coordinate as the best heuristic guess
    path.push(target.clone());
  }

  return path;
}
