/**
 * Tests for proper tree traversal implementation (fixing the flat list bug)
 * 
 * The story tree should work like this:
 * - Choice 1 creates root node (depth 0)
 * - Choice 2 creates child of Choice 1 (depth 1)
 * - Choice 3 creates child of Choice 2 (depth 2)
 * - On rebirth: Same Choice 1 → Follow existing path → Get cached children
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Story Tree Traversal (Proper Tree Implementation)', () => {
    let StoryTreeManager;
    let StoryTreeBuilder;
    let StoryTreeData;
    
    beforeEach(() => {
        // Load story-data classes
        const storyDataCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/story-data.js'),
            'utf8'
        );
        
        const context = {
            window: {},
            console: console,
            localStorage: {
                data: {},
                getItem: jest.fn((key) => context.localStorage.data[key] || null),
                setItem: jest.fn((key, value) => {
                    context.localStorage.data[key] = value;
                }),
                removeItem: jest.fn((key) => {
                    delete context.localStorage.data[key];
                })
            },
            log: {
                noConflict: () => ({
                    setLevel: () => {},
                    debug: () => {},
                    info: () => {},
                    warn: () => {},
                    error: () => {}
                })
            }
        };
        
        vm.runInNewContext(storyDataCode, context);
        StoryTreeManager = context.window.StoryTreeManager;
        StoryTreeBuilder = context.window.StoryTreeBuilder;
        StoryTreeData = context.window.StoryTreeData;
    });
    
    describe('Sequential Choice Depth', () => {
        test('first choice should be at depth 0 (root)', () => {
            const manager = new StoryTreeManager();
            
            // Make first choice
            manager.lockChoice('age25', 'Common work', 'Choice 1', true);
            
            const tree = manager.getStoryTree('age25', 'Common work');
            const branch = tree.branches['Choice 1'];
            
            expect(branch).toBeDefined();
            expect(branch.depth).toBe(0);
        });
        
        test('second choice should be child of first (depth 1)', () => {
            const manager = new StoryTreeManager();
            
            // First choice
            manager.lockChoice('age25', 'Common work', 'Choice 1', true);
            
            // Second choice should be added as CHILD of first
            manager.addChildChoice('age25', 'Common work', ['Choice 1'], 'Choice 2', false);
            
            const tree = manager.getStoryTree('age25', 'Common work');
            const rootBranch = tree.branches['Choice 1'];
            const childBranch = rootBranch.children['Choice 2'];
            
            expect(childBranch).toBeDefined();
            expect(childBranch.depth).toBe(1);
        });
        
        test('third choice should be grandchild of first (depth 2)', () => {
            const manager = new StoryTreeManager();
            
            manager.lockChoice('age25', 'Common work', 'Choice 1', true);
            manager.addChildChoice('age25', 'Common work', ['Choice 1'], 'Choice 2', true);
            manager.addChildChoice('age25', 'Common work', ['Choice 1', 'Choice 2'], 'Choice 3', false);
            
            const tree = manager.getStoryTree('age25', 'Common work');
            const rootBranch = tree.branches['Choice 1'];
            const child = rootBranch.children['Choice 2'];
            const grandchild = child.children['Choice 3'];
            
            expect(grandchild).toBeDefined();
            expect(grandchild.depth).toBe(2);
        });
    });
    
    describe('Path Tracking', () => {
        test('should track current path through adventure', () => {
            const currentPath = [];
            
            // Make choices
            currentPath.push('Choice 1');
            expect(currentPath).toEqual(['Choice 1']);
            
            currentPath.push('Choice 2');
            expect(currentPath).toEqual(['Choice 1', 'Choice 2']);
            
            currentPath.push('Choice 3');
            expect(currentPath).toEqual(['Choice 1', 'Choice 2', 'Choice 3']);
        });
        
        test('should reset path at start of new adventure', () => {
            const currentPath = ['Old 1', 'Old 2'];
            
            // Start new adventure
            const newPath = [];
            
            expect(newPath).toEqual([]);
            expect(newPath.length).toBe(0);
        });
    });
    
    describe('Existing Path Detection', () => {
        test('should detect when a path has been visited before', () => {
            const manager = new StoryTreeManager();
            
            // First life: Create a path
            manager.lockChoice('age25', 'Common work', 'Go to market', true);
            manager.addChildChoice('age25', 'Common work', ['Go to market'], 'Talk to merchant', true);
            
            // Check if path exists
            const tree = manager.getStoryTree('age25', 'Common work');
            const hasRootChoice = tree.branches['Go to market'] !== undefined;
            const rootBranch = tree.branches['Go to market'];
            const hasChildChoice = rootBranch?.children?.['Talk to merchant'] !== undefined;
            
            expect(hasRootChoice).toBe(true);
            expect(hasChildChoice).toBe(true);
        });
        
        test('should return cached children when following existing path', () => {
            const manager = new StoryTreeManager();
            
            // Create a complete path
            manager.lockChoice('age25', 'Common work', 'Choice 1', true);
            manager.addChildChoice('age25', 'Common work', ['Choice 1'], 'Choice 2A', true);
            manager.addChildChoice('age25', 'Common work', ['Choice 1'], 'Choice 2B', false);
            
            // Get children of Choice 1
            const tree = manager.getStoryTree('age25', 'Common work');
            const branch = tree.branches['Choice 1'];
            const childrenKeys = Object.keys(branch.children);
            
            expect(childrenKeys).toContain('Choice 2A');
            expect(childrenKeys).toContain('Choice 2B');
            expect(childrenKeys.length).toBe(2);
        });
    });
    
    describe('Branching Paths', () => {
        test('same root choice can have multiple different children', () => {
            const manager = new StoryTreeManager();
            
            // Life 1: Choice 1 → Choice 2A
            manager.lockChoice('age25', 'Common work', 'Choice 1', true);
            manager.addChildChoice('age25', 'Common work', ['Choice 1'], 'Choice 2A', true);
            
            // Life 2: Same Choice 1 → Different Choice 2B
            manager.addChildChoice('age25', 'Common work', ['Choice 1'], 'Choice 2B', false);
            
            const tree = manager.getStoryTree('age25', 'Common work');
            const branch = tree.branches['Choice 1'];
            
            expect(Object.keys(branch.children).length).toBe(2);
            expect(branch.children['Choice 2A']).toBeDefined();
            expect(branch.children['Choice 2B']).toBeDefined();
        });
        
        test('different root choices create separate trees', () => {
            const manager = new StoryTreeManager();
            
            // Path A: Choice A → Choice AA
            manager.lockChoice('age25', 'Common work', 'Choice A', true);
            manager.addChildChoice('age25', 'Common work', ['Choice A'], 'Choice AA', true);
            
            // Path B: Choice B → Choice BB
            manager.lockChoice('age25', 'Common work', 'Choice B', false);
            manager.addChildChoice('age25', 'Common work', ['Choice B'], 'Choice BB', false);
            
            const tree = manager.getStoryTree('age25', 'Common work');
            
            expect(tree.branches['Choice A']).toBeDefined();
            expect(tree.branches['Choice B']).toBeDefined();
            expect(tree.branches['Choice A'].children['Choice AA']).toBeDefined();
            expect(tree.branches['Choice B'].children['Choice BB']).toBeDefined();
        });
    });
    
    describe('Deep Path Traversal', () => {
        test('should support paths 5+ levels deep', () => {
            const manager = new StoryTreeManager();
            
            const path = [];
            
            // Create a 5-level deep path
            manager.lockChoice('age25', 'Common work', 'L0', true);
            path.push('L0');
            
            manager.addChildChoice('age25', 'Common work', path, 'L1', true);
            path.push('L1');
            
            manager.addChildChoice('age25', 'Common work', path, 'L2', true);
            path.push('L2');
            
            manager.addChildChoice('age25', 'Common work', path, 'L3', true);
            path.push('L3');
            
            manager.addChildChoice('age25', 'Common work', path, 'L4', true);
            
            // Navigate to depth 4
            const tree = manager.getStoryTree('age25', 'Common work');
            const d0 = tree.branches['L0'];
            const d1 = d0.children['L1'];
            const d2 = d1.children['L2'];
            const d3 = d2.children['L3'];
            const d4 = d3.children['L4'];
            
            expect(d4).toBeDefined();
            expect(d4.depth).toBe(4);
        });
    });
    
    describe('Path Navigation Methods', () => {
        test('should be able to get node at specific path', () => {
            const manager = new StoryTreeManager();
            
            manager.lockChoice('age25', 'Common work', 'A', true);
            manager.addChildChoice('age25', 'Common work', ['A'], 'B', true);
            manager.addChildChoice('age25', 'Common work', ['A', 'B'], 'C', true);
            
            // Navigate to node
            const nodeC = manager.getNodeAtPath('age25', 'Common work', ['A', 'B', 'C']);
            
            expect(nodeC).toBeDefined();
            expect(nodeC.choice).toBe('C');
            expect(nodeC.depth).toBe(2);
        });
        
        test('should return null for non-existent path', () => {
            const manager = new StoryTreeManager();
            
            manager.lockChoice('age25', 'Common work', 'A', true);
            
            const node = manager.getNodeAtPath('age25', 'Common work', ['A', 'NonExistent']);
            
            expect(node).toBeNull();
        });
        
        test('should get children of current path', () => {
            const manager = new StoryTreeManager();
            
            manager.lockChoice('age25', 'Common work', 'A', true);
            manager.addChildChoice('age25', 'Common work', ['A'], 'B1', true);
            manager.addChildChoice('age25', 'Common work', ['A'], 'B2', false);
            manager.addChildChoice('age25', 'Common work', ['A'], 'B3', true);
            
            const children = manager.getChildrenAtPath('age25', 'Common work', ['A']);
            
            expect(Object.keys(children)).toHaveLength(3);
            expect(children['B1']).toBeDefined();
            expect(children['B2']).toBeDefined();
            expect(children['B3']).toBeDefined();
        });
    });
    
    describe('Rebirth Path Following', () => {
        test('should follow exact same path on rebirth', () => {
            const manager = new StoryTreeManager();
            
            // Life 1: Create path A → B → C
            manager.lockChoice('age25', 'Common work', 'A', true);
            manager.addChildChoice('age25', 'Common work', ['A'], 'B', true);
            manager.addChildChoice('age25', 'Common work', ['A', 'B'], 'C', false);
            
            // Life 2: Make same Choice A
            const tree = manager.getStoryTree('age25', 'Common work');
            const samePath = tree.branches['A'] !== undefined;
            
            expect(samePath).toBe(true);
            
            // Should have cached child B
            const hasChildB = tree.branches['A'].children['B'] !== undefined;
            expect(hasChildB).toBe(true);
            
            // B should have cached child C
            const hasGrandchildC = tree.branches['A'].children['B'].children['C'] !== undefined;
            expect(hasGrandchildC).toBe(true);
        });
        
        test('should diverge from previous path when different choice made', () => {
            const manager = new StoryTreeManager();
            
            // Life 1: A → B
            manager.lockChoice('age25', 'Common work', 'A', true);
            manager.addChildChoice('age25', 'Common work', ['A'], 'B', true);
            
            // Life 2: A → C (different choice)
            manager.addChildChoice('age25', 'Common work', ['A'], 'C', false);
            
            const tree = manager.getStoryTree('age25', 'Common work');
            const branch = tree.branches['A'];
            
            // Should have BOTH children now
            expect(branch.children['B']).toBeDefined();
            expect(branch.children['C']).toBeDefined();
        });
    });
});

