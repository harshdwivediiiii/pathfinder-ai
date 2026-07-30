import { AcousticRouter } from './lib/ai/acoustic-routing.js';
import { DynamicFareOptimizer } from './lib/ai/dynamic-fare-optimization.js';
import { WasmPathfinderBridge } from './lib/ai/wasm-pathfinding-bridge.js';
import { SpoofingDetector } from './lib/ai/gps-spoofing-detection.js';
import { DrivingProfiler } from './lib/ai/personalized-driving-profile.js';

console.log("\n--- Testing 1593: AcousticRouter ---");
const acoustic = new AcousticRouter({edges: []});
console.log("AcousticRouter threshold:", acoustic.decibelThreshold);

console.log("\n--- Testing 1594: DynamicFareOptimizer ---");
const fare = new DynamicFareOptimizer({}, {});
fare.optimizeRoute('A', 'B', 20).then(res => {
  console.log("Fare best route mode:", res.bestRoute.mode);
});

console.log("\n--- Testing 1595: WasmPathfinderBridge ---");
const wasm = new WasmPathfinderBridge();
wasm.initialize().then(() => {
  const result = wasm.runAStar('A', 'B');
  console.log("Wasm execution time:", result.executionTimeMs);
});

console.log("\n--- Testing 1596: SpoofingDetector ---");
const spoof = new SpoofingDetector({});
const cleanData = spoof.filterSpoofedData([{edgeId: 'e1', speedDrop: 50}]);
console.log("Spoofing filtered data size:", cleanData.length);

console.log("\n--- Testing 1597: DrivingProfiler ---");
const profile = new DrivingProfiler('user123');
profile.analyzeHistoricalTrips([{routeType: 'highway', expectedTime: 10, actualTime: 8}]);
console.log("Driving profile multiplier:", profile.profileMatrix.highwayAggressiveness);

