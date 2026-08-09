/**
 * Simulates a Vision-Language Model (VLM) parsing an uploaded image
 * (like a handwritten roadmap or a screenshot of a curriculum) and 
 * converting it into a structured JSON learning pathway.
 */
export function parseImageInput(imageLabels) {
    if (!imageLabels || imageLabels.length === 0) {
        return { error: "No recognizable educational labels found in image." };
    }
    
    // Simulate mapping random tags to actual pathway modules
    const mappedModules = imageLabels.map((label, index) => ({
        id: `img_mod_${index + 1}`,
        title: label.charAt(0).toUpperCase() + label.slice(1),
        type: 'visual_node',
        order: index + 1
    }));
    
    return {
        source: 'Vision-Language Model (Image)',
        confidence: 0.89,
        pathway: mappedModules
    };
}

/**
 * Simulates a Speech-to-Text model (like Whisper API) parsing a 
 * chaotic voice note from a user about their career goals, and 
 * extracting a structured learning pathway.
 */
export function parseVoiceInput(transcript) {
    if (!transcript || transcript.trim() === '') {
        return { error: "Voice transcript is empty." };
    }
    
    const text = transcript.toLowerCase();
    const extractedSkills = [];
    
    // Simple heuristic keyword extraction to simulate LLM parsing
    const techKeywords = ['react', 'node', 'python', 'ai', 'machine learning', 'css', 'html', 'sql', 'docker', 'cloud'];
    
    techKeywords.forEach(kw => {
        if (text.includes(kw)) {
            extractedSkills.push(kw);
        }
    });
    
    if (extractedSkills.length === 0) {
        return { error: "Could not detect specific technical goals from voice note." };
    }
    
    const mappedModules = extractedSkills.map((skill, index) => ({
        id: `voice_mod_${index + 1}`,
        title: skill.charAt(0).toUpperCase() + skill.slice(1) + ' Fundamentals',
        type: 'audio_node',
        order: index + 1
    }));
    
    return {
        source: 'Speech-to-Text Model (Voice)',
        confidence: 0.94,
        pathway: mappedModules
    };
}
