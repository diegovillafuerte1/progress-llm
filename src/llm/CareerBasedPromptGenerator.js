/**
 * CareerBasedPromptGenerator
 * Generates career-specific adventure prompts based on player career progression
 */

// Dependencies will be loaded via script tags

class CareerBasedPromptGenerator {
    constructor(careerAnalyzer, storyTreeBuilder) {
        this.careerAnalyzer = careerAnalyzer;
        this.storyTreeBuilder = storyTreeBuilder;
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

    /**
     * Generate career-based adventure prompt
     * @param {string} amuletPrompt - Amulet prompt (age25, age45, age65, age200)
     * @param {string} careerCategory - Career category
     * @param {Object} skills - Player skills (optional)
     * @param {number} playerLevel - Player level (optional)
     * @returns {Object} Adventure prompt
     */
    generateAdventurePrompt(amuletPrompt, careerCategory, skills = null, playerLevel = null) {
        // Get existing choices to include in cache key
        const existingChoices = this.storyTreeBuilder.storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
        const cacheKey = `${amuletPrompt}-${careerCategory}-${JSON.stringify(skills)}-${playerLevel}-${existingChoices.length}`;
        
        // Check cache first
        if (this.promptCache.has(cacheKey)) {
            return this.promptCache.get(cacheKey);
        }

        // Generate new prompt
        const prompt = this._generatePrompt(amuletPrompt, careerCategory, skills, playerLevel);
        
        // Cache the prompt
        this.promptCache.set(cacheKey, prompt);
        
        // Update statistics
        this._updatePromptStats(amuletPrompt, careerCategory, prompt);
        
        return prompt;
    }

    /**
     * Generate the actual prompt content
     * @private
     */
    _generatePrompt(amuletPrompt, careerCategory, skills, playerLevel) {
        const careerWeights = this.careerAnalyzer.calculateCareerWeights();
        const careerWeight = careerWeights[careerCategory] || 0;
        
        // Get existing choices from story tree
        const existingChoices = this.storyTreeBuilder.storyTreeManager.getAvailableChoices(amuletPrompt, careerCategory);
        
        // Generate new choices
        const newChoices = this._generateChoices(amuletPrompt, careerCategory, careerWeight, skills, playerLevel);
        
        // Combine existing and new choices
        const allChoices = [...existingChoices.map(choice => ({
            text: choice,
            choiceType: this._getChoiceTypeFromText(choice),
            successProbability: this._calculateSuccessProbability(careerCategory, careerWeight, skills, 0),
            description: `Previous choice: ${choice}`
        })), ...newChoices];
        
        return {
            title: this._generateTitle(amuletPrompt, careerCategory),
            description: this._generateDescription(amuletPrompt, careerCategory, careerWeight),
            choices: allChoices,
            metadata: {
                amuletPrompt,
                careerCategory,
                careerWeight,
                generatedAt: Date.now(),
                totalChoices: allChoices.length
            }
        };
    }

    /**
     * Generate choices for the prompt
     * @private
     */
    _generateChoices(amuletPrompt, careerCategory, careerWeight, skills, playerLevel) {
        const choices = [];
        const choiceTypes = ['aggressive', 'diplomatic', 'cautious', 'creative'];
        
        // Generate 3-5 choices based on career weight
        const numChoices = Math.min(5, Math.max(3, Math.floor(careerWeight / 1000) + 3));
        
        for (let i = 0; i < numChoices; i++) {
            const choiceType = choiceTypes[i % choiceTypes.length];
            const choice = this._generateChoice(amuletPrompt, careerCategory, choiceType, careerWeight, skills, playerLevel);
            choices.push(choice);
        }
        
        return choices;
    }

    /**
     * Generate a single choice
     * @private
     */
    _generateChoice(amuletPrompt, careerCategory, choiceType, careerWeight, skills, playerLevel) {
        const choiceText = this._generateChoiceText(amuletPrompt, careerCategory, choiceType);
        const successProbability = this._calculateSuccessProbability(careerCategory, careerWeight, skills, 0);
        
        return {
            text: choiceText,
            choiceType: choiceType,
            successProbability: successProbability,
            description: this._generateChoiceDescription(choiceType, careerCategory)
        };
    }

    /**
     * Generate choice text based on career category and type
     * @private
     */
    _generateChoiceText(amuletPrompt, careerCategory, choiceType) {
        const choiceTemplates = {
            'Common work': {
                aggressive: 'Confront the merchant directly',
                diplomatic: 'Negotiate a fair deal',
                cautious: 'Carefully examine the merchant\'s goods',
                creative: 'Propose a unique business partnership'
            },
            'Military': {
                aggressive: 'Lead a direct assault',
                diplomatic: 'Negotiate a peaceful resolution',
                cautious: 'Scout the area first',
                creative: 'Devise an unconventional strategy'
            },
            'The Arcane Association': {
                aggressive: 'Use powerful magic to force compliance',
                diplomatic: 'Use charm magic to persuade',
                cautious: 'Analyze the magical situation first',
                creative: 'Invent a new spell for the situation'
            }
        };
        
        // Age-appropriate content
        if (amuletPrompt === 'age200') {
            const legendaryTemplates = {
                'Common work': {
                    aggressive: 'Lead a legendary merchant empire',
                    diplomatic: 'Negotiate with legendary merchants',
                    cautious: 'Examine legendary merchant artifacts',
                    creative: 'Create a legendary business dynasty'
                },
                'Military': {
                    aggressive: 'Lead a legendary military campaign',
                    diplomatic: 'Negotiate legendary peace treaties',
                    cautious: 'Scout legendary battlefields',
                    creative: 'Devise legendary military strategies'
                },
                'The Arcane Association': {
                    aggressive: 'Use legendary magic to reshape reality',
                    diplomatic: 'Use legendary charm magic to unite kingdoms',
                    cautious: 'Analyze legendary magical phenomena',
                    creative: 'Invent legendary spells that change the world'
                }
            };
            
            return legendaryTemplates[careerCategory]?.[choiceType] || choiceTemplates[careerCategory]?.[choiceType] || `Take ${choiceType} action`;
        }
        
        return choiceTemplates[careerCategory]?.[choiceType] || `Take ${choiceType} action`;
    }

    /**
     * Generate choice description
     * @private
     */
    _generateChoiceDescription(choiceType, careerCategory) {
        const descriptions = {
            aggressive: `A bold, direct approach that may yield quick results but carries higher risk`,
            diplomatic: `A careful, measured approach that seeks to find common ground`,
            cautious: `A careful, measured approach that minimizes risk but may take longer`,
            creative: `An innovative approach that may yield unexpected results`
        };
        
        return descriptions[choiceType] || 'An action to take in this situation';
    }

    /**
     * Generate prompt title
     * @private
     */
    _generateTitle(amuletPrompt, careerCategory) {
        const titles = {
            'age25': {
                'Common work': 'The Young Merchant\'s Dilemma',
                'Military': 'The Squire\'s First Command',
                'The Arcane Association': 'The Apprentice\'s Test'
            },
            'age45': {
                'Common work': 'The Established Merchant\'s Challenge',
                'Military': 'The Veteran\'s Leadership',
                'The Arcane Association': 'The Mage\'s Responsibility'
            },
            'age65': {
                'Common work': 'The Master Merchant\'s Legacy',
                'Military': 'The Elite Knight\'s Final Mission',
                'The Arcane Association': 'The Master Wizard\'s Greatest Work'
            },
            'age200': {
                'Common work': 'The Legendary Merchant\'s Ultimate Test',
                'Military': 'The Legendary Knight\'s Final Stand',
                'The Arcane Association': 'The Chairman\'s Ultimate Challenge'
            }
        };
        
        return titles[amuletPrompt]?.[careerCategory] || 'The Adventure Begins';
    }

    /**
     * Generate prompt description
     * @private
     */
    _generateDescription(amuletPrompt, careerCategory, careerWeight) {
        const baseDescriptions = {
            'age25': 'You find yourself at a crossroads in your early career, holding a mysterious amulet...',
            'age45': 'You face a significant challenge in your established career, the amulet glowing with power...',
            'age65': 'You must make a decision that will define your legacy, the ancient amulet pulsing with energy...',
            'age200': 'You face the ultimate test of your legendary career, the amulet radiating with otherworldly power...'
        };
        
        const careerDescriptions = {
            'Common work': 'A merchant approaches you with an intriguing business opportunity.',
            'Military': 'Your commanding officer has given you a critical mission.',
            'The Arcane Association': 'The magical council has presented you with a complex problem.'
        };
        
        const baseDescription = baseDescriptions[amuletPrompt] || 'You face an important decision...';
        const careerDescription = careerDescriptions[careerCategory] || 'You must make a choice...';
        
        return `${baseDescription} ${careerDescription} Your career experience (weight: ${careerWeight}) will influence your options.`;
    }

    /**
     * Calculate success probability for a choice
     * @private
     */
    _calculateSuccessProbability(careerCategory, careerWeight, skills, depth) {
        // Base probability from career weight
        let probability = Math.min(0.95, Math.max(0.15, careerWeight / 100000));
        
        // Apply depth penalty
        probability *= Math.pow(0.9, depth);
        
        // Apply skill bonuses
        if (skills) {
            const skillBonus = this._calculateSkillBonus(skills, careerCategory);
            probability += skillBonus;
        }
        
        return Math.min(0.95, Math.max(0.15, probability));
    }

    /**
     * Calculate skill bonus for career category
     * @private
     */
    _calculateSkillBonus(skills, careerCategory) {
        let bonus = 0;
        
        const skillMappings = {
            'Common work': ['Charisma', 'Intelligence'],
            'Military': ['Strength', 'Concentration'],
            'The Arcane Association': ['Mana control', 'Intelligence']
        };
        
        const relevantSkills = skillMappings[careerCategory] || [];
        relevantSkills.forEach(skill => {
            if (skills[skill]) {
                bonus += skills[skill] * 0.001; // 0.1% per skill level
            }
        });
        
        return bonus;
    }

    /**
     * Get choice type from existing choice text
     * @private
     */
    _getChoiceTypeFromText(choiceText) {
        const text = choiceText.toLowerCase();
        
        if (text.includes('confront') || text.includes('assault') || text.includes('force')) {
            return 'aggressive';
        } else if (text.includes('negotiate') || text.includes('charm') || text.includes('persuade')) {
            return 'diplomatic';
        } else if (text.includes('examine') || text.includes('scout') || text.includes('analyze')) {
            return 'cautious';
        } else if (text.includes('propose') || text.includes('devise') || text.includes('invent')) {
            return 'creative';
        }
        
        return 'diplomatic'; // Default
    }

    /**
     * Update prompt statistics
     * @private
     */
    _updatePromptStats(amuletPrompt, careerCategory, prompt) {
        this.promptStats.totalPrompts++;
        
        // Update category stats
        this.promptStats.promptsByCategory[careerCategory] = 
            (this.promptStats.promptsByCategory[careerCategory] || 0) + 1;
        
        // Update amulet stats
        this.promptStats.promptsByAmulet[amuletPrompt] = 
            (this.promptStats.promptsByAmulet[amuletPrompt] || 0) + 1;
        
        // Update choice type distribution
        prompt.choices.forEach(choice => {
            this.promptStats.choiceTypeDistribution[choice.choiceType]++;
        });
    }

    /**
     * Validate a generated prompt
     * @param {Object} prompt - Prompt to validate
     * @returns {boolean} Is valid
     */
    validatePrompt(prompt) {
        if (!prompt || typeof prompt !== 'object') {
            return false;
        }
        
        if (!prompt.title || !prompt.description || !Array.isArray(prompt.choices)) {
            return false;
        }
        
        if (prompt.choices.length === 0) {
            return false;
        }
        
        return prompt.choices.every(choice => this.validateChoice(choice));
    }

    /**
     * Validate a choice
     * @param {Object} choice - Choice to validate
     * @returns {boolean} Is valid
     */
    validateChoice(choice) {
        if (!choice || typeof choice !== 'object') {
            return false;
        }
        
        if (!choice.text || !choice.choiceType || typeof choice.successProbability !== 'number') {
            return false;
        }
        
        if (choice.successProbability < 0 || choice.successProbability > 1) {
            return false;
        }
        
        const validChoiceTypes = ['aggressive', 'diplomatic', 'cautious', 'creative'];
        if (!validChoiceTypes.includes(choice.choiceType)) {
            return false;
        }
        
        return true;
    }

    /**
     * Get prompt generation statistics
     * @returns {Object} Statistics
     */
    getPromptStats() {
        return { ...this.promptStats };
    }

    /**
     * Clear prompt cache
     */
    clearCache() {
        this.promptCache.clear();
    }

    /**
     * Invalidate cache for specific amulet prompt and career category
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     */
    invalidateCache(amuletPrompt, careerCategory) {
        const keysToDelete = [];
        for (const key of this.promptCache.keys()) {
            if (key.startsWith(`${amuletPrompt}-${careerCategory}`)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.promptCache.delete(key));
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.CareerBasedPromptGenerator = CareerBasedPromptGenerator;
}
