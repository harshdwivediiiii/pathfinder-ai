export class SwarmCoverageRouter {
  constructor() {
    this.robotAssignments = new Map(); // robotId => [polygon1, polygon2, ...]
    this.unassignedPolygons = []; // Polygons waiting for a robot
  }

  // Initialize the routing with a set of polygons and active robots
  initializeSwarm(allPolygons, activeRobots) {
    this.unassignedPolygons = [...allPolygons];
    this.robotAssignments.clear();
    activeRobots.forEach(robot => this.robotAssignments.set(robot.id, []));
    
    this.assignZones(activeRobots);
  }

  // Evenly distribute unassigned polygons among active robots
  assignZones(activeRobots) {
    if (activeRobots.length === 0) return;

    // Simple round-robin distribution for coverage planning
    let robotIndex = 0;
    while (this.unassignedPolygons.length > 0) {
      const polygon = this.unassignedPolygons.shift();
      const robot = activeRobots[robotIndex % activeRobots.length];
      
      const currentAssignments = this.robotAssignments.get(robot.id) || [];
      currentAssignments.push(polygon);
      this.robotAssignments.set(robot.id, currentAssignments);
      
      robotIndex++;
    }
  }

  // A robot reports it successfully cleared a polygon
  markPolygonCleared(robotId, polygonId) {
    const assignments = this.robotAssignments.get(robotId);
    if (assignments) {
      this.robotAssignments.set(
        robotId, 
        assignments.filter(p => p.id !== polygonId)
      );
    }
  }

  // Detects failure, extracts unfinished work, and returns it to the pool
  processRobotFailure(failedRobotId) {
    if (this.robotAssignments.has(failedRobotId)) {
      const unfinishedPolygons = this.robotAssignments.get(failedRobotId);
      
      // Return un-swept polygons back to the pool
      this.unassignedPolygons.push(...unfinishedPolygons);
      
      // Remove dead robot from active tracking
      this.robotAssignments.delete(failedRobotId);
    }
  }

  // Master function to recalculate the swarm when a failure event occurs
  recalculateSwarm(failedRobotId, currentActiveRobots) {
    this.processRobotFailure(failedRobotId);
    this.assignZones(currentActiveRobots);
  }

  // Get current assignment map
  getAssignments() {
    const result = {};
    this.robotAssignments.forEach((polygons, robotId) => {
      result[robotId] = polygons;
    });
    return result;
  }
}
