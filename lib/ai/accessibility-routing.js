/**
 * Personalized Accessibility Routing (Wheelchair/Stroller Optimization)
 * Implements an accessibility profile layer that filters out graph nodes 
 * and edges lacking curb ramps, elevators, or having a gradient > 8%.
 * 
 * Issue: #1450
 */

export class AccessibilityRouter {
  constructor(config = {}) {
    this.maxGradient = config.maxGradient || 8.0; // max 8% gradient for wheelchairs
    this.requireCurbRamps = config.requireCurbRamps ?? true;
    this.avoidStairs = config.avoidStairs ?? true;
  }

  /**
   * Filters a navigation graph based on accessibility constraints
   * @param {Object} graph The raw pedestrian graph
   * @param {Object} userProfile Accessibility preferences (e.g. wheelchair=true)
   * @returns {Object} Filtered graph safe for the user profile
   */
  filterAccessibleGraph(graph, userProfile = { wheelchairAccessible: true }) {
    if (!graph || !graph.nodes) return graph;
    if (!userProfile.wheelchairAccessible) return graph;

    const filteredNodes = [];

    for (const node of graph.nodes) {
      // Check node-level accessibility (e.g., subway station without elevator)
      if (this.avoidStairs && node.hasStairs && !node.hasElevator) {
        continue; // Skip node entirely
      }

      // Filter edges
      const accessibleEdges = [];
      for (const edge of (node.edges || [])) {
        if (this._isEdgeAccessible(edge)) {
          accessibleEdges.push(edge);
        }
      }

      // Keep node if it still has outgoing edges or is a destination node
      if (accessibleEdges.length > 0 || (node.edges || []).length === 0) {
        filteredNodes.push({
          ...node,
          edges: accessibleEdges
        });
      }
    }

    return { ...graph, nodes: filteredNodes };
  }

  _isEdgeAccessible(edge) {
    // 1. Check for stairs
    if (this.avoidStairs && edge.surfaceType === 'stairs') {
      return false;
    }

    // 2. Check for missing curb ramps at crossings
    if (this.requireCurbRamps && edge.isCrossing && !edge.hasCurbRamp) {
      return false;
    }

    // 3. Check gradient (steepness)
    if (edge.gradient && Math.abs(edge.gradient) > this.maxGradient) {
      return false;
    }

    // 4. Check sidewalk width (e.g., min 0.9m for standard wheelchair)
    if (edge.width && edge.width < 0.9) {
      return false;
    }

    return true;
  }
}
