/**
 * Pre-defined mock vector database of courses
 * In a real system, these would be 1536-dimensional embeddings (e.g., text-embedding-3-small)
 */
export const vectorDb = [
    {
        id: 'c1',
        title: 'Advanced CSS and Tailwind',
        category: 'Frontend',
        intentTags: ['design', 'look good', 'styles', 'ui', 'user interface', 'beautiful', 'responsive', 'mobile']
    },
    {
        id: 'c2',
        title: 'Node.js Microservices Architecture',
        category: 'Backend',
        intentTags: ['scale', 'server', 'api', 'data', 'database', 'high traffic', 'performance', 'backend']
    },
    {
        id: 'c3',
        title: 'Machine Learning with PyTorch',
        category: 'Data Science',
        intentTags: ['ai', 'predict', 'model', 'data', 'smart', 'intelligence', 'brain', 'neural']
    },
    {
        id: 'c4',
        title: 'Kubernetes Cluster Management',
        category: 'DevOps',
        intentTags: ['deploy', 'cloud', 'host', 'live', 'production', 'servers', 'scale', 'infrastructure']
    },
    {
        id: 'c5',
        title: 'Figma to React Pro',
        category: 'Frontend',
        intentTags: ['design', 'mockup', 'ui', 'ux', 'look good', 'pixel perfect', 'frontend']
    }
];

/**
 * Simulates a semantic vector search by mapping natural language intent to pre-defined tags
 * using a simulated cosine similarity scoring mechanism.
 */
export function simulateVectorSearch(query) {
    if (!query || query.trim() === '') return [];
    
    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/);
    
    // Calculate a simulated "cosine similarity" score for each document in the DB
    const scoredResults = vectorDb.map(course => {
        let matchScore = 0;
        
        // Direct string match (basic)
        if (course.title.toLowerCase().includes(normalizedQuery)) {
            matchScore += 0.8;
        }
        
        // Semantic intent match (simulating vector proximity)
        course.intentTags.forEach(tag => {
            // Does the query contain the exact intent tag?
            if (normalizedQuery.includes(tag)) {
                matchScore += 0.5;
            } else {
                // Do any query tokens partially match intent tags? (fuzzy semantic)
                queryTokens.forEach(token => {
                    if (token.length > 3 && tag.includes(token)) {
                        matchScore += 0.2;
                    }
                });
            }
        });
        
        // Specific natural language mappings to simulate a true LLM embedding model
        if (normalizedQuery.includes('make websites look good') || normalizedQuery.includes('pretty')) {
            if (course.category === 'Frontend') matchScore += 2.0;
        }
        
        if (normalizedQuery.includes('live on the internet') || normalizedQuery.includes('put my server live')) {
            if (course.category === 'DevOps') matchScore += 2.0;
        }
        
        if (normalizedQuery.includes('make an ai') || normalizedQuery.includes('chatgpt')) {
            if (course.category === 'Data Science') matchScore += 2.0;
        }

        // Cap at 0.99 for realism
        const finalScore = Math.min(0.99, matchScore);
        
        return {
            ...course,
            rawScore: matchScore,
            similarityScore: finalScore
        };
    });
    
    // Filter out very low scores (thresholding) and sort descending by raw score
    return scoredResults
        .filter(res => res.rawScore > 0.15)
        .sort((a, b) => b.rawScore - a.rawScore);
}
