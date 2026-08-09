import { describe, it, expect } from 'vitest';
import { trainLocalModel, aggregateGlobalModel } from '../app/(main)/federated-learning/_components/federated-algorithm.js';

describe('Federated Learning for Privacy-Preserving User Analytics', () => {
  it('trains a local model yielding weights without exposing raw sensitive data', () => {
    const rawTelemetry = {
      userId: 'test_user_1',
      struggleTimeMinutes: 60,
      quizScore: 20,
      hintsUsed: 10
    };
    
    const localModel = trainLocalModel(rawTelemetry);
    
    // Ensure the output contains only mathematical weights and metadata
    expect(localModel.clientId).toBe('test_user_1');
    expect(localModel.modelWeights).toBeDefined();
    expect(localModel.modelWeights.length).toBe(3);
    
    // Ensure raw telemetry data is NOT present in the output
    expect(localModel.struggleTimeMinutes).toBeUndefined();
    expect(localModel.quizScore).toBeUndefined();
  });
  
  it('aggregates multiple client weights accurately (FedAvg)', () => {
    // 3 clients, 3 weights each
    const clients = [
      { modelWeights: [0.1, 0.5, 0.2] },
      { modelWeights: [0.3, 0.5, 0.4] },
      { modelWeights: [0.5, 0.5, 0.6] }
    ];
    
    const globalWeights = aggregateGlobalModel(clients);
    
    // Expected averages:
    // W1: (0.1 + 0.3 + 0.5) / 3 = 0.3
    // W2: (0.5 + 0.5 + 0.5) / 3 = 0.5
    // W3: (0.2 + 0.4 + 0.6) / 3 = 0.4
    
    expect(globalWeights.length).toBe(3);
    expect(globalWeights[0]).toBeCloseTo(0.3, 2);
    expect(globalWeights[1]).toBeCloseTo(0.5, 2);
    expect(globalWeights[2]).toBeCloseTo(0.4, 2);
  });
});
