/**
 * Simulates a WebGazer.js integration for tracking eye movements
 * to assess cognitive load and confusion on text-heavy curriculum pages.
 */

export class CognitiveLoadAnalyzer {
    constructor() {
        this.gazeData = [];
        this.isTracking = false;
        this.paragraphs = []; // Array of bounding boxes for curriculum paragraphs
    }

    startTracking(paragraphRegions) {
        if (!paragraphRegions || paragraphRegions.length === 0) {
            throw new Error("Must provide paragraph regions to track cognitive load against.");
        }
        
        this.paragraphs = paragraphRegions;
        this.gazeData = [];
        this.isTracking = true;
    }

    stopTracking() {
        this.isTracking = false;
    }

    // Simulate receiving coordinates from a webcam eye-tracker
    recordGaze(x, y, durationMs) {
        if (!this.isTracking) return;
        
        this.gazeData.push({
            x,
            y,
            durationMs,
            timestamp: Date.now()
        });
    }

    analyzeHeatmap() {
        if (this.gazeData.length === 0) {
            throw new Error("No gaze data collected to analyze.");
        }

        const loadAssessment = this.paragraphs.map(p => ({
            id: p.id,
            textExcerpt: p.text,
            gazeTimeMs: 0,
            saccadeCount: 0,
            cognitiveLoadScore: 0, // 0 to 100
            status: 'normal' // normal, high_load, extreme_confusion
        }));

        let previousGaze = null;

        // Map gaze data to paragraphs
        for (const gaze of this.gazeData) {
            // Find which paragraph this gaze falls into
            const matchedParagraph = this.paragraphs.find(
                p => gaze.x >= p.x && gaze.x <= (p.x + p.width) && gaze.y >= p.y && gaze.y <= (p.y + p.height)
            );

            if (matchedParagraph) {
                const pData = loadAssessment.find(l => l.id === matchedParagraph.id);
                pData.gazeTimeMs += gaze.durationMs;

                // Detect erratic saccadic movements (jumping back and forth quickly)
                if (previousGaze && previousGaze.pId === matchedParagraph.id) {
                    const distance = Math.sqrt(Math.pow(gaze.x - previousGaze.x, 2) + Math.pow(gaze.y - previousGaze.y, 2));
                    // If eye jumps a lot within a short time in the same paragraph, indicates confusion/re-reading
                    if (distance > 50 && gaze.durationMs < 100) {
                        pData.saccadeCount += 1;
                    }
                }

                previousGaze = { ...gaze, pId: matchedParagraph.id };
            }
        }

        // Calculate scores
        for (const p of loadAssessment) {
            // Algorithm: Heavy weight on erratic saccades + long gaze times relative to text length
            const baseTimeScore = Math.min((p.gazeTimeMs / (p.textExcerpt.length * 20)) * 50, 50); 
            const saccadeScore = Math.min(p.saccadeCount * 10, 50);
            
            p.cognitiveLoadScore = Math.round(baseTimeScore + saccadeScore);

            if (p.cognitiveLoadScore > 80) {
                p.status = 'extreme_confusion';
            } else if (p.cognitiveLoadScore > 50) {
                p.status = 'high_load';
            } else {
                p.status = 'normal';
            }
        }

        return loadAssessment;
    }
}
