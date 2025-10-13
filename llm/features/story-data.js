/**
 * Story Data - Unified story tree management
 * Consolidates: StoryTreeManager, StoryTreeData, StoryTreeBuilder, StoryPersistenceManager
 * 
 * Handles:
 * - Story tree data structures
 * - Tree persistence to localStorage
 * - Tree building and branching logic
 * - Choice tracking and locking
 */

// ============= DATA STRUCTURES =============

class StoryTreeData {
    static createEmptyStoryTree() {
        return {
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

    static createEmptyStoryTrees() {
        return {
            age25: {},
            age45: {},
            age65: {},
            age200: {}
        };
    }

    static createStoryBranch(choice, result, depth = 0, powerLevel = null) {
        const branch = {
            choice: choice,
            result: result,
            timestamp: Date.now(),
            depth: depth,
            children: {}
        };
        
        // Add power level metadata if provided
        if (powerLevel !== null && typeof powerLevel === 'object') {
            branch.powerLevel = powerLevel.effectivePower || 0;
            branch.powerTier = powerLevel.tier || '10-C';
            branch.powerTierName = powerLevel.tierName || 'Below Average Human';
        }
        
        return branch;
    }

    static validateStoryTree(tree) {
        if (!tree || typeof tree !== 'object') {
            return { valid: false, errors: ['Invalid tree structure'] };
        }

        const errors = [];
        
        if (!Array.isArray(tree.choices)) {
            errors.push('Missing or invalid choices array');
        }
        
        if (!tree.branches || typeof tree.branches !== 'object') {
            errors.push('Missing or invalid branches object');
        }
        
        if (!tree.metadata || typeof tree.metadata !== 'object') {
            errors.push('Missing or invalid metadata');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    static getStoryTreeStats(tree) {
        if (!tree) return null;

        const stats = {
            totalChoices: tree.choices?.length || 0,
            successCount: tree.metadata?.successCount || 0,
            failureCount: tree.metadata?.failureCount || 0,
            successRate: 0,
            depth: 0,
            branchCount: Object.keys(tree.branches || {}).length
        };

        const total = stats.successCount + stats.failureCount;
        if (total > 0) {
            stats.successRate = (stats.successCount / total) * 100;
        }

        // Calculate max depth
        const calculateDepth = (branches, currentDepth = 0) => {
            let maxDepth = currentDepth;
            for (const branch of Object.values(branches)) {
                if (branch.children && Object.keys(branch.children).length > 0) {
                    const branchDepth = calculateDepth(branch.children, currentDepth + 1);
                    maxDepth = Math.max(maxDepth, branchDepth);
                }
            }
            return maxDepth;
        };

        stats.depth = calculateDepth(tree.branches || {});

        return stats;
    }
}

// ============= MANAGER =============

class StoryTreeManager {
    constructor() {
        this.storageKey = 'storyTrees';
        this.storyTrees = this.loadStoryTrees();
    }

    loadStoryTrees() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return this.mergeWithDefaults(parsed);
            }
        } catch (error) {
            console.warn('Failed to load story trees:', error);
        }
        return StoryTreeData.createEmptyStoryTrees();
    }

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

    saveStoryTrees() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.storyTrees));
        } catch (error) {
            console.error('Failed to save story trees:', error);
        }
    }

    getStoryTree(amuletPrompt, careerCategory) {
        if (!this.storyTrees[amuletPrompt]) {
            this.storyTrees[amuletPrompt] = {};
        }
        if (!this.storyTrees[amuletPrompt][careerCategory]) {
            this.storyTrees[amuletPrompt][careerCategory] = StoryTreeData.createEmptyStoryTree();
        }
        return this.storyTrees[amuletPrompt][careerCategory];
    }

    saveStoryTree(amuletPrompt, careerCategory, tree) {
        if (!this.storyTrees[amuletPrompt]) {
            this.storyTrees[amuletPrompt] = {};
        }
        tree.metadata.lastModified = Date.now();
        this.storyTrees[amuletPrompt][careerCategory] = tree;
        this.saveStoryTrees();
    }

    lockChoice(amuletPrompt, careerCategory, choice, result, powerLevel = null) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        
        // Only increment counts if this is a new choice at root level
        const isNewChoice = !tree.choices.includes(choice);
        
        if (isNewChoice) {
            tree.choices.push(choice);
            tree.metadata.totalChoices++;
            
            if (result) {
                tree.metadata.successCount++;
            } else {
                tree.metadata.failureCount++;
            }
        }
        
        // Create root-level branch (depth 0)
        tree.branches[choice] = StoryTreeData.createStoryBranch(choice, result, 0, powerLevel);
        
        this.saveStoryTree(amuletPrompt, careerCategory, tree);
    }
    
    addChildChoice(amuletPrompt, careerCategory, path, choice, result, powerLevel = null) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        
        // Navigate to parent node
        let currentNode = null;
        let depth = 0;
        
        if (path.length === 0) {
            // Adding at root - shouldn't happen via this method
            console.warn('addChildChoice called with empty path, use lockChoice for root');
            return;
        }
        
        // Navigate to the node at the end of path
        currentNode = tree.branches[path[0]];
        depth = 1;
        
        for (let i = 1; i < path.length; i++) {
            if (!currentNode || !currentNode.children) {
                console.error('Path does not exist:', path.slice(0, i + 1));
                return;
            }
            currentNode = currentNode.children[path[i]];
            depth++;
        }
        
        if (!currentNode) {
            console.error('Could not find parent node at path:', path);
            return;
        }
        
        // Add choice as child of current node
        if (!currentNode.children) {
            currentNode.children = {};
        }
        
        currentNode.children[choice] = StoryTreeData.createStoryBranch(choice, result, depth, powerLevel);
        
        // Update metadata
        tree.metadata.lastModified = Date.now();
        tree.metadata.totalChoices++;
        if (result) {
            tree.metadata.successCount++;
        } else {
            tree.metadata.failureCount++;
        }
        
        this.saveStoryTree(amuletPrompt, careerCategory, tree);
    }
    
    getNodeAtPath(amuletPrompt, careerCategory, path) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        
        if (!path || path.length === 0) {
            return null;
        }
        
        let currentNode = tree.branches[path[0]];
        if (!currentNode) return null;
        
        for (let i = 1; i < path.length; i++) {
            if (!currentNode || !currentNode.children) {
                return null;
            }
            currentNode = currentNode.children[path[i]];
            if (!currentNode) return null;
        }
        
        return currentNode || null;
    }
    
    getChildrenAtPath(amuletPrompt, careerCategory, path) {
        if (!path || path.length === 0) {
            // Return root level branches
            const tree = this.getStoryTree(amuletPrompt, careerCategory);
            return tree.branches;
        }
        
        const node = this.getNodeAtPath(amuletPrompt, careerCategory, path);
        return node?.children || {};
    }

    getAvailableChoices(amuletPrompt, careerCategory) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        return tree.choices;
    }

    hasChoice(amuletPrompt, careerCategory, choice) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        return tree.choices.includes(choice);
    }

    getChoiceResult(amuletPrompt, careerCategory, choice) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        return tree.branches[choice]?.result;
    }

    clearAllStoryTrees() {
        this.storyTrees = StoryTreeData.createEmptyStoryTrees();
        this.saveStoryTrees();
    }

    clearStoryTree(amuletPrompt) {
        if (this.storyTrees[amuletPrompt]) {
            this.storyTrees[amuletPrompt] = {};
            this.saveStoryTrees();
        }
    }

    clearCareerCategory(amuletPrompt, careerCategory) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        tree.choices = [];
        tree.branches = {};
        tree.metadata = {
            created: Date.now(),
            lastModified: Date.now(),
            totalChoices: 0,
            successCount: 0,
            failureCount: 0
        };
        this.saveStoryTree(amuletPrompt, careerCategory, tree);
    }

    getStoryTreeStats(amuletPrompt, careerCategory) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        return StoryTreeData.getStoryTreeStats(tree);
    }

    validateStoryTree(amuletPrompt, careerCategory) {
        const tree = this.getStoryTree(amuletPrompt, careerCategory);
        return StoryTreeData.validateStoryTree(tree);
    }
}

// ============= BUILDER =============

class StoryTreeBuilder {
    constructor(storyTreeManager, careerAnalyzer) {
        this.storyTreeManager = storyTreeManager;
        this.careerAnalyzer = careerAnalyzer;
    }

    addChoice(amuletPrompt, careerCategory, choice, result, powerLevel = null) {
        this.storyTreeManager.lockChoice(amuletPrompt, careerCategory, choice, result, powerLevel);
    }

    generateNewBranches(amuletPrompt, careerCategory, choice, result) {
        const tree = this.storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
        
        if (!tree.branches[choice]) {
            tree.branches[choice] = StoryTreeData.createStoryBranch(choice, result);
        }
        
        const branch = tree.branches[choice];
        const depth = branch.depth || 0;
        
        // Generate potential follow-up choices based on result
        const followUpChoices = this.generateFollowUpChoices(choice, result, depth);
        
        for (const followUp of followUpChoices) {
            if (!branch.children[followUp.text]) {
                branch.children[followUp.text] = StoryTreeData.createStoryBranch(
                    followUp.text,
                    null,
                    depth + 1
                );
            }
        }
        
        this.storyTreeManager.saveStoryTree(amuletPrompt, careerCategory, tree);
        
        return followUpChoices;
    }

    generateFollowUpChoices(previousChoice, wasSuccess, depth) {
        const baseChoices = [
            {
                text: "Continue forward",
                choiceType: "cautious",
                successProbability: 0.6
            },
            {
                text: "Change approach",
                choiceType: "creative",
                successProbability: 0.5
            },
            {
                text: "Reflect and plan",
                choiceType: "diplomatic",
                successProbability: 0.55
            }
        ];

        return baseChoices;
    }

    getTreeDepth(amuletPrompt, careerCategory) {
        const stats = this.storyTreeManager.getStoryTreeStats(amuletPrompt, careerCategory);
        return stats?.depth || 0;
    }

    pruneTree(amuletPrompt, careerCategory, maxDepth = 10) {
        const tree = this.storyTreeManager.getStoryTree(amuletPrompt, careerCategory);
        
        const pruneRecursive = (branches, currentDepth) => {
            const pruned = {};
            for (const [choice, branch] of Object.entries(branches)) {
                if (currentDepth < maxDepth) {
                    pruned[choice] = {
                        ...branch,
                        children: branch.children ? pruneRecursive(branch.children, currentDepth + 1) : {}
                    };
                }
            }
            return pruned;
        };

        tree.branches = pruneRecursive(tree.branches, 0);
        this.storyTreeManager.saveStoryTree(amuletPrompt, careerCategory, tree);
    }
}

// ============= PERSISTENCE =============

class StoryPersistenceManager {
    constructor(storyTreeManager) {
        this.storyTreeManager = storyTreeManager;
        this.lifeStorageKey = 'lifeStories';
    }

    saveLifeStory(lifeId, amuletPrompt, careerCategory, choice, result) {
        const lifeStories = this.loadLifeStories();
        
        if (!lifeStories[lifeId]) {
            lifeStories[lifeId] = {
                id: lifeId,
                started: Date.now(),
                adventures: []
            };
        }
        
        lifeStories[lifeId].adventures.push({
            amuletPrompt: amuletPrompt,
            careerCategory: careerCategory,
            choice: choice,
            result: result,
            timestamp: Date.now()
        });
        
        try {
            localStorage.setItem(this.lifeStorageKey, JSON.stringify(lifeStories));
        } catch (error) {
            console.error('Failed to save life story:', error);
        }
    }

    loadLifeStories() {
        try {
            const stored = localStorage.getItem(this.lifeStorageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load life stories:', error);
            return {};
        }
    }

    getLifeStory(lifeId) {
        const stories = this.loadLifeStories();
        return stories[lifeId] || null;
    }

    clearLifeStories() {
        try {
            localStorage.removeItem(this.lifeStorageKey);
        } catch (error) {
            console.error('Failed to clear life stories:', error);
        }
    }
}

// Export for browser and tests
if (typeof window !== 'undefined') {
    window.StoryTreeData = StoryTreeData;
    window.StoryTreeManager = StoryTreeManager;
    window.StoryTreeBuilder = StoryTreeBuilder;
    window.StoryPersistenceManager = StoryPersistenceManager;
}
