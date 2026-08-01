export class PipelineRouter {
  /**
   * @param {number} robotDiameter Physical width of the inspection robot in cm.
   * @param {number} maxSwimVelocity Maximum speed the robot can swim against a current (m/s).
   */
  constructor(robotDiameter = 10, maxSwimVelocity = 2.0) {
    this.robotDiameter = robotDiameter;
    this.maxSwimVelocity = maxSwimVelocity;
  }

  // Calculate physical length
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Validates if the edge is physically traversable
  isEdgeTraversable(edgeData) {
    // 1. Is the pipe wide enough?
    if (edgeData.diameter !== undefined && edgeData.diameter < this.robotDiameter) {
      return false; 
    }

    // 2. Is there a closed valve blocking the way?
    if (edgeData.valveState === 'CLOSED') {
      return false;
    }

    // 3. Is the fluid current too strong to fight against?
    // flowVelocity is positive if flowing WITH the robot's intended direction,
    // negative if flowing AGAINST the robot.
    const flowVelocity = edgeData.flowVelocity || 0;
    
    if (flowVelocity < 0 && Math.abs(flowVelocity) > this.maxSwimVelocity) {
      return false; // The current is too strong, robot will be swept away
    }

    return true;
  }

  // Calculate the battery/time cost of traversing the segment
  calculateTraversalCost(edgeData, distance) {
    const flowVelocity = edgeData.flowVelocity || 0;
    
    let cost = distance;

    // Adjust cost based on fluid dynamics
    if (flowVelocity > 0) {
      // Tail-current: Robot moves faster and uses less battery
      cost = cost / (1 + flowVelocity); 
    } else if (flowVelocity < 0) {
      // Head-current: Robot fights the flow, using massive battery
      // We already checked in isEdgeTraversable that maxSwimVelocity is not exceeded
      const resistance = Math.abs(flowVelocity);
      cost = cost * (1 + (resistance * 2)); // Heavy penalty for swimming upstream
    }

    return cost;
  }

  // Find optimal path to the leak
  routeRobot(graph, insertionPointId, leakNodeId) {
    let bestPath = [];
    let lowestCost = Infinity;

    // Simulate exploring all possible routes
    graph.paths.forEach(path => {
      let currentPathCost = 0;
      let isPathValid = true;
      
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const nodeA = path.nodes[i];
        const nodeB = path.nodes[i+1];
        
        const edgeData = path.edges ? path.edges[i] : {};

        if (!this.isEdgeTraversable(edgeData)) {
          isPathValid = false;
          break; // Abort this path, it's a dead end
        }

        const distance = edgeData.lengthMeters !== undefined ? edgeData.lengthMeters : this.calculateDistance(nodeA, nodeB);
        const segmentCost = this.calculateTraversalCost(edgeData, distance);
        
        currentPathCost += segmentCost;
      }

      if (isPathValid && currentPathCost < lowestCost) {
        lowestCost = currentPathCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { status: 'no_route', cost: Infinity, path: [] };
    }

    return { status: 'success', cost: lowestCost, path: bestPath };
  }
}
