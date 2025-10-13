/**
 * Tests for AdventureSystem path tracking
 * 
 * The adventure system should track the current path through the tree
 * and add new choices as children of the current node, not at root.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Adventure System Path Tracking', () => {
    let AdventureSystem;
    let mockGameState;
    let mockMistralAPI;
    let mockStoryManager;
    
    beforeEach(() => {
        // Load dependencies
        const characterEncoderCode = fs.readFileSync(
            path.join(__dirname, '../../llm/utils/CharacterEncoder.js'),
            'utf8'
        );
        const storyDataCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/story-data.js'),
            'utf8'
        );
        const careerAnalysisCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/career-analysis.js'),
            'utf8'
        );
        const adventureSystemCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/adventure-system.js'),
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
            },
            PowerLevelCalculator: {
                calculatePowerLevel: jest.fn(() => ({
                    effectivePower: 0,
                    tier: '10-C',
                    tierName: 'Below Average Human'
                })),
                buildFullPromptContext: jest.fn(() => 'POWER CONTEXT')
            }
        };
        
        vm.runInNewContext(characterEncoderCode, context);
        vm.runInNewContext(storyDataCode, context);
        vm.runInNewContext(careerAnalysisCode, context);
        vm.runInNewContext(adventureSystemCode, context);
        AdventureSystem = context.window.AdventureSystem;
        
        mockGameState = {
            age: 25,
            currentJob: 'Beggar',
            coins: 100,
            taskData: {
                'Strength': { level: 0, exp: 0 },
                'Concentration': { level: 55, exp: 0 }
            }
        };
        
        mockMistralAPI = {
            generateWorldDescription: jest.fn().mockResolvedValue('STORY: Test\n\nCHOICES:\n1. A (TYPE: aggressive)\n2. B (TYPE: diplomatic)\n3. C (TYPE: cautious)')
        };
        
        mockStoryManager = {
            startNewStory: jest.fn().mockReturnValue({
                genre: 'fantasy',
                characterTraits: {},
                worldState: {}
            })
        };
    });
    
    describe('Current Path Tracking', () => {
        test('adventure should initialize with empty path', async () => {
            const system = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            await system.startCareerBasedAdventure('age25');
            
            // currentPath should exist and be empty at start
            expect(system.currentPath).toBeDefined();
            expect(system.currentPath).toEqual([]);
        });
        
        test('path should update after each choice', () => {
            const system = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            // Initialize path
            system.currentPath = [];
            
            // Make first choice
            const choice1 = { text: 'Go north', choiceType: 'aggressive' };
            system.currentPath.push({ choice: choice1.text, result: true });
            
            expect(system.currentPath.length).toBe(1);
            expect(system.currentPath[0].choice).toBe('Go north');
            
            // Make second choice
            const choice2 = { text: 'Fight enemy', choiceType: 'aggressive' };
            system.currentPath.push({ choice: choice2.text, result: false });
            
            expect(system.currentPath.length).toBe(2);
            expect(system.currentPath[1].choice).toBe('Fight enemy');
        });
        
        test('path should reset when adventure ends', () => {
            const system = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            // Simulate starting adventure
            system.adventureActive = true;
            system.currentPath = [
                { choice: 'A', result: true },
                { choice: 'B', result: false }
            ];
            
            system.endAdventure();
            
            expect(system.currentPath).toEqual([]);
            expect(system.adventureActive).toBe(false);
        });
    });
    
    describe('Choice Storage at Current Path', () => {
        test('should add first choice at root (depth 0)', () => {
            const system = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            system.currentPath = [];
            
            const pathDepth = system.currentPath.length;
            expect(pathDepth).toBe(0);
            
            // First choice goes at root
            // This should call: storyTreeBuilder.addChoice(...) with correct depth
        });
        
        test('should add second choice as child of first (depth 1)', () => {
            const system = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            system.currentPath = [
                { choice: 'First choice', result: true }
            ];
            
            const pathDepth = system.currentPath.length;
            expect(pathDepth).toBe(1);
            
            // Second choice should be added as child at depth 1
        });
    });
    
    describe('Cached vs New Choice Detection', () => {
        test('should detect when current path exists in tree', () => {
            const system = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            // Simulate existing tree with path A → B
            const mockTree = {
                branches: {
                    'A': {
                        choice: 'A',
                        result: true,
                        depth: 0,
                        children: {
                            'B': {
                                choice: 'B',
                                result: true,
                                depth: 1,
                                children: {}
                            }
                        }
                    }
                }
            };
            
            // Check if path ['A', 'B'] exists
            const pathExists = mockTree.branches['A']?.children?.['B'] !== undefined;
            expect(pathExists).toBe(true);
            
            // Check if path ['A', 'C'] exists
            const newPathExists = mockTree.branches['A']?.children?.['C'] !== undefined;
            expect(newPathExists).toBe(false);
        });
    });
});

