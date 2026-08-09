/**
 * Mock database of active user agents looking for peers
 */
export const activeAgents = [
    {
        id: 'agent-1',
        name: 'Alex (Backend Specialist)',
        strongSkills: ['node', 'sql', 'docker'],
        weakSkills: ['react', 'css'],
        schedule: ['evenings', 'weekends'],
        learningGoal: 'Fullstack Mastery'
    },
    {
        id: 'agent-2',
        name: 'Sarah (UI/UX Developer)',
        strongSkills: ['react', 'css', 'figma'],
        weakSkills: ['node', 'sql'],
        schedule: ['mornings', 'weekends'],
        learningGoal: 'Fullstack Mastery'
    },
    {
        id: 'agent-3',
        name: 'David (Data Engineer)',
        strongSkills: ['python', 'sql', 'aws'],
        weakSkills: ['react', 'css', 'machine learning'],
        schedule: ['evenings'],
        learningGoal: 'AI Engineering'
    },
    {
        id: 'agent-4',
        name: 'Elena (Frontend Dev)',
        strongSkills: ['react', 'css', 'javascript'],
        weakSkills: ['python', 'aws'],
        schedule: ['evenings', 'weekends'],
        learningGoal: 'Cloud Deployment'
    }
];

/**
 * Simulates a multi-agent negotiation where each peer agent evaluates the primary user's profile.
 * Agents bid for a match based on complementary skill gaps and schedule overlap.
 */
export function simulateAgentNegotiation(userProfile) {
    if (!userProfile) return [];
    
    const negotiationLogs = [];
    const proposals = [];
    
    // Each agent evaluates the user autonomously
    activeAgents.forEach(peerAgent => {
        let matchScore = 0;
        let synergyFactors = [];
        let conflictFactors = [];
        
        negotiationLogs.push(`[${peerAgent.name}'s Agent]: Evaluating primary user profile...`);
        
        // 1. Schedule Overlap
        const commonSchedule = peerAgent.schedule.filter(s => userProfile.schedule.includes(s));
        if (commonSchedule.length > 0) {
            matchScore += 30;
            synergyFactors.push(`Schedule sync: ${commonSchedule.join(', ')}`);
        } else {
            conflictFactors.push(`No common availability`);
            matchScore -= 50; // Hard dealbreaker
        }
        
        // 2. Complementary Skills (Mentorship Potential)
        // User is strong where peer is weak
        const userCanTeach = userProfile.strongSkills.filter(s => peerAgent.weakSkills.includes(s));
        if (userCanTeach.length > 0) {
            matchScore += userCanTeach.length * 15;
            synergyFactors.push(`User can teach: ${userCanTeach.join(', ')}`);
        }
        
        // Peer is strong where user is weak
        const peerCanTeach = peerAgent.strongSkills.filter(s => userProfile.weakSkills.includes(s));
        if (peerCanTeach.length > 0) {
            matchScore += peerCanTeach.length * 15;
            synergyFactors.push(`Peer can teach: ${peerCanTeach.join(', ')}`);
        }
        
        // 3. Learning Goal Alignment
        if (peerAgent.learningGoal === userProfile.learningGoal) {
            matchScore += 20;
            synergyFactors.push(`Aligned goal: ${userProfile.learningGoal}`);
        }
        
        // Decision logic
        if (matchScore >= 50 && conflictFactors.length === 0) {
            negotiationLogs.push(`[${peerAgent.name}'s Agent]: Proposed strong match! (Score: ${matchScore})`);
            proposals.push({
                peer: peerAgent,
                matchScore,
                synergyFactors,
                status: 'Proposed'
            });
        } else {
            negotiationLogs.push(`[${peerAgent.name}'s Agent]: Rejected match. Score too low or schedule conflict.`);
        }
    });
    
    // Sort proposals by best match
    proposals.sort((a, b) => b.matchScore - a.matchScore);
    
    return {
        logs: negotiationLogs,
        proposals
    };
}
