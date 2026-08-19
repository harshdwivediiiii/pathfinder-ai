import { describe, it, expect, beforeEach } from 'vitest';
import { PodcastSynthesizer } from '../app/(main)/audio-podcasts/_components/audio-generator.js';

describe('Generative Audio Podcasts for On-the-Go Module Summaries', () => {
    let synthesizer;

    beforeEach(() => {
        synthesizer = new PodcastSynthesizer();
    });

    it('should throw error if module content is too short', async () => {
        await expect(synthesizer.generatePodcast("Too short.", "v_alex")).rejects.toThrow("Module content must be at least 50 characters");
    });

    it('should throw error for invalid voice ID', async () => {
        const validText = "This is a sufficiently long text string that passes the fifty character minimum requirement for the podcast synthesizer.";
        await expect(synthesizer.generatePodcast(validText, "invalid_voice")).rejects.toThrow("Invalid voice ID selected");
    });

    it('should generate a podcast payload with conversational style script', async () => {
        const validText = "React Server Components (RSC) represent a paradigm shift in how we build React applications.";
        const result = await synthesizer.generatePodcast(validText, "v_alex");
        
        expect(result.podcastId).toContain("pod_");
        expect(result.voiceUsed).toContain("Alex");
        expect(result.scriptExcerpt).toContain("Hey everyone! Today we're diving into some fascinating concepts around React Server Components (RSC) represent.");
    });

    it('should generate a podcast payload with analytical style script', async () => {
        const validText = "React Server Components (RSC) represent a paradigm shift in how we build React applications.";
        const result = await synthesizer.generatePodcast(validText, "v_sarah");
        
        expect(result.voiceUsed).toContain("Sarah");
        expect(result.scriptExcerpt).toContain("Welcome to this module summary. The primary technical objectives covered in this section pertain to React Server Components (RSC) represent.");
    });
});
