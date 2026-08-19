import { describe, it, expect, beforeEach } from 'vitest';
import { LocalWasmLLM } from '../app/(main)/wasm-local-llms/_components/wasm-algorithm.js';

describe('WASM-based Local LLMs for Privacy-First Code Tutoring', () => {
    let llm;

    beforeEach(() => {
        llm = new LocalWasmLLM();
    });

    it('should throw error if generating before loading model', async () => {
        await expect(llm.generateResponse("code", "prompt")).rejects.toThrow("Model is not loaded");
    });

    it('should successfully load the model and allocate memory', async () => {
        const success = await llm.loadModel("Llama-3-8B-Q4");
        expect(success).toBe(true);
        expect(llm.isLoaded).toBe(true);
        expect(llm.memoryUsageMB).toBe(4096);
        expect(llm.modelParams.quantization).toBe("4-bit");
    });

    it('should generate security-focused response locally when prompt involves security', async () => {
        await llm.loadModel("Llama-3-8B-Q4");
        const result = await llm.generateResponse("let userInput = req.body;", "Is there a security vulnerability here?");
        
        expect(result.response).toContain("security vulnerability");
        expect(result.response).toContain("XSS attacks");
        expect(result.privacyStatus).toContain("100% Local");
    });

    it('should generate performance-focused response locally when prompt involves optimization', async () => {
        await llm.loadModel("Llama-3-8B-Q4");
        const result = await llm.generateResponse("for(i){ for(j){ } }", "How can I optimize this?");
        
        expect(result.response).toContain("O(n^2)");
        expect(result.response).toContain("optimize this to O(n)");
    });
});
