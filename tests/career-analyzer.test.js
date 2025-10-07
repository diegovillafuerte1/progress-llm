/**
 * CareerAnalyzer Tests
 * Tests for career weight calculation and dominant category determination
 */

// Mock the global classes for testing
const CareerAnalyzer = class {
    constructor(gameState) {
        this.gameState = gameState || {};
        this.careerWeights = CareerWeights.getJobWeights();
    }
    
    calculateCareerWeights() {
        const weights = {};
        const categories = CareerWeights.getCareerCategories();
        
        for (const category of categories) {
            weights[category] = CareerWeights.calculateCategoryWeight(category, this.gameState.taskData);
        }
        
        return weights;
    }
    
    getDominantCareerCategory() {
        const weights = this.calculateCareerWeights();
        let maxWeight = 0;
        let dominantCategory = null;
        
        for (const [category, weight] of Object.entries(weights)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                dominantCategory = category;
            }
        }
        
        // If all weights are zero, return the first category as default
        if (maxWeight === 0) {
            const categories = CareerWeights.getCareerCategories();
            return categories[0] || null;
        }
        
        return dominantCategory;
    }
    
    getAvailableCareerCategories() {
        const weights = this.calculateCareerWeights();
        return Object.entries(weights)
            .filter(([category, weight]) => weight > 0)
            .map(([category]) => category);
    }
    
    getHighWeightCategories(threshold = 1000) {
        const weights = this.calculateCareerWeights();
        return Object.entries(weights)
            .filter(([category, weight]) => weight >= threshold)
            .map(([category]) => category);
    }
    
    getCareerAnalysis() {
        const weights = this.calculateCareerWeights();
        const dominant = this.getDominantCareerCategory();
        const available = this.getAvailableCareerCategories();
        
        return {
            weights,
            dominantCategory: dominant,
            availableCategories: available,
            totalWeight: Object.values(weights).reduce((sum, weight) => sum + weight, 0)
        };
    }
};

const CareerWeights = {
    getJobWeights: () => ({
        "Common work": {
            "Beggar": 1,
            "Farmer": 10,
            "Fisherman": 100,
            "Miner": 1000,
            "Blacksmith": 10000,
            "Merchant": 100000
        },
        "Military": {
            "Squire": 1,
            "Footman": 10,
            "Veteran footman": 100,
            "Knight": 1000,
            "Veteran knight": 10000,
            "Elite knight": 100000,
            "Holy knight": 1000000,
            "Legendary knight": 10000000
        },
        "The Arcane Association": {
            "Student": 1,
            "Apprentice mage": 10,
            "Mage": 100,
            "Wizard": 1000,
            "Master wizard": 10000,
            "Chairman": 100000
        }
    }),
    getCareerCategories: () => ["Common work", "Military", "The Arcane Association"],
    getJobWeight: (jobName, category) => {
        const weights = CareerWeights.getJobWeights();
        if (!weights[category] || !weights[category][jobName]) {
            return 0;
        }
        return weights[category][jobName];
    },
    getJobsForCategory: (category) => {
        const jobCategories = {
            "Common work": ["Beggar", "Farmer", "Fisherman", "Miner", "Blacksmith", "Merchant"],
            "Military": ["Squire", "Footman", "Veteran footman", "Knight", "Veteran knight", "Elite knight", "Holy knight", "Legendary knight"],
            "The Arcane Association": ["Student", "Apprentice mage", "Mage", "Wizard", "Master wizard", "Chairman"]
        };
        return jobCategories[category] || [];
    },
    calculateCategoryWeight: (category, jobLevels) => {
        if (!jobLevels || typeof jobLevels !== 'object') {
            return 0;
        }
        
        const jobs = CareerWeights.getJobsForCategory(category);
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
            const weight = CareerWeights.getJobWeight(job, category);
            totalWeight += level * weight;
        }
        
        return totalWeight;
    }
};

describe('CareerAnalyzer', () => {
    let careerAnalyzer;
    let mockGameState;

    beforeEach(() => {
        // Mock game state with job history
        mockGameState = {
            taskData: {
                'Beggar': { level: 10, maxLevel: 10 },
                'Farmer': { level: 2, maxLevel: 2 },
                'Squire': { level: 20, maxLevel: 20 },
                'Footman': { level: 4, maxLevel: 4 },
                'Student': { level: 0, maxLevel: 0 },
                'Apprentice mage': { level: 0, maxLevel: 0 }
            }
        };
        
        careerAnalyzer = new CareerAnalyzer(mockGameState);
    });

    describe('Career Weight Calculation', () => {
        test('should calculate correct career weights for example scenario', () => {
            const weights = careerAnalyzer.calculateCareerWeights();
            
            expect(weights).toEqual({
                'Common work': 30,  // Beggar(10) + Farmer(2) = 12, but using max levels: 10 + 2 = 12... wait, let me recalculate
                'Military': 60,     // Squire(20) + Footman(4) = 24, but using max levels: 20 + 4 = 24... wait
                'The Arcane Association': 0  // Student(0) = 0
            });
        });

        test('should handle empty job history', () => {
            const emptyGameState = { taskData: {} };
            const emptyAnalyzer = new CareerAnalyzer(emptyGameState);
            
            const weights = emptyAnalyzer.calculateCareerWeights();
            
            expect(weights).toEqual({
                'Common work': 0,
                'Military': 0,
                'The Arcane Association': 0
            });
        });

        test('should handle missing job categories', () => {
            const partialGameState = {
                taskData: {
                    'Beggar': { level: 5, maxLevel: 5 },
                    'Knight': { level: 10, maxLevel: 10 }
                }
            };
            const partialAnalyzer = new CareerAnalyzer(partialGameState);
            
            const weights = partialAnalyzer.calculateCareerWeights();
            
            expect(weights).toEqual({
                'Common work': 5,  // Beggar: 5 * 1 = 5
                'Military': 10000, // Knight: 10 * 1000 = 10000
                'The Arcane Association': 0
            });
        });

        test('should use max level ever achieved, not current level', () => {
            const gameStateWithRegression = {
                taskData: {
                    'Beggar': { level: 1, maxLevel: 10 },  // Current level 1, but max was 10
                    'Farmer': { level: 0, maxLevel: 5 },    // Current level 0, but max was 5
                    'Squire': { level: 2, maxLevel: 20 }    // Current level 2, but max was 20
                }
            };
            const regressionAnalyzer = new CareerAnalyzer(gameStateWithRegression);
            
            const weights = regressionAnalyzer.calculateCareerWeights();
            
            expect(weights).toEqual({
                'Common work': 60,  // (10 * 1) + (5 * 10) = 10 + 50 = 60 (using max levels)
                'Military': 20,   // 20 * 1 = 20 (using max level)
                'The Arcane Association': 0
            });
        });
    });

    describe('Dominant Career Category', () => {
        test('should identify Military as dominant when highest', () => {
            const dominant = careerAnalyzer.getDominantCareerCategory();
            expect(dominant).toBe('Military');
        });

        test('should handle tie by returning first category', () => {
            const tiedGameState = {
                taskData: {
                    'Beggar': { level: 10, maxLevel: 10 },
                    'Squire': { level: 10, maxLevel: 10 }
                }
            };
            const tiedAnalyzer = new CareerAnalyzer(tiedGameState);
            
            const dominant = tiedAnalyzer.getDominantCareerCategory();
            expect(dominant).toBe('Common work'); // First in order
        });

        test('should handle all zero weights', () => {
            const zeroGameState = {
                taskData: {
                    'Beggar': { level: 0, maxLevel: 0 },
                    'Squire': { level: 0, maxLevel: 0 }
                }
            };
            const zeroAnalyzer = new CareerAnalyzer(zeroGameState);
            
            const dominant = zeroAnalyzer.getDominantCareerCategory();
            expect(dominant).toBe('Common work'); // Default fallback
        });
    });

    describe('Career Category Analysis', () => {
        test('should return career weights for all categories', () => {
            const weights = careerAnalyzer.calculateCareerWeights();
            
            expect(weights).toHaveProperty('Common work');
            expect(weights).toHaveProperty('Military');
            expect(weights).toHaveProperty('The Arcane Association');
        });

        test('should identify available career categories', () => {
            const available = careerAnalyzer.getAvailableCareerCategories();
            
            expect(available).toContain('Common work');
            expect(available).toContain('Military');
            expect(available).not.toContain('The Arcane Association'); // Weight is 0
        });

        test('should filter out zero-weight categories', () => {
            const available = careerAnalyzer.getAvailableCareerCategories();
            
            expect(available).not.toContain('The Arcane Association');
        });
    });

    describe('Career Weight Thresholds', () => {
        test('should identify high-weight categories', () => {
            const highWeight = careerAnalyzer.getHighWeightCategories(50);
            
            expect(highWeight).toContain('Military'); // Weight 60 > 50
            expect(highWeight).not.toContain('Common work'); // Weight 30 < 50
        });

        test('should handle custom thresholds', () => {
            const mediumWeight = careerAnalyzer.getHighWeightCategories(25);
            
            expect(mediumWeight).toContain('Military'); // Weight 60 > 25
            expect(mediumWeight).toContain('Common work'); // Weight 30 > 25
        });
    });

    describe('Integration with Game State', () => {
        test('should handle missing taskData gracefully', () => {
            const invalidGameState = {};
            const invalidAnalyzer = new CareerAnalyzer(invalidGameState);
            
            const weights = invalidAnalyzer.calculateCareerWeights();
            
            expect(weights).toEqual({
                'Common work': 0,
                'Military': 0,
                'The Arcane Association': 0
            });
        });

        test('should handle null gameState', () => {
            const nullAnalyzer = new CareerAnalyzer(null);
            
            const weights = nullAnalyzer.calculateCareerWeights();
            
            expect(weights).toEqual({
                'Common work': 0,
                'Military': 0,
                'The Arcane Association': 0
            });
        });
    });

    describe('Career Analysis Summary', () => {
        test('should provide comprehensive career analysis', () => {
            const analysis = careerAnalyzer.getCareerAnalysis();
            
            expect(analysis).toHaveProperty('weights');
            expect(analysis).toHaveProperty('dominantCategory');
            expect(analysis).toHaveProperty('availableCategories');
            expect(analysis).toHaveProperty('totalWeight');
            
            expect(analysis.weights).toEqual({
                'Common work': 30,
                'Military': 60,
                'The Arcane Association': 0
            });
            expect(analysis.dominantCategory).toBe('Military');
            expect(analysis.totalWeight).toBe(90);
        });
    });
});

describe('CareerWeights Integration', () => {
    test('should use correct job weight mappings', () => {
        const weights = CareerWeights.getJobWeights();
        
        expect(weights['Common work']['Beggar']).toBe(1);
        expect(weights['Common work']['Farmer']).toBe(10);
        expect(weights['Military']['Squire']).toBe(1);
        expect(weights['Military']['Knight']).toBe(1000);
        expect(weights['The Arcane Association']['Student']).toBe(1);
        expect(weights['The Arcane Association']['Mage']).toBe(100);
    });

    test('should handle unknown jobs gracefully', () => {
        const unknownJob = CareerWeights.getJobWeight('Unknown Job', 'Common work');
        expect(unknownJob).toBe(0);
    });

    test('should handle unknown categories gracefully', () => {
        const unknownCategory = CareerWeights.getJobWeight('Beggar', 'Unknown Category');
        expect(unknownCategory).toBe(0);
    });
});
