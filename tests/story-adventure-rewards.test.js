/**
 * Tests for improved reward calculations in StoryAdventureManager
 */

// Handle both Node.js and browser environments
let StoryAdventureManager;
try {
  StoryAdventureManager = require('../src/llm/StoryAdventureManager');
} catch (e) {
  StoryAdventureManager = global.StoryAdventureManager;
}

describe('StoryAdventureManager Reward Calculations', () => {
    let mockGameState;
    let mockStoryManager;
    let adventureManager;

    beforeEach(() => {
        // Mock game state with various skill levels
        mockGameState = {
            taskData: {
                'Strength': { level: 10 },
                'Meditation': { level: 8 },
                'Concentration': { level: 12 },
                'Mana control': { level: 6 },
                'Footman': { level: 5 },
                'Beggar': { level: 15 }
            },
            setPaused: jest.fn(),
            setDays: jest.fn(),
            getDays: jest.fn(() => 365 * 25)
        };

        mockStoryManager = {
            startNewStory: jest.fn()
        };

        adventureManager = new StoryAdventureManager(mockGameState, mockStoryManager);
    });

    describe('calculateBaseXP', () => {
        test('should return default XP when no taskData', () => {
            adventureManager.gameState.taskData = null;
            
            const baseXP = adventureManager.calculateBaseXP();
            
            expect(baseXP).toBe(500); // New default value
        });

        test('should return default XP when no valid skills', () => {
            adventureManager.gameState.taskData = {};
            
            const baseXP = adventureManager.calculateBaseXP();
            
            expect(baseXP).toBe(500); // New default value
        });

        test('should calculate XP based on average skill level', () => {
            // Average level = (10 + 8 + 12 + 6 + 5 + 15) / 6 = 56 / 6 = 9.333...
            const baseXP = adventureManager.calculateBaseXP();
            
            // Expected: 500 + Math.floor(9.333... * 15) = 500 + 140 = 640
            expect(baseXP).toBe(640);
        });

        test('should clamp XP between 500 and 5000', () => {
            // Test minimum bound
            adventureManager.gameState.taskData = {
                'Skill1': { level: 0 },
                'Skill2': { level: 0 }
            };
            
            let baseXP = adventureManager.calculateBaseXP();
            expect(baseXP).toBe(500); // Should be clamped to minimum
            
            // Test maximum bound
            adventureManager.gameState.taskData = {
                'Skill1': { level: 1000 },
                'Skill2': { level: 1000 }
            };
            
            baseXP = adventureManager.calculateBaseXP();
            expect(baseXP).toBe(5000); // Should be clamped to maximum
        });

        test('should scale appropriately with higher levels', () => {
            adventureManager.gameState.taskData = {
                'Skill1': { level: 50 },
                'Skill2': { level: 50 }
            };
            
            const baseXP = adventureManager.calculateBaseXP();
            
            // Expected: 500 + (50 * 15) = 1250
            expect(baseXP).toBe(1250);
        });
    });

    describe('calculateRewards', () => {
        beforeEach(() => {
            // Set up a typical adventure scenario
            adventureManager.successCount = 8;
            adventureManager.failureCount = 2;
            adventureManager.turnCount = 10;
            adventureManager.choiceTypes = {
                aggressive: 4,
                diplomatic: 3,
                cautious: 2,
                creative: 1
            };
        });

        test('should calculate base XP rewards for each choice type', () => {
            const rewards = adventureManager.calculateRewards();
            
            // Base XP should be 640 (from average level 9.333...)
            // Success rate = 8 / (8 + 2) = 0.8
            // Bonus multiplier = 2.0 (since success rate > 0.75 and successCount >= 5)
            const expectedBaseXP = 640;
            const successRate = 0.8;
            const bonusMultiplier = 2.0;
            
            expect(rewards.skillXP.strength).toBe(Math.floor(4 * expectedBaseXP * successRate * bonusMultiplier)); // Aggressive choices
            expect(rewards.skillXP.charisma).toBe(Math.floor(3 * expectedBaseXP * successRate * bonusMultiplier)); // Diplomatic choices
            expect(rewards.skillXP.concentration).toBe(Math.floor(2 * expectedBaseXP * successRate * bonusMultiplier)); // Cautious choices
            expect(rewards.skillXP.magic).toBe(Math.floor(1 * expectedBaseXP * successRate * bonusMultiplier)); // Creative choices
        });

        test('should apply success rate multiplier', () => {
            // Success rate = 8 / (8 + 2) = 0.8
            const rewards = adventureManager.calculateRewards();
            
            const expectedBaseXP = 640;
            const successRate = 0.8;
            
            // Each skill XP should be reduced by success rate and then multiplied by bonus
            const bonusMultiplier = 2.0;
            expect(rewards.skillXP.strength).toBe(Math.floor(4 * expectedBaseXP * successRate * bonusMultiplier));
            expect(rewards.skillXP.charisma).toBe(Math.floor(3 * expectedBaseXP * successRate * bonusMultiplier));
            expect(rewards.skillXP.concentration).toBe(Math.floor(2 * expectedBaseXP * successRate * bonusMultiplier));
            expect(rewards.skillXP.magic).toBe(Math.floor(1 * expectedBaseXP * successRate * bonusMultiplier));
        });

        test('should apply 2.0x bonus for high success rate', () => {
            // 80% success rate with 8 successes should trigger 2.0x bonus
            const rewards = adventureManager.calculateRewards();
            
            expect(rewards.bonusMultiplier).toBe(2.0);
            
            // Verify bonus was applied (XP should be doubled)
            const expectedBaseXP = 640;
            const successRate = 0.8;
            const expectedXP = Math.floor(4 * expectedBaseXP * successRate * 2.0);
            
            expect(rewards.skillXP.strength).toBe(expectedXP);
        });

        test('should apply 3.0x bonus for very high success rate', () => {
            // Set up scenario with 90%+ success rate and 10+ successes
            adventureManager.successCount = 12;
            adventureManager.failureCount = 1;
            adventureManager.choiceTypes = {
                aggressive: 5,
                diplomatic: 4,
                cautious: 2,
                creative: 2
            };
            
            const rewards = adventureManager.calculateRewards();
            
            expect(rewards.bonusMultiplier).toBe(3.0);
            
            // Verify additional 1.5x multiplier was applied
            const expectedBaseXP = 640;
            const successRate = 12 / 13; // ~0.92
            // The code applies 2.0x bonus first, then 1.5x additional bonus
            // Allow for small rounding differences
            const expectedXP = Math.floor(5 * expectedBaseXP * successRate * 2.0 * 1.5);
            
            expect(rewards.skillXP.strength).toBeCloseTo(expectedXP, -1);
        });

        test('should advance time for long adventures', () => {
            adventureManager.turnCount = 15;
            
            const rewards = adventureManager.calculateRewards();
            
            // Expected: Math.floor(15 * 0.1) = 1
            expect(rewards.daysAdvanced).toBe(1);
        });

        test('should not advance time for short adventures', () => {
            adventureManager.turnCount = 5;
            
            const rewards = adventureManager.calculateRewards();
            
            expect(rewards.daysAdvanced).toBe(0);
        });

        test('should provide unlocks for exceptional performance', () => {
            adventureManager.successCount = 16;
            
            const rewards = adventureManager.calculateRewards();
            
            expect(rewards.unlocks).toContain('Adventurer\'s Badge');
        });

        test('should apply reduced penalty for early manual end', () => {
            adventureManager.turnCount = 3; // Less than 5 turns
            
            const rewards = adventureManager.calculateRewards(true); // Manual end
            
            expect(rewards.rewardMultiplier).toBe(0.9); // 10% penalty
        });

        test('should not apply penalty for manual end after 5 turns', () => {
            adventureManager.turnCount = 6; // More than 5 turns
            
            const rewards = adventureManager.calculateRewards(true); // Manual end
            
            expect(rewards.rewardMultiplier).toBe(1.0); // No penalty
        });

        test('should not apply penalty for auto-end', () => {
            adventureManager.turnCount = 3; // Less than 5 turns
            
            const rewards = adventureManager.calculateRewards(false); // Auto end
            
            expect(rewards.rewardMultiplier).toBe(1.0); // No penalty for auto-end
        });
    });

    describe('reward scaling with character progression', () => {
        test('should provide higher rewards for higher level characters', () => {
            // Low level character
            adventureManager.gameState.taskData = {
                'Strength': { level: 5 },
                'Meditation': { level: 5 }
            };
            
            adventureManager.successCount = 5;
            adventureManager.failureCount = 1;
            adventureManager.choiceTypes = { aggressive: 3, diplomatic: 2, cautious: 1, creative: 0 };
            
            const lowLevelRewards = adventureManager.calculateRewards();
            
            // High level character
            adventureManager.gameState.taskData = {
                'Strength': { level: 50 },
                'Meditation': { level: 50 }
            };
            
            const highLevelRewards = adventureManager.calculateRewards();
            
            // High level character should get more XP (but not 5x due to scaling formula)
            expect(highLevelRewards.skillXP.strength).toBeGreaterThan(lowLevelRewards.skillXP.strength * 1.5);
        });

        test('should maintain reward relevance at all levels', () => {
            const testLevels = [1, 10, 25, 50, 100];
            const rewards = [];
            
            testLevels.forEach(level => {
                adventureManager.gameState.taskData = {
                    'Strength': { level },
                    'Meditation': { level }
                };
                
                adventureManager.successCount = 5;
                adventureManager.failureCount = 1;
                adventureManager.choiceTypes = { aggressive: 3, diplomatic: 2, cautious: 0, creative: 0 };
                
                rewards.push(adventureManager.calculateRewards().skillXP.strength);
            });
            
            // Each level should provide progressively more XP
            for (let i = 1; i < rewards.length; i++) {
                expect(rewards[i]).toBeGreaterThan(rewards[i - 1]);
            }
        });
    });

    describe('edge cases', () => {
        test('should handle zero choices gracefully', () => {
            adventureManager.successCount = 0;
            adventureManager.failureCount = 0;
            adventureManager.choiceTypes = { aggressive: 0, diplomatic: 0, cautious: 0, creative: 0 };
            
            const rewards = adventureManager.calculateRewards();
            
            expect(rewards.skillXP.strength).toBe(0);
            expect(rewards.skillXP.charisma).toBe(0);
            expect(rewards.skillXP.concentration).toBe(0);
            expect(rewards.skillXP.magic).toBe(0);
        });

        test('should handle all failed choices', () => {
            adventureManager.successCount = 0;
            adventureManager.failureCount = 10;
            adventureManager.choiceTypes = { aggressive: 5, diplomatic: 3, cautious: 2, creative: 0 };
            
            const rewards = adventureManager.calculateRewards();
            
            // All XP should be zero due to 0% success rate
            expect(rewards.skillXP.strength).toBe(0);
            expect(rewards.skillXP.charisma).toBe(0);
            expect(rewards.skillXP.concentration).toBe(0);
        });

        test('should handle all successful choices', () => {
            adventureManager.successCount = 10;
            adventureManager.failureCount = 0;
            adventureManager.choiceTypes = { aggressive: 5, diplomatic: 3, cautious: 2, creative: 0 };
            
            const rewards = adventureManager.calculateRewards();
            
            // Should get maximum XP with no reduction
            const expectedBaseXP = 640;
            // Success rate = 1.0, bonus multiplier = 2.0, but there might be additional multipliers
            expect(rewards.skillXP.strength).toBe(5 * expectedBaseXP * 2.0 * 1.5); // With all multipliers
        });
    });
});
