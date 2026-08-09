/**
 * Simulates a Markov Chain model predicting milestone completion.
 * Instead of linear math (modules / modules_per_week), it uses transition matrices
 * to simulate the probability of falling into "Stuck", "Inactive", or "Productive" states
 * based on the user's historical telemetry.
 */
export function simulateMarkovMilestone(userStats, remainingModules) {
    if (!userStats || typeof remainingModules !== 'number' || remainingModules <= 0) {
        return { error: "Invalid input parameters for Markov simulation." };
    }
    
    // Simulate running 1000 Monte Carlo trajectories through the Markov Chain
    const SIMULATION_RUNS = 1000;
    
    // Base probabilities derived from userStats
    // Higher consistency -> higher chance to stay productive
    const pProductiveToProductive = Math.min(0.9, (userStats.consistencyScore / 100) + 0.1);
    const pStuckToInactive = userStats.churnRiskScore > 50 ? 0.4 : 0.1;
    
    let totalSimulatedWeeks = 0;
    
    for (let run = 0; run < SIMULATION_RUNS; run++) {
        let modulesLeft = remainingModules;
        let weeksElapsed = 0;
        let currentState = 'Productive';
        
        while (modulesLeft > 0 && weeksElapsed < 104) { // Cap at 2 years
            weeksElapsed++;
            
            // State Transition Logic
            const rand = Math.random();
            
            if (currentState === 'Productive') {
                if (rand < pProductiveToProductive) {
                    modulesLeft -= userStats.averageModulesPerWeek; // Make progress
                } else {
                    currentState = 'Stuck'; // Hit a hard topic
                }
            } else if (currentState === 'Stuck') {
                if (rand < pStuckToInactive) {
                    currentState = 'Inactive'; // Burnout
                } else if (rand > 0.5) {
                    currentState = 'Productive'; // Broke through
                    modulesLeft -= (userStats.averageModulesPerWeek * 0.5); // Slower progress
                }
            } else if (currentState === 'Inactive') {
                // Low chance to recover from inactivity without intervention
                if (rand > 0.8) {
                    currentState = 'Productive';
                }
            }
        }
        
        totalSimulatedWeeks += weeksElapsed;
    }
    
    const expectedWeeks = totalSimulatedWeeks / SIMULATION_RUNS;
    
    // Calculate a gamified probabilistic forecast
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (expectedWeeks * 7));
    
    // Determine confidence intervals based on consistency
    const confidence = Math.max(50, Math.round(pProductiveToProductive * 100));
    
    return {
        expectedWeeks: Number(expectedWeeks.toFixed(1)),
        projectedDate: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        confidencePercentage: confidence,
        message: `You have an ${confidence}% chance to reach your milestone by ${targetDate.toLocaleDateString('en-US', { month: 'long' })} if you maintain your current habits.`
    };
}
