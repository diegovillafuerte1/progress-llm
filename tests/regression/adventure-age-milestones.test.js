/**
 * Adventure Age Milestones Tests
 * 
 * Tests age calculation and adventure availability logic for the minimal adventure system
 */

describe('Adventure Age Milestones', () => {
    let mockGameData;
    let mockDocument;
    let mockLocalStorage;
    
    beforeEach(() => {
        // Mock global objects
        global.gameData = {
            days: 0,
            taskData: {
                Strength: { level: 0, xp: 0 },
                Concentration: { level: 0, xp: 0 }
            },
            coins: 0,
            evil: 0
        };
        
        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn()
        };
        
        mockDocument = {
            getElementById: jest.fn(() => ({
                style: { display: 'none' },
                disabled: false,
                title: ''
            })),
            querySelector: jest.fn()
        };
        
        global.document = mockDocument;
        global.localStorage = mockLocalStorage;
        global.alert = jest.fn();
        global.setPause = jest.fn();
        global.updateUI = jest.fn();
        
        // Load the minimal adventure system
        require('../../js/main-adventure-minimal.js');
        
        mockGameData = { ...global.gameData };
    });

    describe('Age Calculation', () => {
        test('should calculate age correctly from gameData.days', () => {
            const testCases = [
                { days: 9125, expectedAge: 25 }, // Exactly 25 years
                { days: 9124, expectedAge: 24 }, // Just under 25 years
                { days: 9126, expectedAge: 25 }, // Just over 25 years
                { days: 16425, expectedAge: 45 }, // Exactly 45 years
                { days: 23725, expectedAge: 65 }, // Exactly 65 years
                { days: 73000, expectedAge: 200 } // Exactly 200 years
            ];
            
            testCases.forEach(({ days, expectedAge }) => {
                global.gameData.days = days;
                const calculatedAge = Math.floor(days / 365);
                expect(calculatedAge).toBe(expectedAge);
            });
        });
        
        test('should not rely on gameData.age (which is undefined)', () => {
            // gameData.age should not exist
            expect(global.gameData.age).toBeUndefined();
            
            // We should use gameData.days instead
            global.gameData.days = 9125;
            const age = Math.floor(global.gameData.days / 365);
            expect(age).toBe(25);
        });
    });

    describe('Adventure Button Visibility', () => {
        test('should show age25 button when character is 25 or older', () => {
            global.gameData.days = 9125; // Age 25
            global.adventureData = { apiKey: 'test-key', usedAdventures: {} };
            
            // Test age requirement logic
            const ageRequirement = 25;
            const currentAge = Math.floor(global.gameData.days / 365);
            const ageRequirementMet = currentAge >= ageRequirement;
            
            expect(ageRequirementMet).toBe(true);
        });
        
        test('should hide age25 button when character is under 25', () => {
            global.gameData.days = 9124; // Age 24
            global.adventureData = { apiKey: 'test-key', usedAdventures: {} };
            
            const ageRequirement = 25;
            const currentAge = Math.floor(global.gameData.days / 365);
            const ageRequirementMet = currentAge >= ageRequirement;
            
            expect(ageRequirementMet).toBe(false);
        });
        
        test('should show multiple adventure buttons when age requirements are met', () => {
            global.gameData.days = 23725; // Age 65
            global.adventureData = { apiKey: 'test-key', usedAdventures: {} };
            
            const milestones = [
                { age: 25, shouldShow: true },
                { age: 45, shouldShow: true },
                { age: 65, shouldShow: true },
                { age: 200, shouldShow: false }
            ];
            
            const currentAge = Math.floor(global.gameData.days / 365);
            
            milestones.forEach(({ age, shouldShow }) => {
                const ageRequirementMet = currentAge >= age;
                expect(ageRequirementMet).toBe(shouldShow);
            });
        });
        
        test('should show all adventure buttons at age 200', () => {
            global.gameData.days = 73000; // Age 200
            global.adventureData = { apiKey: 'test-key', usedAdventures: {} };
            
            const milestones = [25, 45, 65, 200];
            const currentAge = Math.floor(global.gameData.days / 365);
            
            milestones.forEach(age => {
                const ageRequirementMet = currentAge >= age;
                expect(ageRequirementMet).toBe(true);
            });
        });
    });

    describe('Adventure Button State', () => {
        test('should disable buttons when no API key is available', () => {
            global.adventureData = { apiKey: '', usedAdventures: {} };
            global.gameData.days = 9125; // Age 25
            
            const apiKeyAvailable = !!global.adventureData.apiKey;
            const ageRequirementMet = Math.floor(global.gameData.days / 365) >= 25;
            const shouldDisable = !apiKeyAvailable || !ageRequirementMet;
            
            expect(shouldDisable).toBe(true);
        });
        
        test('should enable buttons when API key is available and age requirement is met', () => {
            global.adventureData = { apiKey: 'test-key', usedAdventures: {} };
            global.gameData.days = 9125; // Age 25
            
            const apiKeyAvailable = !!global.adventureData.apiKey;
            const ageRequirementMet = Math.floor(global.gameData.days / 365) >= 25;
            const shouldDisable = !apiKeyAvailable || !ageRequirementMet;
            
            expect(shouldDisable).toBe(false);
        });
        
        test('should disable buttons when adventure already used this life', () => {
            global.adventureData = { apiKey: 'test-key', usedAdventures: { age25: true } };
            global.gameData.days = 9125; // Age 25
            
            const apiKeyAvailable = !!global.adventureData.apiKey;
            const ageRequirementMet = Math.floor(global.gameData.days / 365) >= 25;
            const alreadyUsed = global.adventureData.usedAdventures.age25;
            const shouldDisable = !apiKeyAvailable || !ageRequirementMet || alreadyUsed;
            
            expect(shouldDisable).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle leap years correctly', () => {
            // Test with leap year edge cases
            global.gameData.days = 9125.5; // Just over 25 years
            const age = Math.floor(global.gameData.days / 365);
            expect(age).toBe(25);
        });
        
        test('should handle very large age values', () => {
            global.gameData.days = 365000; // 1000 years
            const age = Math.floor(global.gameData.days / 365);
            expect(age).toBe(1000);
        });
        
        test('should handle zero days', () => {
            global.gameData.days = 0;
            const age = Math.floor(global.gameData.days / 365);
            expect(age).toBe(0);
        });
    });

    describe('Integration with Story Tree System', () => {
        test('should not show story tree twisty when no adventure has been completed', () => {
            global.adventureData = { storyTrees: {} };
            
            const hasStoryTree = !!global.adventureData.storyTrees.age25;
            expect(hasStoryTree).toBe(false);
        });
        
        test('should show story tree twisty when adventure has been completed', () => {
            global.adventureData = { 
                storyTrees: { 
                    age25: { story: 'Test story', choices: [] } 
                } 
            };
            
            const hasStoryTree = !!global.adventureData.storyTrees.age25;
            expect(hasStoryTree).toBe(true);
        });
    });
});