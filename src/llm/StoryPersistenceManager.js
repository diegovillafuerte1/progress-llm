/**
 * StoryPersistenceManager - Manages cross-life story persistence
 * Handles story tree inheritance and advanced storage features
 */

// Dependencies will be loaded via script tags

class StoryPersistenceManager {
    constructor(storyTreeManager, careerAnalyzer) {
        this.storyTreeManager = storyTreeManager;
        this.careerAnalyzer = careerAnalyzer;
        this.storageKey = 'storyPersistence';
        this.lifeStories = this.loadLifeStories();
    }

    /**
     * Load life stories from localStorage
     * @returns {Object} Life stories
     */
    loadLifeStories() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load life stories from localStorage:', error);
        }
        
        return {};
    }

    /**
     * Save life stories to localStorage
     */
    saveLifeStories() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.lifeStories));
        } catch (error) {
            console.warn('Failed to save life stories to localStorage:', error);
        }
    }

    /**
     * Save story for a specific life
     * @param {string} lifeId - Life identifier
     * @param {string} amuletPrompt - Amulet prompt
     * @param {string} careerCategory - Career category
     * @param {string} choice - Choice made
     * @param {Object} result - Choice result
     */
    saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result) {
        if (!this.lifeStories[lifeId]) {
            this.lifeStories[lifeId] = {};
        }
        
        if (!this.lifeStories[lifeId][amuletPrompt]) {
            this.lifeStories[lifeId][amuletPrompt] = {};
        }
        
        if (!this.lifeStories[lifeId][amuletPrompt][careerCategory]) {
            this.lifeStories[lifeId][amuletPrompt][careerCategory] = {
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
        
        const storyTree = this.lifeStories[lifeId][amuletPrompt][careerCategory];
        
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
        
        this.saveLifeStories();
    }

    /**
     * Get story for a specific life
     * @param {string} lifeId - Life identifier
     * @returns {Object} Life story
     */
    getLifeStory(lifeId) {
        return this.lifeStories[lifeId] || {};
    }

    /**
     * Get all previous life stories
     * @returns {Object} All life stories
     */
    getPreviousLifeStories() {
        return { ...this.lifeStories };
    }

    /**
     * Merge story trees from multiple lives
     * @param {Array} lifeIds - Array of life identifiers
     * @returns {Object} Merged story trees
     */
    mergeLifeStories(lifeIds) {
        const merged = {};
        
        for (const lifeId of lifeIds) {
            const lifeStory = this.lifeStories[lifeId];
            if (!lifeStory) continue;
            
            for (const [amuletPrompt, categories] of Object.entries(lifeStory)) {
                if (!merged[amuletPrompt]) {
                    merged[amuletPrompt] = {};
                }
                
                for (const [careerCategory, storyTree] of Object.entries(categories)) {
                    if (!merged[amuletPrompt][careerCategory]) {
                        merged[amuletPrompt][careerCategory] = {
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
                    
                    const mergedTree = merged[amuletPrompt][careerCategory];
                    
                    // Merge choices
                    for (const choice of storyTree.choices) {
                        if (!mergedTree.choices.includes(choice)) {
                            mergedTree.choices.push(choice);
                        }
                    }
                    
                    // Merge branches
                    Object.assign(mergedTree.branches, storyTree.branches);
                    
                    // Update metadata
                    mergedTree.metadata.totalChoices = mergedTree.choices.length;
                    mergedTree.metadata.successCount += storyTree.metadata.successCount;
                    mergedTree.metadata.failureCount += storyTree.metadata.failureCount;
                    mergedTree.metadata.lastModified = Date.now();
                }
            }
        }
        
        return merged;
    }

    /**
     * Inherit stories from a previous life
     * @param {string} lifeId - Previous life identifier
     * @returns {Object} Inherited stories
     */
    inheritStoriesFromLife(lifeId) {
        const previousLife = this.lifeStories[lifeId];
        if (!previousLife) return {};
        
        // Create a copy of the previous life's stories
        return JSON.parse(JSON.stringify(previousLife));
    }

    /**
     * Get story analytics across all lives
     * @returns {Object} Analytics
     */
    getStoryAnalytics() {
        const analytics = {
            totalLives: Object.keys(this.lifeStories).length,
            totalChoices: 0,
            successRate: 0,
            popularChoices: {},
            maxDepth: 0,
            choicesByCategory: {},
            choicesByPrompt: {}
        };
        
        let totalSuccesses = 0;
        let totalFailures = 0;
        
        for (const [lifeId, lifeStory] of Object.entries(this.lifeStories)) {
            for (const [amuletPrompt, categories] of Object.entries(lifeStory)) {
                if (!analytics.choicesByPrompt[amuletPrompt]) {
                    analytics.choicesByPrompt[amuletPrompt] = 0;
                }
                
                for (const [careerCategory, storyTree] of Object.entries(categories)) {
                    if (!analytics.choicesByCategory[careerCategory]) {
                        analytics.choicesByCategory[careerCategory] = 0;
                    }
                    
                    analytics.totalChoices += storyTree.choices.length;
                    analytics.choicesByPrompt[amuletPrompt] += storyTree.choices.length;
                    analytics.choicesByCategory[careerCategory] += storyTree.choices.length;
                    
                    totalSuccesses += storyTree.metadata.successCount;
                    totalFailures += storyTree.metadata.failureCount;
                    
                    // Track popular choices
                    for (const choice of storyTree.choices) {
                        analytics.popularChoices[choice] = (analytics.popularChoices[choice] || 0) + 1;
                    }
                    
                    // Track max depth
                    const depth = storyTree.metadata.maxDepth || 0;
                    if (depth > analytics.maxDepth) {
                        analytics.maxDepth = depth;
                    }
                }
            }
        }
        
        // Calculate success rate
        const totalChoices = totalSuccesses + totalFailures;
        if (totalChoices > 0) {
            analytics.successRate = totalSuccesses / totalChoices;
        }
        
        return analytics;
    }

    /**
     * Prune unused branches for a specific life
     * @param {string} lifeId - Life identifier
     */
    pruneUnusedBranches(lifeId) {
        const lifeStory = this.lifeStories[lifeId];
        if (!lifeStory) return;
        
        for (const [amuletPrompt, categories] of Object.entries(lifeStory)) {
            for (const [careerCategory, storyTree] of Object.entries(categories)) {
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
                
                // Update metadata
                storyTree.metadata.totalChoices = storyTree.choices.length;
                storyTree.metadata.lastModified = Date.now();
            }
        }
        
        this.saveLifeStories();
    }

    /**
     * Optimize story tree for a specific life
     * @param {string} lifeId - Life identifier
     */
    optimizeStoryTree(lifeId) {
        this.pruneUnusedBranches(lifeId);
        
        // Additional optimization logic can be added here
        const lifeStory = this.lifeStories[lifeId];
        if (lifeStory) {
            for (const [amuletPrompt, categories] of Object.entries(lifeStory)) {
                for (const [careerCategory, storyTree] of Object.entries(categories)) {
                    storyTree.metadata.lastModified = Date.now();
                }
            }
        }
        
        this.saveLifeStories();
    }

    /**
     * Export story trees for a specific life
     * @param {string} lifeId - Life identifier
     * @returns {Object} Exported data
     */
    exportStoryTrees(lifeId) {
        const lifeStory = this.lifeStories[lifeId];
        if (!lifeStory) return null;
        
        return {
            version: '1.0',
            lifeId: lifeId,
            timestamp: Date.now(),
            data: lifeStory
        };
    }

    /**
     * Import story trees
     * @param {Object} exportedData - Exported data
     * @returns {boolean} Success
     */
    importStoryTrees(exportedData) {
        try {
            if (!exportedData || !exportedData.data || !exportedData.lifeId) {
                return false;
            }
            
            if (exportedData.version !== '1.0') {
                throw new Error('Unsupported story tree version');
            }
            
            this.lifeStories[exportedData.lifeId] = exportedData.data;
            this.saveLifeStories();
            return true;
        } catch (error) {
            console.warn('Failed to import story trees:', error);
            return false;
        }
    }

    /**
     * Create backup of all story trees
     * @returns {Object} Backup data
     */
    createBackup() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            lives: { ...this.lifeStories }
        };
    }

    /**
     * Restore from backup
     * @param {Object} backup - Backup data
     * @returns {boolean} Success
     */
    restoreFromBackup(backup) {
        try {
            if (!backup || !backup.lives || backup.version !== '1.0') {
                return false;
            }
            
            this.lifeStories = { ...backup.lives };
            this.saveLifeStories();
            return true;
        } catch (error) {
            console.warn('Failed to restore from backup:', error);
            return false;
        }
    }

    /**
     * Clear all story trees
     */
    clearAllStories() {
        this.lifeStories = {};
        this.saveLifeStories();
    }

    /**
     * Clear story for a specific life
     * @param {string} lifeId - Life identifier
     */
    clearLifeStory(lifeId) {
        if (this.lifeStories[lifeId]) {
            delete this.lifeStories[lifeId];
            this.saveLifeStories();
        }
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StoryPersistenceManager = StoryPersistenceManager;
}
