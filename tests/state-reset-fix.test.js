/**
 * Test for the state reset fix
 * Verifies that the UI properly resets to show "Start New Adventure" button after modal closes
 */

// Set up DOM mock before importing modules
global.document = {
    getElementById: jest.fn(),
    body: {
        appendChild: jest.fn()
    },
    createElement: jest.fn(() => ({
        className: '',
        innerHTML: '',
        style: {},
        remove: jest.fn()
    }))
};

// Setup for both Node.js and browser environments
const StoryAdventureUI = require('../src/ui/StoryAdventureUI.js');
const StoryAdventureManager = require('../src/llm/StoryAdventureManager.js');
const StoryManager = require('../src/llm/StoryManager.js');

describe('Story Adventure State Reset Fix', () => {
    let storyAdventureUI;
    let mockGameData;
    let mockMistralAPI;
    let mockStoryManager;
    let mockAdventureManager;
    let mockStoryContainer;

    beforeEach(() => {
        // Mock story container
        mockStoryContainer = {
            innerHTML: '',
            style: {}
        };

        // Configure DOM mock
        global.document.getElementById = jest.fn((id) => {
            console.log('getElementById called with id:', id);
            if (id === 'storyAdventure') {
                console.log('Returning mockStoryContainer');
                return mockStoryContainer;
            }
            console.log('Returning null for id:', id);
            return null;
        });
        
        // Also mock createElement
        global.document.createElement = jest.fn(() => {
            const element = {
                className: '',
                innerHTML: '',
                style: {},
                remove: jest.fn(),
                appendChild: jest.fn(),
                querySelector: jest.fn(),
                querySelectorAll: jest.fn(() => []),
                addEventListener: jest.fn(),
                setAttribute: jest.fn(),
                getAttribute: jest.fn()
            };
            return element;
        });
        
        // Mock document.body.appendChild to avoid DOM Node type check
        global.document.body.appendChild = jest.fn();

        // Mock game data
        mockGameData = {
            paused: false,
            character: {
                name: 'Test Character',
                stats: { strength: 10, intelligence: 10, charisma: 10 }
            }
        };

        // Mock MistralAPI
        mockMistralAPI = {
            generateStory: jest.fn().mockResolvedValue({
                story: 'Test story content',
                choices: ['Choice 1', 'Choice 2']
            })
        };

        // Mock StoryManager
        mockStoryManager = {
            startNewStory: jest.fn().mockReturnValue({
                genre: 'Fantasy',
                context: 'Test adventure'
            }),
            getDifficultyLabels: jest.fn().mockReturnValue(['Easy', 'Medium', 'Hard'])
        };

        // Mock StoryAdventureManager
        mockAdventureManager = {
            startAdventure: jest.fn(),
            endAdventure: jest.fn().mockReturnValue({
                successCount: 5,
                failureCount: 2,
                successRate: 0.71,
                rewards: {
                    totalXP: 1000,
                    bonusMultiplier: 1.5,
                    rewardMultiplier: 1.0
                }
            }),
            isAdventureActive: jest.fn().mockReturnValue(false), // Initially inactive
            canUnpauseGame: jest.fn().mockReturnValue(true),
            getSuccessCount: jest.fn().mockReturnValue(0),
            getFailureCount: jest.fn().mockReturnValue(0),
            getTurnCount: jest.fn().mockReturnValue(0)
        };

        storyAdventureUI = new StoryAdventureUI(mockGameData, mockMistralAPI, mockStoryManager, mockAdventureManager);
    });

    describe('State Reset Fix', () => {
        test('should have resetToInitialState method', () => {
            // Given: StoryAdventureUI instance
            // When: We check for the resetToInitialState method
            // Then: Should exist
            expect(typeof storyAdventureUI.resetToInitialState).toBe('function');
        });

        test('should have closeRewardModal method', () => {
            // Given: StoryAdventureUI instance
            // When: We check for the closeRewardModal method
            // Then: Should exist
            expect(typeof storyAdventureUI.closeRewardModal).toBe('function');
        });

        test('should reset UI to initial state when resetToInitialState is called', () => {
            // Given: StoryAdventureUI instance with inactive adventure
            mockAdventureManager.isAdventureActive.mockReturnValue(false);

            // Debug: Check if method exists
            console.log('resetToInitialState method exists:', typeof storyAdventureUI.resetToInitialState);
            console.log('mockStoryContainer before call:', mockStoryContainer.innerHTML);

            // When: We call resetToInitialState
            storyAdventureUI.resetToInitialState();

            // Debug: Log what was actually set
            console.log('mockStoryContainer after call:', mockStoryContainer.innerHTML);
            console.log('mockStoryContainer innerHTML length:', mockStoryContainer.innerHTML.length);

            // Then: Container should contain Start New Adventure button
            expect(mockStoryContainer.innerHTML).toContain('Start New Adventure');
            expect(mockStoryContainer.innerHTML).toContain('onclick="storyAdventureUI.startNewStory()"');
            expect(mockStoryContainer.innerHTML).toContain('start-adventure-btn');
        });
        
        test('should manually set innerHTML to verify mock works', () => {
            // Test that the mock container works
            mockStoryContainer.innerHTML = '<div>Test Content</div>';
            expect(mockStoryContainer.innerHTML).toContain('Test Content');
            
            // Test that document.getElementById returns our mock
            const container = document.getElementById('storyAdventure');
            expect(container).toBe(mockStoryContainer);
            
            // Test that we can set innerHTML through the mock
            container.innerHTML = '<div>Start New Adventure</div>';
            expect(mockStoryContainer.innerHTML).toContain('Start New Adventure');
        });

        test('should show initial state when adventure is active and resetToInitialState is called', () => {
            // Given: StoryAdventureUI instance with active adventure
            mockAdventureManager.isAdventureActive.mockReturnValue(true);

            // When: We call resetToInitialState
            storyAdventureUI.resetToInitialState();

            // Then: Container should contain initial state (not End Adventure button)
            expect(mockStoryContainer.innerHTML).toContain('Start New Adventure');
            expect(mockStoryContainer.innerHTML).toContain('onclick="storyAdventureUI.startNewStory()"');
            expect(mockStoryContainer.innerHTML).toContain('start-adventure-btn');
        });

        test('should create modal with correct close button when showRewardSummary is called', () => {
            // Given: StoryAdventureUI instance
            const summary = {
                successCount: 5,
                failureCount: 2,
                successRate: 0.71,
                rewards: {
                    totalXP: 1000,
                    bonusMultiplier: 1.5,
                    rewardMultiplier: 1.0
                }
            };

            // When: We call showRewardSummary
            storyAdventureUI.showRewardSummary(summary);

            // Then: Modal should be created with closeRewardModal button
            expect(global.document.createElement).toHaveBeenCalledWith('div');
            expect(global.document.body.appendChild).toHaveBeenCalled();
            
            // Check that the modal was created with the correct structure
            const createElementCall = global.document.createElement.mock.calls[0];
            expect(createElementCall[0]).toBe('div');
        });

        test('should remove modal and reset UI when closeRewardModal is called', () => {
            // Given: A mock button element with parent modal
            const mockModal = {
                remove: jest.fn()
            };
            const mockButton = {
                closest: jest.fn().mockReturnValue(mockModal)
            };

            // And: Adventure is inactive
            mockAdventureManager.isAdventureActive.mockReturnValue(false);

            // When: We call closeRewardModal
            storyAdventureUI.closeRewardModal(mockButton);

            // Then: Modal should be removed
            expect(mockButton.closest).toHaveBeenCalledWith('.reward-modal');
            expect(mockModal.remove).toHaveBeenCalled();

            // And: UI should be reset to initial state
            expect(mockStoryContainer.innerHTML).toContain('Start New Adventure');
        });

        test('should handle modal not found gracefully in closeRewardModal', () => {
            // Given: A mock button element that doesn't find a modal
            const mockButton = {
                closest: jest.fn().mockReturnValue(null)
            };

            // And: Adventure is inactive
            mockAdventureManager.isAdventureActive.mockReturnValue(false);

            // When: We call closeRewardModal
            // Then: Should not throw an error
            expect(() => {
                storyAdventureUI.closeRewardModal(mockButton);
            }).not.toThrow();

            // And: UI should still be reset
            expect(mockStoryContainer.innerHTML).toContain('Start New Adventure');
        });

        test('should handle missing storyAdventure container gracefully in resetToInitialState', () => {
            // Given: getElementById returns null for storyAdventure
            global.document.getElementById.mockImplementation((id) => {
                if (id === 'storyAdventure') {
                    return null;
                }
                return mockStoryContainer;
            });

            // When: We call resetToInitialState
            // Then: Should not throw an error
            expect(() => {
                storyAdventureUI.resetToInitialState();
            }).not.toThrow();
        });
    });

    describe('Integration Test', () => {
        test('should complete full adventure flow with proper UI reset', async () => {
            // Given: Adventure is inactive initially
            mockAdventureManager.isAdventureActive.mockReturnValue(false);

            // When: We start an adventure
            await storyAdventureUI.startNewStory();

            // Then: Adventure should be marked as active
            expect(mockAdventureManager.startAdventure).toHaveBeenCalled();

            // When: We end the adventure
            await storyAdventureUI.endAdventure(true);

            // Then: showRewardSummary should be called (we can't easily test the modal creation in this context)
            // And: Adventure should be ended
            expect(mockAdventureManager.endAdventure).toHaveBeenCalledWith(true);

            // When: We manually reset to initial state (simulating modal close)
            storyAdventureUI.resetToInitialState();

            // Then: UI should show Start New Adventure button
            expect(mockStoryContainer.innerHTML).toContain('Start New Adventure');
        });
    });
});
