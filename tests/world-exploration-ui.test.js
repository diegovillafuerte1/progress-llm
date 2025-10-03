const { TestMocks, TestDataFactory } = require('./test-helpers');
// Handle both Node.js and browser environments
let WorldExplorationUI;
try {
  WorldExplorationUI = require('../src/ui/WorldExplorationUI');
} catch (e) {
  // For browser environment, use global
  WorldExplorationUI = global.WorldExplorationUI;
}
// Handle CharacterEncoder for both environments
let CharacterEncoder;
try {
  CharacterEncoder = require('../src/llm/CharacterEncoder');
} catch (e) {
  CharacterEncoder = global.CharacterEncoder;
}

// Make CharacterEncoder available globally
global.CharacterEncoder = CharacterEncoder;

describe('World Exploration UI Tests', () => {
  let worldExplorationUI;
  let mockGameState;
  let mockMistralAPI;
  let mockContainer;

  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    // Create a mock container that we can track
    mockContainer = { innerHTML: '' };
    
    // Mock document.getElementById
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'worldExploration') {
        return mockContainer;
      }
      return { innerHTML: '' };
    });
    
    // Mock game state
    mockGameState = {
      days: 365 * 25,
      coins: 5000,
      currentJob: { name: 'Knight' },
      currentSkill: { name: 'Strength' },
      taskData: {
        'Knight': { name: 'Knight', level: 15 },
        'Strength': { name: 'Strength', level: 20 }
      }
    };
    
    // Mock Mistral API
    mockMistralAPI = {
      generateWorldDescription: jest.fn()
    };
    
    worldExplorationUI = new WorldExplorationUI(mockGameState, mockMistralAPI);
  });

  describe('Initialization', () => {
    test('should initialize with game state and API', () => {
      expect(worldExplorationUI.gameState).toBe(mockGameState);
      expect(worldExplorationUI.mistralAPI).toBe(mockMistralAPI);
      expect(worldExplorationUI.isGenerating).toBe(false);
    });
  });

  describe('World Exploration', () => {
    test('should explore world successfully', async () => {
      const mockDescription = 'You find yourself in a bustling medieval town...';
      mockMistralAPI.generateWorldDescription.mockResolvedValue(mockDescription);
      
      const mockContainer = {
        innerHTML: ''
      };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      expect(mockMistralAPI.generateWorldDescription).toHaveBeenCalledTimes(1);
      expect(mockContainer.innerHTML).toContain('World Exploration');
      expect(mockContainer.innerHTML).toContain(mockDescription);
    });

    test('should not explore when already generating', async () => {
      worldExplorationUI.isGenerating = true;
      
      await worldExplorationUI.exploreWorld();
      
      expect(mockMistralAPI.generateWorldDescription).not.toHaveBeenCalled();
    });

    test('should show loading state during generation', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockMistralAPI.generateWorldDescription.mockReturnValue(promise);
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      const explorePromise = worldExplorationUI.exploreWorld();
      
      expect(worldExplorationUI.isGenerating).toBe(true);
      
      resolvePromise('Test description');
      await explorePromise;
      
      expect(worldExplorationUI.isGenerating).toBe(false);
    });

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'API Error: Invalid key';
      mockMistralAPI.generateWorldDescription.mockRejectedValue(new Error(errorMessage));
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      expect(mockContainer.innerHTML).toContain('error');
      expect(mockContainer.innerHTML).toContain(errorMessage);
    });

    test('should reset generating state after error', async () => {
      mockMistralAPI.generateWorldDescription.mockRejectedValue(new Error('Test error'));
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      expect(worldExplorationUI.isGenerating).toBe(false);
    });
  });

  describe('UI Display', () => {
    test('should display world description correctly', () => {
      const mockDescription = 'You discover a hidden treasure chest filled with gold coins.';
      
      worldExplorationUI.displayWorldDescription(mockDescription);
      
      // Note: Debug logging would now use logger.debug instead of console.log
      expect(mockContainer.innerHTML).toContain('World Exploration');
      expect(mockContainer.innerHTML).toContain(mockDescription);
      expect(mockContainer.innerHTML).toContain('Continue Exploring');
    });

    test('should show loading state', () => {
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      worldExplorationUI.showLoadingState();
      
      expect(mockContainer.innerHTML).toContain('loading');
    });

    test('should hide loading state', () => {
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      worldExplorationUI.hideLoadingState();
      
      expect(mockContainer.innerHTML).not.toContain('loading');
    });

    test('should show error message', () => {
      const errorMessage = 'Failed to connect to API';
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      worldExplorationUI.showError(errorMessage);
      
      expect(mockContainer.innerHTML).toContain('error');
      expect(mockContainer.innerHTML).toContain(errorMessage);
    });
  });

  describe('Character State Integration', () => {
    test('should pass correct character state to API', async () => {
      const mockDescription = 'Test description';
      mockMistralAPI.generateWorldDescription.mockResolvedValue(mockDescription);
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      expect(mockMistralAPI.generateWorldDescription).toHaveBeenCalledWith(
        expect.objectContaining({
          age: 25,
          currentJob: 'Knight',
          currentSkill: 'Strength'
        })
      );
    });

    test('should handle missing character data', async () => {
      const incompleteGameState = {
        days: 0,
        coins: 0,
        currentJob: null,
        currentSkill: null,
        taskData: {},
        itemData: {}
      };
      
      const uiWithIncompleteState = new WorldExplorationUI(incompleteGameState, mockMistralAPI);
      mockMistralAPI.generateWorldDescription.mockResolvedValue('Test description');
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await uiWithIncompleteState.exploreWorld();
      
      expect(mockMistralAPI.generateWorldDescription).toHaveBeenCalledWith(
        expect.objectContaining({
          age: 0,
          currentJob: 'Unemployed',
          currentSkill: 'None'
        })
      );
    });
  });

  describe('User Interaction', () => {
    test('should provide continue exploring button', () => {
      const mockDescription = 'Test description';
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      worldExplorationUI.displayWorldDescription(mockDescription);
      
      expect(mockContainer.innerHTML).toContain('Continue Exploring');
      expect(mockContainer.innerHTML).toContain('onclick="worldExplorationUI.exploreWorld()"');
    });

    test('should handle multiple exploration calls', async () => {
      mockMistralAPI.generateWorldDescription
        .mockResolvedValueOnce('First description')
        .mockResolvedValueOnce('Second description');
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      expect(mockContainer.innerHTML).toContain('First description');
      
      await worldExplorationUI.exploreWorld();
      expect(mockContainer.innerHTML).toContain('Second description');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle network timeout', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      
      mockMistralAPI.generateWorldDescription.mockRejectedValue(timeoutError);
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      expect(mockContainer.innerHTML).toContain('timeout');
    });

    test('should handle API quota exceeded', async () => {
      const quotaError = new Error('API quota exceeded');
      quotaError.status = 429;
      
      mockMistralAPI.generateWorldDescription.mockRejectedValue(quotaError);
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      expect(mockContainer.innerHTML).toContain('quota');
    });

    test('should handle invalid API response', async () => {
      mockMistralAPI.generateWorldDescription.mockResolvedValue(null);
      
      const mockContainer = { innerHTML: '' };
      document.getElementById = jest.fn().mockReturnValue(mockContainer);
      
      await worldExplorationUI.exploreWorld();
      
      // The method should display the null response as content, not as an error
      expect(mockContainer.innerHTML).toContain('null');
    });
  });
});
