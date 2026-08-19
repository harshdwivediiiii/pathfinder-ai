import { describe, it, expect, beforeEach } from 'vitest';
import { CognitiveLoadAnalyzer } from '../app/(main)/eye-tracking/_components/cognitive-load-analyzer.js';

describe('Real-Time Eye-Tracking for Cognitive Load Assessment', () => {
    let analyzer;
    const mockParagraphs = [
        { id: "p1", x: 0, y: 0, width: 800, height: 100, text: "Short text" },
        { id: "p2", x: 0, y: 150, width: 800, height: 100, text: "This is a much longer paragraph that might cause more cognitive load for a reader." }
    ];

    beforeEach(() => {
        analyzer = new CognitiveLoadAnalyzer();
    });

    it('should throw error if tracking started without regions', () => {
        expect(() => analyzer.startTracking([])).toThrow("Must provide paragraph regions");
    });

    it('should throw error if analyzed without data', () => {
        analyzer.startTracking(mockParagraphs);
        expect(() => analyzer.analyzeHeatmap()).toThrow("No gaze data collected");
    });

    it('should calculate normal cognitive load for simple reading', () => {
        analyzer.startTracking(mockParagraphs);
        
        // Simulate reading p1 linearly
        analyzer.recordGaze(10, 10, 50);
        analyzer.recordGaze(20, 10, 50);
        analyzer.recordGaze(30, 10, 50);

        const result = analyzer.analyzeHeatmap();
        
        const p1Result = result.find(r => r.id === 'p1');
        expect(p1Result.status).toBe('normal');
        expect(p1Result.saccadeCount).toBe(0);
        expect(p1Result.cognitiveLoadScore).toBeLessThan(50);
    });

    it('should detect erratic saccades and flag high load', () => {
        analyzer.startTracking(mockParagraphs);
        
        // Simulate erratic reading on p2 (jumping distances > 50px quickly)
        analyzer.recordGaze(10, 160, 50);
        analyzer.recordGaze(100, 180, 50); // Jump > 50px
        analyzer.recordGaze(20, 160, 50);  // Jump > 50px
        analyzer.recordGaze(150, 190, 50); // Jump > 50px
        
        // Add artificial gaze time to push score high
        analyzer.recordGaze(150, 190, 5000);

        const result = analyzer.analyzeHeatmap();
        
        const p2Result = result.find(r => r.id === 'p2');
        expect(p2Result.saccadeCount).toBeGreaterThan(0);
        expect(p2Result.cognitiveLoadScore).toBeGreaterThan(50);
        expect(['high_load', 'extreme_confusion']).toContain(p2Result.status);
    });
});
