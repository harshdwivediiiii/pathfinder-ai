/**
 * Simulates a background script for a Context-Aware Browser Extension.
 * Analyzes third-party DOM text and maps semantic keywords back to
 * the user's active Pathfinder AI curriculum.
 */

export class SemanticContentAnalyzer {
    constructor(userCurriculum) {
        if (!userCurriculum) {
            throw new Error("User curriculum is required to initialize the context analyzer.");
        }
        this.curriculum = userCurriculum;
        
        // Dictionary mapping common technical terms to abstract concepts
        this.conceptMap = {
            "docker": ["containerization", "devops"],
            "volume": ["storage", "persistence"],
            "react": ["frontend", "components"],
            "aws": ["cloud", "infrastructure"],
            "s3": ["storage", "cloud"],
            "sql": ["database", "querying"]
        };
    }

    analyzeDOMText(text) {
        if (!text || typeof text !== 'string') return [];

        const lowerText = text.toLowerCase();
        const detectedConcepts = new Set();
        const matches = [];

        // 1. Identify keywords in the text
        for (const [keyword, concepts] of Object.entries(this.conceptMap)) {
            if (lowerText.includes(keyword)) {
                concepts.forEach(c => detectedConcepts.add(c));
            }
        }

        // 2. Cross-reference detected concepts with the user's curriculum
        for (const mod of this.curriculum) {
            if (mod.status === 'active' || mod.status === 'recommended') {
                const intersection = mod.tags.filter(tag => detectedConcepts.has(tag));
                if (intersection.length > 0) {
                    matches.push({
                        moduleId: mod.id,
                        moduleName: mod.name,
                        relevanceScore: intersection.length,
                        triggerConcepts: intersection
                    });
                }
            }
        }

        // Return sorted by relevance
        return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    generateTooltipPayload(match) {
        if (!match) return null;
        
        return {
            title: `Pathfinder AI Connection`,
            description: `This concept relates to your active module: ${match.moduleName}`,
            actionUrl: `https://pathfinder.ai/learn/${match.moduleId}`,
            tags: match.triggerConcepts
        };
    }
}
