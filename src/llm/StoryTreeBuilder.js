/**
 * StoryTreeBuilder - Builds and manages dynamic story trees
 * Handles infinite depth growth and story branch generation
 */

// Dependencies will be loaded via script tags

class StoryTreeBuilder {
    constructor(storyTreeManager, careerAnalyzer) {
        this.storyTreeManager = storyTreeManager;
        this.careerAnalyzer = careerAnalyzer;
        this.probabilityCalculator = new ProbabilityCalculator();
        this.maxDepth = 10; // Maximum depth for story trees
    }

    /**
     * Generate initial story options for a career category
     * @param {string} amuletPrompt - Amulet prompt (age25, age45, etc.)
     * @param {string} careerCategory - Career category
     * @returns {Array} Initial story options
     */
    generateInitialOptions(amuletPrompt, careerCategory) {
        const careerWeights = this.careerAnalyzer.calculateCareerWeights();
        const careerWeight = careerWeights[careerCategory] || 0;
        
        // Generate options based on career weight
        const options = this.generateOptionsForWeight(careerCategory, careerWeight);
        
        return options.map(option => ({
            choice: option.choice,
            description: option.description,
            successProbability: this.calculateBaseProbability(careerWeight),
            depth: 0,
            careerCategory: careerCategory
        }));
    }

    /**
     * Generate new branches when a choice is made
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @param {string} choice - Choice made
     * @param {Object} result - Choice result
     * @returns {Array} New story branches
     */
    generateNewBranches(amuletPrompt, careerCategory, choice, result) {
        const currentDepth = this.getStoryTreeDepth(amuletPrompt, careerCategory);
        
        if (currentDepth >= this.maxDepth) {
            return []; // No more branches at max depth
        }
        
        const careerWeights = this.careerAnalyzer.calculateCareerWeights();
        const careerWeight = careerWeights[careerCategory] || 0;
        
        // Generate branches based on success/failure
        const branches = result.success 
            ? this.generateSuccessBranches(careerCategory, careerWeight, currentDepth + 1)
            : this.generateFailureBranches(careerCategory, careerWeight, currentDepth + 1);
        
        return branches.map(branch => ({
            choice: branch.choice,
            description: branch.description,
            successProbability: branch.successProbability,
            depth: currentDepth + 1,
            careerCategory: careerCategory,
            parentChoice: choice
        }));
    }

    /**
     * Add a choice to the story tree
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @param {string} choice - Choice made
     * @param {Object} result - Choice result
     */
    addChoice(amuletPrompt, careerCategory, choice, result) {
        this.storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result);
    }

    /**
     * Get story tree depth
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @returns {number} Current depth
     */
    getStoryTreeDepth(amuletPrompt, careerCategory) {
        const storyTree = this.storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
        return storyTree.choices.length;
    }

    /**
     * Check if more choices can be added
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @returns {boolean} Can add more choices
     */
    canAddMoreChoices(amuletPrompt, careerCategory) {
        const currentDepth = this.getStoryTreeDepth(amuletPrompt, careerCategory);
        return currentDepth < this.maxDepth;
    }

    /**
     * Validate story tree structure
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @returns {boolean} Is valid
     */
    validateStoryTree(amuletPrompt, careerCategory) {
        return this.storyTreeManager.validateStoryTree(amuletPrompt, careerCategory);
    }

    /**
     * Get story tree statistics
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @returns {Object} Statistics
     */
    getStoryTreeStats(amuletPrompt, careerCategory) {
        const storyTree = this.storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
        const totalChoices = storyTree.choices.length;
        const successCount = storyTree.metadata.successCount;
        const failureCount = storyTree.metadata.failureCount;
        const successRate = totalChoices > 0 ? successCount / (successCount + failureCount) : 0;
        
        return {
            totalChoices,
            successCount,
            failureCount,
            successRate,
            averageDepth: totalChoices > 0 ? totalChoices / 2 : 0,
            maxDepth: totalChoices
        };
    }

    /**
     * Prune unused branches
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     */
    pruneUnusedBranches(amuletPrompt, careerCategory) {
        const storyTree = this.storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
        
        // Remove choices that have no branches
        const usedChoices = new Set();
        for (const [choice, result] of Object.entries(storyTree.branches)) {
            if (result.nextChoices && result.nextChoices.length > 0) {
                result.nextChoices.forEach(nextChoice => usedChoices.add(nextChoice));
            }
        }
        
        // Remove unused choices
        storyTree.choices = storyTree.choices.filter(choice => 
            usedChoices.has(choice) || storyTree.branches[choice]
        );
        
        this.storyTreeManager.saveStoryTrees();
    }

    /**
     * Optimize story tree structure
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     */
    optimizeStoryTree(amuletPrompt, careerCategory) {
        this.pruneUnusedBranches(amuletPrompt, careerCategory);
        
        // Update metadata
        const storyTree = this.storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
        storyTree.metadata.lastModified = Date.now();
        
        this.storyTreeManager.saveStoryTrees();
    }

    /**
     * Generate options based on career weight
     * @param {string} careerCategory - Career category
     * @param {number} careerWeight - Career weight
     * @returns {Array} Generated options
     */
    generateOptionsForWeight(careerCategory, careerWeight) {
        const baseOptions = this.getBaseOptionsForCategory(careerCategory);
        const weightLevel = this.getWeightLevel(careerWeight);
        
        return baseOptions[weightLevel] || baseOptions.low;
    }

    /**
     * Generate success branches
     * @param {string} careerCategory - Career category
     * @param {number} careerWeight - Career weight
     * @param {number} depth - Current depth
     * @returns {Array} Success branches
     */
    generateSuccessBranches(careerCategory, careerWeight, depth) {
        const baseOptions = this.getBaseOptionsForCategory(careerCategory);
        const weightLevel = this.getWeightLevel(careerWeight);
        const options = baseOptions[weightLevel] || baseOptions.low;
        
        // Reduce success probability with depth
        const baseProbability = this.calculateBaseProbability(careerWeight);
        const depthProbability = this.probabilityCalculator.calculateDepthProbability(baseProbability, depth);
        
        return options.map(option => ({
            choice: `${option.choice}_success_${depth}`,
            description: `Success: ${option.description}`,
            successProbability: depthProbability
        }));
    }

    /**
     * Generate failure branches
     * @param {string} careerCategory - Career category
     * @param {number} careerWeight - Career weight
     * @param {number} depth - Current depth
     * @returns {Array} Failure branches
     */
    generateFailureBranches(careerCategory, careerWeight, depth) {
        const baseOptions = this.getBaseOptionsForCategory(careerCategory);
        const weightLevel = this.getWeightLevel(careerWeight);
        const options = baseOptions[weightLevel] || baseOptions.low;
        
        // Lower success probability for failure branches
        const baseProbability = this.calculateBaseProbability(careerWeight);
        const depthProbability = this.probabilityCalculator.calculateDepthProbability(baseProbability, depth);
        const failureProbability = depthProbability * 0.5; // 50% of success probability
        
        return options.map(option => ({
            choice: `${option.choice}_failure_${depth}`,
            description: `Failure: ${option.description}`,
            successProbability: failureProbability
        }));
    }

    /**
     * Get base options for career category
     * @param {string} careerCategory - Career category
     * @returns {Object} Base options by weight level
     */
    getBaseOptionsForCategory(careerCategory) {
        const options = {
            'Common work': {
                low: [
                    { choice: 'Beg from merchants', description: 'Ask for charity from local merchants' },
                    { choice: 'Look for odd jobs', description: 'Search for temporary work' }
                ],
                medium: [
                    { choice: 'Negotiate with merchants', description: 'Try to strike a deal with merchants' },
                    { choice: 'Start small business', description: 'Begin a modest trading venture' }
                ],
                high: [
                    { choice: 'Lead merchant caravan', description: 'Organize and lead a trading expedition' },
                    { choice: 'Establish trade routes', description: 'Create new trading connections' }
                ],
                veryHigh: [
                    { choice: 'Control market prices', description: 'Influence local market economics' },
                    { choice: 'Build commercial empire', description: 'Create a vast trading network' }
                ]
            },
            'Military': {
                low: [
                    { choice: 'Look for a knight to serve', description: 'Seek employment as a squire' },
                    { choice: 'Join local militia', description: 'Enlist in the town guard' }
                ],
                medium: [
                    { choice: 'Lead small patrol', description: 'Command a small military unit' },
                    { choice: 'Train new recruits', description: 'Instruct fresh soldiers' }
                ],
                high: [
                    { choice: 'Command military unit', description: 'Lead a significant military force' },
                    { choice: 'Plan strategic campaigns', description: 'Develop military strategies' }
                ],
                veryHigh: [
                    { choice: 'Lead entire army', description: 'Command the kingdom\'s forces' },
                    { choice: 'Defend the realm', description: 'Protect the kingdom from threats' }
                ]
            },
            'The Arcane Association': {
                low: [
                    { choice: 'Look for some books', description: 'Search for magical texts' },
                    { choice: 'Study basic magic', description: 'Learn fundamental spells' }
                ],
                medium: [
                    { choice: 'Research ancient magic', description: 'Investigate old magical knowledge' },
                    { choice: 'Teach at the academy', description: 'Instruct students in magic' }
                ],
                high: [
                    { choice: 'Lead magical research', description: 'Direct advanced magical studies' },
                    { choice: 'Establish magical school', description: 'Found a new academy' }
                ],
                veryHigh: [
                    { choice: 'Master forbidden arts', description: 'Study dangerous magical practices' },
                    { choice: 'Shape reality itself', description: 'Alter the fundamental laws of magic' }
                ]
            }
        };
        
        return options[careerCategory] || options['Common work'];
    }

    /**
     * Get weight level based on career weight
     * @param {number} careerWeight - Career weight
     * @returns {string} Weight level
     */
    getWeightLevel(careerWeight) {
        if (careerWeight >= 100000) return 'veryHigh';
        if (careerWeight >= 10000) return 'high';
        if (careerWeight >= 1000) return 'medium';
        return 'low';
    }

    /**
     * Calculate base probability from career weight
     * @param {number} careerWeight - Career weight
     * @returns {number} Base probability
     */
    calculateBaseProbability(careerWeight) {
        if (careerWeight <= 0) return 0.1;
        if (careerWeight >= 100000) return 0.9;
        
        // Linear scaling between 0.1 and 0.9
        return 0.1 + (careerWeight / 100000) * 0.8;
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StoryTreeBuilder = StoryTreeBuilder;
}
