import { PredictiveMaintenanceRouter } from './lib/ai/predictive-maintenance.js';
import { AntColonyOptimizer } from './lib/ai/ant-colony-optimization.js';
import { LLMTrafficPredictor } from './lib/ai/llm-traffic-prediction.js';
import { QuantumTelemetryEncryptor } from './lib/ai/quantum-encryption.js';
import { TerrainAwareRouter } from './lib/ai/terrain-aware-routing.js';

console.log("--- Testing 1598: PredictiveMaintenanceRouter ---");
const pmRouter = new PredictiveMaintenanceRouter({
  edges: [
    { id: 1, grade: 6.0, speedLimit: 70, trafficType: 'stop-and-go', weight: 1.0 },
    { id: 2, grade: 2.0, speedLimit: 50, trafficType: 'flowing', weight: 1.0 }
  ]
});
pmRouter.setMaintenanceDepots(['DepotA', 'DepotB']);
const obdTelemetry = { engineTemp: 110, brakePadThicknessMm: 2.5 };
const pmResult = pmRouter.route('Truck1', obdTelemetry);
console.log("PM Reroute status:", pmResult.status);
console.log("PM Modified edges:", pmResult.modifiedEdges);

console.log("\n--- Testing 1599: AntColonyOptimizer ---");
const aco = new AntColonyOptimizer({
  edges: [
    { id: 1, distance: 10 },
    { id: 2, distance: 15 }
  ]
});
aco.initializePheromones();
const acoResult = aco.optimize('Start', ['PointA', 'PointB']);
console.log("ACO Result:", acoResult.status, "Best Length:", acoResult.bestLength);

console.log("\n--- Testing 1600: LLMTrafficPredictor ---");
const llmPredictor = new LLMTrafficPredictor({
  edges: [
    { id: 1, weight: 1.0 },
    { id: 2, weight: 1.0 }
  ]
});
llmPredictor.extractAnomalies([
  "Main st is closed due to a parade.",
  "Clear skies today!"
]).then(() => {
  const penalized = llmPredictor.applyEventPenalties();
  console.log("LLM Penalized edges:", penalized);
  
  console.log("\n--- Testing 1601: QuantumTelemetryEncryptor ---");
  const qte = new QuantumTelemetryEncryptor();
  const keys = qte.generateLatticeKeypair();
  const encrypted = qte.encryptTelemetry({ speed: 45, location: 'highway' }, keys.publicKey);
  console.log("Encrypted Telemetry:", encrypted.ciphertext.substring(0, 20) + "...");
  const decrypted = qte.decryptTelemetry(encrypted, keys.privateKey);
  console.log("Decrypted Telemetry:", decrypted.speed);

  console.log("\n--- Testing 1602: TerrainAwareRouter ---");
  const terrainRouter = new TerrainAwareRouter({
    edges: [
      { id: 1, distance: 1000 },
      { id: 2, distance: 2000 }
    ]
  }, { fitnessLevel: 'beginner' });
  terrainRouter.ingestDEM([
    { edgeId: 1, elevationStart: 100, elevationEnd: 150 },
    { edgeId: 2, elevationStart: 150, elevationEnd: 50 }
  ]);
  const trResult = terrainRouter.route('A', 'B');
  console.log("Terrain Route Estimated Seconds:", trResult.estimatedTimeSeconds);
});
