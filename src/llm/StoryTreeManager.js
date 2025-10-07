/**
 * StoryTreeManager - Manages persistent story trees and choice locking
 * Handles localStorage persistence and cross-life story continuity
 */

// Dependencies will be loaded via script tags

class StoryTreeManager {
    constructor() {
        this.storageKey = 'storyTrees';
        this.storyTrees = this.loadStoryTrees();
    }

    /**
     * Load story trees from localStorage
     * @returns {Object} Story trees
     */
    loadStoryTrees() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return this.mergeWithDefaults(parsed);
            }
        } catch (error) {
            console.warn('Failed to load story trees from localStorage:', error);
        }
        
        return StoryTreeData.createEmptyStoryTrees();
    }

    /**
     * Merge stored data with default structure
     * @param {Object} stored - Stored data
     * @returns {Object} Merged story trees
     */
    mergeWithDefaults(stored) {
        const defaults = StoryTreeData.createEmptyStoryTrees();
        const merged = { ...defaults };
        
        for (const [prompt, categories] of Object.entries(stored)) {
            if (defaults[prompt] !== undefined) {
                merged[prompt] = { ...defaults[prompt], ...categories };
            }
        }
        
        return merged;
    }

    /**
     * Save story trees to localStorage
     */
    saveStoryTrees() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.storyTrees));
        } catch (error) {
            console.warn('Failed to save story trees to localStorage:', error);
        }
    }

    /**
     * Get all story trees
     * @returns {Object} Story trees
     */
    getStoryTrees() {
        return this.storyTrees;
    }

    /**
     * Get story tree for specific amulet prompt and career category
     * @param {string} amuletPrompt - Amulet prompt (age25, age45, etc.)
     * @param {string} careerCategory - Career category
     * @returns {Object} Story tree
     */
    getStoryTree(amuletPrompt, careerCategory) {
        if (!this.storyTrees[amuletPrompt]) {
            this.storyTrees[amuletPrompt] = {};
        }
        
        if (!this.storyTrees[amuletPrompt][careerCategory]) {
            this.storyTrees[amuletPrompt][careerCategory] = StoryTreeData.createEmptyStoryTree();
        }
        
        return this.storyTrees[amuletPrompt][careerCategory];
    }

    /**
     * Lock in a choice permanently
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @param {string} choice - Choice made
     * @param {Object} result - Choice result
     */
    lockChoice(amuletPrompt, careerCategory, choice, result) {
        const storyTree = this.getStoryTree(amuletPrompt, careerCategory);
        
        // Add choice if not already present
        if (!storyTree.choices.includes(choice)) {
            storyTree.choices.push(choice);
        }
        
        // Store choice result
        storyTree.branches[choice] = {
            ...result,
            timestamp: Date.now()
        };
        
        // Update metadata
        storyTree.metadata.lastModified = Date.now();
        storyTree.metadata.totalChoices = storyTree.choices.length;
        
        if (result.success) {
            storyTree.metadata.successCount++;
        } else {
            storyTree.metadata.failureCount++;
        }
        
        this.saveStoryTrees();
    }

    /**
     * Get available choices for career category
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @returns {Array} Available choices
     */
    getAvailableChoices(amuletPrompt, careerCategory) {
        const storyTree = this.getStoryTree(amuletPrompt, careerCategory);
        return [...storyTree.choices];
    }

    /**
     * Get choice result
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @param {string} choice - Choice
     * @returns {Object|null} Choice result
     */
    getChoiceResult(amuletPrompt, careerCategory, choice) {
        const storyTree = this.getStoryTree(amuletPrompt, careerCategory);
        return storyTree.branches[choice] || null;
    }

    /**
     * Check if choice exists
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @param {string} choice - Choice
     * @returns {boolean} Choice exists
     */
    hasChoice(amuletPrompt, careerCategory, choice) {
        const storyTree = this.getStoryTree(amuletPrompt, careerCategory);
        return storyTree.choices.includes(choice);
    }

    /**
     * Get story tree statistics
     * @returns {Object} Statistics
     */
    getStoryTreeStats() {
        const stats = {
            totalChoices: 0,
            choicesByPrompt: {},
            choicesByCategory: {},
            successRate: 0,
            totalSuccesses: 0,
            totalFailures: 0
        };
        
        for (const [prompt, categories] of Object.entries(this.storyTrees)) {
            stats.choicesByPrompt[prompt] = 0;
            
            for (const [category, storyTree] of Object.entries(categories)) {
                if (!stats.choicesByCategory[category]) {
                    stats.choicesByCategory[category] = 0;
                }
                
                const treeStats = StoryTreeData.getStoryTreeStats(storyTree);
                if (treeStats) {
                    stats.totalChoices += treeStats.totalChoices;
                    stats.choicesByPrompt[prompt] += treeStats.totalChoices;
                    stats.choicesByCategory[category] += treeStats.totalChoices;
                    stats.totalSuccesses += treeStats.successCount;
                    stats.totalFailures += treeStats.failureCount;
                }
            }
        }
        
        const totalChoices = stats.totalSuccesses + stats.totalFailures;
        if (totalChoices > 0) {
            stats.successRate = stats.totalSuccesses / totalChoices;
        }
        
        return stats;
    }

    /**
     * Validate story tree structure
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @returns {boolean} Is valid
     */
    validateStoryTree(amuletPrompt, careerCategory) {
        const storyTree = this.getStoryTree(amuletPrompt, careerCategory);
        return StoryTreeData.validateStoryTree(storyTree);
    }

    /**
     * Clear all story trees
     */
    clearAllStoryTrees() {
        this.storyTrees = StoryTreeData.createEmptyStoryTrees();
        this.saveStoryTrees();
    }

    /**
     * Clear specific amulet prompt
     * @param {string} amuletPrompt - Amulet prompt
     */
    clearStoryTree(amuletPrompt) {
        if (this.storyTrees[amuletPrompt]) {
            this.storyTrees[amuletPrompt] = {};
            this.saveStoryTrees();
        }
    }

    /**
     * Clear specific career category
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     */
    clearCareerCategory(amuletPrompt, careerCategory) {
        if (this.storyTrees[amuletPrompt] && this.storyTrees[amuletPrompt][careerCategory]) {
            delete this.storyTrees[amuletPrompt][careerCategory];
            this.saveStoryTrees();
        }
    }

    /**
     * Export story trees
     * @returns {Object} Exported data
     */
    exportStoryTrees() {
        return StoryTreeData.exportStoryTree(this.storyTrees);
    }

    /**
     * Import story trees
     * @param {Object} exportedData - Exported data
     */
    importStoryTrees(exportedData) {
        try {
            const imported = StoryTreeData.importStoryTree(exportedData);
            if (imported) {
                this.storyTrees = this.mergeWithDefaults(imported);
                this.saveStoryTrees();
                return true;
            }
        } catch (error) {
            console.warn('Failed to import story trees:', error);
        }
        
        return false;
    }

    /**
     * Prune story trees to reduce size
     * @param {number} maxDepth - Maximum depth to keep
     */
    pruneStoryTrees(maxDepth = 10) {
        for (const [prompt, categories] of Object.entries(this.storyTrees)) {
            for (const [category, storyTree] of Object.entries(categories)) {
                this.storyTrees[prompt][category] = StoryTreeData.pruneStoryTree(storyTree, maxDepth);
            }
        }
        
        this.saveStoryTrees();
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StoryTreeManager = StoryTreeManager;
}
