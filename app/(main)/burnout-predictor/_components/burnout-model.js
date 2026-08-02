import * as tf from '@tensorflow/tfjs';

// Generate synthetic training data
// Features: [jobSatisfaction (1-10), workHours (30-80), negativeJournals (0-7), daysSincePTO (0-365)]
function generateTrainingData() {
  const numSamples = 200;
  const features = [];
  const labels = [];

  for (let i = 0; i < numSamples; i++) {
    const isBurnout = Math.random() > 0.5;
    
    let satisfaction, hours, negativeJournals, daysSincePTO;
    
    if (isBurnout) {
      satisfaction = Math.floor(Math.random() * 5) + 1; // 1-5
      hours = Math.floor(Math.random() * 30) + 50; // 50-80
      negativeJournals = Math.floor(Math.random() * 4) + 4; // 4-7
      daysSincePTO = Math.floor(Math.random() * 200) + 90; // 90-290
    } else {
      satisfaction = Math.floor(Math.random() * 5) + 6; // 6-10
      hours = Math.floor(Math.random() * 20) + 30; // 30-50
      negativeJournals = Math.floor(Math.random() * 3); // 0-2
      daysSincePTO = Math.floor(Math.random() * 60); // 0-60
    }

    // Normalize inputs
    features.push([
      satisfaction / 10,
      hours / 80,
      negativeJournals / 7,
      daysSincePTO / 365
    ]);
    
    labels.push([isBurnout ? 1 : 0]);
  }

  return {
    xs: tf.tensor2d(features),
    ys: tf.tensor2d(labels)
  };
}

let modelCache = null;

async function getOrTrainModel() {
  if (modelCache) return modelCache;

  const model = tf.sequential();
  
  // Input layer: 4 features
  model.add(tf.layers.dense({
    inputShape: [4],
    units: 8,
    activation: 'relu'
  }));
  
  // Hidden layer
  model.add(tf.layers.dense({
    units: 4,
    activation: 'relu'
  }));
  
  // Output layer: 1 output (Burnout Probability)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  const { xs, ys } = generateTrainingData();

  await model.fit(xs, ys, {
    epochs: 50,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
      }
    }
  });

  xs.dispose();
  ys.dispose();

  modelCache = model;
  return model;
}

export async function predictBurnoutScore(inputs) {
  const { satisfaction, hours, negativeJournals, daysSincePTO } = inputs;
  
  const model = await getOrTrainModel();
  
  // Normalize the input data using the same scale as training
  const normalizedInput = tf.tensor2d([[
    Math.min(Math.max(satisfaction, 1), 10) / 10,
    Math.min(Math.max(hours, 30), 80) / 80,
    Math.min(Math.max(negativeJournals, 0), 7) / 7,
    Math.min(Math.max(daysSincePTO, 0), 365) / 365
  ]]);

  const prediction = model.predict(normalizedInput);
  const score = await prediction.data();
  
  normalizedInput.dispose();
  prediction.dispose();
  
  return score[0];
}
