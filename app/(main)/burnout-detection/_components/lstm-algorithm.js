/**
 * Simulates generating a 7-day time-series telemetry data for a user
 */
export function generateTelemetry(condition) {
    const data = [];
    
    for (let i = 0; i < 7; i++) {
        let sessionLength = 0; // minutes
        let quizScore = 0; // 0-100
        let modulesCompleted = 0;
        
        if (condition === 'healthy') {
            // Steady 45-60 min sessions, high scores
            sessionLength = Math.floor(Math.random() * 20) + 40;
            quizScore = Math.floor(Math.random() * 15) + 85;
            modulesCompleted = Math.floor(Math.random() * 2) + 1;
        } else if (condition === 'burning_out') {
            // Cramming on first days, then dropping off significantly with poor scores
            if (i < 2) {
                sessionLength = Math.floor(Math.random() * 60) + 180; // 3-4 hours
                quizScore = Math.floor(Math.random() * 20) + 70;
                modulesCompleted = 4;
            } else {
                sessionLength = Math.floor(Math.random() * 15) + 5; // 5-20 mins
                quizScore = Math.floor(Math.random() * 30) + 40; // failing
                modulesCompleted = 0;
            }
        }
        
        data.push({
            day: i + 1,
            sessionLength,
            quizScore,
            modulesCompleted
        });
    }
    
    return data;
}

/**
 * Simulates a Time-Series classification model (e.g., LSTM) predicting burnout risk.
 */
export function predictBurnout(telemetrySeries) {
    if (!telemetrySeries || telemetrySeries.length === 0) return { riskScore: 0, factors: [], interventionRequired: false };
    
    let totalLength = 0;
    let avgScore = 0;
    let decliningEngagement = false;
    
    // Analyze trend
    const firstHalfAvg = telemetrySeries.slice(0, 3).reduce((acc, curr) => acc + curr.sessionLength, 0) / 3;
    const secondHalfAvg = telemetrySeries.slice(3).reduce((acc, curr) => acc + curr.sessionLength, 0) / 4;
    
    if (firstHalfAvg > 120 && secondHalfAvg < 30) {
        decliningEngagement = true;
    }
    
    telemetrySeries.forEach(day => {
        totalLength += day.sessionLength;
        avgScore += day.quizScore;
    });
    avgScore = avgScore / telemetrySeries.length;
    
    let riskScore = 0;
    const factors = [];
    
    if (decliningEngagement) {
        riskScore += 40;
        factors.push("Severe drop-off in session duration after initial cramming.");
    }
    
    if (totalLength > 400) {
        riskScore += 20;
        factors.push("Excessive total weekly hours logged (Cognitive Overload).");
    }
    
    if (avgScore < 70) {
        riskScore += 30;
        factors.push("Consistent decline in quiz comprehension scores.");
    }
    
    // Add some noise to simulate ML confidence
    riskScore += Math.floor(Math.random() * 10);
    
    riskScore = Math.min(100, Math.max(0, riskScore));
    
    return {
        riskScore,
        factors,
        interventionRequired: riskScore > 75
    };
}
