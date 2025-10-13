/**
 * Tests for WorldRules integration with AdventureSystem
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('WorldRules Integration', () => {
    let WorldRules;
    let AdventureSystem;
    let mockGameState;
    let mockMistralAPI;
    let mockStoryManager;
    
    beforeEach(() => {
        // Load WorldRules class
        const worldRulesCode = fs.readFileSync(
            path.join(__dirname, '../../llm/utils/WorldRules.js'),
            'utf8'
        );
        
        const context = {
            window: {},
            console: console,
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
        
        vm.runInNewContext(worldRulesCode, context);
        WorldRules = context.window.WorldRules;
        
        // Load adventure-system (simplified for testing)
        const adventureSystemCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/adventure-system.js'),
            'utf8'
        );
        
        // Load dependencies
        const characterEncoderCode = fs.readFileSync(
            path.join(__dirname, '../../llm/utils/CharacterEncoder.js'),
            'utf8'
        );
        const careerAnalysisCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/career-analysis.js'),
            'utf8'
        );
        const storyDataCode = fs.readFileSync(
            path.join(__dirname, '../../llm/features/story-data.js'),
            'utf8'
        );
        
        const adventureContext = {
            window: {},
            console: console,
            localStorage: {
                getItem: jest.fn(() => null),
                setItem: jest.fn(),
                removeItem: jest.fn()
            },
            log: context.log,
            WorldRules: WorldRules,
            PowerLevelCalculator: {
                calculatePowerLevel: jest.fn(() => ({
                    effectivePower: 0,
                    tier: '10-C',
                    tierName: 'Below Average Human'
                })),
                buildFullPromptContext: jest.fn(() => 'POWER CONTEXT')
            }
        };
        
        vm.runInNewContext(characterEncoderCode, adventureContext);
        vm.runInNewContext(careerAnalysisCode, adventureContext);
        vm.runInNewContext(storyDataCode, adventureContext);
        vm.runInNewContext(adventureSystemCode, adventureContext);
        AdventureSystem = adventureContext.window.AdventureSystem;
        
        // Mock dependencies
        mockGameState = {
            age: 70,
            currentJob: 'Beggar',
            coins: 100,
            taskData: {
                'Strength': { level: 10, exp: 0 },
                'Concentration': { level: 55, exp: 0 }
            }
        };
        
        mockMistralAPI = {
            generateWorldDescription: jest.fn().mockResolvedValue('STORY: Test story\n\nCHOICES:\n1. Choice 1 (TYPE: aggressive)\n2. Choice 2 (TYPE: diplomatic)\n3. Choice 3 (TYPE: cautious)')
        };
        
        mockStoryManager = {
            startNewStory: jest.fn().mockReturnValue({
                genre: 'fantasy',
                characterTraits: {},
                worldState: {}
            })
        };
    });
    
    describe('WorldRules Class', () => {
        test('should initialize with default rules', () => {
            const rules = new WorldRules();
            expect(rules).toBeDefined();
            expect(typeof rules.getCombatRules).toBe('function');
            expect(typeof rules.getMagicRules).toBe('function');
        });
        
        test('getCombatRules should return combat rules object', () => {
            const rules = new WorldRules();
            const combatRules = rules.getCombatRules();
            
            expect(combatRules).toBeDefined();
            expect(combatRules.requiresWeapon).toBeDefined();
            expect(combatRules.skillRequired).toBeDefined();
        });
        
        test('getMagicRules should return magic rules object', () => {
            const rules = new WorldRules();
            const magicRules = rules.getMagicRules();
            
            expect(magicRules).toBeDefined();
            expect(magicRules.requiresMana).toBeDefined();
            expect(magicRules.skillRequired).toBeDefined();
        });
        
        test('should format rules as text for prompts', () => {
            const rules = new WorldRules();
            const combatRules = rules.getCombatRules();
            
            // Should be able to serialize for prompts
            expect(typeof combatRules).toBe('object');
            expect(JSON.stringify(combatRules)).toBeDefined();
        });
    });
    
    describe('AdventureSystem with WorldRules', () => {
        test('should include WorldRules in continuation prompts when available', async () => {
            const adventureSystem = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            // Set up adventure state
            adventureSystem.currentAdventure = {
                amuletPrompt: 'age25',
                careerCategory: 'Military',
                initialStory: 'Test story',
                prompt: { choices: [] }
            };
            adventureSystem.adventureActive = true;
            
            // Make a choice to trigger LLM generation
            const choice = {
                text: 'Attack the enemy',
                choiceType: 'aggressive'
            };
            
            // Call the method that generates LLM responses
            await adventureSystem.generateStoryContinuation(choice, true);
            
            // Check that the prompt included world rules  
            expect(mockMistralAPI.generateWorldDescription).toHaveBeenCalled();
            const promptUsed = mockMistralAPI.generateWorldDescription.mock.calls[0][1];
            expect(promptUsed).toContain('GAME WORLD RULES');
        });
        
        test('should include combat rules for Military career', async () => {
            const adventureSystem = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            adventureSystem.currentAdventure = {
                amuletPrompt: 'age25',
                careerCategory: 'Military',
                initialStory: 'Test story'
            };
            adventureSystem.adventureActive = true;
            
            const choice = {
                text: 'Fight',
                choiceType: 'aggressive'
            };
            
            await adventureSystem.generateStoryContinuation(choice, true);
            
            expect(mockMistralAPI.generateWorldDescription).toHaveBeenCalled();
            const promptUsed = mockMistralAPI.generateWorldDescription.mock.calls[0][1];
            // Should mention combat-related rules
            expect(promptUsed.toLowerCase()).toMatch(/combat|weapon|strength/);
        });
        
        test('should include magic rules for Arcane career', async () => {
            const adventureSystem = new AdventureSystem(mockGameState, mockMistralAPI, mockStoryManager);
            
            adventureSystem.currentAdventure = {
                amuletPrompt: 'age25',
                careerCategory: 'The Arcane',
                initialStory: 'Test story'
            };
            adventureSystem.adventureActive = true;
            
            const choice = {
                text: 'Cast spell',
                choiceType: 'creative'
            };
            
            await adventureSystem.generateStoryContinuation(choice, true);
            
            expect(mockMistralAPI.generateWorldDescription).toHaveBeenCalled();
            const promptUsed = mockMistralAPI.generateWorldDescription.mock.calls[0][1];
            // Should mention magic-related rules
            expect(promptUsed.toLowerCase()).toMatch(/magic|mana|spell/);
        });
        
        test('should work without WorldRules if not available', async () => {
            // Create adventure system without WorldRules in context
            const contextWithoutRules = {
                window: {},
                console: console,
                localStorage: {
                    getItem: jest.fn(() => null),
                    setItem: jest.fn()
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
                // No WorldRules here
            };
            
            const adventureSystemCode = fs.readFileSync(
                path.join(__dirname, '../../llm/features/adventure-system.js'),
                'utf8'
            );
            const careerAnalysisCode = fs.readFileSync(
                path.join(__dirname, '../../llm/features/career-analysis.js'),
                'utf8'
            );
            const storyDataCode = fs.readFileSync(
                path.join(__dirname, '../../llm/features/story-data.js'),
                'utf8'
            );
            
            vm.runInNewContext(careerAnalysisCode, contextWithoutRules);
            vm.runInNewContext(storyDataCode, contextWithoutRules);
            vm.runInNewContext(adventureSystemCode, contextWithoutRules);
            const AdventureSystemNoRules = contextWithoutRules.window.AdventureSystem;
            
            const adventureSystem = new AdventureSystemNoRules(mockGameState, mockMistralAPI, mockStoryManager);
            
            adventureSystem.currentAdventure = {
                amuletPrompt: 'age25',
                careerCategory: 'Military',
                initialStory: 'Test story'
            };
            adventureSystem.adventureActive = true;
            
            const choice = {
                text: 'Fight',
                choiceType: 'aggressive',
                successProbability: 0.7
            };
            
            // Should not throw error
            await expect(adventureSystem.handleCareerBasedChoice(choice.text, true)).resolves.toBeDefined();
        });
    });
    
    describe('WorldRules Content', () => {
        test('combat rules should specify skill requirements', () => {
            const rules = new WorldRules();
            const combat = rules.getCombatRules();
            
            expect(combat.skillRequired).toBeDefined();
            expect(combat.minimumLevel).toBeGreaterThan(0);
        });
        
        test('magic rules should specify mana requirements', () => {
            const rules = new WorldRules();
            const magic = rules.getMagicRules();
            
            expect(magic.requiresMana).toBeDefined();
            expect(magic.skillRequired).toBeDefined();
        });
        
        test('should be able to get rules relevant to career category', () => {
            const rules = new WorldRules();
            
            // Should have methods to get relevant rules
            expect(typeof rules.getCombatRules).toBe('function');
            expect(typeof rules.getMagicRules).toBe('function');
        });
    });
});

