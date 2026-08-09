/**
 * Simulates an NLP Named Entity Recognition (NER) pipeline extracting tech skills from free text.
 */
export function parseResumeText(text) {
    if (!text || text.trim() === '') return [];

    const normalizedText = text.toLowerCase();
    
    // A simulated vocabulary of recognized entities (skills)
    const entityVocabulary = [
        'react', 'javascript', 'html', 'css', 'node', 'express', 'mongodb', 
        'sql', 'python', 'django', 'flask', 'pandas', 'numpy', 'machine learning',
        'aws', 'docker', 'kubernetes', 'typescript', 'java', 'spring', 'git'
    ];
    
    // Extract entities that appear in the text
    const extractedSkills = entityVocabulary.filter(entity => normalizedText.includes(entity));
    
    return extractedSkills;
}

/**
 * Simulates generating an upskilling pathway based on the gap between current skills and a target career.
 */
export function generateGapPathway(extractedSkills, targetCareer) {
    
    // Define the canonical requirements for different target careers
    const careerRequirements = {
        'fullstack': {
            title: 'Fullstack Web Developer',
            required: ['html', 'css', 'javascript', 'react', 'node', 'express', 'sql', 'git']
        },
        'data_science': {
            title: 'Data Scientist',
            required: ['python', 'pandas', 'numpy', 'sql', 'machine learning', 'git']
        },
        'devops': {
            title: 'Cloud DevOps Engineer',
            required: ['python', 'aws', 'docker', 'kubernetes', 'git']
        }
    };
    
    const target = careerRequirements[targetCareer] || careerRequirements['fullstack'];
    
    // Calculate the gap (required skills that the user DOES NOT have)
    const missingSkills = target.required.filter(skill => !extractedSkills.includes(skill));
    
    // Construct the recommended pathway
    const pathway = missingSkills.map((skill, index) => ({
        id: `module-${index + 1}`,
        skill: skill,
        estimatedHours: Math.round(Math.random() * 20 + 10), // 10-30 hours per skill
        difficulty: index === 0 ? 'Beginner' : (index === missingSkills.length - 1 ? 'Advanced' : 'Intermediate')
    }));
    
    return {
        targetTitle: target.title,
        recognizedSkills: extractedSkills,
        missingSkills: missingSkills,
        recommendedPathway: pathway,
        readinessScore: Math.round((extractedSkills.filter(s => target.required.includes(s)).length / target.required.length) * 100)
    };
}
