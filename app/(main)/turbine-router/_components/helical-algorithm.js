import * as THREE from 'three';

/**
 * Procedurally generates the 3D geometry for a wind turbine blade.
 * The blade is a complex parametric shape: thick cylinder at the root,
 * tapering into a flat, twisted airfoil at the tip.
 */
export function generateBladeGeometry() {
  const bladeLength = 50;
  const segments = 100;
  
  // We'll build the mesh by lofting 2D ellipses along the Z axis
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1 along the blade
    const z = t * bladeLength;
    
    // Taper profiles
    // Width (Chord length): Starts medium, gets wide, then tapers to a point
    const width = t < 0.2 ? 2 + t * 5 : 3 - (t - 0.2) * 3;
    
    // Thickness: Starts cylindrical (thick), quickly flattens out
    const thickness = t < 0.1 ? 2 : 2 * Math.exp(-t * 10) + 0.1;
    
    // Aerodynamic Twist: The blade twists heavily near the root, flattens near the tip
    const twistAngle = (1 - t) * (Math.PI / 3); // 60 degree twist

    // Generate the cross-section (an ellipse)
    const crossSectionPts = [];
    const resolution = 32;
    for (let j = 0; j <= resolution; j++) {
      const angle = (j / resolution) * Math.PI * 2;
      
      // Base ellipse
      let x = (width / 2) * Math.cos(angle);
      let y = (thickness / 2) * Math.sin(angle);
      
      // Apply Twist (Rotation around Z)
      const rotatedX = x * Math.cos(twistAngle) - y * Math.sin(twistAngle);
      const rotatedY = x * Math.sin(twistAngle) + y * Math.cos(twistAngle);
      
      crossSectionPts.push(new THREE.Vector3(rotatedX, rotatedY, z));
    }
    
    points.push(crossSectionPts);
  }
  
  return { points, bladeLength };
}

/**
 * Calculates a helical inspection path that mathematically contours to the blade's surface.
 * 
 * @param {Array} bladeCrossSections - The output points from generateBladeGeometry
 * @param {number} standoff - Focal distance from the surface
 * @param {number} density - How tightly the helix winds around the blade
 */
export function calculateHelicalPath(bladeCrossSections, standoff = 2, density = 5) {
  const path = [];
  const segments = bladeCrossSections.length - 1;
  const totalRevolutions = density; 
  
  // We want to generate a continuous path wrapping around the blade.
  // Instead of a simple cylinder helix, we must map it to the exact cross-section shape.
  
  const pathResolution = segments * 10; // Total points in flight path
  
  for (let i = 0; i <= pathResolution; i++) {
    const t = i / pathResolution; // 0 to 1 representing total flight progress
    
    // 1. Find which Z-segment of the blade we are currently at
    const segmentIndex = Math.min(Math.floor(t * segments), segments - 1);
    const localT = (t * segments) - segmentIndex; // 0 to 1 between the two segments
    
    const sectionA = bladeCrossSections[segmentIndex];
    const sectionB = bladeCrossSections[segmentIndex + 1];
    
    // 2. Find our angular position around the cross-section
    // The drone revolves totalRevolutions times as it goes from t=0 to t=1
    const currentAngle = t * totalRevolutions * Math.PI * 2;
    
    // Map currentAngle (continuous) to a discrete index in the 32-point cross-section ring
    const normalizedAngle = (currentAngle % (Math.PI * 2)) / (Math.PI * 2);
    const ringResolution = sectionA.length - 1;
    
    const pointIndex = Math.floor(normalizedAngle * ringResolution);
    const nextPointIndex = (pointIndex + 1) % ringResolution;
    
    // We linearly interpolate between points on the ring for smoothness
    const angularT = (normalizedAngle * ringResolution) - pointIndex;
    
    // 3. Get the exact surface point on the blade
    // Interpolate on ring A
    const ptA = new THREE.Vector3().copy(sectionA[pointIndex]).lerp(sectionA[nextPointIndex], angularT);
    // Interpolate on ring B
    const ptB = new THREE.Vector3().copy(sectionB[pointIndex]).lerp(sectionB[nextPointIndex], angularT);
    
    // Interpolate between Z-segments
    const surfacePt = new THREE.Vector3().copy(ptA).lerp(ptB, localT);
    
    // 4. Calculate the Normal Vector (pointing away from the surface)
    // To calculate the normal, we need a tangent vector along the ring
    const tangent = new THREE.Vector3().copy(sectionA[nextPointIndex]).sub(sectionA[pointIndex]).normalize();
    // And a tangent vector along the Z axis (blade length)
    const zTangent = new THREE.Vector3().copy(sectionB[pointIndex]).sub(sectionA[pointIndex]).normalize();
    
    // Cross product gives us the normal vector
    const normal = new THREE.Vector3().crossVectors(tangent, zTangent).normalize();
    
    // If the normal is pointing inwards (depending on vertex winding), flip it
    // A quick hack for this specific geometry: normal should generally point away from the Z axis
    const centerAxis = new THREE.Vector3(0, 0, surfacePt.z);
    const outwardDir = new THREE.Vector3().copy(surfacePt).sub(centerAxis);
    if (normal.dot(outwardDir) < 0) {
      normal.negate();
    }
    
    // 5. Apply the Focal Standoff Distance
    const flightWaypoint = new THREE.Vector3().copy(surfacePt).add(normal.multiplyScalar(standoff));
    
    // Push as an array [x,y,z] for the UI line renderer
    path.push([flightWaypoint.x, flightWaypoint.y, flightWaypoint.z]);
  }
  
  return path;
}
