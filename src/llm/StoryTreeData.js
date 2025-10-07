/**
 * StoryTreeData - Defines data structures for persistent story trees
 * Handles the tree structure for each amulet prompt and career category
 */

// Dependencies will be loaded via script tags

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

    static createChoiceResult(success, nextChoices = [], narrative = '') {
        return {
            success: success,
            nextChoices: nextChoices,
            narrative: narrative,
            timestamp: Date.now(),
            depth: 0
        };
    }

    static createStoryBranch(choice, result, depth = 0) {
        return {
            choice: choice,
            result: result,
            depth: depth,
            timestamp: Date.now(),
            children: {}
        };
    }

    static validateStoryTree(storyTree) {
        if (!storyTree || typeof storyTree !== 'object') {
            return false;
        }

        // Check required properties
        if (!Array.isArray(storyTree.choices)) {
            return false;
        }

        if (!storyTree.branches || typeof storyTree.branches !== 'object') {
            return false;
        }

        // Check that all choices have corresponding branches
        for (const choice of storyTree.choices) {
            if (!storyTree.branches[choice]) {
                return false;
            }
        }

        return true;
    }

    static getStoryTreeStats(storyTree) {
        if (!this.validateStoryTree(storyTree)) {
            return null;
        }

        const stats = {
            totalChoices: storyTree.choices.length,
            successCount: 0,
            failureCount: 0,
            averageDepth: 0,
            maxDepth: 0,
            choiceTypes: {}
        };

        for (const [choice, result] of Object.entries(storyTree.branches)) {
            if (result.success) {
                stats.successCount++;
            } else {
                stats.failureCount++;
            }

            if (result.depth > stats.maxDepth) {
                stats.maxDepth = result.depth;
            }

            stats.averageDepth += result.depth;
        }

        if (stats.totalChoices > 0) {
            stats.averageDepth = stats.averageDepth / stats.totalChoices;
        }

        return stats;
    }

    static mergeStoryTrees(existingTree, newTree) {
        if (!existingTree) {
            return newTree;
        }

        if (!newTree) {
            return existingTree;
        }

        const merged = {
            choices: [...new Set([...existingTree.choices, ...newTree.choices])],
            branches: { ...existingTree.branches, ...newTree.branches },
            metadata: {
                ...existingTree.metadata,
                ...newTree.metadata,
                lastModified: Date.now()
            }
        };

        return merged;
    }

    static pruneStoryTree(storyTree, maxDepth = 10) {
        if (!this.validateStoryTree(storyTree)) {
            return storyTree;
        }

        const pruned = {
            choices: [...storyTree.choices],
            branches: {},
            metadata: { ...storyTree.metadata }
        };

        for (const [choice, result] of Object.entries(storyTree.branches)) {
            if (result.depth <= maxDepth) {
                pruned.branches[choice] = result;
            }
        }

        return pruned;
    }

    static exportStoryTree(storyTree) {
        return {
            version: '1.0',
            timestamp: Date.now(),
            data: storyTree
        };
    }

    static importStoryTree(exportedData) {
        if (!exportedData || !exportedData.data) {
            return null;
        }

        if (exportedData.version !== '1.0') {
            throw new Error('Unsupported story tree version');
        }

        return exportedData.data;
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.StoryTreeData = StoryTreeData;
}
