import { describe, it, expect, beforeEach } from 'vitest';
import { DifferentialPrivacyEngine } from '../app/(main)/differential-privacy/_components/privacy-algorithm.js';

describe('Differential Privacy Implementation for Leaderboards', () => {
    let engine;

    beforeEach(() => {
        engine = new DifferentialPrivacyEngine(1.0); // Standard epsilon
    });

    it('should throw error if invalid dataset is provided', () => {
        expect(() => engine.anonymizeLeaderboard(null)).toThrow("Invalid dataset provided");
        expect(() => engine.anonymizeLeaderboard({ id: 1 })).toThrow("Invalid dataset provided");
    });

    it('should throw error if score is missing', () => {
        const badData = [{ id: 'u1', username: 'bob' }];
        expect(() => engine.anonymizeLeaderboard(badData)).toThrow("must have a numeric 'score' property");
    });

    it('should anonymize usernames', () => {
        const rawData = [{ id: 'u1', username: 'Alice', score: 500 }];
        const noisyData = engine.anonymizeLeaderboard(rawData);
        
        expect(noisyData[0].username).not.toBe('Alice');
        expect(noisyData[0].username).toContain('User_');
    });

    it('should inject noise into scores while preventing negative scores', () => {
        const rawData = [
            { id: 'u1', username: 'Alice', score: 500 },
            { id: 'u2', username: 'Bob', score: 0 }
        ];
        
        const noisyData = engine.anonymizeLeaderboard(rawData, 100);
        
        const alice = noisyData.find(u => u.id === 'u1');
        const bob = noisyData.find(u => u.id === 'u2');

        // Laplace noise is non-deterministic, but we know it should have added *some* noise
        // or modified the score, and bob's score shouldn't be negative.
        expect(alice.noisyScore).toBeGreaterThanOrEqual(0);
        expect(bob.noisyScore).toBeGreaterThanOrEqual(0);
        expect(typeof alice.noiseAdded).toBe('number');
    });

    it('should calculate approximate percentiles correctly', () => {
        const rawData = Array.from({ length: 10 }, (_, i) => ({
            id: `u${i}`,
            username: `user_${i}`,
            score: (i + 1) * 100
        }));

        const noisyData = engine.anonymizeLeaderboard(rawData, 100);
        
        // Sorting should be from highest to lowest noisyScore
        expect(noisyData[0].noisyScore).toBeGreaterThanOrEqual(noisyData[9].noisyScore);
        
        // Top rank should have 'Top 10%' or similar percentile
        expect(noisyData[0].percentileTier).toBe('Top 10%');
        expect(noisyData[0].approximateRank).toBe(1);
    });

    it('should calculate privacy metrics', () => {
        const rawData = [{ id: 'u1', username: 'Alice', score: 500 }];
        const metrics = engine.calculatePrivacyMetrics(rawData, 100);
        
        expect(metrics.epsilon).toBe(1.0);
        expect(metrics.theoreticalScale).toBe(100);
        expect(typeof metrics.averageNoiseAdded).toBe('number');
    });
});
