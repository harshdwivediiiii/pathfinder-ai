/**
 * Procedurally generates a 2D geological cross-section grid.
 * Rock Types (costs):
 * 0: Standard Sedimentary Rock (Base cost)
 * 1: Dense Granite (Impenetrable, infinite cost)
 * 2: Tectonic Fracture (Highly optimal, negative/low cost)
 * 3: Thermal Reservoir (Target zone)
 *
 * @param {number} width 
 * @param {number} depth 
 */
export function generateGeology(width, depth) {
  const grid = Array(depth).fill(null).map(() => Array(width).fill(0));
  const graniteBlobs = [];
  const fractures = [];
  
  // 1. Spawn Impenetrable Granite Blobs
  const numBlobs = Math.floor((width * depth) / 1000); // Density heuristic
  for (let i = 0; i < numBlobs; i++) {
    const cx = Math.floor(Math.random() * width);
    // Keep granite mostly in the middle depths (avoid surface and absolute bottom)
    const cy = Math.floor(Math.random() * (depth - 20)) + 10; 
    const radius = Math.floor(Math.random() * 8) + 4;
    graniteBlobs.push({x: cx, y: cy, radius});
    
    // Fill blob
    for (let y = Math.max(0, cy - radius); y < Math.min(depth, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x++) {
        // Distance check for circle
        if (Math.pow(x - cx, 2) + Math.pow(y - cy, 2) <= Math.pow(radius, 2)) {
          grid[y][x] = 1; // Granite
        }
      }
    }
  }

  // 2. Spawn Tectonic Fractures (Linear pathways)
  const numFractures = Math.floor(width / 20);
  for (let i = 0; i < numFractures; i++) {
    let startX = Math.floor(Math.random() * width);
    let startY = Math.floor(Math.random() * (depth / 2)); // Start in upper half
    
    // Slanted downward
    let length = Math.floor(Math.random() * 30) + 20;
    let dx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.8 + 0.2); // Slope
    let dy = 1;
    
    let cx = startX;
    let cy = startY;
    
    const fracPath = [];
    for (let l = 0; l < length; l++) {
      let ix = Math.floor(cx);
      let iy = Math.floor(cy);
      
      if (ix >= 0 && ix < width && iy >= 0 && iy < depth) {
        // Fractures can cut through granite, breaking it up
        grid[iy][ix] = 2; // Fracture
        fracPath.push({x: ix, y: iy});
        
        // Add some thickness to the fracture
        if (ix + 1 < width && Math.random() > 0.5) { grid[iy][ix+1] = 2; fracPath.push({x: ix+1, y: iy}); }
      }
      cx += dx;
      cy += dy;
      
      // Randomly shift direction slightly
      if (Math.random() > 0.8) dx += (Math.random() - 0.5) * 0.5;
    }
    fractures.push(fracPath);
  }

  // 3. Define the Thermal Reservoir (Bottom layer target)
  const targetY = depth - 5;
  const targetX = Math.floor(Math.random() * (width - 40)) + 20; // Somewhere near the bottom center
  
  // Create a heat bloom around the target
  for (let y = depth - 10; y < depth; y++) {
    for (let x = targetX - 15; x < targetX + 15; x++) {
       if (x >= 0 && x < width) {
         if (Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2) <= 100) {
           grid[y][x] = 3; // Reservoir
         }
       }
    }
  }

  return { 
    grid, 
    target: { x: targetX, y: targetY } 
  };
}

/**
 * Calculates a smooth, parabolic directional drill path.
 * 
 * @param {Object} start {x, y} (Surface Rig)
 * @param {Object} target {x, y} (Reservoir)
 * @param {Array} grid Geological grid
 * @returns {Array} Array of {x, y} coordinates for the drill path
 */
export function calculateDrillPath(start, target, grid) {
  const depth = grid.length;
  const width = grid[0].length;
  
  // A* implementation with directional constraints (simulating drill flexibility)
  
  // To enforce "smoothness" (Dogleg Severity limits), the state must include the current heading
  // State: { x, y, dx, dy }
  // To keep it simple for the grid, we'll allow 8 standard directions, but penalize changing direction
  
  const openSet = [];
  const closedSet = new Set();
  
  // We need a complex state key because arriving at a node from the left vs top is different
  const getStateKey = (n) => `${n.x},${n.y},${n.dx},${n.dy}`;
  
  const startNode = { 
    x: start.x, 
    y: start.y, 
    dx: 0, 
    dy: 1, // Start drilling straight down
    g: 0, 
    f: 0, 
    parent: null 
  };
  
  const heuristic = (a, b) => {
    // Standard Euclidean
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  };
  
  startNode.f = heuristic(startNode, target);
  openSet.push(startNode);
  
  const directions = [
    {dx: 0, dy: 1},   // Down
    {dx: 1, dy: 1},   // Down-Right
    {dx: -1, dy: 1},  // Down-Left
    {dx: 1, dy: 0},   // Right (Horizontal drilling)
    {dx: -1, dy: 0},  // Left
    // Gravity prevents drilling upwards easily, so omit negative dy unless absolutely necessary
  ];

  let iterations = 0;
  const maxIterations = 50000;

  while (openSet.length > 0) {
    iterations++;
    if (iterations > maxIterations) return []; // Timeout/trapped
    
    // Get lowest f
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIdx].f) currentIdx = i;
    }
    const current = openSet.splice(currentIdx, 1)[0];
    
    // Check if we hit the reservoir (Type 3)
    if (grid[current.y][current.x] === 3 || (current.x === target.x && current.y === target.y)) {
      // Reconstruct path
      const path = [];
      let curr = current;
      while (curr) {
        path.unshift({x: curr.x, y: curr.y});
        curr = curr.parent;
      }
      return path;
    }
    
    closedSet.add(getStateKey(current));
    
    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      
      // Bounds check
      if (nx < 0 || nx >= width || ny < 0 || ny >= depth) continue;
      
      // Cost evaluation based on geology
      const rockType = grid[ny][nx];
      if (rockType === 1) continue; // IMPENETRABLE GRANITE
      
      let stepCost = (dir.dx !== 0 && dir.dy !== 0) ? 1.414 : 1.0;
      
      if (rockType === 2) stepCost = 0.1; // FRACTURE - Highly preferred, very fast drilling
      if (rockType === 0) stepCost = 2.0; // STANDARD ROCK
      
      // Directional Penalty (Dogleg Severity)
      // Penalize changing the drill bit angle too sharply
      let turnPenalty = 0;
      if (current.dx !== dir.dx || current.dy !== dir.dy) {
        // Calculate dot product to find angle severity
        const dot = (current.dx * dir.dx) + (current.dy * dir.dy);
        const mag1 = Math.sqrt(current.dx*current.dx + current.dy*current.dy);
        const mag2 = Math.sqrt(dir.dx*dir.dx + dir.dy*dir.dy);
        
        // If angle is sharp, massive penalty or even disallow
        if (dot / (mag1 * mag2) < 0) {
           continue; // Cannot make > 90 degree turn
        }
        turnPenalty = 5.0; // Encourage keeping the same heading (smooth parabolic curves)
      }
      
      const gNode = current.g + stepCost + turnPenalty;
      
      const neighbor = {
        x: nx, y: ny, dx: dir.dx, dy: dir.dy,
        g: gNode,
        f: gNode + heuristic({x: nx, y: ny}, target),
        parent: current
      };
      
      if (closedSet.has(getStateKey(neighbor))) continue;
      
      // Check if openSet already has this state with a lower G
      const existingIdx = openSet.findIndex(n => n.x === nx && n.y === ny && n.dx === dir.dx && n.dy === dir.dy);
      if (existingIdx !== -1) {
        if (openSet[existingIdx].g > gNode) {
          openSet[existingIdx] = neighbor; // Update with better path
        }
      } else {
        openSet.push(neighbor);
      }
    }
  }
  
  return []; // No path found
}
