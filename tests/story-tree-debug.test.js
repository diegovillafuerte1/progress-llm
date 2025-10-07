/**
 * Story Tree Debug Tests
 * Tests for debugging functionality of story trees
 */

import { CareerBasedAdventureIntegration } from '../src/llm/CareerBasedAdventureIntegration.js';
import { CareerAnalyzer } from '../src/llm/CareerAnalyzer.js';
import { StoryTreeManager } from '../src/llm/StoryTreeManager.js';
import { StoryTreeBuilder } from '../src/llm/StoryTreeBuilder.js';

describe('Story Tree Debug Functionality', () => {
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

    describe('Debug Output', () => {
        test('should print story tree debug info after choice', async () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // Start adventure
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            
            // Make a choice
            await careerBasedIntegration.handleCareerBasedChoice('Lead a direct assault', true);
            
            // Check that debug output was printed
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🌳 === STORY TREE DEBUG ==='));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📅 Current Life:'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🎯 Adventure:'));
            
            consoleSpy.mockRestore();
        });

        test('should print story tree debug info before starting adventure', async () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // Start adventure
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            
            // Check that debug output was printed before starting
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🎯 Starting Adventure:'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📅 Life ID:'));
            
            consoleSpy.mockRestore();
        });

        test('should handle debug output when no story trees exist', () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // Call debug method when no trees exist
            careerBasedIntegration.debugStoryTrees();
            
            // Check that appropriate message was printed
            const output = consoleSpy.mock.calls.join('\n');
            expect(output).toContain('📝 No career categories for this prompt');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Manual Debug Functions', () => {
        test('should provide manual debug function', () => {
            expect(typeof careerBasedIntegration.debugStoryTrees).toBe('function');
        });

        test('should provide story tree summary', () => {
            const summary = careerBasedIntegration.getStoryTreeSummary();
            
            expect(summary).toHaveProperty('lifeId');
            expect(summary).toHaveProperty('totalTrees');
            expect(summary).toHaveProperty('totalChoices');
            expect(summary).toHaveProperty('totalSuccesses');
            expect(summary).toHaveProperty('totalFailures');
            expect(summary).toHaveProperty('successRate');
            expect(summary).toHaveProperty('trees');
            expect(summary).toHaveProperty('stats');
        });

        test('should handle errors in debug functions gracefully', () => {
            // Mock getStoryTrees to throw error
            const originalGetStoryTrees = careerBasedIntegration.storyTreeManager.getStoryTrees;
            careerBasedIntegration.storyTreeManager.getStoryTrees = jest.fn(() => {
                throw new Error('Test error');
            });
            
            // Mock console.error to capture error
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            // Call debug method
            careerBasedIntegration.debugStoryTrees();
            
            // Check that error was handled gracefully
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error printing story tree debug info:'), expect.any(Error));
            
            // Restore mocks
            careerBasedIntegration.storyTreeManager.getStoryTrees = originalGetStoryTrees;
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Story Tree Structure Debug', () => {
        test('should show correct tree structure after multiple choices', async () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // Start adventure and make choices
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            await careerBasedIntegration.handleCareerBasedChoice('Lead a direct assault', true);
            
            // Start another adventure
            mockGameState.days = 45 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age45');
            await careerBasedIntegration.handleCareerBasedChoice('Negotiate a peaceful resolution', false);
            
            // Check that debug output shows both trees
            const output = consoleSpy.mock.calls.join('\n');
            expect(output).toContain('AGE25 TREE:');
            expect(output).toContain('AGE45 TREE:');
            expect(output).toContain('Lead a direct assault');
            expect(output).toContain('Negotiate a peaceful resolution');
            
            consoleSpy.mockRestore();
        });

        test('should show statistics correctly', async () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // Start adventure and make choice
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            await careerBasedIntegration.handleCareerBasedChoice('Lead a direct assault', true);
            
            // Check that statistics are shown
            const output = consoleSpy.mock.calls.join('\n');
            expect(output).toContain('📊 OVERALL STATISTICS:');
            expect(output).toContain('🎯 Total Choices:');
            expect(output).toContain('✅ Total Successes:');
            expect(output).toContain('❌ Total Failures:');
            expect(output).toContain('📈 Overall Success Rate:');
            
            consoleSpy.mockRestore();
        });

        test('should show choices by prompt and category', async () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // Start adventure and make choice
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            await careerBasedIntegration.handleCareerBasedChoice('Lead a direct assault', true);
            
            // Check that choices are categorized
            const output = consoleSpy.mock.calls.join('\n');
            expect(output).toContain('📅 Choices by Prompt:');
            expect(output).toContain('🎭 Choices by Category:');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Cross-Life Debug', () => {
        test('should show different life IDs in debug output', async () => {
            // Mock console.log to capture output
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            // First life
            mockGameState.rebirthOneCount = 0;
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            await careerBasedIntegration.handleCareerBasedChoice('Lead a direct assault', true);
            
            // Second life
            mockGameState.rebirthOneCount = 1;
            mockGameState.days = 25 * 365;
            await careerBasedIntegration.startCareerBasedAdventure('age25');
            await careerBasedIntegration.handleCareerBasedChoice('Negotiate a peaceful resolution', false);
            
            // Check that different life IDs are shown
            const output = consoleSpy.mock.calls.join('\n');
            expect(output).toContain('📅 Current Life: life_0');
            expect(output).toContain('📅 Current Life: life_1');
            
            consoleSpy.mockRestore();
        });
    });
});
