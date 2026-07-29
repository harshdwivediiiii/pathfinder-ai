export class CognitiveRouter {
  constructor(graph) {
    this.graph = graph;
    // Penalty values applied per turn, un-named road, etc.
    this.turnPenalty = 15; // Adds 15 seconds perceived cost per turn
    this.residentialPenalty = 20; // Perceived penalty for residential roads
    this.highwayBonus = -10; // Perceived bonus for taking major highways
  }

  calculatePath(start, end) {
    const pq = new PriorityQueue();
    const distances = new Map();
    const previous = new Map();

    distances.set(start, { cost: 0, cognitiveCost: 0, path: [start], lastEdge: null });
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();

      if (current === end) {
        return distances.get(end).path;
      }

      const neighbors = this.graph.getNeighbors(current);
      const currentData = distances.get(current);

      for (const neighbor of neighbors) {
        const edge = this.graph.getEdge(current, neighbor);
        
        let physicalCost = edge.weight;
        let cognitiveCost = 0;

        // Apply cognitive penalties based on road type
        if (edge.type === 'residential') {
          cognitiveCost += this.residentialPenalty;
        } else if (edge.type === 'highway') {
          cognitiveCost += this.highwayBonus;
        }

        // Apply turn penalties
        if (currentData.lastEdge && this.isTurn(currentData.lastEdge, edge)) {
           cognitiveCost += this.turnPenalty;
        }

        const totalCost = currentData.cost + physicalCost + cognitiveCost;
        
        // We only care about exploring paths based on their cognitive ease for humans
        const existingNeighbor = distances.get(neighbor);
        if (!existingNeighbor || totalCost < (existingNeighbor.cost + existingNeighbor.cognitiveCost)) {
          distances.set(neighbor, {
            cost: currentData.cost + physicalCost,
            cognitiveCost: currentData.cognitiveCost + cognitiveCost,
            path: [...currentData.path, neighbor],
            lastEdge: edge
          });
          previous.set(neighbor, current);
          pq.enqueue(neighbor, totalCost);
        }
      }
    }
    return null;
  }

  isTurn(edgeA, edgeB) {
    // Basic heuristic: if street names change or angles indicate a turn > 45 degrees
    if (edgeA.name && edgeB.name && edgeA.name !== edgeB.name) {
        return true;
    }
    // Geometric checks would go here based on lat/lon
    return false;
  }
}

class PriorityQueue {
    constructor() { this.elements = []; }
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    dequeue() { return this.elements.shift().element; }
    isEmpty() { return this.elements.length === 0; }
}
