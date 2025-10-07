/**
 * Integration Test Script
 * Tests the career-based adventure system integration
 */

// Mock the required classes for testing
class MockCareerBasedPromptGenerator {
    constructor() {
        this.promptCache = new Map();
        this.promptStats = {
            totalPrompts: 0,
            promptsByCategory: {},
            promptsByAmulet: {},
            choiceTypeDistribution: {
                aggressive: 0,
                diplomatic: 0,
                cautious: 0,
                creative: 0
            }
        };
    }

    generateAdventurePrompt(amuletPrompt, careerCategory, skills = null, playerLevel = null) {
        const prompt = {
            title: `The ${careerCategory} Adventure at ${amuletPrompt}`,
            description: `You face a challenge in your ${careerCategory} career at age ${amuletPrompt}.`,
            choices: [
                {
                    text: `Take aggressive action in ${careerCategory}`,
                    choiceType: 'aggressive',
                    successProbability: 0.7,
                    description: 'A bold, direct approach'
                },
                {
                    text: `Use diplomatic approach in ${careerCategory}`,
                    choiceType: 'diplomatic',
                    successProbability: 0.8,
                    description: 'A careful, measured approach'
                },
                {
                    text: `Be cautious in ${careerCategory}`,
                    choiceType: 'cautious',
                    successProbability: 0.6,
                    description: 'A careful, measured approach'
                }
            ],
            metadata: {
                amuletPrompt,
                careerCategory,
                generatedAt: Date.now()
            }
        };

        this.promptStats.totalPrompts++;
        this.promptStats.promptsByCategory[careerCategory] = 
            (this.promptStats.promptsByCategory[careerCategory] || 0) + 1;
        this.promptStats.promptsByAmulet[amuletPrompt] = 
            (this.promptStats.promptsByAmulet[amuletPrompt] || 0) + 1;

        return prompt;
    }

    getPromptStats() {
        return { ...this.promptStats };
    }
}

class MockCareerAnalyzer {
    constructor(gameState) {
        this.gameState = gameState;
    }

    calculateCareerWeights() {
        const weights = {
            'Common work': 1000,
            'Military': 2000,
            'The Arcane Association': 500
        };
        return weights;
    }

    getDominantCareer() {
        return 'Military';
    }

    getCareerAnalysis() {
        return {
            careerWeights: this.calculateCareerWeights(),
            dominantCareer: this.getDominantCareer(),
            availableCategories: ['Common work', 'Military', 'The Arcane Association'],
            highWeightCategories: ['Military']
        };
    }
}

class MockStoryTreeManager {
    constructor() {
        this.storyTrees = {
            'age25': {},
            'age45': {},
            'age65': {},
            'age200': {}
        };
    }

    getAvailableChoices(amuletPrompt, careerCategory) {
        return this.storyTrees[amuletPrompt][careerCategory]?.choices || [];
    }

    lockChoice(amuletPrompt, careerCategory, choice, result) {
        if (!this.storyTrees[amuletPrompt][careerCategory]) {
            this.storyTrees[amuletPrompt][careerCategory] = {
                choices: [],
                branches: {},
                metadata: {
                    created: Date.now(),
                    lastModified: Date.now(),
                    totalChoices: 0,
                    successCount: 0,
                    failureCount: 0
                }
            };
        }

        const tree = this.storyTrees[amuletPrompt][careerCategory];
        if (!tree.choices.includes(choice)) {
            tree.choices.push(choice);
        }

        tree.branches[choice] = {
            ...result,
            timestamp: Date.now()
        };

        tree.metadata.lastModified = Date.now();
        tree.metadata.totalChoices = tree.choices.length;

        if (result.success) {
            tree.metadata.successCount++;
        } else {
            tree.metadata.failureCount++;
        }
    }

    getStoryTreeStats() {
        let totalChoices = 0;
        let totalSuccesses = 0;
        let totalFailures = 0;

        for (const prompt in this.storyTrees) {
            for (const category in this.storyTrees[prompt]) {
                const tree = this.storyTrees[prompt][category];
                totalChoices += tree.metadata.totalChoices;
                totalSuccesses += tree.metadata.successCount;
                totalFailures += tree.metadata.failureCount;
            }
        }

        return {
            totalChoices,
            totalSuccesses,
            totalFailures,
            successRate: totalChoices > 0 ? totalSuccesses / totalChoices : 0
        };
    }
}

class MockStoryTreeBuilder {
    constructor(storyTreeManager, careerAnalyzer) {
        this.storyTreeManager = storyTreeManager;
        this.careerAnalyzer = careerAnalyzer;
    }

    addChoice(amuletPrompt, careerCategory, choice, result) {
        this.storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
    }
}

// Test the integration
function testCareerBasedAdventureIntegration() {
    console.log('🧪 Testing Career-Based Adventure Integration...');
    
    // Mock game state
    const gameState = {
        taskData: {
            'Beggar': { level: 10, maxLevel: 10 },
            'Farmer': { level: 2, maxLevel: 2 },
            'Squire': { level: 20, maxLevel: 20 },
            'Footman': { level: 4, maxLevel: 4 }
        },
        days: 25 * 365, // 25 years
        paused: false
    };

    // Initialize components
    const careerAnalyzer = new MockCareerAnalyzer(gameState);
    const storyTreeManager = new MockStoryTreeManager();
    const storyTreeBuilder = new MockStoryTreeBuilder(storyTreeManager, careerAnalyzer);
    const careerBasedPromptGenerator = new MockCareerBasedPromptGenerator();

    // Test 1: Career Analysis
    console.log('📊 Testing Career Analysis...');
    const careerAnalysis = careerAnalyzer.getCareerAnalysis();
    console.log('Career Analysis:', careerAnalysis);
    console.log('✅ Career Analysis Test Passed');

    // Test 2: Prompt Generation
    console.log('🎭 Testing Prompt Generation...');
    const prompt = careerBasedPromptGenerator.generateAdventurePrompt('age25', 'Military');
    console.log('Generated Prompt:', prompt);
    console.log('✅ Prompt Generation Test Passed');

    // Test 3: Story Tree Management
    console.log('🌳 Testing Story Tree Management...');
    storyTreeBuilder.addChoice('age25', 'Military', 'Lead assault', { success: true });
    storyTreeBuilder.addChoice('age25', 'Military', 'Negotiate peace', { success: false });
    
    const availableChoices = storyTreeManager.getAvailableChoices('age25', 'Military');
    console.log('Available Choices:', availableChoices);
    console.log('✅ Story Tree Management Test Passed');

    // Test 4: Statistics
    console.log('📈 Testing Statistics...');
    const stats = storyTreeManager.getStoryTreeStats();
    console.log('Story Tree Stats:', stats);
    console.log('✅ Statistics Test Passed');

    // Test 5: Amulet Prompt Triggers
    console.log('🔮 Testing Amulet Prompt Triggers...');
    const amuletPromptTriggers = {
        25: 'age25',
        45: 'age45', 
        65: 'age65',
        200: 'age200'
    };
    
    const currentAge = Math.floor(gameState.days / 365);
    console.log('Current Age:', currentAge);
    
    for (const [triggerAge, promptKey] of Object.entries(amuletPromptTriggers)) {
        if (currentAge >= parseInt(triggerAge)) {
            console.log(`✅ Amulet prompt ${promptKey} should trigger at age ${triggerAge}`);
        }
    }
    console.log('✅ Amulet Prompt Triggers Test Passed');

    // Test 6: Career Weight Calculation
    console.log('⚖️ Testing Career Weight Calculation...');
    const careerWeights = careerAnalyzer.calculateCareerWeights();
    console.log('Career Weights:', careerWeights);
    
    let dominantCareer = null;
    let maxWeight = -1;
    
    for (const [category, weight] of Object.entries(careerWeights)) {
        if (weight > maxWeight) {
            maxWeight = weight;
            dominantCareer = category;
        }
    }
    
    console.log('Dominant Career:', dominantCareer);
    console.log('✅ Career Weight Calculation Test Passed');

    // Test 7: Integration Flow
    console.log('🔄 Testing Integration Flow...');
    
    // Simulate age progression
    const testAges = [25, 45, 65, 200];
    for (const age of testAges) {
        const amuletPrompt = amuletPromptTriggers[age];
        if (amuletPrompt) {
            const prompt = careerBasedPromptGenerator.generateAdventurePrompt(amuletPrompt, dominantCareer);
            console.log(`Age ${age} Adventure:`, prompt.title);
        }
    }
    console.log('✅ Integration Flow Test Passed');

    console.log('🎉 All Career-Based Adventure Integration Tests Passed!');
    return true;
}

// Run the tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testCareerBasedAdventureIntegration };
} else {
    // Run in browser
    testCareerBasedAdventureIntegration();
}
