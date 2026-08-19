import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeWebLLMSimulator } from '../app/(main)/edge-quiz/_components/webllm-simulator.js';

describe('Edge-Computed Personalized Quiz Generation', () => {
    let simulator;

    beforeEach(() => {
        simulator = new EdgeWebLLMSimulator();
    });

    it('should throw error if generating before loading model', async () => {
        await expect(simulator.generateQuiz('React', 'easy')).rejects.toThrow("WebLLM Engine is not loaded");
    });

    it('should load model successfully', async () => {
        const result = await simulator.loadModel();
        expect(result.status).toBe('success');
        expect(simulator.isModelLoaded).toBe(true);
        expect(simulator.modelState).toBe('ready');
    });

    it('should throw error if topic is missing', async () => {
        await simulator.loadModel();
        await expect(simulator.generateQuiz(null, 'easy')).rejects.toThrow("topic must be provided");
    });

    it('should generate standard quiz without previous mistakes', async () => {
        await simulator.loadModel();
        const quiz = await simulator.generateQuiz('Next.js', 'easy');
        
        expect(quiz.topic).toBe('Next.js');
        expect(quiz.difficulty).toBe('easy');
        expect(quiz.questions.length).toBe(3);
        expect(quiz.computeSource).toBe('Local WebGPU');
    });

    it('should generate personalized quiz when previous mistakes are provided', async () => {
        await simulator.loadModel();
        const quiz = await simulator.generateQuiz('Next.js', 'hard', ['routing']);
        
        expect(quiz.difficulty).toBe('hard');
        expect(quiz.questions.length).toBe(5);
        
        // First question should specifically address the mistake
        expect(quiz.questions[0].question).toContain("routing");
        expect(quiz.questions[0].explanation).toContain("routing");
    });
});
