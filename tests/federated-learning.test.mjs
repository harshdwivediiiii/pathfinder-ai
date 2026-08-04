import { describe, it, expect } from 'vitest';
import { initializeFederatedClients, performLocalTraining, aggregateGlobalModel } from '../app/(main)/federated-learning/_components/federated-algorithm.js';

describe('Federated Learning Algorithm', () => {
  it('updates weights correctly through local training and global aggregation', () => {
    // Initialize 3 clients
    const clients = initializeFederatedClients(3);
    expect(clients.length).toBe(3);
    
    // Store initial global model
    const initialGlobal = aggregateGlobalModel(clients);
    
    // Perform 10 epochs of local training
    const trainedClients = performLocalTraining(clients, 10, 0.1);
    
    // Check that clients updated their weights
    expect(trainedClients[0].hasUpdate).toBe(true);
    expect(trainedClients[0].weights[0]).not.toBe(clients[0].weights[0]);
    
    // Aggregate new global model
    const newGlobal = aggregateGlobalModel(trainedClients);
    
    // Verify global model changed due to training
    expect(newGlobal[0]).not.toBe(initialGlobal[0]);
    expect(newGlobal[1]).not.toBe(initialGlobal[1]);
  });
});
