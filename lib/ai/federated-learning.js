/**
 * Simulated Federated Learning System for Route Predictions
 * Edge-computing architecture where devices train models locally
 * and only upload encrypted weight updates to the server.
 */

export class FederatedLearningManager {
  constructor() {
    this.modelLayers = [128, 64, 32];
    // Represents the global aggregated model weights
    this.globalWeights = this.initializeWeights();
    this.federatedClientsCount = 0;
  }

  /**
   * Initializes random weights for the global model
   */
  initializeWeights() {
    const weights = [];
    for (let layer of this.modelLayers) {
      const layerWeights = new Float32Array(layer);
      for (let i = 0; i < layer; i++) {
        layerWeights[i] = Math.random() * 0.2 - 0.1;
      }
      weights.push(layerWeights);
    }
    return weights;
  }

  /**
   * Retrieves the current global model weights for a client to download
   */
  getGlobalModel() {
    return {
      version: Date.now(),
      layers: this.modelLayers,
      weights: this.globalWeights.map(layer => Array.from(layer))
    };
  }

  /**
   * Simulates a client training a local model on local telemetry data
   * and returning the weight deltas (gradient updates).
   */
  simulateLocalTraining(localDataCount) {
    const deltas = [];
    const learningRate = 0.01;
    for (let layer of this.modelLayers) {
      const layerDeltas = new Float32Array(layer);
      for (let i = 0; i < layer; i++) {
        // Simulate gradient calculation based on local data
        layerDeltas[i] = (Math.random() - 0.5) * learningRate * (localDataCount / 100);
      }
      deltas.push(layerDeltas);
    }
    return {
      clientDeltas: deltas,
      samplesTrained: localDataCount
    };
  }

  /**
   * Aggregates a batch of client updates using Federated Averaging (FedAvg)
   * @param {Array} clientUpdates - Array of update objects from edge devices
   */
  aggregateUpdates(clientUpdates) {
    if (!clientUpdates || clientUpdates.length === 0) return this.globalWeights;

    let totalSamples = clientUpdates.reduce((sum, update) => sum + update.samplesTrained, 0);

    for (let l = 0; l < this.modelLayers.length; l++) {
      const layerSize = this.modelLayers[l];
      const aggregatedDeltas = new Float32Array(layerSize);

      // Weighted average of deltas
      for (let update of clientUpdates) {
        const weightFactor = update.samplesTrained / totalSamples;
        for (let i = 0; i < layerSize; i++) {
          aggregatedDeltas[i] += update.clientDeltas[l][i] * weightFactor;
        }
      }

      // Apply aggregated deltas to global weights
      for (let i = 0; i < layerSize; i++) {
        this.globalWeights[l][i] += aggregatedDeltas[i];
      }
    }

    this.federatedClientsCount += clientUpdates.length;
    
    return {
      success: true,
      newVersion: Date.now(),
      participantsTotal: this.federatedClientsCount
    };
  }
}

export const globalFederatedManager = new FederatedLearningManager();
