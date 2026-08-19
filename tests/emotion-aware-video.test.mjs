import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionVisionPipeline } from '../app/(main)/emotion-aware-video/_components/cv-algorithm.js';

describe('Emotion-Aware Video Interview Analysis', () => {
    let pipeline;

    beforeEach(() => {
        pipeline = new EmotionVisionPipeline();
    });

    it('should throw error if processing frame before initialization', () => {
        expect(() => pipeline.processFrame({}, 0)).toThrow("Pipeline must be initialized");
    });

    it('should successfully initialize and process frames to generate a report', async () => {
        await pipeline.initialize();
        expect(pipeline.isInitialized).toBe(true);

        // Process 30 simulated frames
        for (let i = 0; i < 30; i++) {
            pipeline.processFrame({}, i * 100);
        }

        expect(pipeline.sessionMetrics.totalFrames).toBe(30);

        const report = pipeline.generatePostInterviewReport();
        expect(report).not.toBeNull();
        expect(report.averageValence).toBeGreaterThan(0);
        expect(report.eyeContactScore).toBeGreaterThan(0);
        expect(report.timeline.length).toBeGreaterThan(0);
        expect(report.timeline.length).toBeLessThanOrEqual(30);
    });

    it('should return null report if no frames processed', async () => {
        await pipeline.initialize();
        const report = pipeline.generatePostInterviewReport();
        expect(report).toBeNull();
    });
});
