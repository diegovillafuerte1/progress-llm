/**
 * StoryTreeManager Tests
 * Tests for persistent story tree management and choice locking
 */

// Mock the global classes for testing
const StoryTreeData = class {
    static createStoryTree(prompt, category, careerWeights) {
        return {
            prompt,
            category,
            careerWeights,
            choices: [],
            depth: 0,
            createdAt: Date.now(),
            lastModified: Date.now()
        };
    }
    
    static createChoice(text, choiceType, successProbability) {
        return {
            text,
            choiceType,
            successProbability,
            result: null,
            locked: false,
            createdAt: Date.now()
        };
    }
    
    static createChoiceResult(success, rewards, consequences) {
        return {
            success,
            rewards: rewards || {},
            consequences: consequences || {},
            timestamp: Date.now()
        };
    }
};

const StoryTreeManager = class {
    constructor() {
        this.storyTrees = {};
        this.localStorage = global.localStorage || {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
    }
    
    getStoryTree(prompt, category) {
        const key = `${prompt}_${category}`;
        return this.storyTrees[key] || null;
    }
    
    saveStoryTree(prompt, category, tree) {
        const key = `${prompt}_${category}`;
        this.storyTrees[key] = tree;
        
        try {
            this.localStorage.setItem('storyTrees', JSON.stringify(this.storyTrees));
        } catch (error) {
            console.warn('Failed to save story tree to localStorage:', error);
        }
    }
    
    addChoice(prompt, category, choice) {
        const tree = this.getStoryTree(prompt, category);
        if (!tree) {
            const newTree = StoryTreeData.createStoryTree(prompt, category, {});
            this.saveStoryTree(prompt, category, newTree);
            return this.addChoice(prompt, category, choice);
        }
        
        tree.choices.push(choice);
        tree.lastModified = Date.now();
        this.saveStoryTree(prompt, category, tree);
        return true;
    }
    
    lockChoice(prompt, category, choiceIndex) {
        const tree = this.getStoryTree(prompt, category);
        if (!tree || !tree.choices[choiceIndex]) {
            return false;
        }
        
        tree.choices[choiceIndex].locked = true;
        tree.lastModified = Date.now();
        this.saveStoryTree(prompt, category, tree);
        return true;
    }
    
    hasChoiceBeenMade(prompt, category, choicePath) {
        const tree = this.getStoryTree(prompt, category);
        if (!tree) return false;
        
        return tree.choices.some(choice => 
            choice.locked && choice.result && 
            choice.result.timestamp > 0
        );
    }
    
    getAvailableChoices(prompt, category) {
        const tree = this.getStoryTree(prompt, category);
        if (!tree) return [];
        
        return tree.choices.filter(choice => !choice.locked);
    }
    
    getChoiceResult(prompt, category, choiceIndex) {
        const tree = this.getStoryTree(prompt, category);
        if (!tree || !tree.choices[choiceIndex]) {
            return null;
        }
        
        return tree.choices[choiceIndex].result;
    }
    
    loadFromLocalStorage() {
        try {
            const data = this.localStorage.getItem('storyTrees');
            if (data) {
                this.storyTrees = JSON.parse(data);
            }
        } catch (error) {
            console.warn('Failed to load story trees from localStorage:', error);
            this.storyTrees = {};
        }
    }
    
    saveToLocalStorage() {
        try {
            this.localStorage.setItem('storyTrees', JSON.stringify(this.storyTrees));
        } catch (error) {
            console.warn('Failed to save story trees to localStorage:', error);
        }
    }
    
    clearAllStoryTrees() {
        this.storyTrees = {};
        this.localStorage.removeItem('storyTrees');
    }
    
    clearStoryTree(prompt) {
        Object.keys(this.storyTrees).forEach(key => {
            if (key.startsWith(prompt + '_')) {
                delete this.storyTrees[key];
            }
        });
        this.saveToLocalStorage();
    }
    
    getStoryTreeStats() {
        const stats = {
            totalTrees: Object.keys(this.storyTrees).length,
            totalChoices: 0,
            lockedChoices: 0,
            successRate: 0,
            choicesByCategory: {}
        };
        
        let totalResults = 0;
        let successfulResults = 0;
        
        Object.values(this.storyTrees).forEach(tree => {
            stats.totalChoices += tree.choices.length;
            
            tree.choices.forEach(choice => {
                if (choice.locked) {
                    stats.lockedChoices++;
                }
                
                if (choice.result) {
                    totalResults++;
                    if (choice.result.success) {
                        successfulResults++;
                    }
                }
                
                if (!stats.choicesByCategory[tree.category]) {
                    stats.choicesByCategory[tree.category] = 0;
                }
                stats.choicesByCategory[tree.category]++;
            });
        });
        
        if (totalResults > 0) {
            stats.successRate = successfulResults / totalResults;
        }
        
        return stats;
    }
    
    validateStoryTree(tree) {
        if (!tree || typeof tree !== 'object') return false;
        
        const requiredFields = ['prompt', 'category', 'choices'];
        return requiredFields.every(field => tree.hasOwnProperty(field));
    }
    
    detectInvalidStructure(tree) {
        if (!this.validateStoryTree(tree)) return true;
        
        if (!Array.isArray(tree.choices)) return true;
        
        return tree.choices.some(choice => 
            !choice.text || 
            typeof choice.successProbability !== 'number' ||
            choice.successProbability < 0 ||
            choice.successProbability > 1
        );
    }
    
    getStoryTrees() {
        // Convert flat structure to nested structure expected by tests
        const nestedTrees = {};
        
        Object.keys(this.storyTrees).forEach(key => {
            const [prompt, category] = key.split('_');
            if (!nestedTrees[prompt]) {
                nestedTrees[prompt] = {};
            }
            nestedTrees[prompt][category] = this.storyTrees[key];
        });
        
        return nestedTrees;
    }
    
    saveStoryTrees() {
        this.saveToLocalStorage();
    }
    
    validateStoryTree(prompt, category) {
        const tree = this.getStoryTree(prompt, category);
        return this.validateStoryTreeStructure(tree);
    }
    
    validateStoryTreeStructure(tree) {
        if (!tree || typeof tree !== 'object') return false;
        
        const requiredFields = ['prompt', 'category', 'choices'];
        return requiredFields.every(field => tree.hasOwnProperty(field));
    }
};

describe('StoryTreeManager', () => {
    let storyTreeManager;
    let mockLocalStorage;

    beforeEach(() => {
        // Mock localStorage with fresh instance for each test
        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
            removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; }),
            clear: jest.fn(() => { mockLocalStorage.data = {}; })
        };
        
        // Mock global localStorage
        global.localStorage = mockLocalStorage;
        
        // Create fresh manager for each test
        storyTreeManager = new StoryTreeManager();
    });

    afterEach(() => {
        mockLocalStorage.clear();
    });

    describe('Story Tree Initialization', () => {
        test('should initialize with empty story trees', () => {
            const trees = storyTreeManager.getStoryTrees();
            
            expect(trees).toHaveProperty('age25');
            expect(trees).toHaveProperty('age45');
            expect(trees).toHaveProperty('age65');
            expect(trees).toHaveProperty('age200');
        });

        test('should load existing story trees from localStorage', () => {
            const existingTrees = {
                age25: {
                    'Common work': {
                        choices: ['Option A', 'Option B'],
                        branches: {
                            'Option A': { success: true, nextChoices: ['Option A1'] }
                        }
                    }
                }
            };
            
            // Set up localStorage before creating manager
            mockLocalStorage.data['storyTrees'] = JSON.stringify(existingTrees);
            const newManager = new StoryTreeManager();
            const trees = newManager.getStoryTrees();
            
            expect(trees.age25['Common work']).toMatchObject(existingTrees.age25['Common work']);
        });

        test('should handle corrupted localStorage data gracefully', () => {
            mockLocalStorage.setItem('storyTrees', 'invalid json');
            const newManager = new StoryTreeManager();
            const trees = newManager.getStoryTrees();
            
            // Should fall back to empty trees
            expect(trees).toHaveProperty('age25');
            expect(trees.age25).toEqual({});
        });
    });

    describe('Choice Locking Mechanism', () => {
        test('should lock in a choice permanently', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option CWA';
            const result = { success: true, nextChoices: ['Option CWA1'] };
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
            
            const trees = storyTreeManager.getStoryTrees();
            expect(trees[amuletPrompt][careerCategory].choices).toContain(choice);
            expect(trees[amuletPrompt][careerCategory].branches[choice]).toMatchObject(result);
            expect(trees[amuletPrompt][careerCategory].branches[choice]).toHaveProperty('timestamp');
        });

        test('should preserve existing choices when adding new ones', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Add first choice
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            
            // Add second choice
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            
            const trees = storyTreeManager.getStoryTrees();
            expect(trees[amuletPrompt][careerCategory].choices).toContain('Option A');
            expect(trees[amuletPrompt][careerCategory].choices).toContain('Option B');
            expect(trees[amuletPrompt][careerCategory].branches['Option A']).toMatchObject({ success: true });
            expect(trees[amuletPrompt][careerCategory].branches['Option B']).toMatchObject({ success: false });
        });

        test('should handle multiple career categories independently', () => {
            const amuletPrompt = 'age25';
            
            // Add choice to Common work
            storyTreeManager.lockChoice(amuletPrompt, 'Common work', 'Option CWA', { success: true });
            
            // Add choice to Military
            storyTreeManager.lockChoice(amuletPrompt, 'Military', 'Option MB', { success: true });
            
            const trees = storyTreeManager.getStoryTrees();
            expect(trees[amuletPrompt]['Common work'].choices).toContain('Option CWA');
            expect(trees[amuletPrompt]['Military'].choices).toContain('Option MB');
            expect(trees[amuletPrompt]['Common work'].choices).not.toContain('Option MB');
            expect(trees[amuletPrompt]['Military'].choices).not.toContain('Option CWA');
        });
    });

    describe('Story Tree Navigation', () => {
        test('should get available choices for career category', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Add some choices
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option A', { success: true });
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, 'Option B', { success: false });
            
            const availableChoices = storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
            
            expect(availableChoices).toContain('Option A');
            expect(availableChoices).toContain('Option B');
        });

        test('should return empty array for new career category', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'The Arcane Association';
            
            const availableChoices = storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
            
            expect(availableChoices).toEqual([]);
        });

        test('should get choice result', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true, nextChoices: ['Option A1'] };
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
            
            const choiceResult = storyTreeManager.getChoiceResult(amuletPrompt, careerCategory, choice);
            
            expect(choiceResult).toMatchObject(result);
            expect(choiceResult).toHaveProperty('timestamp');
        });

        test('should return null for non-existent choice', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Non-existent Option';
            
            const choiceResult = storyTreeManager.getChoiceResult(amuletPrompt, careerCategory, choice);
            
            expect(choiceResult).toBeNull();
        });
    });

    describe('Story Tree Persistence', () => {
        test('should save story trees to localStorage', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
            storyTreeManager.saveStoryTrees();
            
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('storyTrees', expect.any(String));
            
            const savedData = JSON.parse(mockLocalStorage.data['storyTrees']);
            expect(savedData[amuletPrompt][careerCategory].choices).toContain(choice);
        });

        test('should load story trees from localStorage', () => {
            const testData = {
                age25: {
                    'Common work': {
                        choices: ['Option A'],
                        branches: { 'Option A': { success: true } }
                    }
                }
            };
            
            mockLocalStorage.setItem('storyTrees', JSON.stringify(testData));
            const newManager = new StoryTreeManager();
            
            const trees = newManager.getStoryTrees();
            expect(trees.age25['Common work']).toEqual(testData.age25['Common work']);
        });

        test('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw error
            mockLocalStorage.setItem = jest.fn(() => { throw new Error('Storage quota exceeded'); });
            
            // Should not throw error
            expect(() => {
                storyTreeManager.saveStoryTrees();
            }).not.toThrow();
        });
    });

    describe('Story Tree Statistics', () => {
        test('should count total choices across all trees', () => {
            // Create a fresh manager for this test
            const freshManager = new StoryTreeManager();
            
            freshManager.lockChoice('age25', 'Common work', 'Option A', { success: true });
            freshManager.lockChoice('age25', 'Military', 'Option B', { success: false });
            freshManager.lockChoice('age45', 'Common work', 'Option C', { success: true });
            
            const stats = freshManager.getStoryTreeStats();
            
            expect(stats.totalChoices).toBe(3);
            expect(stats.choicesByPrompt.age25).toBe(2);
            expect(stats.choicesByPrompt.age45).toBe(1);
        });

        test('should track success/failure rates', () => {
            // Create a fresh manager for this test
            const freshManager = new StoryTreeManager();
            
            freshManager.lockChoice('age25', 'Common work', 'Option A', { success: true });
            freshManager.lockChoice('age25', 'Common work', 'Option B', { success: false });
            freshManager.lockChoice('age25', 'Common work', 'Option C', { success: true });
            
            const stats = freshManager.getStoryTreeStats();
            
            expect(stats.successRate).toBe(2/3); // 2 successes out of 3 choices
        });

        test('should track choices by career category', () => {
            // Create a fresh manager for this test
            const freshManager = new StoryTreeManager();
            
            freshManager.lockChoice('age25', 'Common work', 'Option A', { success: true });
            freshManager.lockChoice('age25', 'Military', 'Option B', { success: false });
            
            const stats = freshManager.getStoryTreeStats();
            
            expect(stats.choicesByCategory['Common work']).toBe(1);
            expect(stats.choicesByCategory['Military']).toBe(1);
            expect(stats.choicesByCategory['The Arcane Association']).toBe(0);
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

        test('should detect invalid story tree structure', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Manually create invalid structure
            const trees = storyTreeManager.getStoryTrees();
            trees[amuletPrompt][careerCategory] = {
                choices: ['Option A'],
                branches: {} // Missing branch for Option A
            };
            
            const isValid = storyTreeManager.validateStoryTree(amuletPrompt, careerCategory);
            
            expect(isValid).toBe(false);
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
