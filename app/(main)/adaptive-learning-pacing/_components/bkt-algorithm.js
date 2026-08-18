/**
 * Simulates Bayesian Knowledge Tracing (BKT).
 * Assesses the probability that a user has mastered a specific concept
 * based on a sequence of quiz results.
 * 
 * @param prior - Initial probability of knowing the skill
 * @param learn - Probability of transitioning to knowing state after practice
 * @param guess - Probability of guessing correctly without knowing
 * @param slip - Probability of making a mistake despite knowing
 * @param results - Array of boolean quiz results (true = correct, false = incorrect)
 */
export function calculateMasteryBKT(prior, learn, guess, slip, results) {
    if (!Array.isArray(results) || prior == null || learn == null || guess == null || slip == null) {
        return { error: "Invalid BKT parameters provided." };
    }
    
    let pKnown = prior;
    
    for (const result of results) {
        let pCorrect;
        
        if (result) { // Answered Correctly
            pCorrect = (pKnown * (1 - slip)) + ((1 - pKnown) * guess);
            // Bayesian update given correct response
            pKnown = (pKnown * (1 - slip)) / pCorrect;
        } else { // Answered Incorrectly
            const pIncorrect = (pKnown * slip) + ((1 - pKnown) * (1 - guess));
            // Bayesian update given incorrect response
            pKnown = (pKnown * slip) / pIncorrect;
        }
        
        // Add probability of learning the skill during this iteration
        pKnown = pKnown + ((1 - pKnown) * learn);
    }
    
    return {
        masteryProbability: Number(pKnown.toFixed(4))
    };
}

/**
 * Optimizes the learning pathway. If mastery is high, prunes redundant modules.
 */
export function prunePathway(masteryProbability, threshold, originalPathway) {
    if (!originalPathway || !Array.isArray(originalPathway)) {
        return { error: "Invalid original pathway." };
    }
    
    if (masteryProbability >= threshold) {
        // High mastery: Prune "beginner" or "intro" modules to accelerate pacing
        const pruned = originalPathway.filter(mod => !mod.isBeginner);
        return {
            action: 'accelerate',
            message: `High proficiency detected (${(masteryProbability * 100).toFixed(1)}%). Redundant beginner modules skipped.`,
            newPathway: pruned
        };
    } else {
        // Low mastery: Keep original pathway to ensure solid fundamentals
        return {
            action: 'maintain',
            message: `Proficiency requires reinforcement (${(masteryProbability * 100).toFixed(1)}%). Standard pacing maintained.`,
            newPathway: originalPathway
        };
    }
}
