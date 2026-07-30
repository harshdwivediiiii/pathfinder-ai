import { EmergencyEvacuationRouter } from './lib/ai/emergency-evacuation-routing.js';
import { HRLDroneRouter } from './lib/ai/hrl-drone-routing.js';
import { WeatherIsochroneGenerator } from './lib/ai/weather-isochrones.js';
import { AccessibilityRouter } from './lib/ai/accessibility-routing.js';
import { H3HierarchicalRouter } from './lib/ai/h3-hexagonal-routing.js';

console.log("\n--- Testing 1518: EmergencyEvacuationRouter ---");
const evac = new EmergencyEvacuationRouter({});
const flow = evac.calculateFlow(['A'], ['B'], 10);
console.log("Evacuation Total:", flow.totalEvacuated);

console.log("\n--- Testing 1519: HRLDroneRouter ---");
const drone = new HRLDroneRouter({});
const flight = drone.planFullFlight({x:0, y:0, z:0}, {x:100, y:100, z:100});
console.log("Drone Flight estimated time:", flight.estimatedFlightTime);

console.log("\n--- Testing 1545: WeatherIsochroneGenerator ---");
const iso = new WeatherIsochroneGenerator({nodes: [], edges: []}, {});
iso.generateIsochrone({lat: 0, lng: 0}, 15).then(res => {
  console.log("Isochrone Condition:", res.weatherCondition);
});

console.log("\n--- Testing 1546: AccessibilityRouter ---");
const access = new AccessibilityRouter({edges: [{start: 'A', end: 'B', distance: 10, hasSidewalk: false, curbCuts: false, surfaceQuality: 0.5}]});
const accessRoute = access.route('A', 'B', 'wheelchair');
console.log("AccessibilityRoute weight:", accessRoute.totalWeight);

console.log("\n--- Testing 1547: H3HierarchicalRouter ---");
const h3 = new H3HierarchicalRouter({});
const h3Route = h3.route('A', 'B');
console.log("H3HierarchicalRouter memory saved:", h3Route.memorySaved);
