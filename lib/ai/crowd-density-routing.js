export class CrowdDensityRouter {
  constructor(graph, densityData) {
    this.graph = graph;
    this.densityData = densityData; // e.g., { edgeId: densityLevel } where densityLevel is 0.0 to 1.0
    this.densityThreshold = 0.7; // Treat density above 70% as overcrowded
    this.penaltyMultiplier = 5000;
  }

  updateDensityData(newDensityData) {
    this.densityData = newDensityData;
  }

  calculatePath(start, end) {
    const pq = new PriorityQueue();
    const distances = new Map();
    const previous = new Map();

    distances.set(start, 0);
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
      const current = pq.dequeue();

      if (current === end) {
        return this.reconstructPath(previous, end);
      }

      const neighbors = this.graph.getNeighbors(current);
      for (const neighbor of neighbors) {
        const edgeId = this.graph.getEdgeId(current, neighbor);
        let weight = this.graph.getWeight(current, neighbor);
        
        const density = this.densityData[edgeId] || 0;
        if (density > this.densityThreshold) {
            // Apply exponential or massive penalty based on density
            weight += (density * this.penaltyMultiplier);
        }

        const newDist = distances.get(current) + weight;
        if (!distances.has(neighbor) || newDist < distances.get(neighbor)) {
          distances.set(neighbor, newDist);
          previous.set(neighbor, current);
          pq.enqueue(neighbor, newDist);
        }
      }
    }
    return null;
  }

  reconstructPath(previous, end) {
    const path = [];
    let curr = end;
    while (curr) {
      path.unshift(curr);
      curr = previous.get(curr);
    }
    return path;
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
