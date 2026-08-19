import { describe, it, expect, beforeEach } from 'vitest';
import { SwarmIntelligenceCurriculum } from '../app/(main)/swarm-intelligence/_components/aco-algorithm.js';

describe('Swarm Intelligence Algorithm for Global Curriculum Optimization', () => {
    let aco;
    const nodes = ['A', 'B', 'C', 'D'];
    const edges = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' }
    ];

    beforeEach(() => {
        aco = new SwarmIntelligenceCurriculum(nodes, edges);
    });

    it('should initialize edges with baseline pheromone', () => {
        expect(aco.edges.every(e => e.pheromone === 1.0)).toBe(true);
    });

    it('should evaporate pheromones and deposit based on traversals', () => {
        const traversals = [
            { success: true, path: ['A', 'B', 'D'] },
            { success: true, path: ['A', 'B', 'D'] },
            { success: false, path: ['A', 'C', 'D'] } // Should not deposit
        ];

        aco.simulateSwarmCycle(traversals);

        const abEdge = aco.edges.find(e => e.source === 'A' && e.target === 'B');
        const acEdge = aco.edges.find(e => e.source === 'A' && e.target === 'C');

        // AB gets evaporated (0.9 * 1.0 = 0.9) then gets 2 deposits of 0.5 (total 1.9)
        // AC gets evaporated (0.9 * 1.0 = 0.9) and no deposits
        expect(abEdge.pheromone).toBeCloseTo(1.9);
        expect(acEdge.pheromone).toBeCloseTo(0.9);
    });

    it('should calculate the recommended path based on highest pheromone', () => {
        // Artificially inflate the A -> C -> D path
        aco.edges.find(e => e.source === 'A' && e.target === 'C').pheromone = 5.0;
        aco.edges.find(e => e.source === 'C' && e.target === 'D').pheromone = 4.0;
        
        const path = aco.getRecommendedPath('A');
        expect(path).toEqual(['A', 'C', 'D']);
    });
});
