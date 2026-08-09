/**
 * Simulates a clustering algorithm (like K-Means or DBSCAN) to group users
 * into highly targeted micro-study groups.
 * 
 * Vectors for clustering:
 * - topicId: Must match exactly (hard constraint)
 * - timezoneOffset: Should be close (to allow synchronous chat/calls)
 * - learningPace: Should be similar (to prevent skill-gap frustration)
 */
export function clusterStudyGroups(usersPool, currentUser) {
    if (!usersPool || !Array.isArray(usersPool) || !currentUser) {
        return { error: "Invalid data provided for clustering." };
    }
    
    // Hard constraint: Must be studying the exact same topic right now
    const sameTopicUsers = usersPool.filter(u => 
        u.id !== currentUser.id && 
        u.currentTopicId === currentUser.currentTopicId
    );
    
    if (sameTopicUsers.length < 2) {
        return { 
            message: "Not enough active users studying this specific topic right now to form a cluster. Try again later.", 
            group: [] 
        };
    }
    
    // Calculate Euclidean distance for each user based on (Timezone, Pace)
    // Normalize pace (0-10) and timezone (-12 to +12) to similar scales for fair distance calculation
    const scoredUsers = sameTopicUsers.map(user => {
        // Timezone diff: 0 means same timezone, max diff is 24
        const tzDiff = Math.abs(currentUser.timezoneOffset - user.timezoneOffset);
        // Pace diff: max diff is ~10
        const paceDiff = Math.abs(currentUser.learningPace - user.learningPace);
        
        // Euclidean distance (lower is better/closer)
        const distance = Math.sqrt(Math.pow(tzDiff, 2) + Math.pow(paceDiff, 2));
        
        return { ...user, distance };
    });
    
    // Sort by closest distance
    scoredUsers.sort((a, b) => a.distance - b.distance);
    
    // Select top 3 closest neighbors to form a 4-person micro-group (currentUser + 3 peers)
    const optimalGroup = scoredUsers.slice(0, 3);
    
    return {
        message: `Successfully clustered a micro-study group of ${optimalGroup.length + 1} peers for optimal collaboration.`,
        group: optimalGroup
    };
}
