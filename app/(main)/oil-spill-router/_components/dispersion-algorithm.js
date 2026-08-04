/**
 * Implements a Cellular Automata fluid dynamics simulation for oil dispersion.
 * Also includes logic for ASV swarm routing to containment coordinates.
 */

// Grid size for the simulation
export const GRID_SIZE = 100;

export class OilSpillSimulation {
  constructor() {
    this.grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    // Seed the initial spill in the center
    this.grid[Math.floor(GRID_SIZE / 2)][Math.floor(GRID_SIZE / 2)] = 100;
    
    // Track ASV swarm positions
    this.asvs = Array(12).fill(0).map((_, i) => ({
      id: i,
      x: 10 + (i * 2),
      y: 10,
      targetX: null,
      targetY: null,
      speed: 0.8
    }));

    this.spillArea = 0;
  }

  // Calculate one step of cellular automata fluid dispersion
  step(currentDirectionDeg, currentSpeed) {
    const nextGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
    let newArea = 0;

    // Convert degrees to radians (0 is East, 90 is South on canvas, etc.)
    // We adjust it so 0 is North, 90 East
    const rad = ((currentDirectionDeg - 90) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    // Basic diffusion rate
    const diffusion = 0.15;
    
    // Advection (movement due to current)
    const advectionX = dx * currentSpeed * 0.1;
    const advectionY = dy * currentSpeed * 0.1;

    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        let val = this.grid[y][x];
        
        if (val > 0) {
          // Diffuse to neighbors
          const spread = val * diffusion;
          val -= spread * 4;

          // Advection biasing (wind/current pushes more oil in one direction)
          const weightE = 0.25 + (advectionX > 0 ? advectionX : 0);
          const weightW = 0.25 - (advectionX < 0 ? advectionX : 0);
          const weightS = 0.25 + (advectionY > 0 ? advectionY : 0);
          const weightN = 0.25 - (advectionY < 0 ? advectionY : 0);

          // Normalize weights
          const totalWeight = weightE + weightW + weightS + weightN;

          nextGrid[y][x+1] += (spread * (weightE / totalWeight));
          nextGrid[y][x-1] += (spread * (weightW / totalWeight));
          nextGrid[y+1][x] += (spread * (weightS / totalWeight));
          nextGrid[y-1][x] += (spread * (weightN / totalWeight));
        }
        
        nextGrid[y][x] += val;

        // Count cells with significant oil
        if (nextGrid[y][x] > 0.5) {
          newArea++;
        }
      }
    }

    this.grid = nextGrid;
    this.spillArea = newArea;
    this.updateASVs();
  }

  // Find the edge of the spill and route ASVs to form a perimeter ahead of it
  updateASVs() {
    // 1. Find edge cells (cells with oil > 0.5 next to cells with oil < 0.5)
    const edges = [];
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (this.grid[y][x] > 0.5) {
          if (
            this.grid[y-1][x] < 0.5 ||
            this.grid[y+1][x] < 0.5 ||
            this.grid[y][x-1] < 0.5 ||
            this.grid[y][x+1] < 0.5
          ) {
            edges.push({x, y});
          }
        }
      }
    }

    if (edges.length === 0) return;

    // 2. Select N edge points evenly spaced to assign to the N ASVs
    // (A very simplified perimeter targeting logic)
    const targets = [];
    const step = Math.max(1, Math.floor(edges.length / this.asvs.length));
    
    // To ensure they deploy *ahead* of the spill, we push the target out slightly from the center
    const cx = GRID_SIZE / 2;
    const cy = GRID_SIZE / 2;

    for (let i = 0; i < this.asvs.length; i++) {
      const edgePoint = edges[(i * step) % edges.length];
      
      // Push target outward by 5 units to give a buffer
      const dx = edgePoint.x - cx;
      const dy = edgePoint.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const targetX = edgePoint.x + (dx / dist) * 5;
      const targetY = edgePoint.y + (dy / dist) * 5;

      targets.push({ x: targetX, y: targetY });
    }

    // 3. Move ASVs towards their targets
    for (let i = 0; i < this.asvs.length; i++) {
      const asv = this.asvs[i];
      const target = targets[i];
      
      asv.targetX = target.x;
      asv.targetY = target.y;

      const dx = target.x - asv.x;
      const dy = target.y - asv.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > asv.speed) {
        asv.x += (dx / dist) * asv.speed;
        asv.y += (dy / dist) * asv.speed;
      }
    }
  }

  getGrid() {
    return this.grid;
  }

  getASVs() {
    return this.asvs;
  }
}
