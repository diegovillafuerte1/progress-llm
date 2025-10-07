/**
 * StoryPersistenceManager Tests
 * Tests for cross-life story persistence and advanced storage
 */

import { StoryPersistenceManager } from '../src/llm/StoryPersistenceManager.js';
import { StoryTreeManager } from '../src/llm/StoryTreeManager.js';
import { CareerAnalyzer } from '../src/llm/CareerAnalyzer.js';

describe('StoryPersistenceManager', () => {
    let storyPersistenceManager;
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
        storyPersistenceManager = new StoryPersistenceManager(storyTreeManager, careerAnalyzer);
    });

    describe('Cross-Life Persistence', () => {
        test('should save story trees for current life', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            const savedLife = storyPersistenceManager.getLifeStory(lifeId);
            expect(savedLife).toBeDefined();
            expect(savedLife[amuletPrompt][careerCategory].choices).toContain(choice);
        });

        test('should load story trees from previous life', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story for life 1
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Load story for life 2
            const previousStories = storyPersistenceManager.getPreviousLifeStories();
            expect(previousStories).toHaveProperty(lifeId);
            expect(previousStories[lifeId][amuletPrompt][careerCategory].choices).toContain(choice);
        });

        test('should merge story trees from multiple lives', () => {
            const life1Id = 'life_1';
            const life2Id = 'life_2';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Save story for life 1
            storyPersistenceManager.saveLifeStory(life1Id, amuletPrompt, careerCategory, 'Option A', { success: true });
            
            // Save story for life 2
            storyPersistenceManager.saveLifeStory(life2Id, amuletPrompt, careerCategory, 'Option B', { success: false });
            
            // Merge stories
            const mergedStories = storyPersistenceManager.mergeLifeStories([life1Id, life2Id]);
            
            expect(mergedStories[amuletPrompt][careerCategory].choices).toContain('Option A');
            expect(mergedStories[amuletPrompt][careerCategory].choices).toContain('Option B');
        });

        test('should handle empty previous life stories', () => {
            const previousStories = storyPersistenceManager.getPreviousLifeStories();
            expect(previousStories).toEqual({});
        });
    });

    describe('Story Tree Inheritance', () => {
        test('should inherit story trees from previous life', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story for life 1
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Inherit story for new life
            const inheritedStories = storyPersistenceManager.inheritStoriesFromLife(lifeId);
            
            expect(inheritedStories[amuletPrompt][careerCategory].choices).toContain(choice);
        });

        test('should handle inheritance from non-existent life', () => {
            const inheritedStories = storyPersistenceManager.inheritStoriesFromLife('non_existent_life');
            expect(inheritedStories).toEqual({});
        });

        test('should preserve story tree metadata during inheritance', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story for life 1
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Inherit story for new life
            const inheritedStories = storyPersistenceManager.inheritStoriesFromLife(lifeId);
            
            expect(inheritedStories[amuletPrompt][careerCategory].metadata).toBeDefined();
            expect(inheritedStories[amuletPrompt][careerCategory].metadata.totalChoices).toBe(1);
        });
    });

    describe('Story Tree Analytics', () => {
        test('should calculate story tree statistics across lives', () => {
            const life1Id = 'life_1';
            const life2Id = 'life_2';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Save stories for multiple lives
            storyPersistenceManager.saveLifeStory(life1Id, amuletPrompt, careerCategory, 'Option A', { success: true });
            storyPersistenceManager.saveLifeStory(life2Id, amuletPrompt, careerCategory, 'Option B', { success: false });
            
            const analytics = storyPersistenceManager.getStoryAnalytics();
            
            expect(analytics).toHaveProperty('totalLives');
            expect(analytics).toHaveProperty('totalChoices');
            expect(analytics).toHaveProperty('successRate');
            expect(analytics.totalLives).toBe(2);
        });

        test('should track most popular story paths', () => {
            const life1Id = 'life_1';
            const life2Id = 'life_2';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Save same choice for multiple lives
            storyPersistenceManager.saveLifeStory(life1Id, amuletPrompt, careerCategory, 'Option A', { success: true });
            storyPersistenceManager.saveLifeStory(life2Id, amuletPrompt, careerCategory, 'Option A', { success: true });
            
            const analytics = storyPersistenceManager.getStoryAnalytics();
            
            expect(analytics).toHaveProperty('popularChoices');
            expect(analytics.popularChoices['Option A']).toBe(2);
        });

        test('should track story tree depth across lives', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Save deep story tree
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option A', { success: true });
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option A1', { success: true });
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option A2', { success: false });
            
            const analytics = storyPersistenceManager.getStoryAnalytics();
            
            expect(analytics).toHaveProperty('maxDepth');
            expect(analytics.maxDepth).toBeGreaterThan(1);
        });
    });

    describe('Story Tree Optimization', () => {
        test('should prune unused story branches', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Save multiple choices
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option A', { success: true });
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option B', { success: false });
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option C', { success: true });
            
            // Prune unused branches
            storyPersistenceManager.pruneUnusedBranches(lifeId);
            
            const savedLife = storyPersistenceManager.getLifeStory(lifeId);
            expect(savedLife).toBeDefined();
        });

        test('should optimize story tree structure', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Save story
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, 'Option A', { success: true });
            
            // Optimize structure
            storyPersistenceManager.optimizeStoryTree(lifeId);
            
            const savedLife = storyPersistenceManager.getLifeStory(lifeId);
            expect(savedLife).toBeDefined();
        });

        test('should handle optimization of non-existent life', () => {
            expect(() => {
                storyPersistenceManager.optimizeStoryTree('non_existent_life');
            }).not.toThrow();
        });
    });

    describe('Story Tree Export/Import', () => {
        test('should export story trees', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Export story
            const exported = storyPersistenceManager.exportStoryTrees(lifeId);
            
            expect(exported).toHaveProperty('version');
            expect(exported).toHaveProperty('lifeId');
            expect(exported).toHaveProperty('data');
            expect(exported.lifeId).toBe(lifeId);
        });

        test('should import story trees', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Export story
            const exported = storyPersistenceManager.exportStoryTrees(lifeId);
            
            // Import story
            const imported = storyPersistenceManager.importStoryTrees(exported);
            
            expect(imported).toBe(true);
            
            const importedLife = storyPersistenceManager.getLifeStory(lifeId);
            expect(importedLife[amuletPrompt][careerCategory].choices).toContain(choice);
        });

        test('should handle invalid export data', () => {
            const invalidData = { invalid: 'data' };
            
            const imported = storyPersistenceManager.importStoryTrees(invalidData);
            expect(imported).toBe(false);
        });
    });

    describe('Story Tree Backup', () => {
        test('should create story tree backup', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Create backup
            const backup = storyPersistenceManager.createBackup();
            
            expect(backup).toHaveProperty('timestamp');
            expect(backup).toHaveProperty('lives');
            expect(backup.lives).toHaveProperty(lifeId);
        });

        test('should restore story tree from backup', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Create backup
            const backup = storyPersistenceManager.createBackup();
            
            // Clear current stories
            storyPersistenceManager.clearAllStories();
            
            // Restore from backup
            const restored = storyPersistenceManager.restoreFromBackup(backup);
            
            expect(restored).toBe(true);
            
            const restoredLife = storyPersistenceManager.getLifeStory(lifeId);
            expect(restoredLife[amuletPrompt][careerCategory].choices).toContain(choice);
        });

        test('should handle invalid backup data', () => {
            const invalidBackup = { invalid: 'data' };
            
            const restored = storyPersistenceManager.restoreFromBackup(invalidBackup);
            expect(restored).toBe(false);
        });
    });

    describe('Story Tree Cleanup', () => {
        test('should clear all story trees', () => {
            const lifeId = 'life_1';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save story
            storyPersistenceManager.saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result);
            
            // Clear all stories
            storyPersistenceManager.clearAllStories();
            
            const clearedLife = storyPersistenceManager.getLifeStory(lifeId);
            expect(clearedLife).toBeUndefined();
        });

        test('should clear specific life story', () => {
            const life1Id = 'life_1';
            const life2Id = 'life_2';
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Save stories for multiple lives
            storyPersistenceManager.saveLifeStory(life1Id, amuletPrompt, careerCategory, choice, result);
            storyPersistenceManager.saveLifeStory(life2Id, amuletPrompt, careerCategory, choice, result);
            
            // Clear specific life
            storyPersistenceManager.clearLifeStory(life1Id);
            
            const clearedLife = storyPersistenceManager.getLifeStory(life1Id);
            const remainingLife = storyPersistenceManager.getLifeStory(life2Id);
            
            expect(clearedLife).toBeUndefined();
            expect(remainingLife).toBeDefined();
        });
    });
});
