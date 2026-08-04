/**
 * Simple pseudo-random number generator for predictable client generation
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Initializes a set of local device models (clients)
 */
export function initializeFederatedClients(numClients, seed = 42) {
  const clients = [];
  
  for (let i = 0; i < numClients; i++) {
    // Each client has a local weight vector (e.g., [w1, w2]) 
    // initialized randomly.
    const w1 = (seededRandom(seed + i * 2) * 2 - 1) * 0.1;
    const w2 = (seededRandom(seed + i * 2 + 1) * 2 - 1) * 0.1;
    
    // Each client also has some local "true" traffic data it observed
    // Ground truth w1=2.5, w2=-1.2, but local data is noisy.
    const trueW1 = 2.5 + (seededRandom(seed * 3 + i) - 0.5);
    const trueW2 = -1.2 + (seededRandom(seed * 4 + i) - 0.5);
    
    clients.push({
      id: `Device-${i+1}`,
      weights: [w1, w2],
      localDataDist: [trueW1, trueW2],
      x: seededRandom(seed * 5 + i),
      y: seededRandom(seed * 6 + i),
      isTraining: false,
      hasUpdate: false
    });
  }
  return clients;
}

/**
 * Performs one round of local training on the clients.
 */
export function performLocalTraining(clients, epochs = 1, learningRate = 0.05) {
  return clients.map(client => {
    let [w1, w2] = client.weights;
    const [t1, t2] = client.localDataDist;
    
    // Simulated gradient descent towards the local "true" distribution
    for (let e = 0; e < epochs; e++) {
        w1 -= learningRate * (w1 - t1);
        w2 -= learningRate * (w2 - t2);
    }
    
    return {
      ...client,
      weights: [w1, w2],
      isTraining: false,
      hasUpdate: true
    };
  });
}

/**
 * Aggregates client weights securely using Federated Averaging (FedAvg).
 */
export function aggregateGlobalModel(clients) {
  if (clients.length === 0) return [0, 0];
  
  let sumW1 = 0;
  let sumW2 = 0;
  
  for (const client of clients) {
    sumW1 += client.weights[0];
    sumW2 += client.weights[1];
  }
  
  return [sumW1 / clients.length, sumW2 / clients.length];
}
