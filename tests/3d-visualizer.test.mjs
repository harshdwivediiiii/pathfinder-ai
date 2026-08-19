import { describe, it, expect, beforeEach } from 'vitest';
import { WebGLVisualizerEngine } from '../app/(main)/3d-visualizer/_components/webgl-engine.js';

describe('3D Code Execution Visualizer in WebGL', () => {
    let engine;

    beforeEach(() => {
        engine = new WebGLVisualizerEngine();
    });

    it('should throw error on invalid code string', () => {
        expect(() => engine.parseCode(null)).toThrow("Invalid code provided for visualization");
    });

    it('should generate a sequence of frames for the simulation', () => {
        const frameCount = engine.parseCode("function main() {} main();");
        expect(frameCount).toBeGreaterThan(0);
        expect(engine.getAllFrames().length).toBe(frameCount);
    });

    it('should correctly build frame sequence logic (Push, Allocate, Pop, Sweep)', () => {
        engine.parseCode("test");
        const frames = engine.getAllFrames();
        
        // Initial state
        expect(frames[0].action).toBe('INITIALIZE');
        expect(frames[0].callStack.length).toBe(0);

        // First push
        expect(frames[1].action).toBe('PUSH_STACK');
        expect(frames[1].callStack.length).toBe(1);

        // Memory allocation
        expect(frames[2].action).toBe('ALLOCATE_HEAP');
        expect(frames[2].heap.length).toBe(1);
        expect(frames[2].heap[0].isReferenced).toBe(true);

        // Loss of reference
        expect(frames[4].action).toBe('POP_STACK');
        expect(frames[4].heap[0].isReferenced).toBe(false);

        // GC Sweep
        expect(frames[5].action).toBe('GARBAGE_COLLECTION');
        expect(frames[5].heap.length).toBe(0);
    });

    it('should return null for out of bounds frame indices', () => {
        engine.parseCode("test");
        expect(engine.getFrame(-1)).toBeNull();
        expect(engine.getFrame(100)).toBeNull();
    });
});
