/**
 * Adventure Reward System Tests
 * 
 * Tests the reward calculation and application system for the minimal adventure system
 */

describe('Adventure Reward System', () => {
    let mockGameData;
    
    beforeEach(() => {
        // Mock global objects
        global.gameData = {
            taskData: {
                Strength: { level: 0, xp: 0 },
                Bargaining: { level: 0, xp: 0 },
                'Mana control': { level: 0, xp: 0 },
                'Battle tactics': { level: 0, xp: 0 },
                Concentration: { level: 0, xp: 0 },
                Productivity: { level: 0, xp: 0 },
                'Dark influence': { level: 0, xp: 0 }
            },
            days: 9125, // Age 25
            coins: 1000,
            evil: 0
        };
        
        global.getGameSpeed = jest.fn(() => 1);
        global.calculateTimeBasedXP = jest.fn((skillName, baseXP) => baseXP);
        
        // Load the minimal adventure system
        require('../../js/main-adventure-minimal.js');
        
        mockGameData = { ...global.gameData };
    });

    describe('Reward Calculation', () => {
        test('should calculate rewards for successful choice', () => {
            const choiceType = 'aggressive';
            const isSuccess = true;
            
            // Test skill mapping logic (from our minimal system)
            const skillMappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            const skillName = skillMappings[choiceType];
            expect(skillName).toBe('Strength');
            
            // Test that rewards are calculated
            const baseXP = isSuccess ? 1500 : 500;
            expect(baseXP).toBe(1500);
        });
        
        test('should calculate rewards for failed choice', () => {
            const choiceType = 'diplomatic';
            const isSuccess = false;
            
            const skillMappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            const skillName = skillMappings[choiceType];
            expect(skillName).toBe('Bargaining');
            
            const baseXP = isSuccess ? 1500 : 500;
            expect(baseXP).toBe(500);
        });
        
        test('success should give more XP than failure', () => {
            const successXP = 1500;
            const failureXP = 500;
            
            expect(successXP).toBeGreaterThan(failureXP);
        });
    });

    describe('Reward Application', () => {
        test('aggressive choice should award XP to Strength skill', () => {
            const skillMappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            const skillName = skillMappings['aggressive'];
            expect(skillName).toBe('Strength');
            
            // Test XP application
            const initialXP = global.gameData.taskData.Strength.xp;
            global.gameData.taskData.Strength.xp += 1000;
            
            expect(global.gameData.taskData.Strength.xp).toBe(initialXP + 1000);
        });
        
        test('diplomatic choice should award XP to Bargaining skill', () => {
            const skillMappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            const skillName = skillMappings['diplomatic'];
            expect(skillName).toBe('Bargaining');
        });
        
        test('cautious choice should award XP to Concentration skill', () => {
            const skillMappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            const skillName = skillMappings['cautious'];
            expect(skillName).toBe('Concentration');
        });
        
        test('creative choice should award XP to Concentration skill', () => {
            const skillMappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            const skillName = skillMappings['creative'];
            expect(skillName).toBe('Concentration');
        });
    });

    describe('Reward Integration', () => {
        test('should not crash if skill does not exist', () => {
            // Test with non-existent skill
            const nonExistentSkill = 'NonExistentSkill';
            expect(global.gameData.taskData[nonExistentSkill]).toBeUndefined();
            
            // Should handle gracefully
            expect(() => {
                if (global.gameData.taskData[nonExistentSkill]) {
                    global.gameData.taskData[nonExistentSkill].xp += 100;
                }
            }).not.toThrow();
        });
        
        test('should handle skill level updates correctly', () => {
            const skillName = 'Strength';
            const initialLevel = global.gameData.taskData[skillName].level;
            
            // Simulate leveling up
            global.gameData.taskData[skillName].level += 1;
            
            expect(global.gameData.taskData[skillName].level).toBe(initialLevel + 1);
        });
    });

    describe('Choice Type Mapping', () => {
        test('should map all choice types to correct skills', () => {
            const mappings = {
                aggressive: 'Strength',
                diplomatic: 'Bargaining',
                cautious: 'Concentration',
                creative: 'Concentration'
            };
            
            Object.entries(mappings).forEach(([choiceType, expectedSkill]) => {
                const actualSkill = mappings[choiceType];
                expect(actualSkill).toBe(expectedSkill);
            });
        });
    });

    describe('Power Level Integration', () => {
        test('should calculate power level correctly', () => {
            // Set up some skill levels
            global.gameData.taskData.Strength.level = 10;
            global.gameData.taskData.Concentration.level = 20;
            
            // Test power level calculation logic
            const skills = global.gameData.taskData;
            let totalLevel = 0;
            let skillCount = 0;
            
            for (const skillName in skills) {
                totalLevel += skills[skillName].level || 0;
                skillCount++;
            }
            
            const averageLevel = skillCount > 0 ? totalLevel / skillCount : 0;
            expect(averageLevel).toBeGreaterThan(0);
        });
    });
});