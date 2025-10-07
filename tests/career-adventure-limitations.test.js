/**
 * Career Adventure Limitations Tests
 * Tests for adventure limitations (4 per life) and experience scaling
 */

import { CareerBasedAdventureIntegration } from '../src/llm/CareerBasedAdventureIntegration.js';
import { CareerAnalyzer } from '../src/llm/CareerAnalyzer.js';
import { StoryTreeManager } from '../src/llm/StoryTreeManager.js';
import { StoryTreeBuilder } from '../src/llm/StoryTreeBuilder.js';

describe('Career Adventure Limitations', () => {
    let careerBasedIntegration;
    let mockGameState;
    let mockStoryManager;
    let mockMistralAPI;

    beforeEach(() => {
        // Clear localStorage before each test
        if (global.localStorage) {
            global.localStorage.clear();
        }
        
        // Mock localStorage
        global.localStorage = {
            data: {},
            getItem: jest.fn((key) => global.localStorage.data[key] || null),
            setItem: jest.fn((key, value) => { global.localStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete global.localStorage.data[key]; }),
            clear: jest.fn(() => { global.localStorage.data = {}; })
        };

        // Mock game state
        mockGameState = {
            taskData: {
                'Beggar': { level: 10, maxLevel: 10 },
                'Farmer': { level: 2, maxLevel: 2 },
                'Squire': { level: 20, maxLevel: 20 },
                'Footman': { level: 4, maxLevel: 4 }
            },
            days: 25 * 365, // 25 years
            paused: false,
            rebirthOneCount: 0,
            rebirthTwoCount: 0
        };

        // Mock story manager
        mockStoryManager = {
            startNewStory: jest.fn(() => ({
                characterTraits: {},
                worldState: {},
                storyTurns: 0
            }))
        };

        // Mock Mistral API
        mockMistralAPI = {
            generateStory: jest.fn(() => Promise.resolve({
                story: "Test story continuation",
                choices: []
            }))
        };

        careerBasedIntegration = new CareerBasedAdventureIntegration(
            mockGameState,
            mockStoryManager,
            mockMistralAPI
        );
    });

    describe('Adventure Availability', () => {
        test('should check if adventure is available at correct ages', () => {
            // Test age 25
            mockGameState.days = 25 * 365;
            expect(careerBasedIntegration.isAdventureAvailable(mockGameState.days)).toBe(true);
            
            // Test age 45
            mockGameState.days = 45 * 365;
            expect(careerBasedIntegration.isAdventureAvailable(mockGameState.days)).toBe(true);
            
            // Test age 65
            mockGameState.days = 65 * 365;
            expect(careerBasedIntegration.isAdventureAvailable(mockGameState.days)).toBe(true);
            
            // Test age 200
            mockGameState.days = 200 * 365;
            expect(careerBasedIntegration.isAdventureAvailable(mockGameState.days)).toBe(true);
        });

        test('should not allow adventures at wrong ages', () => {
            // Test age 20 (too young)
            mockGameState.days = 20 * 365;
            expect(careerBasedIntegration.isAdventureAvailable(mockGameState.days)).toBe(false);
            
            // Test age 30 (between triggers)
            mockGameState.days = 30 * 365;
            expect(careerBasedIntegration.isAdventureAvailable(mockGameState.days)).toBe(false);
        });

        test('should get available amulet prompt at correct ages', () => {
            // Test age 25
            mockGameState.days = 25 * 365;
            expect(careerBasedIntegration.getAvailableAmuletPrompt(mockGameState.days)).toBe('age25');
            
            // Test age 45
            mockGameState.days = 45 * 365;
            expect(careerBasedIntegration.getAvailableAmuletPrompt(mockGameState.days)).toBe('age45');
            
            // Test age 65
            mockGameState.days = 65 * 365;
            expect(careerBasedIntegration.getAvailableAmuletPrompt(mockGameState.days)).toBe('age65');
            
            // Test age 200
            mockGameState.days = 200 * 365;
            expect(careerBasedIntegration.getAvailableAmuletPrompt(mockGameState.days)).toBe('age200');
        });
    });

    describe('Adventure Limitations (4 per life)', () => {
        test('should allow first adventure in a life', async () => {
            mockGameState.days = 25 * 365;
            const result = await careerBasedIntegration.startCareerBasedAdventure('age25');
            
            // Debug the result
            if (!result.success) {
                console.log('Adventure start failed:', result.message);
            }
            
            expect(result.success).toBe(true);
            expect(result.adventure).toBeDefined();
            expect(result.adventure.amuletPrompt).toBe('age25');
        });

        test('should prevent duplicate adventures in same life', async () => {
            mockGameState.days = 25 * 365;
            
            // Start first adventure
            const result1 = await careerBasedIntegration.startCareerBasedAdventure('age25');
            expect(result1.success).toBe(true);
            
            // Try to start same adventure again
            const result2 = await careerBasedIntegration.startCareerBasedAdventure('age25');
            expect(result2.success).toBe(false);
            expect(result2.message).toContain('already been used');
        });

        test('should allow different adventures in same life', async () => {
            mockGameState.days = 45 * 365;
            
            // Start age 25 adventure
            const result1 = await careerBasedIntegration.startCareerBasedAdventure('age25');
            expect(result1.success).toBe(true);
            
            // Start age 45 adventure
            const result2 = await careerBasedIntegration.startCareerBasedAdventure('age45');
            expect(result2.success).toBe(true);
        });

        test('should track used adventures per life', () => {
            const lifeId = careerBasedIntegration.getCurrentLifeId();
            expect(lifeId).toBe('life_0'); // First life
            
            // Mark adventure as used
            careerBasedIntegration.markAdventureAsUsed('age25');
            
            // Check if adventure has been used
            expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age25')).toBe(true);
            expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age45')).toBe(false);
        });

        test('should reset adventure tracking on rebirth', () => {
            // Mark adventure as used in first life
            careerBasedIntegration.markAdventureAsUsed('age25');
            
            // Simulate rebirth
            mockGameState.rebirthOneCount = 1;
            
            // Check new life ID
            const newLifeId = careerBasedIntegration.getCurrentLifeId();
            expect(newLifeId).toBe('life_1');
            
            // Adventure should be available again in new life
            expect(careerBasedIntegration.hasAdventureBeenUsed(newLifeId, 'age25')).toBe(false);
        });
    });

    describe('Experience Scaling (10x)', () => {
        test('should calculate 10x experience rewards', () => {
            const choice = {
                choiceType: 'aggressive',
                successProbability: 0.7
            };
            
            const rewards = careerBasedIntegration.calculateExperienceRewards(choice, true);
            
            expect(rewards.rarityMultiplier).toBe(10);
            expect(rewards.totalExperience).toBeGreaterThan(1000); // Base 100 * 10 * multipliers
        });

        test('should apply success/failure multipliers', () => {
            const choice = {
                choiceType: 'diplomatic',
                successProbability: 0.8
            };
            
            const successRewards = careerBasedIntegration.calculateExperienceRewards(choice, true);
            const failureRewards = careerBasedIntegration.calculateExperienceRewards(choice, false);
            
            expect(successRewards.successMultiplier).toBe(1.5);
            expect(failureRewards.successMultiplier).toBe(0.5);
            expect(successRewards.totalExperience).toBeGreaterThan(failureRewards.totalExperience);
        });

        test('should apply choice type multipliers', () => {
            const aggressiveChoice = { choiceType: 'aggressive', successProbability: 0.7 };
            const creativeChoice = { choiceType: 'creative', successProbability: 0.7 };
            
            const aggressiveRewards = careerBasedIntegration.calculateExperienceRewards(aggressiveChoice, true);
            const creativeRewards = careerBasedIntegration.calculateExperienceRewards(creativeChoice, true);
            
            expect(creativeRewards.choiceTypeMultiplier).toBe(1.5);
            expect(aggressiveRewards.choiceTypeMultiplier).toBe(1.2);
            expect(creativeRewards.totalExperience).toBeGreaterThan(aggressiveRewards.totalExperience);
        });

        test('should map choice types to relevant skills', () => {
            const aggressiveChoice = { choiceType: 'aggressive', successProbability: 0.7 };
            const diplomaticChoice = { choiceType: 'diplomatic', successProbability: 0.7 };
            
            const aggressiveRewards = careerBasedIntegration.calculateExperienceRewards(aggressiveChoice, true);
            const diplomaticRewards = careerBasedIntegration.calculateExperienceRewards(diplomaticChoice, true);
            
            // Aggressive should reward Strength and Concentration
            expect(aggressiveRewards.skillRewards.Strength).toBeGreaterThan(0);
            expect(aggressiveRewards.skillRewards.Concentration).toBeGreaterThan(0);
            
            // Diplomatic should reward Charisma and Meditation
            expect(diplomaticRewards.skillRewards.Charisma).toBeGreaterThan(0);
            expect(diplomaticRewards.skillRewards.Meditation).toBeGreaterThan(0);
        });

        test('should calculate realistic experience values', () => {
            const choice = {
                choiceType: 'creative',
                successProbability: 0.8
            };
            
            const rewards = careerBasedIntegration.calculateExperienceRewards(choice, true);
            
            // Base 100 * 10 (rarity) * 1.5 (success) * 1.5 (creative) = 2250
            expect(rewards.totalExperience).toBe(2250);
            expect(rewards.skillRewards['Mana control']).toBe(1350); // 60% of total
            expect(rewards.skillRewards.Intelligence).toBe(900); // 40% of total
        });
    });

    describe('Adventure Lifecycle with Limitations', () => {
        test('should handle complete adventure lifecycle with limitations', async () => {
            mockGameState.days = 25 * 365;
            
            // Start adventure
            const startResult = await careerBasedIntegration.startCareerBasedAdventure('age25');
            expect(startResult.success).toBe(true);
            
            // Make a choice (use a choice that exists in the adventure)
            const choiceResult = await careerBasedIntegration.handleCareerBasedChoice(
                'Lead a direct assault',
                true
            );
            
            // Debug the result
            if (!choiceResult.success) {
                console.log('Choice handling failed:', choiceResult.message);
            }
            
            expect(choiceResult.success).toBe(true);
            expect(choiceResult.experienceRewards).toBeDefined();
            expect(choiceResult.experienceRewards.rarityMultiplier).toBe(10);
            
            // End adventure
            const endResult = careerBasedIntegration.endCareerBasedAdventure();
            expect(endResult.success).toBe(true);
            
            // Try to start same adventure again (should fail)
            const duplicateResult = await careerBasedIntegration.startCareerBasedAdventure('age25');
            expect(duplicateResult.success).toBe(false);
        });

        test('should allow different adventures in same life', async () => {
            mockGameState.days = 45 * 365;
            
            // Start age 25 adventure
            const result1 = await careerBasedIntegration.startCareerBasedAdventure('age25');
            expect(result1.success).toBe(true);
            
            // End first adventure
            careerBasedIntegration.endCareerBasedAdventure();
            
            // Start age 45 adventure
            const result2 = await careerBasedIntegration.startCareerBasedAdventure('age45');
            expect(result2.success).toBe(true);
        });

        test('should track adventure usage across different lives', () => {
            // First life
            mockGameState.rebirthOneCount = 0;
            careerBasedIntegration.markAdventureAsUsed('age25');
            
            // Second life
            mockGameState.rebirthOneCount = 1;
            expect(careerBasedIntegration.hasAdventureBeenUsed('life_1', 'age25')).toBe(false);
            
            // Mark in second life
            careerBasedIntegration.markAdventureAsUsed('age25');
            expect(careerBasedIntegration.hasAdventureBeenUsed('life_1', 'age25')).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw error
            global.localStorage.getItem = jest.fn(() => {
                throw new Error('localStorage error');
            });
            
            const lifeId = careerBasedIntegration.getCurrentLifeId();
            const usedAdventures = careerBasedIntegration.getUsedAdventuresForLife(lifeId);
            
            expect(usedAdventures).toEqual([]);
        });

        test('should handle invalid adventure parameters', async () => {
            const result = await careerBasedIntegration.startCareerBasedAdventure('age999');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Must be at least');
        });

        test('should handle choice processing errors', async () => {
            // Start adventure first
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            
            // Try to process invalid choice
            const result = await careerBasedIntegration.handleCareerBasedChoice(
                'Invalid choice',
                true
            );
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
        });
    });

    describe('Performance and Memory', () => {
        test('should efficiently track adventure usage', () => {
            const lifeId = careerBasedIntegration.getCurrentLifeId();
            
            // Mark multiple adventures as used
            careerBasedIntegration.markAdventureAsUsed('age25');
            careerBasedIntegration.markAdventureAsUsed('age45');
            careerBasedIntegration.markAdventureAsUsed('age65');
            careerBasedIntegration.markAdventureAsUsed('age200');
            
            // Check all are marked as used
            expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age25')).toBe(true);
            expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age45')).toBe(true);
            expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age65')).toBe(true);
            expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age200')).toBe(true);
        });

        test('should not leak memory with multiple lives', () => {
            // Simulate multiple lives
            for (let i = 0; i < 10; i++) {
                mockGameState.rebirthOneCount = i;
                const lifeId = careerBasedIntegration.getCurrentLifeId();
                careerBasedIntegration.markAdventureAsUsed('age25');
                expect(careerBasedIntegration.hasAdventureBeenUsed(lifeId, 'age25')).toBe(true);
            }
            
            // Check that all lives are tracked separately
            expect(careerBasedIntegration.hasAdventureBeenUsed('life_0', 'age25')).toBe(true);
            expect(careerBasedIntegration.hasAdventureBeenUsed('life_5', 'age25')).toBe(true);
            expect(careerBasedIntegration.hasAdventureBeenUsed('life_9', 'age25')).toBe(true);
        });
    });
});
