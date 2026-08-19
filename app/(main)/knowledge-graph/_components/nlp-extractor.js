/**
 * Simulates an NLP Information Extraction (IE) pipeline.
 * Parses unstructured documentation text and constructs a 
 * structured Knowledge Graph (Nodes and Edges).
 */

export class NLPKnowledgeExtractor {
    constructor() {
        this.extractedGraph = {
            nodes: [],
            edges: []
        };
    }

    async extractGraph(markdownText) {
        if (!markdownText || typeof markdownText !== 'string' || markdownText.length < 20) {
            throw new Error("Invalid or insufficient text provided for extraction.");
        }

        // Simulate API latency for NLP inference (e.g., passing to an LLM or SpaCy pipeline)
        return new Promise((resolve) => {
            setTimeout(() => {
                this.extractedGraph = this._simulateExtractionLogic(markdownText);
                resolve(this.extractedGraph);
            }, 1500);
        });
    }

    _simulateExtractionLogic(text) {
        const lowerText = text.toLowerCase();
        const nodes = new Map();
        const edges = [];

        const addNode = (id, label, type) => {
            if (!nodes.has(id)) {
                nodes.set(id, { id, label, type });
            }
        };

        const addEdge = (source, target, relation) => {
            edges.push({ id: `e_${source}_${target}`, source, target, relation });
        };

        // Simulated heuristic extraction rules for demo purposes
        if (lowerText.includes("next.js 15") || lowerText.includes("react server components")) {
            addNode("n_nextjs15", "Next.js 15", "Framework");
            addNode("n_rsc", "React Server Components", "Architecture");
            addNode("n_app_router", "App Router", "Feature");
            addNode("n_turbopack", "Turbopack", "Tooling");

            addEdge("n_nextjs15", "n_rsc", "IMPLEMENTS");
            addEdge("n_nextjs15", "n_app_router", "USES");
            addEdge("n_nextjs15", "n_turbopack", "BUNDLES_WITH");
        } 
        else if (lowerText.includes("docker") || lowerText.includes("container")) {
            addNode("n_docker", "Docker", "Tool");
            addNode("n_container", "Container", "Concept");
            addNode("n_image", "Image", "Artifact");
            addNode("n_volume", "Volume", "Storage");

            addEdge("n_docker", "n_container", "ORCHESTRATES");
            addEdge("n_container", "n_image", "INSTANTIATED_FROM");
            addEdge("n_container", "n_volume", "MOUNTS");
        }
        else {
            // Generic fallback extraction
            addNode("n_concept_a", "Core Concept A", "Concept");
            addNode("n_concept_b", "Sub Concept B", "Concept");
            addEdge("n_concept_a", "n_concept_b", "RELATES_TO");
        }

        return {
            nodes: Array.from(nodes.values()),
            edges
        };
    }

    generateCurriculumDraft() {
        if (this.extractedGraph.nodes.length === 0) {
            throw new Error("Knowledge Graph is empty. Cannot generate curriculum.");
        }

        const rootNode = this.extractedGraph.nodes[0];
        const draft = {
            title: `Mastering ${rootNode.label}`,
            modules: []
        };

        this.extractedGraph.edges.forEach((edge, index) => {
            const targetNode = this.extractedGraph.nodes.find(n => n.id === edge.target);
            draft.modules.push({
                moduleId: `mod_${index}`,
                title: `Understanding ${targetNode.label}`,
                description: `Learn how ${rootNode.label} ${edge.relation.toLowerCase()} ${targetNode.label}.`,
                type: targetNode.type
            });
        });

        return draft;
    }
}
