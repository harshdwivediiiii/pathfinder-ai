import { describe, it, expect, beforeEach } from 'vitest';
import { NLPKnowledgeExtractor } from '../app/(main)/knowledge-graph/_components/nlp-extractor.js';

describe('Knowledge Graph Extraction from Unstructured Documentation', () => {
    let extractor;

    beforeEach(() => {
        extractor = new NLPKnowledgeExtractor();
    });

    it('should throw error if text is too short or invalid', async () => {
        await expect(extractor.extractGraph("too short")).rejects.toThrow("Invalid or insufficient text");
        await expect(extractor.extractGraph(null)).rejects.toThrow("Invalid or insufficient text");
    });

    it('should extract correct nodes and edges for Next.js docs', async () => {
        const text = "Next.js 15 uses React Server Components and the new App Router. It also bundles with Turbopack.";
        const graph = await extractor.extractGraph(text);
        
        expect(graph.nodes.length).toBeGreaterThan(0);
        expect(graph.nodes.find(n => n.id === 'n_nextjs15')).toBeDefined();
        expect(graph.edges.find(e => e.relation === 'IMPLEMENTS')).toBeDefined();
    });

    it('should extract correct nodes and edges for Docker docs', async () => {
        const text = "Docker is a platform for running containers, which are instantiated from an image and can mount a volume.";
        const graph = await extractor.extractGraph(text);
        
        expect(graph.nodes.find(n => n.id === 'n_docker')).toBeDefined();
        expect(graph.edges.find(e => e.relation === 'ORCHESTRATES')).toBeDefined();
    });

    it('should throw error when generating curriculum before extraction', () => {
        expect(() => extractor.generateCurriculumDraft()).toThrow("Knowledge Graph is empty");
    });

    it('should generate a structured curriculum draft from the extracted graph', async () => {
        const text = "Next.js 15 uses React Server Components and the new App Router.";
        await extractor.extractGraph(text);
        
        const draft = extractor.generateCurriculumDraft();
        expect(draft.title).toContain("Next.js 15");
        expect(draft.modules.length).toBeGreaterThan(0);
        expect(draft.modules[0].moduleId).toContain("mod_");
        expect(draft.modules[0].title).toContain("React Server Components");
    });
});
