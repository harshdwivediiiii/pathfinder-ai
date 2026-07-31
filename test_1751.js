import { PlanetaryRoverRouter } from './lib/ai/planetary-rover-router.js';

console.log("--- Testing 1751: Planetary Surface Rover Routing (Soil-Slip Mechanics) ---");

// Rover with 20 degree max traction
const router = new PlanetaryRoverRouter(20);

// Base camp on flat, somewhat loose sand (cohesion 0.3)
const startNode = { id: 'BaseCamp', x: 0, y: 0, elevation: 100, cohesion: 0.3 };
// Solid rock path but steep, 25 degree incline (dist 100, elev +46.6)
const steepRockNode = { id: 'SteepRock', x: 100, y: 0, elevation: 146.6, cohesion: 1.0 };
// Loose sand gentle slope, 5 degree incline (dist 200, elev +17.5)
const gentleSandNode = { id: 'GentleSand', x: 0, y: 200, elevation: 117.5, cohesion: 0.2 };
// Destination
const endNode = { id: 'Destination', x: 100, y: 200, elevation: 120, cohesion: 0.5 };

const mockGraph = {
  paths: [
    { name: 'Direct Steep Path', nodes: [startNode, steepRockNode, endNode] },
    { name: 'Gentle Detour Path', nodes: [startNode, gentleSandNode, endNode] }
  ]
};

console.log("\nCalculating Optimal Rover Route...");
const result = router.routeRover(mockGraph, 'BaseCamp', 'Destination');

console.log(`Status: ${result.status}`);
console.log(`Chosen Path: ${result.path.join(' -> ')}`);

if (result.path.includes('GentleSand') && !result.path.includes('SteepRock')) {
  console.log("Test Passed: Router correctly avoided the steep incline beyond its traction limits.");
} else {
  console.log("Test Failed: Router selected a steep/dangerous path.");
  process.exit(1);
}
