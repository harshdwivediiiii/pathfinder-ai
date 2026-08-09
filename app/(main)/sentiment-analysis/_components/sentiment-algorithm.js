/**
 * Simulates a RoBERTa-style NLP Sentiment Analysis model.
 * It reads a user's daily progress journal and outputs a sentiment score
 * from -1 (Extremely Frustrated) to +1 (Extremely Satisfied), along with
 * flagged pain points.
 */
export function analyzeSentiment(journalEntry) {
    if (!journalEntry || typeof journalEntry !== 'string') {
        return { score: 0, category: 'Neutral', flags: [] };
    }
    
    const text = journalEntry.toLowerCase();
    
    const negativeKeywords = ['frustrating', 'stuck', 'confusing', 'hate', 'hard', 'give up', 'terrible', 'lost', 'struggling'];
    const positiveKeywords = ['great', 'awesome', 'understood', 'finally', 'love', 'easy', 'fun', 'happy', 'excited'];
    
    let negCount = 0;
    let posCount = 0;
    const flags = [];
    
    negativeKeywords.forEach(kw => {
        if (text.includes(kw)) {
            negCount++;
            flags.push({ keyword: kw, type: 'negative' });
        }
    });
    
    positiveKeywords.forEach(kw => {
        if (text.includes(kw)) {
            posCount++;
            flags.push({ keyword: kw, type: 'positive' });
        }
    });
    
    // Calculate raw score between -1 and 1
    const totalHits = negCount + posCount;
    let score = 0;
    
    if (totalHits > 0) {
        score = (posCount - negCount) / totalHits;
    }
    
    // Categorize
    let category = 'Neutral';
    if (score <= -0.3) category = 'Frustrated';
    if (score >= 0.3) category = 'Satisfied';
    
    return {
        score: Number(score.toFixed(2)),
        category,
        flags
    };
}
