/**
 * CareerAnalyzer - Analyzes player career progression and determines career weights
 * Calculates career weights based on highest job levels ever achieved
 */

// Dependencies will be loaded via script tags

class CareerAnalyzer {
    constructor(gameState) {
        this.gameState = gameState || {};
        
        // Check if CareerWeights is available
        if (typeof CareerWeights === 'undefined') {
            throw new Error('CareerWeights not loaded. Please ensure CareerWeights.js is loaded before CareerAnalyzer.js');
        }
        
        // Check if required methods are available
        if (typeof CareerWeights.getWeightCategory !== 'function') {
            throw new Error('CareerWeights.getWeightCategory is not a function. Please check CareerWeights.js implementation.');
        }
        
        this.careerWeights = CareerWeights.getJobWeights();
    }

    /**
     * Calculate career weights for all categories based on max job levels
     * @returns {Object} Career weights for each category
     */
    calculateCareerWeights() {
        const weights = {};
        const categories = CareerWeights.getCareerCategories();
        
        for (const category of categories) {
            weights[category] = CareerWeights.calculateCategoryWeight(category, this.gameState.taskData || {});
        }
        
        return weights;
    }

    /**
     * Get the dominant career category (highest weight)
     * @returns {string} Dominant career category
     */
    getDominantCareer() {
        const weights = this.calculateCareerWeights();
        const categories = CareerWeights.getCareerCategories();
        
        let maxWeight = -1;
        let dominantCategory = categories[0]; // Default to first category
        
        for (const category of categories) {
            if (weights[category] > maxWeight) {
                maxWeight = weights[category];
                dominantCategory = category;
            }
        }
        
        return dominantCategory;
    }

    /**
     * Get available career categories (non-zero weight)
     * @returns {Array} Available career categories
     */
    getAvailableCareerCategories() {
        const weights = this.calculateCareerWeights();
        const categories = CareerWeights.getCareerCategories();
        
        return categories.filter(category => weights[category] > 0);
    }

    /**
     * Get high-weight categories above threshold
     * @param {number} threshold - Weight threshold
     * @returns {Array} High-weight categories
     */
    getHighWeightCategories(threshold = 0) {
        const weights = this.calculateCareerWeights();
        const categories = CareerWeights.getCareerCategories();
        
        return categories.filter(category => weights[category] > threshold);
    }

    /**
     * Get comprehensive career analysis
     * @returns {Object} Complete career analysis
     */
    getCareerAnalysis() {
        const weights = this.calculateCareerWeights();
        const dominantCareer = this.getDominantCareer();
        const availableCategories = this.getAvailableCareerCategories();
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        
        return {
            weights,
            dominantCareer,
            availableCategories,
            totalWeight,
            weightDistribution: this.getWeightDistribution(weights),
            careerRecommendations: this.getCareerRecommendations(weights)
        };
    }

    /**
     * Get weight distribution analysis
     * @param {Object} weights - Career weights
     * @returns {Object} Weight distribution
     */
    getWeightDistribution(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const distribution = {};
        
        for (const [category, weight] of Object.entries(weights)) {
            distribution[category] = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
        }
        
        return distribution;
    }

    /**
     * Get career recommendations based on weights
     * @param {Object} weights - Career weights
     * @returns {Array} Career recommendations
     */
    getCareerRecommendations(weights) {
        const recommendations = [];
        const categories = CareerWeights.getCareerCategories();
        
        for (const category of categories) {
            const weight = weights[category];
            const weightCategory = CareerWeights.getWeightCategory(weight);
            
            if (weightCategory === 'veryHigh') {
                recommendations.push(`${category}: Master level - You have achieved mastery in this field`);
            } else if (weightCategory === 'high') {
                recommendations.push(`${category}: Expert level - You are highly skilled in this field`);
            } else if (weightCategory === 'medium') {
                recommendations.push(`${category}: Intermediate level - You have good experience in this field`);
            } else if (weightCategory === 'low' && weight > 0) {
                recommendations.push(`${category}: Beginner level - You have some experience in this field`);
            } else {
                recommendations.push(`${category}: No experience - Consider exploring this career path`);
            }
        }
        
        return recommendations;
    }

    /**
     * Get career weight for specific category
     * @param {string} category - Career category
     * @returns {number} Career weight
     */
    getCareerWeight(category) {
        const weights = this.calculateCareerWeights();
        return weights[category] || 0;
    }

    /**
     * Check if player has experience in category
     * @param {string} category - Career category
     * @returns {boolean} Has experience
     */
    hasCareerExperience(category) {
        return this.getCareerWeight(category) > 0;
    }

    /**
     * Get career progression level
     * @param {string} category - Career category
     * @returns {string} Progression level
     */
    getCareerProgressionLevel(category) {
        const weight = this.getCareerWeight(category);
        return CareerWeights.getWeightCategory(weight);
    }

    /**
     * Get available career options based on weights
     * @param {string} amuletPrompt - Amulet prompt (age25, age45, etc.)
     * @returns {Object} Available career options
     */
    getAvailableCareerOptions(amuletPrompt) {
        const weights = this.calculateCareerWeights();
        const availableCategories = this.getAvailableCareerCategories();
        const options = {};
        
        for (const category of availableCategories) {
            const weight = weights[category];
            const weightCategory = CareerWeights.getWeightCategory(weight);
            
            options[category] = {
                weight: weight,
                level: weightCategory,
                available: true,
                options: this.getCareerSpecificOptions(category, weightCategory)
            };
        }
        
        return options;
    }

    /**
     * Get career-specific options based on weight level
     * @param {string} category - Career category
     * @param {string} weightLevel - Weight level (low, medium, high, veryHigh)
     * @returns {Array} Career-specific options
     */
    getCareerSpecificOptions(category, weightLevel) {
        const baseOptions = {
            'Common work': {
                low: ['Beg from merchants', 'Look for odd jobs'],
                medium: ['Negotiate with merchants', 'Start small business'],
                high: ['Lead merchant caravan', 'Establish trade routes'],
                veryHigh: ['Control market prices', 'Build commercial empire']
            },
            'Military': {
                low: ['Look for a knight to serve', 'Join local militia'],
                medium: ['Lead small patrol', 'Train new recruits'],
                high: ['Command military unit', 'Plan strategic campaigns'],
                veryHigh: ['Lead entire army', 'Defend the realm']
            },
            'The Arcane Association': {
                low: ['Look for some books', 'Study basic magic'],
                medium: ['Research ancient magic', 'Teach at the academy'],
                high: ['Lead magical research', 'Establish magical school'],
                veryHigh: ['Master forbidden arts', 'Shape reality itself']
            }
        };
        
        return baseOptions[category]?.[weightLevel] || [];
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.CareerAnalyzer = CareerAnalyzer;
}
