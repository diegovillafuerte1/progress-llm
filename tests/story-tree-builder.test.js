/**
 * StoryTreeBuilder Tests
 * Tests for dynamic story tree generation and infinite depth growth
 */

import { StoryTreeBuilder } from '../src/llm/StoryTreeBuilder.js';
import { StoryTreeManager } from '../src/llm/StoryTreeManager.js';
import { CareerAnalyzer } from '../src/llm/CareerAnalyzer.js';

describe('StoryTreeBuilder', () => {
    let storyTreeBuilder;
    let storyTreeManager;
    let careerAnalyzer;
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

        storyTreeManager = new StoryTreeManager();
        careerAnalyzer = new CareerAnalyzer(mockGameState);
        storyTreeBuilder = new StoryTreeBuilder(storyTreeManager, careerAnalyzer);
    });

    describe('Story Tree Generation', () => {
        test('should generate initial story options for career category', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const options = storyTreeBuilder.generateInitialOptions(amuletPrompt, careerCategory);
            
            expect(options).toBeInstanceOf(Array);
            expect(options.length).toBeGreaterThan(0);
            expect(options[0]).toHaveProperty('choice');
            expect(options[0]).toHaveProperty('description');
            expect(options[0]).toHaveProperty('successProbability');
        });

        test('should generate different options for different career categories', () => {
            const amuletPrompt = 'age25';
            
            const commonOptions = storyTreeBuilder.generateInitialOptions(amuletPrompt, 'Common work');
            const militaryOptions = storyTreeBuilder.generateInitialOptions(amuletPrompt, 'Military');
            
            expect(commonOptions).not.toEqual(militaryOptions);
            expect(commonOptions[0].choice).not.toEqual(militaryOptions[0].choice);
        });

        test('should generate options based on career weight', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const options = storyTreeBuilder.generateInitialOptions(amuletPrompt, careerCategory);
            
            // Higher career weight should generate better options
            expect(options[0].successProbability).toBeGreaterThan(0);
            expect(options[0].successProbability).toBeLessThanOrEqual(1);
        });
    });

    describe('Story Branch Generation', () => {
        test('should generate new branches when choice is made', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            const newBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, result);
            
            expect(newBranches).toBeInstanceOf(Array);
            expect(newBranches.length).toBeGreaterThan(0);
            expect(newBranches[0]).toHaveProperty('choice');
            expect(newBranches[0]).toHaveProperty('description');
            expect(newBranches[0]).toHaveProperty('successProbability');
        });

        test('should generate different branches for success vs failure', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            
            const successBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, { success: true });
            const failureBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, { success: false });
            
            expect(successBranches).not.toEqual(failureBranches);
            expect(successBranches[0].choice).not.toEqual(failureBranches[0].choice);
        });

        test('should generate branches with decreasing success probability', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true, depth: 3 };
            
            const newBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, result);
            
            // Deeper branches should have lower success probability
            expect(newBranches[0].successProbability).toBeLessThan(0.8); // Assuming base probability is 0.8
        });
    });

    describe('Story Tree Depth Management', () => {
        test('should track story tree depth', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Add initial choice
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            
            // Add deeper choice
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option A1', { success: true });
            
            const depth = storyTreeBuilder.getStoryTreeDepth(amuletPrompt, careerCategory);
            expect(depth).toBe(2);
        });

        test('should limit story tree depth', () => {
            // Create fresh builder for this test
            const freshStoryTreeManager = new StoryTreeManager();
            const freshCareerAnalyzer = new CareerAnalyzer(mockGameState);
            const freshBuilder = new StoryTreeBuilder(freshStoryTreeManager, freshCareerAnalyzer);
            
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const maxDepth = 5;
            
            // Add choices up to max depth
            for (let i = 0; i < maxDepth; i++) {
                freshBuilder.addChoice(amuletPrompt, careerCategory, `Option ${i}`, { success: true });
            }
            
            const depth = freshBuilder.getStoryTreeDepth(amuletPrompt, careerCategory);
            expect(depth).toBe(maxDepth);
        });

        test('should prevent adding choices beyond max depth', () => {
            // Create fresh builder for this test
            const freshStoryTreeManager = new StoryTreeManager();
            const freshCareerAnalyzer = new CareerAnalyzer(mockGameState);
            const freshBuilder = new StoryTreeBuilder(freshStoryTreeManager, freshCareerAnalyzer);
            
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const maxDepth = 3;
            
            // Add choices up to max depth
            for (let i = 0; i < maxDepth; i++) {
                freshBuilder.addChoice(amuletPrompt, careerCategory, `Option ${i}`, { success: true });
            }
            
            // Try to add one more choice
            const canAddMore = freshBuilder.canAddMoreChoices(amuletPrompt, careerCategory);
            expect(canAddMore).toBe(false);
        });
    });

    describe('Story Tree Integration', () => {
        test('should integrate with existing story tree manager', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            
            const availableChoices = storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
            expect(availableChoices).toContain(choice);
        });

        test('should generate new branches when no existing branches', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Add choice
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            
            // Generate new branches
            const newBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, result);
            
            expect(newBranches).toBeInstanceOf(Array);
            expect(newBranches.length).toBeGreaterThan(0);
        });

        test('should use existing branches when available', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Add choice and generate branches
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            const initialBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, result);
            
            // Add one of the branches
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, initialBranches[0].choice, { success: true });
            
            // Generate branches again - should use existing structure
            const existingBranches = storyTreeBuilder.generateNewBranches(amuletPrompt, careerCategory, choice, result);
            
            expect(existingBranches).toBeInstanceOf(Array);
        });
    });

    describe('Story Tree Validation', () => {
        test('should validate story tree structure', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            
            const isValid = storyTreeBuilder.validateStoryTree(amuletPrompt, careerCategory);
            expect(isValid).toBe(true);
        });

        test('should detect invalid story tree structure', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Manually create invalid structure
            const storyTree = storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
            storyTree.choices = ['Option A'];
            storyTree.branches = {}; // Missing branch for Option A
            
            const isValid = storyTreeBuilder.validateStoryTree(amuletPrompt, careerCategory);
            expect(isValid).toBe(false);
        });
    });

    describe('Story Tree Statistics', () => {
        test('should calculate story tree statistics', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            
            const stats = storyTreeBuilder.getStoryTreeStats(amuletPrompt, careerCategory);
            
            expect(stats).toHaveProperty('totalChoices');
            expect(stats).toHaveProperty('successCount');
            expect(stats).toHaveProperty('failureCount');
            expect(stats).toHaveProperty('averageDepth');
            expect(stats).toHaveProperty('maxDepth');
        });

        test('should track success rate', () => {
            // Create fresh builder for this test
            const freshStoryTreeManager = new StoryTreeManager();
            const freshCareerAnalyzer = new CareerAnalyzer(mockGameState);
            const freshBuilder = new StoryTreeBuilder(freshStoryTreeManager, freshCareerAnalyzer);
            
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            freshBuilder.addChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            freshBuilder.addChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            freshBuilder.addChoice(amuletPrompt, careerCategory, 'Option C', { success: true });
            
            const stats = freshBuilder.getStoryTreeStats(amuletPrompt, careerCategory);
            
            expect(stats.successRate).toBe(2/3); // 2 successes out of 3 choices
        });
    });

    describe('Story Tree Cleanup', () => {
        test('should prune unused branches', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Add multiple choices
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option C', { success: true });
            
            // Prune unused branches
            storyTreeBuilder.pruneUnusedBranches(amuletPrompt, careerCategory);
            
            const stats = storyTreeBuilder.getStoryTreeStats(amuletPrompt, careerCategory);
            expect(stats.totalChoices).toBeGreaterThan(0);
        });

        test('should optimize story tree structure', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Add multiple choices
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            
            // Optimize structure
            storyTreeBuilder.optimizeStoryTree(amuletPrompt, careerCategory);
            
            const isValid = storyTreeBuilder.validateStoryTree(amuletPrompt, careerCategory);
            expect(isValid).toBe(true);
        });
    });
});
