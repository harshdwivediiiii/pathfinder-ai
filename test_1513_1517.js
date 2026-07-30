import { GNNGraphPruner } from './lib/ai/gnn-graph-pruning.js';
import { EVEnergyRouter } from './lib/ai/ev-energy-routing.js';
import { SwarmDeliveryManager } from './lib/ai/swarm-intelligence.js';
import { DifferentialPrivacyLayer } from './lib/ai/differential-privacy.js';
import { GraphStitcher } from './lib/ai/graph-stitching.js';

console.log("\n--- Testing 1513: GNNGraphPruner ---");
const gnn = new GNNGraphPruner("model_weights");
const pruned = gnn.pruneGraph({ nodes: ['A'], edges: [{ startNode: 'A', endNode: 'B' }] }, [[0.9]]);
console.log("GNNGraphPruner Edges:", pruned.edges.length);

console.log("\n--- Testing 1514: EVEnergyRouter ---");
const evRouter = new EVEnergyRouter({}, {}, {});
const evRoute = evRouter.route('A', 'B', 100);
console.log("EVEnergyRouter Consumption:", evRoute.estimatedEnergyConsumption);

console.log("\n--- Testing 1515: SwarmDeliveryManager ---");
const swarm = new SwarmDeliveryManager([{ id: 1, velocity: [0,0], position: [0,0], bestPosition: [0,0] }], []);
const routes = swarm.calculateRoutes([1, 1]);
console.log("SwarmDeliveryManager Routes:", routes);

console.log("\n--- Testing 1516: DifferentialPrivacyLayer ---");
const dp = new DifferentialPrivacyLayer(1.0, 1.0);
const anonymized = dp.anonymizeTelemetry([{ speed: 60, locationLat: 0, locationLng: 0 }]);
console.log("DifferentialPrivacyLayer speed != 60:", anonymized[0].speed !== 60);

console.log("\n--- Testing 1517: GraphStitcher ---");
const stitcher = new GraphStitcher({ nodes: [], edges: [] }, { building_1: { nodes: [], edges: [] } });
const stitched = stitcher.stitch('building_1');
console.log("GraphStitcher Edges:", stitched.edges.length);
