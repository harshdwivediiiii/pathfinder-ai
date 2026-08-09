/**
 * Simulates training a model locally on the user's edge device.
 * It consumes raw, highly sensitive data (e.g., specific failed questions, time spent struggling)
 * and outputs only a non-reversible numerical weight array (the model delta).
 */
export function trainLocalModel(sensitiveLocalData) {
    if (!sensitiveLocalData) return null;
    
    // Simulate complex local backpropagation based on quiz failures and struggle time
    let w1 = sensitiveLocalData.struggleTimeMinutes * 0.05;
    let w2 = (100 - sensitiveLocalData.quizScore) * 0.1;
    let w3 = sensitiveLocalData.hintsUsed * 0.2;
    
    // Normalize and add some stochastic noise
    const weights = [
        Math.min(1.0, w1 + (Math.random() * 0.1)),
        Math.min(1.0, w2 + (Math.random() * 0.1)),
        Math.min(1.0, w3 + (Math.random() * 0.1))
    ];
    
    return {
        clientId: sensitiveLocalData.userId,
        timestamp: new Date().toISOString(),
        modelWeights: weights
    };
}

/**
 * Simulates the Central Server performing Federated Averaging (FedAvg).
 * It takes the weights from multiple clients and computes a new global model,
 * having never seen the raw sensitive data of any individual user.
 */
export function aggregateGlobalModel(clientWeightUpdates) {
    if (!clientWeightUpdates || clientWeightUpdates.length === 0) return [];
    
    const numClients = clientWeightUpdates.length;
    const numWeights = clientWeightUpdates[0].modelWeights.length;
    
    const aggregatedWeights = new Array(numWeights).fill(0);
    
    // Sum all weights
    clientWeightUpdates.forEach(update => {
        for (let i = 0; i < numWeights; i++) {
            aggregatedWeights[i] += update.modelWeights[i];
        }
    });
    
    // Average them
    for (let i = 0; i < numWeights; i++) {
        aggregatedWeights[i] = Number((aggregatedWeights[i] / numClients).toFixed(4));
    }
    
    return aggregatedWeights;
}
