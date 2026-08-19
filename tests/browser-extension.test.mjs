import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticContentAnalyzer } from '../app/(main)/browser-extension/_components/extension-algorithm.js';

describe('Context-Aware Browser Extension Algorithm', () => {
    let analyzer;
    const mockCurriculum = [
        { id: "1", name: "Docker Basics", status: "active", tags: ["containerization", "devops"] },
        { id: "2", name: "Storage", status: "recommended", tags: ["storage"] },
        { id: "3", name: "React", status: "locked", tags: ["frontend"] }
    ];

    beforeEach(() => {
        analyzer = new SemanticContentAnalyzer(mockCurriculum);
    });

    it('should throw error if initialized without curriculum', () => {
        expect(() => new SemanticContentAnalyzer()).toThrow("User curriculum is required");
    });

    it('should return empty array for empty or invalid text', () => {
        expect(analyzer.analyzeDOMText(null)).toEqual([]);
        expect(analyzer.analyzeDOMText("")).toEqual([]);
    });

    it('should identify semantic keywords and map to active modules', () => {
        // Text contains "Docker" -> maps to "containerization", "devops" -> matches module 1
        const text = "Let's learn about Docker and how it works.";
        const matches = analyzer.analyzeDOMText(text);

        expect(matches).toHaveLength(1);
        expect(matches[0].moduleId).toBe("1");
        expect(matches[0].triggerConcepts).toContain("containerization");
    });

    it('should prioritize matches with higher relevance scores', () => {
        // Text contains "Docker" (module 1) and "Volume" (module 2)
        // Let's modify module 1 to have 2 matching tags for "Docker", and module 2 to have 1 matching tag for "Volume"
        // Actually, Docker maps to 2 tags, Volume maps to 2 tags.
        // Let's make a text that heavily matches one.
        // The algorithm simply intersects tags.
        // Docker -> containerization, devops. Mod 1 has both. Intersect length = 2.
        // Volume -> storage, persistence. Mod 2 has storage. Intersect length = 1.
        const text = "Docker is great, but how do we use a volume?";
        const matches = analyzer.analyzeDOMText(text);

        expect(matches).toHaveLength(2);
        // Module 1 should be first because it matches 2 tags (containerization, devops), Mod 2 matches 1 (storage)
        expect(matches[0].moduleId).toBe("1");
        expect(matches[1].moduleId).toBe("2");
    });

    it('should ignore locked modules even if concepts match', () => {
        const text = "I love programming in React.";
        const matches = analyzer.analyzeDOMText(text);

        // React maps to frontend. Module 3 has frontend, but is locked.
        expect(matches).toHaveLength(0);
    });
});
