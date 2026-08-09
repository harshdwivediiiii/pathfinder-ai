/**
 * Initializes the Multi-Armed Bandit arms (content formats)
 */
export function initializeArms() {
    return [
        { id: 'video', label: 'Video Lecture', pulls: 0, totalReward: 0, qValue: 0.5 },
        { id: 'text', label: 'Text Article', pulls: 0, totalReward: 0, qValue: 0.5 },
        { id: 'interactive', label: 'Interactive Code Quiz', pulls: 0, totalReward: 0, qValue: 0.5 }
    ];
}

/**
 * Selects an arm using the Epsilon-Greedy policy
 * Epsilon (e.g., 0.2) is the probability of exploring a random arm instead of exploiting the best one.
 */
export function selectArm(arms, epsilon = 0.2) {
    // Exploration
    if (Math.random() < epsilon) {
        const randomIndex = Math.floor(Math.random() * arms.length);
        return arms[randomIndex].id;
    }
    
    // Exploitation (find max qValue)
    let bestArm = arms[0];
    for (let i = 1; i < arms.length; i++) {
        if (arms[i].qValue > bestArm.qValue) {
            bestArm = arms[i];
        }
    }
    return bestArm.id;
}

/**
 * Updates the Q-value of the selected arm based on the received reward (e.g., user completion rate/engagement)
 */
export function updateArm(arms, armId, reward) {
    const updatedArms = [...arms];
    const armIndex = updatedArms.findIndex(a => a.id === armId);
    
    if (armIndex !== -1) {
        const arm = { ...updatedArms[armIndex] };
        
        arm.pulls += 1;
        arm.totalReward += reward;
        
        // Simple incremental average update rule
        // Q_{n+1} = Q_n + (1/n) * (R - Q_n)
        arm.qValue = arm.qValue + (1 / arm.pulls) * (reward - arm.qValue);
        
        updatedArms[armIndex] = arm;
    }
    
    return updatedArms;
}

/**
 * Simulates a user interaction environment where a specific format actually yields better engagement.
 * e.g., this specific simulated user highly prefers 'interactive', hates 'video'
 */
export function simulateUserEngagement(armId) {
    // Generate a simulated reward between 0.0 and 1.0 (completion rate)
    
    // Base probabilities for this specific simulated user profile
    const userPreference = {
        'video': 0.2,       // Low base completion rate
        'text': 0.5,        // Medium
        'interactive': 0.9  // High base completion rate
    };
    
    const base = userPreference[armId] || 0.5;
    
    // Add some noise (variance)
    const noise = (Math.random() - 0.5) * 0.3; 
    
    let reward = base + noise;
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, reward));
}
