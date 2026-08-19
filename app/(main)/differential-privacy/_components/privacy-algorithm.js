/**
 * Implements a Differential Privacy algorithm using the Laplace Mechanism.
 * Adds calibrated cryptographic noise to user leaderboard scores to protect
 * individual privacy while maintaining macro-level statistical accuracy.
 */

export class DifferentialPrivacyEngine {
    constructor(epsilon = 1.0) {
        // Epsilon controls the privacy budget. Smaller epsilon = more privacy (more noise).
        this.epsilon = epsilon;
    }

    /**
     * Generates noise from a Laplace distribution centered at 0 with scale b.
     */
    _laplaceNoise(scale) {
        if (scale <= 0) return 0;
        
        // Inverse transform sampling for Laplace distribution
        const u = Math.random() - 0.5;
        return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    }

    /**
     * Applies differential privacy to a dataset of users.
     * @param {Array} dataset - Array of user objects containing 'score'
     * @param {number} sensitivity - The maximum change one user can have on the query (e.g., max score)
     * @returns {Array} - Anonymized dataset with noisy scores and approximate rankings
     */
    anonymizeLeaderboard(dataset, sensitivity = 100) {
        if (!dataset || !Array.isArray(dataset)) {
            throw new Error("Invalid dataset provided. Expected an array.");
        }

        if (dataset.length === 0) return [];

        const scale = sensitivity / this.epsilon;

        // Apply Laplace noise to each score
        const noisyDataset = dataset.map(user => {
            if (typeof user.score !== 'number') {
                throw new Error("Each user in dataset must have a numeric 'score' property.");
            }

            // Generate noise and apply it
            const noise = this._laplaceNoise(scale);
            const noisyScore = Math.max(0, Math.round(user.score + noise)); // Scores shouldn't be negative

            return {
                id: user.id,
                username: `User_${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Anonymize username
                originalScore: user.score,
                noisyScore: noisyScore,
                noiseAdded: noisyScore - user.score
            };
        });

        // Sort by noisy score to determine approximate rank
        noisyDataset.sort((a, b) => b.noisyScore - a.noisyScore);

        // Assign percentile rankings based on noisy data
        const totalUsers = noisyDataset.length;
        return noisyDataset.map((user, index) => {
            const percentile = Math.round((1 - (index / totalUsers)) * 100);
            return {
                ...user,
                approximateRank: index + 1,
                percentileTier: percentile >= 90 ? 'Top 10%' :
                                percentile >= 75 ? 'Top 25%' :
                                percentile >= 50 ? 'Top 50%' : 'Bottom 50%'
            };
        });
    }

    calculatePrivacyMetrics(dataset, sensitivity = 100) {
        const noisyData = this.anonymizeLeaderboard(dataset, sensitivity);
        
        // Calculate Mean Absolute Error (MAE) introduced by the noise
        let totalError = 0;
        noisyData.forEach(user => {
            totalError += Math.abs(user.noiseAdded);
        });
        
        return {
            epsilon: this.epsilon,
            averageNoiseAdded: totalError / noisyData.length,
            theoreticalScale: sensitivity / this.epsilon
        };
    }
}
