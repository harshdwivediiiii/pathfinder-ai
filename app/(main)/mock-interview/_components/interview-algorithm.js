/**
 * Simulates LLM context generation for a mock interview
 * In a real app, this would construct a prompt and call the OpenAI/Anthropic API
 */
export function generateMockQuestion(completedSkills) {
    if (!completedSkills || completedSkills.length === 0) {
        return {
            question: "Can you tell me about your background and what you are looking to learn?",
            expectedKeywords: ['learning', 'growth'],
            context: 'General'
        };
    }
    
    // Simulate contextual LLM generation based on specific path overlaps
    if (completedSkills.includes('react') && completedSkills.includes('node')) {
        return {
            question: "Describe a situation where you had to optimize the data fetching between a React frontend and a Node.js backend. How did you handle state management and network latency?",
            expectedKeywords: ['useeffect', 'caching', 'redux', 'context', 'async', 'await', 'graphql', 'rest', 'pagination'],
            context: 'Fullstack React/Node'
        };
    } else if (completedSkills.includes('python') && completedSkills.includes('ml')) {
        return {
            question: "You have a dataset with a significant class imbalance, and your Python-based ML model is overfitting to the majority class. Walk me through the techniques you would use to resolve this.",
            expectedKeywords: ['smote', 'undersampling', 'oversampling', 'f1', 'precision', 'recall', 'cross-validation', 'regularization'],
            context: 'Machine Learning (Python)'
        };
    } else if (completedSkills.includes('aws') && completedSkills.includes('docker')) {
        return {
            question: "How would you design a scalable CI/CD pipeline using Docker containers to deploy a microservice architecture onto AWS?",
            expectedKeywords: ['ecs', 'eks', 'ecr', 'jenkins', 'github actions', 'fargate', 'registry', 'image'],
            context: 'DevOps (AWS/Docker)'
        };
    }
    
    // Fallback
    return {
        question: `I see you have experience with ${completedSkills[0]}. Can you explain a complex project where you utilized this technology and what the main challenges were?`,
        expectedKeywords: ['challenge', 'solution', 'debug', 'architecture', 'performance'],
        context: 'Single Skill Deep Dive'
    };
}

/**
 * Simulates an LLM evaluating a candidate's answer
 */
export function evaluateAnswer(answerText, expectedKeywords) {
    if (!answerText || answerText.trim() === '') {
        return {
            score: 0,
            feedback: "No answer provided.",
            matchedKeywords: []
        };
    }

    const normalizedAnswer = answerText.toLowerCase();
    
    const matchedKeywords = expectedKeywords.filter(kw => normalizedAnswer.includes(kw.toLowerCase()));
    
    // Calculate a rough score based on keyword hits (in reality, an LLM would do semantic scoring)
    const matchRatio = matchedKeywords.length / expectedKeywords.length;
    
    let score = 0;
    let feedback = "";
    
    if (matchRatio >= 0.5) {
        score = Math.min(100, Math.round(50 + (matchRatio * 50)));
        feedback = "Excellent response. You clearly demonstrated deep technical knowledge and touched on the critical architectural concepts.";
    } else if (matchRatio >= 0.2) {
        score = Math.round(30 + (matchRatio * 40));
        feedback = "Good start, but your answer lacked depth. You missed some key industry-standard approaches to solving this problem.";
    } else {
        score = Math.round(matchRatio * 30);
        feedback = "Your answer was too vague or off-topic. In a technical interview, you need to be specific about the tools and methodologies used.";
    }
    
    return {
        score,
        feedback,
        matchedKeywords
    };
}
