import { describe, it, expect, beforeEach } from 'vitest';
import { EthicalAILinter } from '../app/(main)/bias-detection/_components/ethical-linter.js';

describe('Subconscious Bias Detection via NLP', () => {
    let linter;

    beforeEach(() => {
        linter = new EthicalAILinter();
    });

    it('should throw error on invalid code input', async () => {
        await expect(linter.scanCode(null)).rejects.toThrow("Invalid code string");
    });

    it('should pass code with no demographic bias', async () => {
        const cleanCode = `
            function filter(c) {
                if (c.years_experience < 2) return false;
                if (c.skills.includes('React')) return true;
                return false;
            }
        `;
        const result = await linter.scanCode(cleanCode);
        expect(result.passed).toBe(true);
        expect(result.violations.length).toBe(0);
        expect(result.requiresIntervention).toBe(false);
    });

    it('should flag direct demographic filtering as Critical', async () => {
        const badCode = `
            if (candidate.gender === 'Female') return false;
        `;
        const result = await linter.scanCode(badCode);
        
        expect(result.passed).toBe(false);
        expect(result.requiresIntervention).toBe(true);
        
        const violation = result.violations[0];
        expect(violation.type).toBe('Direct Demographic Filtering');
        expect(violation.severity).toBe('Critical');
    });

    it('should flag socioeconomic proxy bias (credit score) as Warning', async () => {
        const code = `
            if (user.credit_score < 600) reject();
        `;
        const result = await linter.scanCode(code);
        
        expect(result.passed).toBe(false);
        // Warning doesn't strictly require intervention block in this simplified model,
        // unless there's also a critical violation.
        expect(result.requiresIntervention).toBe(false); 
        
        const violation = result.violations[0];
        expect(violation.type).toBe('Socioeconomic Proxy Bias');
        expect(violation.severity).toBe('Warning');
    });

    it('should flag multiple violations across lines', async () => {
        const code = `
            if (age > 40) return false;
            if (gap_in_resume > 5) return false;
        `;
        const result = await linter.scanCode(code);
        
        expect(result.violations.length).toBe(2);
        expect(result.requiresIntervention).toBe(true); // age > 40 is Critical
        expect(result.violations.some(v => v.type === 'Gender/Maternal Bias')).toBe(true);
    });
});
