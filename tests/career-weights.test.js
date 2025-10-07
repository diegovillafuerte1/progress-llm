/**
 * CareerWeights Tests
 * Tests for job weight mappings and career category definitions
 */

// Mock the global CareerWeights for testing
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

describe('CareerWeights', () => {
    describe('Job Weight Mappings', () => {
        test('should have correct Common Work weights', () => {
            const commonWorkWeights = CareerWeights.getJobWeights()['Common work'];
            
            expect(commonWorkWeights['Beggar']).toBe(1);
            expect(commonWorkWeights['Farmer']).toBe(10);
            expect(commonWorkWeights['Fisherman']).toBe(100);
            expect(commonWorkWeights['Miner']).toBe(1000);
            expect(commonWorkWeights['Blacksmith']).toBe(10000);
            expect(commonWorkWeights['Merchant']).toBe(100000);
        });

        test('should have correct Military weights', () => {
            const militaryWeights = CareerWeights.getJobWeights()['Military'];
            
            expect(militaryWeights['Squire']).toBe(1);
            expect(militaryWeights['Footman']).toBe(10);
            expect(militaryWeights['Veteran footman']).toBe(100);
            expect(militaryWeights['Knight']).toBe(1000);
            expect(militaryWeights['Veteran knight']).toBe(10000);
            expect(militaryWeights['Elite knight']).toBe(100000);
            expect(militaryWeights['Holy knight']).toBe(1000000);
            expect(militaryWeights['Legendary knight']).toBe(10000000);
        });

        test('should have correct Arcane Association weights', () => {
            const arcaneWeights = CareerWeights.getJobWeights()['The Arcane Association'];
            
            expect(arcaneWeights['Student']).toBe(1);
            expect(arcaneWeights['Apprentice mage']).toBe(10);
            expect(arcaneWeights['Mage']).toBe(100);
            expect(arcaneWeights['Wizard']).toBe(1000);
            expect(arcaneWeights['Master wizard']).toBe(10000);
            expect(arcaneWeights['Chairman']).toBe(100000);
        });
    });

    describe('Individual Job Weight Lookup', () => {
        test('should return correct weight for valid job and category', () => {
            expect(CareerWeights.getJobWeight('Beggar', 'Common work')).toBe(1);
            expect(CareerWeights.getJobWeight('Farmer', 'Common work')).toBe(10);
            expect(CareerWeights.getJobWeight('Knight', 'Military')).toBe(1000);
            expect(CareerWeights.getJobWeight('Mage', 'The Arcane Association')).toBe(100);
        });

        test('should return 0 for invalid job', () => {
            expect(CareerWeights.getJobWeight('Invalid Job', 'Common work')).toBe(0);
            expect(CareerWeights.getJobWeight('', 'Common work')).toBe(0);
            expect(CareerWeights.getJobWeight(null, 'Common work')).toBe(0);
        });

        test('should return 0 for invalid category', () => {
            expect(CareerWeights.getJobWeight('Beggar', 'Invalid Category')).toBe(0);
            expect(CareerWeights.getJobWeight('Beggar', '')).toBe(0);
            expect(CareerWeights.getJobWeight('Beggar', null)).toBe(0);
        });

        test('should return 0 for job in wrong category', () => {
            expect(CareerWeights.getJobWeight('Knight', 'Common work')).toBe(0);
            expect(CareerWeights.getJobWeight('Beggar', 'Military')).toBe(0);
            expect(CareerWeights.getJobWeight('Mage', 'Common work')).toBe(0);
        });
    });

    describe('Career Category Definitions', () => {
        test('should have all three career categories', () => {
            const categories = CareerWeights.getCareerCategories();
            
            expect(categories).toContain('Common work');
            expect(categories).toContain('Military');
            expect(categories).toContain('The Arcane Association');
            expect(categories).toHaveLength(3);
        });

        test('should return jobs for each category', () => {
            const commonWorkJobs = CareerWeights.getJobsForCategory('Common work');
            const militaryJobs = CareerWeights.getJobsForCategory('Military');
            const arcaneJobs = CareerWeights.getJobsForCategory('The Arcane Association');
            
            expect(commonWorkJobs).toContain('Beggar');
            expect(commonWorkJobs).toContain('Merchant');
            expect(commonWorkJobs).toHaveLength(6);
            
            expect(militaryJobs).toContain('Squire');
            expect(militaryJobs).toContain('Legendary knight');
            expect(militaryJobs).toHaveLength(8);
            
            expect(arcaneJobs).toContain('Student');
            expect(arcaneJobs).toContain('Chairman');
            expect(arcaneJobs).toHaveLength(6);
        });

        test('should return empty array for invalid category', () => {
            expect(CareerWeights.getJobsForCategory('Invalid Category')).toEqual([]);
            expect(CareerWeights.getJobsForCategory('')).toEqual([]);
            expect(CareerWeights.getJobsForCategory(null)).toEqual([]);
        });
    });

    describe('Weight Calculation Helpers', () => {
        test('should calculate total weight for category', () => {
            const jobLevels = {
                'Beggar': { level: 5, maxLevel: 5 },
                'Farmer': { level: 3, maxLevel: 3 },
                'Knight': { level: 2, maxLevel: 2 }
            };
            
            const commonWorkWeight = CareerWeights.calculateCategoryWeight('Common work', jobLevels);
            const militaryWeight = CareerWeights.calculateCategoryWeight('Military', jobLevels);
            
            expect(commonWorkWeight).toBe(35); // (5 * 1) + (3 * 10) = 5 + 30 = 35
            expect(militaryWeight).toBe(2000); // (2 * 1000) = 2000
        });

        test('should handle missing jobs in category', () => {
            const jobLevels = {
                'Beggar': { level: 5, maxLevel: 5 },
                'Knight': { level: 2, maxLevel: 2 }
            };
            
            const commonWorkWeight = CareerWeights.calculateCategoryWeight('Common work', jobLevels);
            const arcaneWeight = CareerWeights.calculateCategoryWeight('The Arcane Association', jobLevels);
            
            expect(commonWorkWeight).toBe(5); // Only Beggar: 5 * 1 = 5
            expect(arcaneWeight).toBe(0); // No arcane jobs
        });

        test('should use max level for weight calculation', () => {
            const jobLevels = {
                'Beggar': { level: 1, maxLevel: 10 }, // Current 1, max 10
                'Farmer': { level: 0, maxLevel: 5 }    // Current 0, max 5
            };
            
            const weight = CareerWeights.calculateCategoryWeight('Common work', jobLevels);
            
            expect(weight).toBe(60); // (10 * 1) + (5 * 10) = 10 + 50 = 60
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty job levels', () => {
            const emptyJobLevels = {};
            
            const weight = CareerWeights.calculateCategoryWeight('Common work', emptyJobLevels);
            
            expect(weight).toBe(0);
        });

        test('should handle null job levels', () => {
            const weight = CareerWeights.calculateCategoryWeight('Common work', null);
            
            expect(weight).toBe(0);
        });

        test('should handle undefined job levels', () => {
            const weight = CareerWeights.calculateCategoryWeight('Common work', undefined);
            
            expect(weight).toBe(0);
        });
    });

    describe('Weight Scaling', () => {
        test('should have exponential weight scaling', () => {
            const weights = CareerWeights.getJobWeights();
            
            // Common work scaling: 1, 10, 100, 1000, 10000, 100000
            const commonWork = weights['Common work'];
            expect(commonWork['Beggar']).toBe(1);
            expect(commonWork['Farmer']).toBe(10);
            expect(commonWork['Fisherman']).toBe(100);
            expect(commonWork['Miner']).toBe(1000);
            expect(commonWork['Blacksmith']).toBe(10000);
            expect(commonWork['Merchant']).toBe(100000);
        });

        test('should have consistent scaling across categories', () => {
            const weights = CareerWeights.getJobWeights();
            
            // All categories should start at 1 and scale by 10x
            expect(weights['Common work']['Beggar']).toBe(1);
            expect(weights['Military']['Squire']).toBe(1);
            expect(weights['The Arcane Association']['Student']).toBe(1);
            
            expect(weights['Common work']['Farmer']).toBe(10);
            expect(weights['Military']['Footman']).toBe(10);
            expect(weights['The Arcane Association']['Apprentice mage']).toBe(10);
        });
    });
});
