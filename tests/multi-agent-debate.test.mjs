import { describe, it, expect, beforeEach } from 'vitest';
import { DebateOrchestrator } from '../app/(main)/multi-agent-debate/_components/debate-orchestrator.js';

describe('Multi-Agent Debate Simulation for System Design', () => {
    let orchestrator;

    beforeEach(() => {
        orchestrator = new DebateOrchestrator();
    });

    it('should throw error if starting without a topic', () => {
        expect(() => orchestrator.startSession(null)).toThrow("A system design topic is required");
    });

    it('should initialize session correctly', () => {
        const session = orchestrator.startSession("Design Twitter");
        expect(session.topic).toBe("Design Twitter");
        expect(session.agents.length).toBe(3);
        expect(orchestrator.isDebating).toBe(true);
    });

    it('should throw error if submitting argument without starting', async () => {
        await expect(orchestrator.submitArgument("I use postgres")).rejects.toThrow("Debate session has not been started");
    });

    it('should generate DBA and DevOps responses for SQL + Monolith argument', async () => {
        orchestrator.startSession("Design Twitter");
        const responses = await orchestrator.submitArgument("I will use a PostgreSQL database to ensure consistency.");
        
        expect(responses.some(r => r.role === 'Database Administrator')).toBe(true);
        expect(responses.some(r => r.role === 'DevOps Engineer')).toBe(true);
        expect(responses.some(r => r.role === 'Security Auditor')).toBe(true); // Security responds because no auth was mentioned
    });

    it('should append conversation to history', async () => {
        orchestrator.startSession("Design Twitter");
        await orchestrator.submitArgument("I will use NoSQL.");
        
        const history = orchestrator.endSession();
        expect(orchestrator.isDebating).toBe(false);
        expect(history.length).toBeGreaterThan(1);
        expect(history[0].role).toBe("Lead Architect");
        expect(history[1].sender).toBe("agent");
    });
});
