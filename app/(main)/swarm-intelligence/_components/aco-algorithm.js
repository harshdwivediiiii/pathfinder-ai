/**
 * Simulates an Ant Colony Optimization (ACO) algorithm on a learning graph.
 * Users act as "ants" depositing pheromones on successful pathways,
 * which gradually shifts the recommended curriculum for future users.
 */

export class SwarmIntelligenceCurriculum {
    constructor(graphNodes, graphEdges) {
        if (!graphNodes || !graphEdges) {
            throw new Error("Graph nodes and edges are required for ACO initialization.");
        }
        
        this.nodes = graphNodes;
        
        // Initialize edges with baseline pheromone levels
        this.edges = graphEdges.map(e => ({
            ...e,
            pheromone: 1.0,
            id: `${e.source}->${e.target}`
        }));
        
        this.evaporationRate = 0.1; // 10% evaporation per cycle
        this.pheromoneDeposit = 0.5; // Amount added per successful traversal
    }

    simulateSwarmCycle(userTraversals) {
        if (!userTraversals || !Array.isArray(userTraversals)) {
            throw new Error("User traversals must be an array.");
        }

        // 1. Evaporate pheromones across all edges
        this.edges.forEach(edge => {
            edge.pheromone = Math.max(0.1, edge.pheromone * (1 - this.evaporationRate));
        });

        // 2. Deposit pheromones based on successful ant traversals
        userTraversals.forEach(traversal => {
            if (traversal.success && traversal.path) {
                for (let i = 0; i < traversal.path.length - 1; i++) {
                    const source = traversal.path[i];
                    const target = traversal.path[i+1];
                    const edgeId = `${source}->${target}`;
                    
                    const edge = this.edges.find(e => e.id === edgeId);
                    if (edge) {
                        edge.pheromone += this.pheromoneDeposit;
                    }
                }
            }
        });

        return this.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            pheromone: parseFloat(e.pheromone.toFixed(2))
        }));
    }

    getRecommendedPath(startNodeId) {
        let current = startNodeId;
        const path = [current];
        const visited = new Set([current]);

        // Greedy traversal following highest pheromone edges
        while (true) {
            const outEdges = this.edges.filter(e => e.source === current && !visited.has(e.target));
            if (outEdges.length === 0) break; // Dead end or finished

            // Find edge with max pheromone
            let bestEdge = outEdges[0];
            for (const edge of outEdges) {
                if (edge.pheromone > bestEdge.pheromone) {
                    bestEdge = edge;
                }
            }

            current = bestEdge.target;
            path.push(current);
            visited.add(current);
        }

        return path;
    }
}
