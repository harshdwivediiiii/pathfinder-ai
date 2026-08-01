export class AcousticStealthRouter {
  // Helper to calculate 3D distance between two nodes (x, y, z coordinates in meters, where z is depth)
  calculateDistance3D(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    // z is depth (positive down)
    const dz = (nodeB.depth || 0) - (nodeA.depth || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Calculate distance between a node and a sensor
  calculateDistanceToSensor(node, sensor) {
    const dx = sensor.x - node.x;
    const dy = sensor.y - node.y;
    const dz = (sensor.depth || 0) - (node.depth || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Calculate detection probability from a specific sensor
  calculateDetectionProbability(node, sensor, environment) {
    const distance = this.calculateDistanceToSensor(node, sensor);
    
    // If outside the sensor's maximum range, detection probability is 0
    if (distance > sensor.maxRange) {
      return 0.0;
    }

    // Base detection probability (inverse square law approximation)
    let detectionProb = Math.max(0, 1.0 - (distance / sensor.maxRange));

    // Acoustic Propagation Modeling
    
    // 1. Thermocline Effect (Acoustic Shadow Zone)
    // If the sensor is above the thermocline and the submarine is below it, sound is deflected downwards.
    // This creates an acoustic shadow zone, significantly reducing detection probability.
    const thermoclineDepth = environment.thermoclineDepth || 50;
    const sensorAboveThermocline = (sensor.depth || 0) < thermoclineDepth;
    const subBelowThermocline = (node.depth || 0) >= thermoclineDepth;
    
    if (sensorAboveThermocline && subBelowThermocline) {
      detectionProb *= 0.2; // 80% reduction in detection probability
    }

    // 2. Deep Sound Channel (SOFAR Channel)
    // The SOFAR channel traps sound, allowing it to travel immense distances with little loss.
    // If both the submarine and the sensor are in the deep sound channel, detection probability spikes.
    const sofarMinDepth = environment.sofarMinDepth || 800;
    const sofarMaxDepth = environment.sofarMaxDepth || 1200;
    
    const sensorInSofar = (sensor.depth || 0) >= sofarMinDepth && (sensor.depth || 0) <= sofarMaxDepth;
    const subInSofar = (node.depth || 0) >= sofarMinDepth && (node.depth || 0) <= sofarMaxDepth;

    if (sensorInSofar && subInSofar) {
      // Sound travels far better; detection probability remains extremely high even at range
      detectionProb = Math.min(1.0, detectionProb * 5.0); 
    }

    return detectionProb;
  }

  calculateEdgeCost(nodeA, nodeB, sensors, environment) {
    const distance = this.calculateDistance3D(nodeA, nodeB);
    
    // Evaluate detection probability at the midpoint of the edge
    const midNode = {
      x: (nodeA.x + nodeB.x) / 2,
      y: (nodeA.y + nodeB.y) / 2,
      depth: ((nodeA.depth || 0) + (nodeB.depth || 0)) / 2
    };

    let totalDetectionRisk = 0;
    sensors.forEach(sensor => {
      totalDetectionRisk += this.calculateDetectionProbability(midNode, sensor, environment);
    });

    // Stealth penalty is exponential based on detection risk.
    // If total risk approaches or exceeds 1.0, the cost spikes massively to avoid detection.
    const stealthPenalty = Math.pow(10, totalDetectionRisk);

    return distance * stealthPenalty;
  }

  routeVessel(graph, startId, endId, sensors = [], environment = {}) {
    let bestPath = [];
    let bestCost = Infinity;

    graph.paths.forEach(path => {
      let currentCost = 0;
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        currentCost += this.calculateEdgeCost(path.nodes[i], path.nodes[i+1], sensors, environment);
      }

      if (currentCost < bestCost) {
        bestCost = currentCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_path_found', cost: Infinity, path: [] };
    }

    return { status: 'success', cost: bestCost, path: bestPath };
  }
}
