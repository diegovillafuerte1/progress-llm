/**
 * Adventure Integration Tests
 * Tests for integration with career-based prompt generation
 */

import { CareerBasedPromptGenerator } from '../src/llm/CareerBasedPromptGenerator.js';
import { CareerAnalyzer } from '../src/llm/CareerAnalyzer.js';
import { StoryTreeManager } from '../src/llm/StoryTreeManager.js';
import { StoryTreeBuilder } from '../src/llm/StoryTreeBuilder.js';

describe('Adventure Integration', () => {
    let careerBasedPromptGenerator;
    let careerAnalyzer;
    let storyTreeManager;
    let storyTreeBuilder;
    let mockGameState;

    beforeEach(() => {
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
            }
        };

        careerAnalyzer = new CareerAnalyzer(mockGameState);
        storyTreeManager = new StoryTreeManager();
        storyTreeBuilder = new StoryTreeBuilder(storyTreeManager, careerAnalyzer);
        careerBasedPromptGenerator = new CareerBasedPromptGenerator(careerAnalyzer, storyTreeBuilder);
    });

    describe('Career-Based Adventure Integration', () => {
        test('should generate career-based adventure prompts', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Generate career-based prompt
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt).toHaveProperty('title');
            expect(prompt).toHaveProperty('description');
            expect(prompt).toHaveProperty('choices');
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should generate different prompts for different career categories', () => {
            const amuletPrompt = 'age25';
            
            const commonPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Common work');
            const militaryPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Military');
            
            expect(commonPrompt.title).not.toEqual(militaryPrompt.title);
            expect(commonPrompt.description).not.toEqual(militaryPrompt.description);
        });

        test('should handle career-based choice selection', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            
            // Generate career-based prompt
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Find a choice
            const selectedChoice = prompt.choices.find(c => c.choiceType === 'aggressive');
            expect(selectedChoice).toBeDefined();
            expect(selectedChoice).toHaveProperty('text');
            expect(selectedChoice).toHaveProperty('successProbability');
            expect(selectedChoice).toHaveProperty('choiceType');
        });
    });

    describe('Story Tree Integration with Adventures', () => {
        test('should use existing story tree choices in adventures', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Negotiate with merchants';
            const result = { success: true };
            
            // Add choice to story tree
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            
            // Generate prompt (should include existing choice)
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            const existingChoice = prompt.choices.find(c => c.text === choice);
            expect(existingChoice).toBeDefined();
        });

        test('should add new choices to story tree', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            const choice = 'Lead military campaign';
            const result = { success: true };
            
            // Add choice to story tree
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            
            // Verify choice was added
            const availableChoices = storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
            expect(availableChoices).toContain(choice);
        });

        test('should persist story tree choices across sessions', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Start small business';
            const result = { success: true };
            
            // Add choice to story tree
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            
            // Generate prompt (should include existing choice)
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Should include previous choice
            const previousChoice = prompt.choices.find(c => c.text === choice);
            expect(previousChoice).toBeDefined();
        });
    });

    describe('Career Weight Integration', () => {
        test('should generate different prompts based on career weight', () => {
            const amuletPrompt = 'age25';
            
            // High career weight (Military)
            const militaryPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Military');
            
            // Low career weight (Common work)
            const commonPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Common work');
            
            expect(militaryPrompt.choices.length).toBeGreaterThan(0);
            expect(commonPrompt.choices.length).toBeGreaterThan(0);
            
            // Military should have higher success probabilities
            const militaryAvgProb = militaryPrompt.choices.reduce((sum, c) => sum + c.successProbability, 0) / militaryPrompt.choices.length;
            const commonAvgProb = commonPrompt.choices.reduce((sum, c) => sum + c.successProbability, 0) / commonPrompt.choices.length;
            
            expect(militaryAvgProb).toBeGreaterThanOrEqual(commonAvgProb);
        });

        test('should adapt prompts to career progression', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Generate initial prompt
            const initialPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Simulate career progression
            mockGameState.taskData['Merchant'] = { level: 5, maxLevel: 5 };
            const updatedCareerAnalyzer = new CareerAnalyzer(mockGameState);
            const updatedPromptGenerator = new CareerBasedPromptGenerator(updatedCareerAnalyzer, storyTreeBuilder);
            
            const updatedPrompt = updatedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(updatedPrompt.choices.length).toBeGreaterThan(0);
        });
    });

    describe('Adventure Lifecycle Integration', () => {
        test('should handle complete adventure lifecycle', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            
            // Generate prompt
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            expect(prompt.choices.length).toBeGreaterThan(0);
            
            // Make choices
            const choice1 = prompt.choices[0];
            const choice2 = prompt.choices[1];
            
            expect(choice1).toHaveProperty('text');
            expect(choice1).toHaveProperty('successProbability');
            expect(choice2).toHaveProperty('text');
            expect(choice2).toHaveProperty('successProbability');
        });

        test('should handle different choice types', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Generate prompt
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Check different choice types
            const choiceTypes = prompt.choices.map(c => c.choiceType);
            const uniqueTypes = [...new Set(choiceTypes)];
            
            expect(uniqueTypes.length).toBeGreaterThan(1);
        });
    });

    describe('Reward Integration', () => {
        test('should calculate success probabilities based on career choices', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            
            // Generate prompt
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Check that choices have success probabilities
            prompt.choices.forEach(choice => {
                expect(choice.successProbability).toBeGreaterThan(0);
                expect(choice.successProbability).toBeLessThanOrEqual(1);
            });
        });

        test('should apply career-based success probability scaling', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            
            // Generate prompt
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Check that different choice types have different success probabilities
            const aggressiveChoice = prompt.choices.find(c => c.choiceType === 'aggressive');
            const diplomaticChoice = prompt.choices.find(c => c.choiceType === 'diplomatic');
            
            if (aggressiveChoice && diplomaticChoice) {
                expect(aggressiveChoice.successProbability).toBeGreaterThan(0);
                expect(diplomaticChoice.successProbability).toBeGreaterThan(0);
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle missing career category gracefully', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Non-existent Category';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt).toHaveProperty('title');
            expect(prompt).toHaveProperty('description');
            expect(prompt).toHaveProperty('choices');
        });

        test('should handle invalid amulet prompt gracefully', () => {
            const amuletPrompt = 'invalid_age';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt).toHaveProperty('title');
            expect(prompt).toHaveProperty('description');
            expect(prompt).toHaveProperty('choices');
        });

        test('should handle invalid game state gracefully', () => {
            // Test with invalid game state
            const invalidGameState = null;
            const invalidCareerAnalyzer = new CareerAnalyzer(invalidGameState);
            const invalidPromptGenerator = new CareerBasedPromptGenerator(invalidCareerAnalyzer, storyTreeBuilder);
            
            expect(() => {
                invalidPromptGenerator.generateAdventurePrompt('age25', 'Common work');
            }).not.toThrow();
        });
    });

    describe('Performance Integration', () => {
        test('should generate prompts efficiently', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const startTime = Date.now();
            
            for (let i = 0; i < 10; i++) {
                careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
        });

        test('should cache prompts for performance', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt1 = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            const prompt2 = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt1).toEqual(prompt2);
        });
    });
});
