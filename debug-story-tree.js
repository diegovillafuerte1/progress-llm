/**
 * Debug script to test story tree isolation
 */

import { StoryTreeManager } from './src/llm/StoryTreeManager.js';

// Mock localStorage
global.localStorage = {
    data: {},
    getItem: (key) => global.localStorage.data[key] || null,
    setItem: (key, value) => { global.localStorage.data[key] = value; },
    removeItem: (key) => { delete global.localStorage.data[key]; },
    clear: () => { global.localStorage.data = {}; }
};

const manager = new StoryTreeManager();

console.log('=== Testing Story Tree Isolation ===');

// Add choice to Common work
manager.lockChoice('age25', 'Common work', 'Option A', { success: true });
console.log('After adding Option A to Common work:');
console.log('Common work choices:', manager.getAvailableChoices('age25', 'Common work'));
console.log('Military choices:', manager.getAvailableChoices('age25', 'Military'));

// Add choice to Military
manager.lockChoice('age25', 'Military', 'Option B', { success: false });
console.log('After adding Option B to Military:');
console.log('Common work choices:', manager.getAvailableChoices('age25', 'Common work'));
console.log('Military choices:', manager.getAvailableChoices('age25', 'Military'));

// Check the internal structure
console.log('Internal story trees:');
console.log(JSON.stringify(manager.getStoryTrees(), null, 2));
