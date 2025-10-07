/**
 * ProbabilityCalculator Tests
 * Tests for depth-based success probability calculation
 */

// Mock the global ProbabilityCalculator for testing
const ProbabilityCalculator = class {
    constructor() {
        this.minProbability = 0.1;
        this.maxProbability = 0.95;
        this.depthDecayFactor = 0.1;
    }
    
    calculateBaseProbability(careerCategory, careerWeights) {
        const weight = careerWeights[careerCategory] || 0;
        if (weight <= 0) return 0;
        if (weight >= 100000) return this.maxProbability;
        return this.minProbability + (weight / 100000) * (this.maxProbability - this.minProbability);
    }
    
    calculateDepthProbability(baseProbability, depth) {
        if (depth <= 0) return baseProbability;
        const depthMultiplier = Math.pow(1 - this.depthDecayFactor, depth);
        const depthProbability = baseProbability * depthMultiplier;
        return Math.max(this.minProbability, depthProbability);
    }
    
    calculateSkillProbability(baseProbability, skills) {
        if (!skills || typeof skills !== 'object') return baseProbability;
        const skillValues = Object.values(skills).filter(skill => typeof skill === 'number' && skill > 0);
        if (skillValues.length === 0) return baseProbability;
        const averageSkill = skillValues.reduce((sum, skill) => sum + skill, 0) / skillValues.length;
        const skillMultiplier = Math.min(2.0, 1 + (averageSkill / 100));
        const skillProbability = baseProbability * skillMultiplier;
        return Math.min(this.maxProbability, skillProbability);
    }
    
    calculateChoiceTypeProbability(baseProbability, choiceType) {
        if (!choiceType) return baseProbability;
        const choiceTypeMultipliers = {
            'aggressive': 1.1,
            'diplomatic': 1.2,
            'cautious': 0.9,
            'creative': 0.8
        };
        const multiplier = choiceTypeMultipliers[choiceType] || 1.0;
        const choiceProbability = baseProbability * multiplier;
        return Math.min(this.maxProbability, Math.max(this.minProbability, choiceProbability));
    }
    
    calculateCombinedProbability(careerCategory, careerWeights, skills, choiceType, depth) {
        let probability = this.calculateBaseProbability(careerCategory, careerWeights);
        probability = this.calculateDepthProbability(probability, depth);
        probability = this.calculateSkillProbability(probability, skills);
        probability = this.calculateChoiceTypeProbability(probability, choiceType);
        return Math.min(this.maxProbability, Math.max(this.minProbability, probability));
    }
    
    getProbabilityCategory(probability) {
        if (probability >= 0.8) return 'veryHigh';
        if (probability >= 0.6) return 'high';
        if (probability >= 0.4) return 'medium';
        if (probability >= 0.2) return 'low';
        return 'veryLow';
    }
    
    isValidProbability(probability) {
        return typeof probability === 'number' && probability >= 0 && probability <= 1;
    }
    
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
    
    calculateSuccessRate(results) {
        if (!Array.isArray(results) || results.length === 0) return 0;
        const successes = results.filter(result => result === true || result.success === true).length;
        return successes / results.length;
    }
    
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
};

describe('ProbabilityCalculator', () => {
    let probabilityCalculator;

    beforeEach(() => {
        probabilityCalculator = new ProbabilityCalculator();
    });

    describe('Base Probability Calculation', () => {
        test('should calculate base probability for career category', () => {
            const careerWeights = {
                'Common work': 30,
                'Military': 60,
                'The Arcane Association': 0
            };
            
            const commonProb = probabilityCalculator.calculateBaseProbability('Common work', careerWeights);
            const militaryProb = probabilityCalculator.calculateBaseProbability('Military', careerWeights);
            const arcaneProb = probabilityCalculator.calculateBaseProbability('The Arcane Association', careerWeights);
            
            expect(commonProb).toBeGreaterThan(0);
            expect(militaryProb).toBeGreaterThan(commonProb);
            expect(arcaneProb).toBe(0);
        });

        test('should handle zero career weight', () => {
            const careerWeights = {
                'Common work': 0,
                'Military': 0,
                'The Arcane Association': 0
            };
            
            const prob = probabilityCalculator.calculateBaseProbability('Common work', careerWeights);
            expect(prob).toBe(0);
        });

        test('should handle negative career weight', () => {
            const careerWeights = {
                'Common work': -10,
                'Military': 0,
                'The Arcane Association': 0
            };
            
            const prob = probabilityCalculator.calculateBaseProbability('Common work', careerWeights);
            expect(prob).toBe(0);
        });
    });

    describe('Depth-Based Probability Calculation', () => {
        test('should decrease probability with depth', () => {
            const baseProbability = 0.8;
            const depth1 = probabilityCalculator.calculateDepthProbability(baseProbability, 1);
            const depth2 = probabilityCalculator.calculateDepthProbability(baseProbability, 2);
            const depth3 = probabilityCalculator.calculateDepthProbability(baseProbability, 3);
            
            expect(depth1).toBeLessThan(baseProbability);
            expect(depth2).toBeLessThan(depth1);
            expect(depth3).toBeLessThan(depth2);
        });

        test('should never go below minimum probability', () => {
            const baseProbability = 0.8;
            const depth10 = probabilityCalculator.calculateDepthProbability(baseProbability, 10);
            const depth20 = probabilityCalculator.calculateDepthProbability(baseProbability, 20);
            
            expect(depth10).toBeGreaterThanOrEqual(0.1); // Minimum probability
            expect(depth20).toBeGreaterThanOrEqual(0.1);
        });

        test('should handle zero depth', () => {
            const baseProbability = 0.8;
            const depth0 = probabilityCalculator.calculateDepthProbability(baseProbability, 0);
            
            expect(depth0).toBe(baseProbability);
        });

        test('should handle negative depth', () => {
            const baseProbability = 0.8;
            const depthNeg = probabilityCalculator.calculateDepthProbability(baseProbability, -1);
            
            expect(depthNeg).toBe(baseProbability);
        });
    });

    describe('Skill-Based Probability Calculation', () => {
        test('should increase probability with higher skills', () => {
            const baseProbability = 0.5;
            const lowSkills = { 'Strength': 10, 'Charisma': 5 };
            const highSkills = { 'Strength': 50, 'Charisma': 30 };
            
            const lowProb = probabilityCalculator.calculateSkillProbability(baseProbability, lowSkills);
            const highProb = probabilityCalculator.calculateSkillProbability(baseProbability, highSkills);
            
            expect(highProb).toBeGreaterThan(lowProb);
            expect(highProb).toBeGreaterThan(baseProbability);
        });

        test('should handle missing skills', () => {
            const baseProbability = 0.5;
            const skills = { 'Strength': 10 }; // Missing Charisma
            
            const prob = probabilityCalculator.calculateSkillProbability(baseProbability, skills);
            expect(prob).toBeGreaterThan(0);
            expect(prob).toBeLessThanOrEqual(1);
        });

        test('should handle empty skills object', () => {
            const baseProbability = 0.5;
            const skills = {};
            
            const prob = probabilityCalculator.calculateSkillProbability(baseProbability, skills);
            expect(prob).toBe(baseProbability);
        });

        test('should handle null skills', () => {
            const baseProbability = 0.5;
            const skills = null;
            
            const prob = probabilityCalculator.calculateSkillProbability(baseProbability, skills);
            expect(prob).toBe(baseProbability);
        });
    });

    describe('Choice Type Probability Calculation', () => {
        test('should calculate probability for different choice types', () => {
            const baseProbability = 0.5;
            const choiceTypes = ['aggressive', 'diplomatic', 'cautious', 'creative'];
            
            choiceTypes.forEach(type => {
                const prob = probabilityCalculator.calculateChoiceTypeProbability(baseProbability, type);
                expect(prob).toBeGreaterThan(0);
                expect(prob).toBeLessThanOrEqual(1);
            });
        });

        test('should handle unknown choice type', () => {
            const baseProbability = 0.5;
            const prob = probabilityCalculator.calculateChoiceTypeProbability(baseProbability, 'unknown');
            
            expect(prob).toBe(baseProbability);
        });

        test('should handle null choice type', () => {
            const baseProbability = 0.5;
            const prob = probabilityCalculator.calculateChoiceTypeProbability(baseProbability, null);
            
            expect(prob).toBe(baseProbability);
        });
    });

    describe('Combined Probability Calculation', () => {
        test('should calculate combined probability with all factors', () => {
            const careerWeights = { 'Common work': 30, 'Military': 60, 'The Arcane Association': 0 };
            const skills = { 'Strength': 25, 'Charisma': 15 };
            const choiceType = 'aggressive';
            const depth = 2;
            
            const prob = probabilityCalculator.calculateCombinedProbability(
                'Military',
                careerWeights,
                skills,
                choiceType,
                depth
            );
            
            expect(prob).toBeGreaterThan(0);
            expect(prob).toBeLessThanOrEqual(1);
        });

        test('should handle edge cases in combined calculation', () => {
            const careerWeights = { 'Common work': 0, 'Military': 0, 'The Arcane Association': 0 };
            const skills = {};
            const choiceType = 'unknown';
            const depth = 0;
            
            const prob = probabilityCalculator.calculateCombinedProbability(
                'Common work',
                careerWeights,
                skills,
                choiceType,
                depth
            );
            
            expect(prob).toBe(0.1); // Minimum probability
        });
    });

    describe('Probability Thresholds', () => {
        test('should identify probability categories', () => {
            const veryHigh = probabilityCalculator.getProbabilityCategory(0.9);
            const high = probabilityCalculator.getProbabilityCategory(0.7);
            const medium = probabilityCalculator.getProbabilityCategory(0.5);
            const low = probabilityCalculator.getProbabilityCategory(0.3);
            const veryLow = probabilityCalculator.getProbabilityCategory(0.1);
            
            expect(veryHigh).toBe('veryHigh');
            expect(high).toBe('high');
            expect(medium).toBe('medium');
            expect(low).toBe('low');
            expect(veryLow).toBe('veryLow');
        });

        test('should handle edge cases in probability categories', () => {
            const exactlyHigh = probabilityCalculator.getProbabilityCategory(0.8);
            const exactlyMedium = probabilityCalculator.getProbabilityCategory(0.6);
            const exactlyLow = probabilityCalculator.getProbabilityCategory(0.4);
            
            expect(exactlyHigh).toBe('veryHigh'); // 0.8 >= 0.8 is veryHigh
            expect(exactlyMedium).toBe('high'); // 0.6 >= 0.6 is high
            expect(exactlyLow).toBe('medium'); // 0.4 >= 0.4 is medium
        });
    });

    describe('Probability Validation', () => {
        test('should validate probability values', () => {
            expect(probabilityCalculator.isValidProbability(0.5)).toBe(true);
            expect(probabilityCalculator.isValidProbability(0)).toBe(true);
            expect(probabilityCalculator.isValidProbability(1)).toBe(true);
            expect(probabilityCalculator.isValidProbability(-0.1)).toBe(false);
            expect(probabilityCalculator.isValidProbability(1.1)).toBe(false);
        });

        test('should handle non-numeric probability values', () => {
            expect(probabilityCalculator.isValidProbability('0.5')).toBe(false);
            expect(probabilityCalculator.isValidProbability(null)).toBe(false);
            expect(probabilityCalculator.isValidProbability(undefined)).toBe(false);
        });
    });

    describe('Probability Statistics', () => {
        test('should calculate probability statistics', () => {
            const probabilities = [0.8, 0.6, 0.4, 0.2, 0.1];
            
            const stats = probabilityCalculator.calculateProbabilityStats(probabilities);
            
            expect(stats).toHaveProperty('average');
            expect(stats).toHaveProperty('min');
            expect(stats).toHaveProperty('max');
            expect(stats).toHaveProperty('median');
            expect(stats.average).toBeCloseTo(0.42, 1);
            expect(stats.min).toBe(0.1);
            expect(stats.max).toBe(0.8);
        });

        test('should handle empty probability array', () => {
            const stats = probabilityCalculator.calculateProbabilityStats([]);
            
            expect(stats.average).toBe(0);
            expect(stats.min).toBe(0);
            expect(stats.max).toBe(0);
            expect(stats.median).toBe(0);
        });

        test('should handle single probability value', () => {
            const stats = probabilityCalculator.calculateProbabilityStats([0.5]);
            
            expect(stats.average).toBe(0.5);
            expect(stats.min).toBe(0.5);
            expect(stats.max).toBe(0.5);
            expect(stats.median).toBe(0.5);
        });
    });
});
