import { describe, it, expect, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../app/(main)/autonomous-code-review/_components/review-algorithm.js';

describe('Autonomous Agents for Simulated Code Reviews', () => {
    let orchestrator;

    beforeEach(() => {
        orchestrator = new AgentOrchestrator();
    });

    it('should throw error if analyzing without diff', async () => {
        await expect(orchestrator.analyzePullRequest({})).rejects.toThrow("diff is required");
    });

    it('should trigger Strict Security Auditor on hardcoded secrets', async () => {
        const diff = `+ const secret = "my_password_123";`;
        const result = await orchestrator.analyzePullRequest({ diff });
        
        expect(result.status).toBe("changes_requested");
        const secComment = result.comments.find(c => c.agentId === "sec_bot");
        expect(secComment).toBeDefined();
        expect(secComment.severity).toBe("high");
    });

    it('should trigger Performance Optimizer on nested loops', async () => {
        const diff = `
+ for(let i=0; i<10; i++) {
+   for(let j=0; j<10; j++) {
+     console.log("n^2");
+   }
+ }
        `;
        const result = await orchestrator.analyzePullRequest({ diff });
        
        const perfComment = result.comments.find(c => c.agentId === "perf_bot");
        expect(perfComment).toBeDefined();
        expect(perfComment.severity).toBe("medium");
    });

    it('should trigger Clean Code Advocate on var usage', async () => {
        const diff = `+ var x = 10;`;
        const result = await orchestrator.analyzePullRequest({ diff });
        
        const cleanComment = result.comments.find(c => c.agentId === "clean_bot");
        expect(cleanComment).toBeDefined();
        expect(cleanComment.severity).toBe("low");
    });

    it('should approve clean code', async () => {
        const diff = `+ const x = 10;`;
        const result = await orchestrator.analyzePullRequest({ diff });
        
        expect(result.status).toBe("approved");
        expect(result.comments.length).toBe(1);
        expect(result.comments[0].severity).toBe("info");
        expect(result.comments[0].message).toContain("LGTM");
    });
});
