export class MultiModalGraphParser {
  constructor() {
    this.superGraph = {
      nodes: new Map(),
      edges: new Map()
    };
    this.transferPenalties = {
      'road_rail': 300, // seconds to park and walk to train
      'rail_micromobility': 120, // seconds to exit station and rent scooter
      'road_micromobility': 60 // seconds to park and rent
    };
  }

  mergeNetworks(roadGraph, railGraph, microGraph, transferPoints) {
    // 1. Add all nodes with modal prefixes
    this.addNodesFromNetwork(roadGraph, 'road_');
    this.addNodesFromNetwork(railGraph, 'rail_');
    this.addNodesFromNetwork(microGraph, 'micro_');

    // 2. Add all edges within same modes
    this.addEdgesFromNetwork(roadGraph, 'road_');
    this.addEdgesFromNetwork(railGraph, 'rail_');
    this.addEdgesFromNetwork(microGraph, 'micro_');

    // 3. Create transfer edges based on geographical proximity (transfer points)
    for (const point of transferPoints) {
      const { roadNodeId, railNodeId, microNodeId } = point;

      if (roadNodeId && railNodeId) {
        this.addTransferEdge(`road_${roadNodeId}`, `rail_${railNodeId}`, this.transferPenalties['road_rail']);
      }
      if (railNodeId && microNodeId) {
        this.addTransferEdge(`rail_${railNodeId}`, `micro_${microNodeId}`, this.transferPenalties['rail_micromobility']);
      }
      if (roadNodeId && microNodeId) {
        this.addTransferEdge(`road_${roadNodeId}`, `micro_${microNodeId}`, this.transferPenalties['road_micromobility']);
      }
    }
  }

  addNodesFromNetwork(network, prefix) {
    if (!network || !network.nodes) return;
    for (const [id, data] of network.nodes.entries()) {
      this.superGraph.nodes.set(`${prefix}${id}`, { ...data, mode: prefix.replace('_', '') });
      this.superGraph.edges.set(`${prefix}${id}`, []);
    }
  }

  addEdgesFromNetwork(network, prefix) {
    if (!network || !network.edges) return;
    for (const [fromId, edges] of network.edges.entries()) {
      const prefixedEdges = edges.map(e => ({ ...e, to: `${prefix}${e.to}` }));
      const current = this.superGraph.edges.get(`${prefix}${fromId}`) || [];
      this.superGraph.edges.set(`${prefix}${fromId}`, current.concat(prefixedEdges));
    }
  }

  addTransferEdge(fromNode, toNode, penaltySeconds) {
    // Bidirectional transfer edges
    const fromEdges = this.superGraph.edges.get(fromNode) || [];
    fromEdges.push({ to: toNode, weight: penaltySeconds, type: 'transfer' });
    this.superGraph.edges.set(fromNode, fromEdges);

    const toEdges = this.superGraph.edges.get(toNode) || [];
    toEdges.push({ to: fromNode, weight: penaltySeconds, type: 'transfer' });
    this.superGraph.edges.set(toNode, toEdges);
  }

  getSuperGraph() {
    return this.superGraph;
  }
}
