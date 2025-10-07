/**
 * CareerBasedAdventureIntegration
 * Integrates career-based prompt generation with existing adventure system
 */

// Dependencies will be loaded via script tags

class CareerBasedAdventureIntegration {
    constructor(gameState, storyManager, mistralAPI) {
        this.gameState = gameState;
        this.storyManager = storyManager;
        this.mistralAPI = mistralAPI;
        
        // Initialize career-based components
        if (typeof CareerAnalyzer === 'undefined') {
            throw new Error('CareerAnalyzer not loaded. Please ensure CareerAnalyzer.js is loaded before CareerBasedAdventureIntegration.js');
        }
        this.careerAnalyzer = new CareerAnalyzer(gameState);
        
        if (typeof StoryTreeManager === 'undefined') {
            throw new Error('StoryTreeManager not loaded. Please ensure StoryTreeManager.js is loaded before CareerBasedAdventureIntegration.js');
        }
        this.storyTreeManager = new StoryTreeManager();
        
        if (typeof StoryTreeBuilder === 'undefined') {
            throw new Error('StoryTreeBuilder not loaded. Please ensure StoryTreeBuilder.js is loaded before CareerBasedAdventureIntegration.js');
        }
        this.storyTreeBuilder = new StoryTreeBuilder(this.storyTreeManager, this.careerAnalyzer);
        
        if (typeof CareerBasedPromptGenerator === 'undefined') {
            throw new Error('CareerBasedPromptGenerator not loaded. Please ensure CareerBasedPromptGenerator.js is loaded before CareerBasedAdventureIntegration.js');
        }
        this.careerBasedPromptGenerator = new CareerBasedPromptGenerator(this.careerAnalyzer, this.storyTreeBuilder);
        
        // Track amulet prompt triggers
        this.amuletPromptTriggers = {
            25: 'age25',
            45: 'age45', 
            65: 'age65',
            200: 'age200'
        };
        
        this.lastTriggeredAge = null;
        this.currentAdventure = null;
    }

    /**
     * Check if an amulet prompt is available at the current age
     * @param {number} currentAge - Current player age in years
     * @returns {string|null} - Amulet prompt key or null if not available
     */
    getAvailableAmuletPrompt(currentAge) {
        const ageInYears = Math.floor(currentAge / 365);
        
        // Check if we've reached a specific trigger age
        if (ageInYears >= 200) {
            return 'age200';
        } else if (ageInYears >= 65) {
            return 'age65';
        } else if (ageInYears >= 45) {
            return 'age45';
        } else if (ageInYears >= 25) {
            return 'age25';
        }
        
        return null;
    }

    /**
     * Check if an adventure is available for the current age
     * @param {number} currentAge - Current player age in years
     * @returns {boolean} - Whether an adventure is available
     */
    isAdventureAvailable(currentAge) {
        const ageInYears = Math.floor(currentAge / 365);
        
        // Check if we're at a specific trigger age
        if (ageInYears === 25 || ageInYears === 45 || ageInYears === 65 || ageInYears === 200) {
            const amuletPrompt = this.getAvailableAmuletPrompt(currentAge);
            if (!amuletPrompt) return false;
            
            // Check if this adventure has already been used in this life
            const lifeId = this.getCurrentLifeId();
            return !this.hasAdventureBeenUsed(lifeId, amuletPrompt);
        }
        
        return false;
    }

    /**
     * Mark an adventure as used for this life
     * @param {string} amuletPrompt - The amulet prompt key
     */
    markAdventureAsUsed(amuletPrompt) {
        const lifeId = this.getCurrentLifeId();
        const usedAdventures = this.getUsedAdventuresForLife(lifeId);
        usedAdventures.push(amuletPrompt);
        this.saveUsedAdventuresForLife(lifeId, usedAdventures);
    }

    /**
     * Get current life ID based on rebirth count
     * @returns {string} - Current life ID
     */
    getCurrentLifeId() {
        const rebirthCount = this.gameState.rebirthOneCount + this.gameState.rebirthTwoCount;
        return `life_${rebirthCount}`;
    }

    /**
     * Check if an adventure has been used in this life
     * @param {string} lifeId - Life ID
     * @param {string} amuletPrompt - Amulet prompt key
     * @returns {boolean} - Whether adventure has been used
     */
    hasAdventureBeenUsed(lifeId, amuletPrompt) {
        const usedAdventures = this.getUsedAdventuresForLife(lifeId);
        return usedAdventures.includes(amuletPrompt);
    }

    /**
     * Get used adventures for a specific life
     * @param {string} lifeId - Life ID
     * @returns {Array} - Array of used adventure keys
     */
    getUsedAdventuresForLife(lifeId) {
        try {
            const data = localStorage.getItem('usedAdventures');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed[lifeId] || [];
            }
        } catch (e) {
            console.error('Error loading used adventures:', e);
        }
        return [];
    }

    /**
     * Save used adventures for a specific life
     * @param {string} lifeId - Life ID
     * @param {Array} usedAdventures - Array of used adventure keys
     */
    saveUsedAdventuresForLife(lifeId, usedAdventures) {
        try {
            const data = localStorage.getItem('usedAdventures');
            const parsed = data ? JSON.parse(data) : {};
            parsed[lifeId] = usedAdventures;
            localStorage.setItem('usedAdventures', JSON.stringify(parsed));
        } catch (e) {
            console.error('Error saving used adventures:', e);
        }
    }

    /**
     * Start a career-based adventure
     * @param {string} amuletPrompt - The amulet prompt key (age25, age45, etc.)
     * @returns {Object} - Adventure data with prompt and choices
     */
    async startCareerBasedAdventure(amuletPrompt) {
        try {
            // Check if this specific adventure is available
            const currentAge = Math.floor(this.gameState.days / 365);
            const lifeId = this.getCurrentLifeId();
            
            // Check if this adventure has already been used in this life
            if (this.hasAdventureBeenUsed(lifeId, amuletPrompt)) {
                return {
                    success: false,
                    error: 'Adventure already used',
                    message: `Adventure ${amuletPrompt} has already been used in this life`
                };
            }
            
            // Check if we're at the right age for this adventure
            const expectedAge = parseInt(amuletPrompt.replace('age', ''));
            if (currentAge < expectedAge) {
                return {
                    success: false,
                    error: 'Too young for adventure',
                    message: `Must be at least ${expectedAge} years old for ${amuletPrompt} adventure`
                };
            }
            
            // Get player's dominant career category
            const careerAnalysis = this.careerAnalyzer.getCareerAnalysis();
            const dominantCareer = careerAnalysis.dominantCareer || 'Common work';
            
            // Generate career-based prompt
            const prompt = this.careerBasedPromptGenerator.generateAdventurePrompt(
                amuletPrompt, 
                dominantCareer,
                this.getPlayerSkills(),
                this.getPlayerLevel()
            );
            
            // Mark adventure as used for this life
            this.markAdventureAsUsed(amuletPrompt);
            
            // Debug: Print story tree state before starting adventure
            console.log(`\n🎯 Starting Adventure: ${amuletPrompt} - ${dominantCareer}`);
            console.log(`📅 Life ID: ${this.getCurrentLifeId()}`);
            this.debugPrintStoryTree();
            
            // Store current adventure
            this.currentAdventure = {
                amuletPrompt,
                careerCategory: dominantCareer,
                prompt,
                startTime: Date.now()
            };
            
            return {
                success: true,
                adventure: this.currentAdventure,
                message: `Career-based adventure started for ${dominantCareer} at ${amuletPrompt}`
            };
            
        } catch (error) {
            console.error('Error starting career-based adventure:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to start career-based adventure'
            };
        }
    }

    /**
     * Handle player choice in career-based adventure
     * @param {string} choiceText - The choice text selected by player
     * @param {boolean} isSuccess - Whether the choice was successful
     * @returns {Object} - Result of the choice
     */
    async handleCareerBasedChoice(choiceText, isSuccess) {
        if (!this.currentAdventure) {
            return {
                success: false,
                error: 'No active adventure',
                message: 'No active career-based adventure'
            };
        }

        try {
            // Find the choice in the current adventure
            const choice = this.currentAdventure.prompt.choices.find(c => c.text === choiceText);
            if (!choice) {
                return {
                    success: false,
                    error: 'Choice not found',
                    message: 'Selected choice not found in current adventure'
                };
            }

            // Add choice to story tree
            this.storyTreeBuilder.addChoice(
                this.currentAdventure.amuletPrompt,
                this.currentAdventure.careerCategory,
                choiceText,
                { success: isSuccess, choiceType: choice.choiceType }
            );

            // Generate story continuation based on choice
            const storyContinuation = await this.generateStoryContinuation(choice, isSuccess);
            
            // Calculate experience rewards (10x due to rarity)
            const experienceRewards = this.calculateExperienceRewards(choice, isSuccess);
            
            // Debug: Print story tree structure after choice
            this.debugPrintStoryTree();
            
            return {
                success: true,
                storyContinuation,
                choiceResult: {
                    choice: choiceText,
                    success: isSuccess,
                    choiceType: choice.choiceType,
                    successProbability: choice.successProbability
                },
                experienceRewards,
                message: `Choice "${choiceText}" processed successfully`
            };

        } catch (error) {
            console.error('Error handling career-based choice:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to process choice'
            };
        }
    }

    /**
     * Generate story continuation based on choice
     * @param {Object} choice - The choice object
     * @param {boolean} isSuccess - Whether the choice was successful
     * @returns {Object} - Story continuation data
     */
    async generateStoryContinuation(choice, isSuccess) {
        try {
            // Get character state for story generation
            const characterState = this.getCharacterState();
            
            // Create story context
            const storyContext = this.storyManager.startNewStory(characterState);
            
            // Generate story prompt based on choice result
            const storyPrompt = this.createStoryPromptFromChoice(choice, isSuccess, characterState, storyContext);
            
            // Call LLM to generate story continuation
            const storyResponse = await this.mistralAPI.generateStory(storyPrompt);
            
            return {
                story: storyResponse.story,
                choices: storyResponse.choices || [],
                success: isSuccess,
                choiceType: choice.choiceType
            };

        } catch (error) {
            console.error('Error generating story continuation:', error);
            return {
                story: `You ${isSuccess ? 'succeeded' : 'failed'} in your ${choice.choiceType} approach.`,
                choices: [],
                success: isSuccess,
                choiceType: choice.choiceType
            };
        }
    }

    /**
     * Create story prompt from choice
     * @param {Object} choice - The choice object
     * @param {boolean} isSuccess - Whether the choice was successful
     * @param {Object} characterState - Character state
     * @param {Object} storyContext - Story context
     * @returns {string} - Story prompt
     */
    createStoryPromptFromChoice(choice, isSuccess, characterState, storyContext) {
        const successText = isSuccess ? 'succeeded' : 'failed';
        const choiceType = choice.choiceType;
        
        return `
You are a master storyteller continuing a fantasy adventure. The character has just ${successText} in their ${choiceType} approach: "${choice.text}".

CHARACTER STATE:
- Age: ${Math.floor(characterState.days / 365)} years old
- Current Job: ${characterState.currentJob || 'Adventurer'}
- Current Skill: ${characterState.currentSkill || 'None'}
- Wealth: ${characterState.coins || 0} coins
- Evil Level: ${characterState.evil || 0}

CURRENT SITUATION:
The character has just ${successText} in their ${choiceType} approach. Continue the story from this point, showing the consequences of their ${successText} attempt.

Generate a vivid, immersive continuation of the story that reflects the ${successText} outcome of their ${choiceType} choice.
Keep it to 2-3 paragraphs and focus on the immediate consequences and next steps.
        `;
    }

    /**
     * End the current career-based adventure
     * @returns {Object} - Adventure summary
     */
    endCareerBasedAdventure() {
        if (!this.currentAdventure) {
            return {
                success: false,
                message: 'No active adventure to end'
            };
        }

        const adventure = this.currentAdventure;
        const duration = Date.now() - adventure.startTime;
        
        // Clear current adventure
        this.currentAdventure = null;
        
        return {
            success: true,
            summary: {
                amuletPrompt: adventure.amuletPrompt,
                careerCategory: adventure.careerCategory,
                duration: duration,
                choices: adventure.prompt.choices.length
            },
            message: 'Career-based adventure ended successfully'
        };
    }

    /**
     * Get player skills for career analysis
     * @returns {Object} - Player skills
     */
    getPlayerSkills() {
        const skills = {};
        if (this.gameState.taskData) {
            for (const [skillName, skillData] of Object.entries(this.gameState.taskData)) {
                if (skillData.maxLevel) {
                    skills[skillName] = { maxLevel: skillData.maxLevel };
                }
            }
        }
        return skills;
    }

    /**
     * Get player level
     * @returns {number} - Player level
     */
    getPlayerLevel() {
        return Math.floor(this.gameState.days / 365);
    }

    /**
     * Get character state for story generation
     * @returns {Object} - Character state
     */
    getCharacterState() {
        return {
            days: this.gameState.days,
            currentJob: this.gameState.currentJob?.name || 'Adventurer',
            currentSkill: this.gameState.currentSkill?.name || 'None',
            coins: this.gameState.coins,
            evil: this.gameState.evil,
            rebirthOneCount: this.gameState.rebirthOneCount,
            rebirthTwoCount: this.gameState.rebirthTwoCount
        };
    }

    /**
     * Get career analysis for current player
     * @returns {Object} - Career analysis
     */
    getCareerAnalysis() {
        return this.careerAnalyzer.getCareerAnalysis();
    }

    /**
     * Get story tree statistics
     * @returns {Object} - Story tree statistics
     */
    getStoryTreeStats() {
        return this.storyTreeManager.getStoryTreeStats();
    }

    /**
     * Check if adventure is active
     * @returns {boolean} - Whether adventure is active
     */
    isAdventureActive() {
        return this.currentAdventure !== null;
    }

    /**
     * Get current adventure data
     * @returns {Object|null} - Current adventure or null
     */
    getCurrentAdventure() {
        return this.currentAdventure;
    }

    /**
     * Calculate experience rewards for career-based adventures (10x due to rarity)
     * @param {Object} choice - The choice object
     * @param {boolean} isSuccess - Whether the choice was successful
     * @returns {Object} - Experience rewards
     */
    calculateExperienceRewards(choice, isSuccess) {
        const baseReward = 100; // Base experience reward
        const rarityMultiplier = 10; // 10x due to rarity
        const successMultiplier = isSuccess ? 1.5 : 0.5; // Success/failure multiplier
        const choiceTypeMultiplier = this.getChoiceTypeMultiplier(choice.choiceType);
        
        const totalReward = Math.floor(baseReward * rarityMultiplier * successMultiplier * choiceTypeMultiplier);
        
        // Map choice types to relevant skills
        const skillRewards = this.getSkillRewardsForChoiceType(choice.choiceType, totalReward);
        
        return {
            totalExperience: totalReward,
            skillRewards: skillRewards,
            rarityMultiplier: rarityMultiplier,
            successMultiplier: successMultiplier,
            choiceTypeMultiplier: choiceTypeMultiplier
        };
    }

    /**
     * Get choice type multiplier for experience calculation
     * @param {string} choiceType - The choice type
     * @returns {number} - Multiplier value
     */
    getChoiceTypeMultiplier(choiceType) {
        const multipliers = {
            'aggressive': 1.2,
            'diplomatic': 1.0,
            'cautious': 0.8,
            'creative': 1.5
        };
        return multipliers[choiceType] || 1.0;
    }

    /**
     * Get skill rewards for a specific choice type
     * @param {string} choiceType - The choice type
     * @param {number} totalReward - Total experience reward
     * @returns {Object} - Skill-specific rewards
     */
    getSkillRewardsForChoiceType(choiceType, totalReward) {
        const skillMappings = {
            'aggressive': {
                'Strength': 0.6,
                'Concentration': 0.4
            },
            'diplomatic': {
                'Charisma': 0.7,
                'Meditation': 0.3
            },
            'cautious': {
                'Concentration': 0.8,
                'Intelligence': 0.2
            },
            'creative': {
                'Mana control': 0.6,
                'Intelligence': 0.4
            }
        };
        
        const mapping = skillMappings[choiceType] || {
            'Concentration': 1.0
        };
        
        const rewards = {};
        for (const [skill, multiplier] of Object.entries(mapping)) {
            rewards[skill] = Math.floor(totalReward * multiplier);
        }
        
        return rewards;
    }

    /**
     * Debug method to print story tree structure to console
     * Shows the current state of all story trees after an adventure
     */
    debugPrintStoryTree() {
        console.log('\n🌳 === STORY TREE DEBUG ===');
        console.log(`📅 Current Life: ${this.getCurrentLifeId()}`);
        console.log(`🎯 Adventure: ${this.currentAdventure?.amuletPrompt} - ${this.currentAdventure?.careerCategory}`);
        
        try {
            // Get all story trees
            const allTrees = this.storyTreeManager.getStoryTrees();
            
            if (Object.keys(allTrees).length === 0) {
                console.log('📝 No story trees created yet');
                return;
            }
            
            // Print each amulet prompt tree
            for (const [amuletPrompt, promptTrees] of Object.entries(allTrees)) {
                console.log(`\n🔮 ${amuletPrompt.toUpperCase()} TREE:`);
                
                if (Object.keys(promptTrees).length === 0) {
                    console.log('  📝 No career categories for this prompt');
                    continue;
                }
                
                // Print each career category tree
                for (const [careerCategory, tree] of Object.entries(promptTrees)) {
                    console.log(`\n  🎭 ${careerCategory}:`);
                    
                    if (!tree || !tree.choices || tree.choices.length === 0) {
                        console.log('    📝 No choices made yet');
                        continue;
                    }
                    
                    // Print tree structure
                    console.log(`    📊 Total Choices: ${tree.metadata?.totalChoices || 0}`);
                    console.log(`    ✅ Successes: ${tree.metadata?.successCount || 0}`);
                    console.log(`    ❌ Failures: ${tree.metadata?.failureCount || 0}`);
                    console.log(`    📈 Success Rate: ${((tree.metadata?.successCount || 0) / (tree.metadata?.totalChoices || 1) * 100).toFixed(1)}%`);
                    
                    // Print choices and their outcomes
                    console.log('    🌿 Choices:');
                    for (const choice of tree.choices) {
                        const branch = tree.branches[choice];
                        if (branch) {
                            const status = branch.success ? '✅' : '❌';
                            const timestamp = new Date(branch.timestamp).toLocaleTimeString();
                            console.log(`      ${status} "${choice}" (${branch.choiceType}) - ${timestamp}`);
                        } else {
                            console.log(`      ⚠️  "${choice}" (no branch data)`);
                        }
                    }
                    
                    // Print tree depth
                    const depth = this.storyTreeBuilder.getStoryTreeDepth(amuletPrompt, careerCategory);
                    console.log(`    📏 Tree Depth: ${depth}`);
                }
            }
            
            // Print overall statistics
            const stats = this.storyTreeManager.getStoryTreeStats();
            console.log(`\n📊 OVERALL STATISTICS:`);
            console.log(`  🎯 Total Choices: ${stats.totalChoices}`);
            console.log(`  ✅ Total Successes: ${stats.totalSuccesses}`);
            console.log(`  ❌ Total Failures: ${stats.totalFailures}`);
            console.log(`  📈 Overall Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
            
            // Print choices by prompt
            if (stats.choicesByPrompt) {
                console.log(`\n📅 Choices by Prompt:`);
                for (const [prompt, count] of Object.entries(stats.choicesByPrompt)) {
                    console.log(`  ${prompt}: ${count} choices`);
                }
            }
            
            // Print choices by category
            if (stats.choicesByCategory) {
                console.log(`\n🎭 Choices by Category:`);
                for (const [category, count] of Object.entries(stats.choicesByCategory)) {
                    console.log(`  ${category}: ${count} choices`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error printing story tree debug info:', error);
        }
        
        console.log('\n🌳 === END STORY TREE DEBUG ===\n');
    }

    /**
     * Manual debug method to print story tree structure
     * Can be called from console or UI for debugging
     */
    debugStoryTrees() {
        console.log('\n🔍 === MANUAL STORY TREE DEBUG ===');
        this.debugPrintStoryTree();
    }

    /**
     * Get a summary of all story trees for debugging
     * @returns {Object} - Summary of all story trees
     */
    getStoryTreeSummary() {
        try {
            const allTrees = this.storyTreeManager.getStoryTrees();
            const stats = this.storyTreeManager.getStoryTreeStats();
            
            return {
                lifeId: this.getCurrentLifeId(),
                totalTrees: Object.keys(allTrees).length,
                totalChoices: stats.totalChoices,
                totalSuccesses: stats.totalSuccesses,
                totalFailures: stats.totalFailures,
                successRate: stats.successRate,
                trees: allTrees,
                stats: stats
            };
        } catch (error) {
            console.error('Error getting story tree summary:', error);
            return { error: error.message };
        }
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.CareerBasedAdventureIntegration = CareerBasedAdventureIntegration;
}
