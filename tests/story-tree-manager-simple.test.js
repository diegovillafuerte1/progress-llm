/**
 * StoryTreeManager Simple Tests
 * Focused tests for core functionality without complex localStorage mocking
 */

import { StoryTreeManager } from '../src/llm/StoryTreeManager.js';

describe('StoryTreeManager - Core Functionality', () => {
    let storyTreeManager;

    beforeEach(() => {
        // Simple localStorage mock
        const mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; }),
            clear: jest.fn(() => { mockLocalStorage.data = {}; })
        };
        
        global.localStorage = mockLocalStorage;
        storyTreeManager = new StoryTreeManager();
    });

    describe('Basic Story Tree Operations', () => {
        test('should initialize with empty story trees', () => {
            const trees = storyTreeManager.getStoryTrees();
            
            expect(trees).toHaveProperty('age25');
            expect(trees).toHaveProperty('age45');
            expect(trees).toHaveProperty('age65');
            expect(trees).toHaveProperty('age200');
        });

        test('should lock in a choice', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true, nextChoices: ['Option A1'] };
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
            
            const trees = storyTreeManager.getStoryTrees();
            expect(trees[amuletPrompt][careerCategory].choices).toContain(choice);
            expect(trees[amuletPrompt][careerCategory].branches[choice]).toMatchObject(result);
        });

        test('should get available choices', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            
            const choices = storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
            expect(choices).toContain('Option A');
            expect(choices).toContain('Option B');
        });

        test('should get choice result', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true, nextChoices: ['Option A1'] };
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
            
            const choiceResult = storyTreeManager.getChoiceResult(amuletPrompt, careerCategory, choice);
            expect(choiceResult).toMatchObject(result);
        });

        test('should handle multiple career categories', () => {
            // Create fresh manager for this test
            const freshManager = new StoryTreeManager();
            const amuletPrompt = 'age25';
            
            // Add choice to Common work
            freshManager.lockChoice(amuletPrompt, 'Common work', 'Option A', { success: true });
            const commonChoices = freshManager.getAvailableChoices(amuletPrompt, 'Common work');
            expect(commonChoices).toEqual(['Option A']);
            
            // Add choice to Military
            freshManager.lockChoice(amuletPrompt, 'Military', 'Option B', { success: false });
            const militaryChoices = freshManager.getAvailableChoices(amuletPrompt, 'Military');
            expect(militaryChoices).toEqual(['Option B']);
            
            // Verify they're still separate
            const commonChoicesAfter = freshManager.getAvailableChoices(amuletPrompt, 'Common work');
            const militaryChoicesAfter = freshManager.getAvailableChoices(amuletPrompt, 'Military');
            
            expect(commonChoicesAfter).toEqual(['Option A']);
            expect(militaryChoicesAfter).toEqual(['Option B']);
        });
    });

    describe('Story Tree Statistics', () => {
        test('should calculate basic statistics', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Option A', { success: true });
            storyTreeManager.lockChoice('age25', 'Common work', 'Option B', { success: false });
            
            const stats = storyTreeManager.getStoryTreeStats();
            
            expect(stats.totalChoices).toBeGreaterThan(0);
            expect(stats.choicesByPrompt.age25).toBeGreaterThan(0);
            expect(stats.choicesByCategory['Common work']).toBeGreaterThan(0);
        });
    });

    describe('Story Tree Validation', () => {
        test('should validate story tree structure', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            
            const isValid = storyTreeManager.validateStoryTree(amuletPrompt, careerCategory);
            expect(isValid).toBe(true);
        });
    });

    describe('Story Tree Cleanup', () => {
        test('should clear all story trees', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Option A', { success: true });
            storyTreeManager.clearAllStoryTrees();
            
            const trees = storyTreeManager.getStoryTrees();
            expect(trees.age25).toEqual({});
            expect(trees.age45).toEqual({});
            expect(trees.age65).toEqual({});
            expect(trees.age200).toEqual({});
        });

        test('should clear specific amulet prompt', () => {
            storyTreeManager.lockChoice('age25', 'Common work', 'Option A', { success: true });
            storyTreeManager.lockChoice('age45', 'Common work', 'Option B', { success: true });
            
            storyTreeManager.clearStoryTree('age25');
            
            const trees = storyTreeManager.getStoryTrees();
            expect(trees.age25).toEqual({});
            expect(trees.age45['Common work']).toBeDefined();
        });
    });
});
