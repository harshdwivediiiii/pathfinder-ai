export class GraphStitcher {
  constructor(outdoorGraph, indoorGraphs) {
    this.outdoorGraph = outdoorGraph;
    this.indoorGraphs = indoorGraphs; // Map of building ID to floorplan graph
  }

  identifyPortalNodes(outdoorRadius, buildingId) {
    // Logic to find closest outdoor street nodes to indoor entry doors
    return [
      { outdoorNodeId: 'street_node_1', indoorNodeId: `door_${buildingId}_A`, walkingPenalty: 1.5 }
    ];
  }

  stitch(buildingId) {
    const indoorGraph = this.indoorGraphs[buildingId];
    if (!indoorGraph) throw new Error("Indoor graph not found");

    const stitchedGraph = {
      nodes: [...this.outdoorGraph.nodes, ...indoorGraph.nodes],
      edges: [...this.outdoorGraph.edges, ...indoorGraph.edges]
    };

    const portals = this.identifyPortalNodes(50, buildingId);
    portals.forEach(portal => {
      // Connect outdoor to indoor with walking penalty transition
      stitchedGraph.edges.push({
        startNode: portal.outdoorNodeId,
        endNode: portal.indoorNodeId,
        weight: portal.walkingPenalty,
        type: 'transition'
      });
    });

    return stitchedGraph;
  }
}
