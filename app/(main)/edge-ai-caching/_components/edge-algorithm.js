/**
 * Simulates predicting the next 3 steps of a pathway based on current progress.
 * In a real PWA, this runs on the Service Worker to aggressively pre-fetch content
 * before the user loses network connectivity.
 */
export function predictAndCacheNextSteps(currentModuleId) {
    // Mock pathway database
    const pathway = [
        { id: 'mod_1', title: 'HTML Syntax', type: 'lesson' },
        { id: 'mod_2', title: 'CSS Grid', type: 'lesson' },
        { id: 'mod_3', title: 'Layout Quiz', type: 'quiz', keywords: ['display', 'grid', 'columns', 'rows'] },
        { id: 'mod_4', title: 'JavaScript Variables', type: 'lesson' },
        { id: 'mod_5', title: 'Functions', type: 'lesson' },
        { id: 'mod_6', title: 'Logic Quiz', type: 'quiz', keywords: ['return', 'scope', 'parameter'] },
        { id: 'mod_7', title: 'DOM Manipulation', type: 'lesson' }
    ];

    const currentIndex = pathway.findIndex(mod => mod.id === currentModuleId);
    if (currentIndex === -1) return [];

    // Predict and return the next 3 modules
    const cachedSteps = [];
    for (let i = 1; i <= 3; i++) {
        if (currentIndex + i < pathway.length) {
            cachedSteps.push(pathway[currentIndex + i]);
        }
    }
    
    return cachedSteps;
}

/**
 * Simulates a lightweight Edge AI (TensorFlow.js) NLP model running entirely locally.
 * It grades a user's free-text quiz answer by checking for semantic keyword overlap,
 * allowing the user to progress even when completely offline.
 */
export function evaluateOfflineQuiz(userAnswer, expectedKeywords) {
    if (!userAnswer || !expectedKeywords || expectedKeywords.length === 0) {
        return { isCorrect: false, score: 0, feedback: "Invalid input data." };
    }
    
    const normalizedAnswer = userAnswer.toLowerCase();
    let matches = 0;
    
    expectedKeywords.forEach(keyword => {
        if (normalizedAnswer.includes(keyword.toLowerCase())) {
            matches++;
        }
    });
    
    const score = (matches / expectedKeywords.length) * 100;
    const isCorrect = score >= 60; // 60% threshold for passing
    
    let feedback = "";
    if (isCorrect) {
        feedback = "Great job! The local Edge AI detected strong understanding of the core concepts.";
    } else {
        feedback = `You missed some key concepts. Try mentioning: ${expectedKeywords.join(', ')}.`;
    }
    
    return {
        isCorrect,
        score,
        feedback
    };
}
