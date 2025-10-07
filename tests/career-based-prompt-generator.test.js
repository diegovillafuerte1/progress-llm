/**
 * CareerBasedPromptGenerator Tests
 * Tests for career-specific adventure prompt generation
 */

// Mock the global classes for testing
const CareerAnalyzer = class {
    constructor(gameState) {
        this.gameState = gameState || {};
    }
    
    calculateCareerWeights() {
        const weights = {};
        const categories = ['Common work', 'Military', 'The Arcane Association'];
        
        for (const category of categories) {
            weights[category] = this.calculateCategoryWeight(category);
        }
        
        return weights;
    }
    
    calculateCategoryWeight(category) {
        if (!this.gameState.taskData) return 0;
        
        const jobWeights = {
            'Common work': { 'Beggar': 1, 'Farmer': 10, 'Fisherman': 100 },
            'Military': { 'Squire': 1, 'Footman': 10, 'Knight': 100 },
            'The Arcane Association': { 'Student': 1, 'Mage': 10, 'Wizard': 100 }
        };
        
        const jobs = jobWeights[category] || {};
        let totalWeight = 0;
        
        for (const [job, weight] of Object.entries(jobs)) {
            const jobData = this.gameState.taskData[job];
            if (jobData) {
                const level = jobData.maxLevel || jobData.level || 0;
                totalWeight += level * weight;
            }
        }
        
        return totalWeight;
    }
    
    getDominantCareerCategory() {
        const weights = this.calculateCareerWeights();
        let maxWeight = 0;
        let dominantCategory = null;
        
        for (const [category, weight] of Object.entries(weights)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                dominantCategory = category;
            }
        }
        
        return dominantCategory;
    }
};

const StoryTreeManager = class {
    constructor() {
        this.storyTrees = {};
    }
    
    getStoryTree(prompt, category) {
        const key = `${prompt}_${category}`;
        return this.storyTrees[key] || null;
    }
    
    saveStoryTree(prompt, category, tree) {
        const key = `${prompt}_${category}`;
        this.storyTrees[key] = tree;
    }
    
    hasChoiceBeenMade(prompt, category, choicePath) {
        const tree = this.getStoryTree(prompt, category);
        if (!tree) return false;
        
        // Simple implementation for testing
        return tree.choices && tree.choices.length > 0;
    }
};

const StoryTreeBuilder = class {
    constructor(storyTreeManager, careerAnalyzer) {
        this.storyTreeManager = storyTreeManager;
        this.careerAnalyzer = careerAnalyzer;
    }
    
    buildStoryTree(prompt, category, careerWeights) {
        return {
            prompt,
            category,
            careerWeights,
            choices: [
                'Take the aggressive approach',
                'Try diplomatic negotiation',
                'Use stealth and caution',
                'Seek magical assistance'
            ],
            depth: 0,
            successProbability: 0.8
        };
    }
    
    addChoice(prompt, category, choice, result) {
        // Simple implementation for testing
        const key = `${prompt}_${category}`;
        if (!this.storyTreeManager.storyTrees[key]) {
            this.storyTreeManager.storyTrees[key] = { choices: [] };
        }
        this.storyTreeManager.storyTrees[key].choices.push(choice);
    }
};

const CareerBasedPromptGenerator = class {
    constructor(careerAnalyzer, storyTreeBuilder) {
        this.careerAnalyzer = careerAnalyzer;
        this.storyTreeBuilder = storyTreeBuilder;
    }
    
    generateCareerBasedPrompt(amuletPrompt, gameState) {
        const careerWeights = this.careerAnalyzer.calculateCareerWeights();
        const dominantCategory = this.careerAnalyzer.getDominantCareerCategory();
        
        if (!dominantCategory) {
            return {
                success: false,
                message: 'No dominant career category found'
            };
        }
        
        const storyTree = this.storyTreeBuilder.buildStoryTree(amuletPrompt, dominantCategory, careerWeights);
        
        return {
            success: true,
            prompt: `As a ${dominantCategory.toLowerCase()} specialist, you encounter a mysterious situation...`,
            storyTree,
            careerContext: {
                dominantCategory,
                careerWeights,
                availableChoices: storyTree.choices
            }
        };
    }
    
    generateAdventurePrompt(amuletPrompt, careerCategory, skills = null, playerLevel = null) {
        const careerWeights = this.careerAnalyzer.calculateCareerWeights();
        const storyTree = this.storyTreeBuilder.buildStoryTree(amuletPrompt, careerCategory, careerWeights);
        
        return {
            title: `${careerCategory} Adventure`,
            description: `As a ${careerCategory.toLowerCase()} specialist, you face a challenging situation...`,
            choices: storyTree.choices.map((choice, index) => ({
                text: choice,
                choiceType: ['aggressive', 'diplomatic', 'cautious', 'creative'][index % 4],
                successProbability: 0.8 - (index * 0.1)
            })),
            careerContext: {
                category: careerCategory,
                careerWeights: { [careerCategory]: careerWeights[careerCategory] || 0 },
                availableChoices: storyTree.choices
            }
        };
    }
    
    validatePrompt(prompt) {
        return prompt && 
               prompt.title && 
               prompt.description && 
               prompt.choices && 
               Array.isArray(prompt.choices) &&
               prompt.choices.length > 0;
    }
    
    validateChoice(choice) {
        return choice && 
               choice.text && 
               typeof choice.successProbability === 'number' &&
               choice.successProbability >= 0 &&
               choice.successProbability <= 1;
    }
    
    getPromptStats() {
        return {
            totalPrompts: 0,
            careerDistribution: {},
            choiceTypeDistribution: {}
        };
    }
    
    generatePromptForCategory(category, amuletPrompt, gameState) {
        const careerWeights = this.careerAnalyzer.calculateCareerWeights();
        const storyTree = this.storyTreeBuilder.buildStoryTree(amuletPrompt, category, careerWeights);
        
        return {
            success: true,
            prompt: `As a ${category.toLowerCase()} specialist, you face a challenging decision...`,
            storyTree,
            careerContext: {
                category,
                careerWeights: { [category]: careerWeights[category] || 0 },
                availableChoices: storyTree.choices
            }
        };
    }
};

describe('CareerBasedPromptGenerator', () => {
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

    describe('Career-Based Prompt Generation', () => {
        test('should generate career-specific adventure prompts', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt).toHaveProperty('title');
            expect(prompt).toHaveProperty('description');
            expect(prompt).toHaveProperty('choices');
            expect(prompt.choices).toBeInstanceOf(Array);
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should generate different prompts for different career categories', () => {
            const amuletPrompt = 'age25';
            
            const commonPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Common work');
            const militaryPrompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Military');
            
            expect(commonPrompt.title).not.toEqual(militaryPrompt.title);
            expect(commonPrompt.description).not.toEqual(militaryPrompt.description);
            expect(commonPrompt.choices).not.toEqual(militaryPrompt.choices);
        });

        test('should generate prompts based on career weight', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt.choices).toBeInstanceOf(Array);
            expect(prompt.choices.length).toBeGreaterThan(0);
            
            // Higher career weight should generate better options
            prompt.choices.forEach(choice => {
                expect(choice).toHaveProperty('text');
                expect(choice).toHaveProperty('successProbability');
                expect(choice.successProbability).toBeGreaterThan(0);
                expect(choice.successProbability).toBeLessThanOrEqual(1);
            });
        });

        test('should include career context in prompts', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt.description).toContain('merchant');
            expect(prompt.choices.some(choice => choice.text.toLowerCase().includes('merchant'))).toBe(true);
        });
    });

    describe('Choice Generation', () => {
        test('should generate choices with success probabilities', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            prompt.choices.forEach(choice => {
                expect(choice).toHaveProperty('text');
                expect(choice).toHaveProperty('successProbability');
                expect(choice).toHaveProperty('choiceType');
                expect(choice).toHaveProperty('description');
                
                expect(choice.successProbability).toBeGreaterThan(0);
                expect(choice.successProbability).toBeLessThanOrEqual(1);
                expect(['aggressive', 'diplomatic', 'cautious', 'creative']).toContain(choice.choiceType);
            });
        });

        test('should generate different choice types', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            const choiceTypes = prompt.choices.map(choice => choice.choiceType);
            const uniqueTypes = [...new Set(choiceTypes)];
            
            expect(uniqueTypes.length).toBeGreaterThan(1);
        });

        test('should generate choices with appropriate difficulty', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'The Arcane Association';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            prompt.choices.forEach(choice => {
                expect(choice.successProbability).toBeGreaterThan(0.1);
                expect(choice.successProbability).toBeLessThan(0.95);
            });
        });
    });

    describe('Story Tree Integration', () => {
        test('should use existing story tree choices when available', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const choice = 'Option A';
            const result = { success: true };
            
            // Add existing choice to story tree
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, choice, result);
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Should include existing choices
            const existingChoices = prompt.choices.filter(c => c.text === choice);
            expect(existingChoices.length).toBeGreaterThan(0);
        });

        test('should generate new choices when no existing story tree', () => {
            const amuletPrompt = 'age45';
            const careerCategory = 'Military';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt.choices).toBeInstanceOf(Array);
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should combine existing and new choices', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            // Add some existing choices
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'Existing Choice', { success: true });
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt.choices.length).toBeGreaterThan(1);
            expect(prompt.choices.some(c => c.text === 'Existing Choice')).toBe(true);
        });
    });

    describe('Amulet Prompt Integration', () => {
        test('should generate different prompts for different amulet prompts', () => {
            const careerCategory = 'Common work';
            
            const age25Prompt = careerBasedPromptGenerator.generateAdventurePrompt('age25', careerCategory);
            const age45Prompt = careerBasedPromptGenerator.generateAdventurePrompt('age45', careerCategory);
            
            expect(age25Prompt.title).not.toEqual(age45Prompt.title);
            expect(age25Prompt.description).not.toEqual(age45Prompt.description);
        });

        test('should include amulet context in prompts', () => {
            const careerCategory = 'Common work';
            
            const age25Prompt = careerBasedPromptGenerator.generateAdventurePrompt('age25', careerCategory);
            const age45Prompt = careerBasedPromptGenerator.generateAdventurePrompt('age45', careerCategory);
            
            expect(age25Prompt.description).toContain('amulet');
            expect(age45Prompt.description).toContain('amulet');
        });

        test('should generate age-appropriate content', () => {
            const careerCategory = 'Military';
            
            const age25Prompt = careerBasedPromptGenerator.generateAdventurePrompt('age25', careerCategory);
            const age200Prompt = careerBasedPromptGenerator.generateAdventurePrompt('age200', careerCategory);
            
            // Age 200 should have more advanced content
            expect(age200Prompt.choices.some(c => c.text.toLowerCase().includes('legendary'))).toBe(true);
        });
    });

    describe('Prompt Customization', () => {
        test('should customize prompts based on player skills', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            const skills = { 'Strength': 50, 'Charisma': 30 };
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory, skills);
            
            expect(prompt.choices).toBeInstanceOf(Array);
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should customize prompts based on player level', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Military';
            const playerLevel = 50;
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory, null, playerLevel);
            
            expect(prompt.choices).toBeInstanceOf(Array);
            expect(prompt.choices.length).toBeGreaterThan(0);
        });

        test('should handle missing customization parameters', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt.choices).toBeInstanceOf(Array);
            expect(prompt.choices.length).toBeGreaterThan(0);
        });
    });

    describe('Prompt Validation', () => {
        test('should validate generated prompts', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            const isValid = careerBasedPromptGenerator.validatePrompt(prompt);
            expect(isValid).toBe(true);
        });

        test('should detect invalid prompts', () => {
            const invalidPrompt = {
                title: '',
                description: '',
                choices: []
            };
            
            const isValid = careerBasedPromptGenerator.validatePrompt(invalidPrompt);
            expect(isValid).toBe(false);
        });

        test('should validate prompt choices', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            prompt.choices.forEach(choice => {
                const isValid = careerBasedPromptGenerator.validateChoice(choice);
                expect(isValid).toBe(true);
            });
        });
    });

    describe('Prompt Statistics', () => {
        test('should track prompt generation statistics', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, 'Military');
            
            const stats = careerBasedPromptGenerator.getPromptStats();
            
            expect(stats).toHaveProperty('totalPrompts');
            expect(stats).toHaveProperty('promptsByCategory');
            expect(stats).toHaveProperty('promptsByAmulet');
            expect(stats.totalPrompts).toBe(2);
        });

        test('should track choice type distribution', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            const stats = careerBasedPromptGenerator.getPromptStats();
            
            expect(stats).toHaveProperty('choiceTypeDistribution');
            expect(stats.choiceTypeDistribution).toHaveProperty('aggressive');
            expect(stats.choiceTypeDistribution).toHaveProperty('diplomatic');
            expect(stats.choiceTypeDistribution).toHaveProperty('cautious');
            expect(stats.choiceTypeDistribution).toHaveProperty('creative');
        });
    });

    describe('Prompt Caching', () => {
        test('should cache generated prompts', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt1 = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            const prompt2 = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt1).toEqual(prompt2);
        });

        test('should invalidate cache when story tree changes', () => {
            const amuletPrompt = 'age25';
            const careerCategory = 'Common work';
            
            const prompt1 = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            // Add choice to story tree
            storyTreeBuilder.addChoice(amuletPrompt, careerCategory, 'New Choice', { success: true });
            
            const prompt2 = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, careerCategory);
            
            expect(prompt1).not.toEqual(prompt2);
        });
    });
});
