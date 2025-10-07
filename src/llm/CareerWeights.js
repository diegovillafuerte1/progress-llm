/**
 * CareerWeights - Defines career weight calculations and job categories
 * Provides weight values for different job categories
 */

// Dependencies will be loaded via script tags

class CareerWeights {
    static getJobWeights() {
        return {
            // Common work jobs with exponential weighting
            "Beggar": 1,
            "Farmer": 10,
            "Fisherman": 100,
            "Miner": 1000,
            "Blacksmith": 10000,
            "Merchant": 100000,
            
            // Military jobs with exponential weighting
            "Squire": 1,
            "Footman": 10,
            "Veteran footman": 100,
            "Knight": 1000,
            "Veteran knight": 10000,
            "Elite knight": 100000,
            "Holy knight": 1000000,
            "Legendary knight": 10000000,
            
            // Arcane Association jobs with exponential weighting
            "Student": 1,
            "Apprentice mage": 10,
            "Mage": 100,
            "Wizard": 1000,
            "Master wizard": 10000,
            "Chairman": 100000
        };
    }
    
    static getCareerCategories() {
        return ["Common work", "Military", "The Arcane Association"];
    }

    static getJobWeight(jobName, category) {
        const weights = this.getJobWeights();
        if (!weights[jobName]) {
            return 0;
        }
        return weights[jobName];
    }

    static getJobsForCategory(category) {
        const jobCategories = {
            "Common work": ["Beggar", "Farmer", "Fisherman", "Miner", "Blacksmith", "Merchant"],
            "Military": ["Squire", "Footman", "Veteran footman", "Knight", "Veteran knight", "Elite knight", "Holy knight", "Legendary knight"],
            "The Arcane Association": ["Student", "Apprentice mage", "Mage", "Wizard", "Master wizard", "Chairman"]
        };
        return jobCategories[category] || [];
    }

    static calculateCategoryWeight(category, jobLevels) {
        if (!jobLevels || typeof jobLevels !== 'object') {
            return 0;
        }
        
        const jobs = this.getJobsForCategory(category);
        let totalWeight = 0;
        
        for (const job of jobs) {
            const jobData = jobLevels[job];
            let level = 0;
            if (jobData && typeof jobData === 'object') {
                // Use maxLevel if available, otherwise use level
                level = jobData.maxLevel !== undefined ? jobData.maxLevel : (jobData.level || 0);
            } else if (typeof jobData === 'number') {
                level = jobData;
            }
            const weight = this.getJobWeight(job, category);
            totalWeight += level * weight;
        }
        
        return totalWeight;
    }

    static getWeightCategory(weight) {
        if (weight >= 1000000) {
            return 'veryHigh';
        } else if (weight >= 100000) {
            return 'high';
        } else if (weight >= 10000) {
            return 'medium';
        } else if (weight >= 1000) {
            return 'low';
        } else if (weight >= 100) {
            return 'veryLow';
        } else {
            return 'minimal';
        }
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.CareerWeights = CareerWeights;
}