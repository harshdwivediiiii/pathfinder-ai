import { AvalancheRiskRouter } from './lib/ai/avalanche-risk-router.js';

console.log("--- Testing 1752: Avalanche Risk-Aware Backcountry Ski Routing ---");

// Danger level 4 (High)
const router = new AvalancheRiskRouter(4);

const startNode = { id: 'BaseCamp', x: 0, y: 0, elevation: 2000 };
// A direct path up a 38 degree slope. (tan(38) ≈ 0.78 => e.g., dist=100, elev=78)
const dangerSlopeNode = { id: '38DegreeSlope', x: 100, y: 0, elevation: 2078, isUnderCornice: false }; 
// A longer detour path along a ridge with a 15 degree slope. (tan(15) ≈ 0.27 => e.g., dist=200, elev=54)
const safeRidgeNode = { id: 'SafeRidge', x: 0, y: 200, elevation: 2054, isUnderCornice: false }; 
// A path under a cornice, which should be invalidated completely.
const corniceNode = { id: 'UnderCornice', x: 50, y: 50, elevation: 2010, isUnderCornice: true };
const endNode = { id: 'Summit', x: 100, y: 100, elevation: 2200 };

const mockGraph = {
  paths: [
    { name: 'Direct Dangerous Path', nodes: [startNode, dangerSlopeNode, endNode] },
    { name: 'Safe Detour Path', nodes: [startNode, safeRidgeNode, endNode] },
    { name: 'Suicide Cornice Path', nodes: [startNode, corniceNode, endNode] }
  ]
};

console.log("\nCalculating Optimal Safe Ski Route (Danger Level 4)...");
const result = router.routeSkier(mockGraph, 'BaseCamp', 'Summit');

console.log(`Status: ${result.status}`);
console.log(`Chosen Path: ${result.path.join(' -> ')}`);

// The 38-degree slope gets a massive penalty, the cornice path gets Infinity.
// The router MUST choose the SafeRidge path even though it is physically much longer.

if (result.path.includes('SafeRidge') && !result.path.includes('38DegreeSlope') && !result.path.includes('UnderCornice')) {
  console.log("Test Passed: Router correctly prioritized safety and avoided the avalanche zone.");
} else {
  console.log("Test Failed: Router selected a dangerous path.");
  process.exit(1);
}
