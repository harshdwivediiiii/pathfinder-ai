import { describe, it, expect, beforeEach } from 'vitest';
import { ZKProofGenerator } from '../app/(main)/zk-proofs/_components/zk-algorithm.js';

describe('Zero-Knowledge Proofs for Anonymous Grading', () => {
    let zk;

    beforeEach(() => {
        zk = new ZKProofGenerator();
    });

    it('should throw error if generating proof without data', () => {
        expect(() => zk.generateProof(null, {})).toThrow("Both submission data and private identity are required");
        expect(() => zk.generateProof({}, null)).toThrow("Both submission data and private identity are required");
    });

    it('should generate a valid proof payload with public signals', async () => {
        const payload = await zk.generateProof({ repo: "test" }, { name: "User" });
        
        expect(payload.proof).toBeDefined();
        expect(payload.proof.protocol).toBe("groth16");
        expect(payload.publicSignals).toHaveLength(2);
        expect(payload.publicSignals[1]).toBe("1"); // Valid cohort flag
    });

    it('should mathematically verify a valid proof', async () => {
        const payload = await zk.generateProof({ repo: "test" }, { name: "User" });
        const isValid = zk.verifyProof(payload.proof, payload.publicSignals);
        
        expect(isValid).toBe(true);
    });

    it('should reject invalid proofs or tampered signals', async () => {
        const payload = await zk.generateProof({ repo: "test" }, { name: "User" });
        
        // Tamper with the public signal (e.g. invalid cohort)
        payload.publicSignals[1] = "0"; 
        
        const isValid = zk.verifyProof(payload.proof, payload.publicSignals);
        expect(isValid).toBe(false);

        // Tamper with protocol
        payload.proof.protocol = "fake_protocol";
        payload.publicSignals[1] = "1";
        expect(zk.verifyProof(payload.proof, payload.publicSignals)).toBe(false);
    });
});
