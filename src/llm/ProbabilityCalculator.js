/**
 * ProbabilityCalculator - Calculates success probabilities for story choices
 * Handles depth-based probability scaling and skill-based adjustments
 */

// Dependencies will be loaded via script tags

class ProbabilityCalculator {
    constructor() {
        this.minProbability = 0.1; // Minimum probability
        this.maxProbability = 0.95; // Maximum probability
        this.depthDecayFactor = 0.1; // How much probability decreases per depth level
    }

    /**
     * Calculate base probability for career category
     * @param {string} careerCategory - Career category
     * @param {Object} careerWeights - Career weights
     * @returns {number} Base probability
     */
    calculateBaseProbability(careerCategory, careerWeights) {
        const weight = careerWeights[careerCategory] || 0;
        
        if (weight <= 0) return 0;
        if (weight >= 100000) return this.maxProbability;
        
        // Linear scaling between 0.1 and 0.95
        return this.minProbability + (weight / 100000) * (this.maxProbability - this.minProbability);
    }

    /**
     * Calculate probability with depth scaling
     * @param {number} baseProbability - Base probability
     * @param {number} depth - Current depth
     * @returns {number} Depth-adjusted probability
     */
    calculateDepthProbability(baseProbability, depth) {
        if (depth <= 0) return baseProbability;
        
        // Exponential decay with depth
        const depthMultiplier = Math.pow(1 - this.depthDecayFactor, depth);
        const depthProbability = baseProbability * depthMultiplier;
        
        return Math.max(this.minProbability, depthProbability);
    }

    /**
     * Calculate probability with skill adjustments
     * @param {number} baseProbability - Base probability
     * @param {Object} skills - Player skills
     * @returns {number} Skill-adjusted probability
     */
    calculateSkillProbability(baseProbability, skills) {
        if (!skills || typeof skills !== 'object') return baseProbability;
        
        const skillValues = Object.values(skills).filter(skill => typeof skill === 'number' && skill > 0);
        if (skillValues.length === 0) return baseProbability;
        
        const averageSkill = skillValues.reduce((sum, skill) => sum + skill, 0) / skillValues.length;
        const skillMultiplier = Math.min(2.0, 1 + (averageSkill / 100)); // Max 2x multiplier
        
        const skillProbability = baseProbability * skillMultiplier;
        return Math.min(this.maxProbability, skillProbability);
    }

    /**
     * Calculate probability for choice type
     * @param {number} baseProbability - Base probability
     * @param {string} choiceType - Choice type (aggressive, diplomatic, cautious, creative)
     * @returns {number} Choice type adjusted probability
     */
    calculateChoiceTypeProbability(baseProbability, choiceType) {
        if (!choiceType) return baseProbability;
        
        const choiceTypeMultipliers = {
            'aggressive': 1.1,    // Slightly higher success rate
            'diplomatic': 1.2,    // Higher success rate
            'cautious': 0.9,      // Lower success rate but safer
            'creative': 0.8       // Lower success rate but more interesting
        };
        
        const multiplier = choiceTypeMultipliers[choiceType] || 1.0;
        const choiceProbability = baseProbability * multiplier;
        
        return Math.min(this.maxProbability, Math.max(this.minProbability, choiceProbability));
    }

    /**
     * Calculate combined probability with all factors
     * @param {string} careerCategory - Career category
     * @param {Object} careerWeights - Career weights
     * @param {Object} skills - Player skills
     * @param {string} choiceType - Choice type
     * @param {number} depth - Current depth
     * @returns {number} Combined probability
     */
    calculateCombinedProbability(careerCategory, careerWeights, skills, choiceType, depth) {
        // Start with base probability
        let probability = this.calculateBaseProbability(careerCategory, careerWeights);
        
        // Apply depth scaling
        probability = this.calculateDepthProbability(probability, depth);
        
        // Apply skill adjustments
        probability = this.calculateSkillProbability(probability, skills);
        
        // Apply choice type adjustments
        probability = this.calculateChoiceTypeProbability(probability, choiceType);
        
        // Ensure probability is within bounds
        return Math.min(this.maxProbability, Math.max(this.minProbability, probability));
    }

    /**
     * Get probability category
     * @param {number} probability - Probability value
     * @returns {string} Probability category
     */
    getProbabilityCategory(probability) {
        if (probability >= 0.8) return 'veryHigh';
        if (probability >= 0.6) return 'high';
        if (probability >= 0.4) return 'medium';
        if (probability >= 0.2) return 'low';
        return 'veryLow';
    }

    /**
     * Validate probability value
     * @param {number} probability - Probability value
     * @returns {boolean} Is valid
     */
    isValidProbability(probability) {
        return typeof probability === 'number' && probability >= 0 && probability <= 1;
    }

    /**
     * Calculate probability statistics
     * @param {Array} probabilities - Array of probability values
     * @returns {Object} Statistics
     */
    calculateProbabilityStats(probabilities) {
        if (!Array.isArray(probabilities) || probabilities.length === 0) {
            return { average: 0, min: 0, max: 0, median: 0 };
        }
        
        const validProbabilities = probabilities.filter(p => this.isValidProbability(p));
        
        if (validProbabilities.length === 0) {
            return { average: 0, min: 0, max: 0, median: 0 };
        }
        
        const sorted = [...validProbabilities].sort((a, b) => a - b);
        const sum = validProbabilities.reduce((acc, p) => acc + p, 0);
        
        return {
            average: sum / validProbabilities.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: sorted.length % 2 === 0 
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)]
        };
    }

    /**
     * Get probability thresholds
     * @returns {Object} Probability thresholds
     */
    getProbabilityThresholds() {
        return {
            veryHigh: 0.8,
            high: 0.6,
            medium: 0.4,
            low: 0.2,
            veryLow: 0.0
        };
    }

    /**
     * Calculate success rate from results
     * @param {Array} results - Array of success/failure results
     * @returns {number} Success rate
     */
    calculateSuccessRate(results) {
        if (!Array.isArray(results) || results.length === 0) return 0;
        
        const successes = results.filter(result => result === true || result.success === true).length;
        return successes / results.length;
    }

    /**
     * Predict success probability for future choice
     * @param {Object} context - Choice context
     * @returns {number} Predicted probability
     */
    predictSuccessProbability(context) {
        const { careerCategory, careerWeights, skills, choiceType, depth } = context;
        
        return this.calculateCombinedProbability(
            careerCategory,
            careerWeights,
            skills,
            choiceType,
            depth || 0
        );
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.ProbabilityCalculator = ProbabilityCalculator;
}
