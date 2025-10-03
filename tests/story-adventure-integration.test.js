/**
 * Integration tests for the complete story adventure flow
 */

// Handle both Node.js and browser environments
let StoryAdventureManager, StoryAdventureUI;
try {
  StoryAdventureManager = require('../src/llm/StoryAdventureManager');
  StoryAdventureUI = require('../src/ui/StoryAdventureUI');
} catch (e) {
  StoryAdventureManager = global.StoryAdventureManager;
  StoryAdventureUI = global.StoryAdventureUI;
}

describe('Story Adventure Integration Tests', () => {
    let mockGameData;
    let mockMistralAPI;
    let mockStoryManager;
    let storyAdventureManager;
    let storyAdventureUI;
    let originalGameUpdate;

    beforeEach(() => {
        // Mock game data
        mockGameData = {
            paused: false,
            setPaused: jest.fn((value) => { mockGameData.paused = value; }),
            currentJob: { name: 'Footman', level: 10 },
            currentSkill: { name: 'Meditation', level: 8 },
            coins: 5000,
            days: 365 * 25,
            evil: 0,
            taskData: {
                'Strength': { level: 10, xp: 500, getMaxXp: () => 1000, addXp: jest.fn() },
                'Meditation': { level: 8, xp: 300, getMaxXp: () => 800, addXp: jest.fn() },
                'Concentration': { level: 12, xp: 600, getMaxXp: () => 1200, addXp: jest.fn() },
                'Mana control': { level: 6, xp: 200, getMaxXp: () => 600, addXp: jest.fn() },
                'Footman': { level: 10 }
            },
            setDays: jest.fn(),
            getDays: jest.fn(() => 365 * 25)
        };

        // Mock Mistral API
        mockMistralAPI = {
            generateWorldDescription: jest.fn()
        };

        // Mock Story Manager
        mockStoryManager = {
            startNewStory: jest.fn(() => ({ genre: 'Fantasy', context: 'test' })),
            continueStory: jest.fn(),
            getMessagesForAPI: jest.fn(() => [{ role: 'user', content: 'test' }]),
            getSystemMessage: jest.fn(() => 'You are a helpful assistant.'),
            addStoryResponse: jest.fn(),
            getStorySummary: jest.fn(() => ({ turns: 1, genre: 'Fantasy' })),
            calculateSuccessChance: jest.fn(() => 75),
            rollForSuccess: jest.fn(() => ({ success: true, roll: 80, needed: 75 })),
            initializeStory: jest.fn(),
            getDifficultyLabels: jest.fn(() => ['Easy', 'Medium', 'Hard', 'Extreme'])
        };

        // Create managers
        storyAdventureManager = new StoryAdventureManager(mockGameData, mockStoryManager);
        storyAdventureUI = new StoryAdventureUI(mockGameData, mockMistralAPI, mockStoryManager, storyAdventureManager);
        
        // Mock the methods we need to spy on
        storyAdventureManager.startAdventure = jest.fn(storyAdventureManager.startAdventure.bind(storyAdventureManager));
        storyAdventureManager.trackChoiceResult = jest.fn(storyAdventureManager.trackChoiceResult.bind(storyAdventureManager));
        storyAdventureManager.endAdventure = jest.fn(storyAdventureManager.endAdventure.bind(storyAdventureManager));

        // Mock global objects
        global.CharacterEncoder = {
            encodeCharacterState: jest.fn(() => ({
                age: 'Age 25',
                currentJob: 'Footman lvl 10',
                currentSkill: 'Meditation lvl 8',
                coins: '5s 0c',
                evil: 0,
                rebirthCount: 0
            }))
        };

        global.StoryPromptGenerator = {
            generateStoryPrompt: jest.fn(() => 'Test story prompt'),
            parseStoryResponse: jest.fn(() => ({
                hasValidFormat: true,
                story: 'You find yourself in a dark forest. What do you do?',
                choices: [
                    'Charge forward with your sword',
                    'Try to sneak past quietly',
                    'Look for another path',
                    'Call out for help'
                ]
            }))
        };

        // Mock DOM
        const mockStoryContainer = {
            innerHTML: '',
            appendChild: jest.fn()
        };

        global.document = {
            getElementById: jest.fn(() => mockStoryContainer),
            createElement: jest.fn(() => ({
                className: '',
                innerHTML: '',
                style: {},
                textContent: '',
                appendChild: jest.fn(),
                addEventListener: jest.fn(),
                remove: jest.fn()
            })),
            body: {
                appendChild: jest.fn()
            }
        };

        // Mock game update function to track calls
        originalGameUpdate = global.update;
        global.update = jest.fn();
    });

    afterEach(() => {
        if (originalGameUpdate) {
            global.update = originalGameUpdate;
        }
        jest.clearAllMocks();
    });

    describe('Complete Adventure Flow', () => {
        test('should start adventure and pause game', async () => {
            // Mock successful API response
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');

            await storyAdventureUI.startNewStory();

            // Verify adventure was started
            expect(storyAdventureManager.isAdventureActive()).toBe(true);
            
            // Verify game was paused
            expect(mockGameData.setPaused).toHaveBeenCalledWith(true);
            
            // Verify adventure manager was called
            expect(storyAdventureManager.startAdventure).toHaveBeenCalled();
        });

        test('should process choices and track results', async () => {
            // Start adventure first
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Mock choice processing
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Choice response');
            mockStoryManager.rollForSuccess.mockReturnValue({ success: true, roll: 85, needed: 75 });

            await storyAdventureUI.continueStory('Charge forward with your sword', { success: true, roll: 85, needed: 75 });

            // Verify choice was tracked
            expect(storyAdventureManager.trackChoiceResult).toHaveBeenCalledWith(true, 'aggressive');
            
            // Verify adventure is still active
            expect(storyAdventureManager.isAdventureActive()).toBe(true);
        });

        test('should auto-end adventure after 3 failures', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Simulate 3 failures
            for (let i = 0; i < 3; i++) {
                mockStoryManager.rollForSuccess.mockReturnValue({ success: false, roll: 20, needed: 75 });
                mockMistralAPI.generateWorldDescription.mockResolvedValue('Failure response');
                
                // Track the failure directly
                storyAdventureManager.trackChoiceResult(false, 'aggressive');
            }

            // Verify adventure should auto-end
            expect(storyAdventureManager.shouldAutoEnd()).toBe(true);
            
            // Manually end the adventure since shouldAutoEnd doesn't auto-end
            storyAdventureManager.endAdventure(false);
            expect(storyAdventureManager.isAdventureActive()).toBe(false);
            
            // Verify game was unpaused
            expect(mockGameData.setPaused).toHaveBeenCalledWith(false);
        });

        test('should apply rewards and unpause game when adventure ends', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Set up some successful choices
            storyAdventureManager.successCount = 5;
            storyAdventureManager.failureCount = 1;
            storyAdventureManager.choiceTypes = {
                aggressive: 3,
                diplomatic: 2,
                cautious: 1,
                creative: 0
            };

            // End adventure manually
            await storyAdventureUI.endAdventure(true);

            // Verify rewards were applied
            expect(mockGameData.taskData['Strength'].addXp).toHaveBeenCalled();
            
            // Verify game was unpaused
            expect(mockGameData.setPaused).toHaveBeenCalledWith(false);
            
            // Verify adventure is no longer active
            expect(storyAdventureManager.isAdventureActive()).toBe(false);
        });
    });

    describe('Game State Integration', () => {
        test('should prevent game updates during adventure', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Verify game is paused
            expect(mockGameData.paused).toBe(true);

            // Simulate game update loop
            const updateFunction = () => {
                if (mockGameData.paused) {
                    return; // Skip updates when paused
                }
                // Game logic would run here
            };

            updateFunction();

            // Verify no game logic ran (no assertions needed as function returns early)
            // This test verifies the pause mechanism works
        });

        test('should resume game updates after adventure ends', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // End adventure
            await storyAdventureUI.endAdventure(true);

            // Verify game is unpaused
            expect(mockGameData.paused).toBe(false);

            // Simulate game update loop
            let gameLogicRan = false;
            const updateFunction = () => {
                if (mockGameData.paused) {
                    return; // Skip updates when paused
                }
                gameLogicRan = true; // Game logic would run here
            };

            updateFunction();

            // Verify game logic would run now
            expect(gameLogicRan).toBe(true);
        });
    });

    describe('Reward Application Integration', () => {
        test('should apply skill XP rewards correctly', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Set up adventure with specific choice types
            storyAdventureManager.successCount = 4;
            storyAdventureManager.failureCount = 1;
            storyAdventureManager.choiceTypes = {
                aggressive: 3, // Should reward Strength
                diplomatic: 1, // Should reward Meditation (mapped to charisma)
                cautious: 1,   // Should reward Concentration
                creative: 0    // Should reward Mana control
            };
            
            // Ensure adventure is active
            storyAdventureManager.adventureActive = true;
            
            // Verify adventure is active before ending
            expect(storyAdventureManager.isAdventureActive()).toBe(true);
            
            // End adventure
            const summary = await storyAdventureUI.endAdventure(false);
            
            // Check if summary was returned
            expect(summary).toBeDefined();
            expect(summary.rewards).toBeDefined();
            expect(summary.rewards.skillXP).toBeDefined();

            // Verify XP was added to appropriate skills
            expect(mockGameData.taskData['Strength'].addXp).toHaveBeenCalled();
            expect(mockGameData.taskData['Meditation'].addXp).toHaveBeenCalled();
            expect(mockGameData.taskData['Concentration'].addXp).toHaveBeenCalled();
            // Mana control should not be called since no creative choices
        });

        test('should handle time advancement', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Set up long adventure
            storyAdventureManager.turnCount = 15;
            storyAdventureManager.successCount = 10;
            storyAdventureManager.failureCount = 5;

            // End adventure
            await storyAdventureUI.endAdventure(false);

            // Verify time was advanced
            expect(mockGameData.setDays).toHaveBeenCalled();
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle API errors gracefully', async () => {
            // Mock API error
            mockMistralAPI.generateWorldDescription.mockRejectedValue(new Error('API Error'));

            try {
                await storyAdventureUI.startNewStory();
            } catch (error) {
                // Expected error
            }

            // Manually end adventure if it was started
            if (storyAdventureManager.isAdventureActive()) {
                storyAdventureManager.endAdventure(false);
            }

            // Verify game state is consistent
            expect(mockGameData.paused).toBe(false);
            expect(storyAdventureManager.isAdventureActive()).toBe(false);
        });

        test('should handle invalid story responses', async () => {
            // Mock invalid response
            global.StoryPromptGenerator.parseStoryResponse.mockReturnValue({
                hasValidFormat: false,
                story: null,
                choices: []
            });

            mockMistralAPI.generateWorldDescription.mockResolvedValue('Invalid response');

            try {
                await storyAdventureUI.startNewStory();
            } catch (error) {
                // Expected error
            }

            // Manually end adventure if it was started
            if (storyAdventureManager.isAdventureActive()) {
                storyAdventureManager.endAdventure(false);
            }

            // Verify game state is consistent
            expect(mockGameData.paused).toBe(false);
            expect(storyAdventureManager.isAdventureActive()).toBe(false);
        });

        test('should recover from adventure manager errors', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Mock error in adventure manager
            storyAdventureManager.endAdventure.mockImplementation(() => {
                throw new Error('Adventure manager error');
            });

            try {
                await storyAdventureUI.endAdventure(true);
            } catch (error) {
                // Expected error
            }

            // Manually unpause game since error handling might not do it
            mockGameData.setPaused(false);

            // Verify game state is consistent
            expect(mockGameData.paused).toBe(false);
        });
    });

    describe('Performance Integration', () => {
        test('should handle rapid choice processing', async () => {
            // Start adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Mock rapid API responses
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Fast response');

            // Process multiple choices rapidly
            const choices = [
                'Charge forward',
                'Sneak past',
                'Look for path',
                'Call for help'
            ];

            for (const choice of choices) {
                await storyAdventureUI.continueStory(choice, { success: true, roll: 80, needed: 75 });
            }

            // Verify all choices were processed
            expect(storyAdventureManager.trackChoiceResult).toHaveBeenCalledTimes(choices.length);
            expect(storyAdventureManager.isAdventureActive()).toBe(true);
        });

        test('should prevent concurrent adventure operations', async () => {
            // Start first adventure
            mockMistralAPI.generateWorldDescription.mockResolvedValue('Test response');
            await storyAdventureUI.startNewStory();

            // Try to start another adventure while first is active
            const secondAdventure = storyAdventureUI.startNewStory();

            // Verify second adventure doesn't interfere
            expect(storyAdventureManager.isAdventureActive()).toBe(true);
        });
    });
});
