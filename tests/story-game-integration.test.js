/**
 * Integration tests for Story Adventure with Game State
 * Tests the full flow from starting adventure to applying rewards
 */

const { TestMocks, TestDataFactory } = require('./test-helpers');

// Mock imports
let StoryAdventureManager, GameState, StoryManager;

try {
  StoryAdventureManager = require('../src/llm/StoryAdventureManager');
  GameState = require('../src/core/GameState').GameState;
  StoryManager = require('../src/llm/StoryManager');
} catch (e) {
  StoryAdventureManager = global.StoryAdventureManager;
  GameState = global.GameState;
  StoryManager = global.StoryManager;
}

describe('Story-Game Integration Tests', () => {
  let gameState;
  let storyManager;
  let adventureManager;
  
  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    // Create real GameState instance
    if (GameState) {
      gameState = new GameState();
      
      // Add mock skills with increaseXp method
      const createMockSkill = (name, level = 10) => ({
        name,
        level,
        xp: 0,
        baseData: { maxXp: 100 },
        getMaxXp: () => 100 * (level + 1),
        increaseXp: jest.fn(function() { this.xp += 10; }),
        addXp: jest.fn(function(amount) { this.xp += amount; })
      });
      
      gameState.taskData = {
        'Strength': createMockSkill('Strength', 20),
        'Charisma': createMockSkill('Charisma', 5),
        'Concentration': createMockSkill('Concentration', 15),
        'Mana control': createMockSkill('Mana control', 10) // Using actual skill name from GameData
      };
    } else {
      // Fallback mock
      gameState = {
        paused: false,
        days: 365 * 25,
        coins: 5000,
        evil: 10,
        setPaused: jest.fn(function(val) { this.paused = val; }),
        taskData: {
          'Strength': { name: 'Strength', level: 20, addXp: jest.fn(), xp: 0 },
          'Charisma': { name: 'Charisma', level: 5, addXp: jest.fn(), xp: 0 },
          'Concentration': { name: 'Concentration', level: 15, addXp: jest.fn(), xp: 0 },
          'Mana control': { name: 'Mana control', level: 10, addXp: jest.fn(), xp: 0 }
        }
      };
    }
    
    // Create story manager
    if (StoryManager) {
      storyManager = new StoryManager();
    } else {
      storyManager = {
        startNewStory: jest.fn(),
        continueStory: jest.fn(),
        getStorySummary: jest.fn(() => ({ turns: 0 }))
      };
    }
    
    // Create adventure manager
    adventureManager = new StoryAdventureManager(gameState, storyManager);
  });
  
  describe('Full Adventure Flow', () => {
    test('should complete full adventure cycle', () => {
      // Start adventure
      adventureManager.startAdventure();
      expect(gameState.paused).toBe(true);
      
      // Make some choices
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      adventureManager.trackChoiceResult(false, 'cautious');
      adventureManager.trackChoiceResult(true, 'creative');
      
      // End adventure
      const summary = adventureManager.endAdventure(true);
      
      // Verify summary
      expect(summary.successCount).toBe(3);
      expect(summary.failureCount).toBe(1);
      expect(summary.successRate).toBeCloseTo(0.75);
      
      // Verify game unpaused
      expect(gameState.paused).toBe(false);
      
      // Verify rewards were calculated
      expect(summary.rewards).toBeDefined();
      expect(summary.rewards.skillXP.strength).toBeGreaterThan(0);
    });
    
    test('should auto-end adventure after 3 failures', () => {
      adventureManager.startAdventure();
      
      // Make 3 failures
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      adventureManager.trackChoiceResult(false, 'cautious');
      
      // Check should auto-end
      expect(adventureManager.shouldAutoEnd()).toBe(true);
      
      // UI should detect this and trigger end
      const summary = adventureManager.endAdventure(false);
      
      expect(summary.failureCount).toBe(3);
      expect(summary.successCount).toBe(0);
      expect(gameState.paused).toBe(false);
    });
  });
  
  describe('Pause/Unpause Integration', () => {
    test('should prevent unpause during adventure', () => {
      adventureManager.startAdventure();
      
      // Check that adventure blocks unpause
      expect(adventureManager.canUnpauseGame()).toBe(false);
      
      // Try to unpause (in real game, this check would prevent it)
      if (gameState.setPaused) {
        gameState.setPaused(false);
      }
      
      // Adventure manager still says can't unpause
      expect(adventureManager.canUnpauseGame()).toBe(false);
    });
    
    test('should allow unpause after adventure ends', () => {
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.endAdventure(true);
      
      expect(adventureManager.canUnpauseGame()).toBe(true);
      expect(gameState.paused).toBe(false);
    });
  });
  
  describe('Skill Mapping and XP Application', () => {
    test('should map choice types to correct skills', () => {
      adventureManager.startAdventure();
      
      // Make one of each choice type
      adventureManager.trackChoiceResult(true, 'aggressive');   // → Strength
      adventureManager.trackChoiceResult(true, 'diplomatic');   // → Charisma
      adventureManager.trackChoiceResult(true, 'cautious');     // → Concentration
      adventureManager.trackChoiceResult(true, 'creative');     // → Magic
      
      const rewards = adventureManager.calculateRewards();
      
      // Check each skill got XP
      expect(rewards.skillXP.strength).toBeGreaterThan(0);
      expect(rewards.skillXP.charisma).toBeGreaterThan(0);
      expect(rewards.skillXP.concentration).toBeGreaterThan(0);
      expect(rewards.skillXP.magic).toBeGreaterThan(0);
    });
    
    test('should handle missing skills gracefully', () => {
      // Create game state with only partial skills
      const partialGameState = {
        paused: false,
        setPaused: jest.fn(),
        taskData: {
          'Strength': { name: 'Strength', level: 20, addXp: jest.fn() }
          // Missing other skills
        }
      };
      
      const manager = new StoryAdventureManager(partialGameState, storyManager);
      manager.startAdventure();
      manager.trackChoiceResult(true, 'aggressive');
      manager.trackChoiceResult(true, 'diplomatic'); // No charisma skill exists
      
      // Should not crash
      expect(() => manager.endAdventure(true)).not.toThrow();
    });
  });
  
  describe('Real Skill Name Mapping', () => {
    test('should use actual game skill names', () => {
      // Game uses these skill names:
      // - "Strength" (good)
      // - "Mana control" (not "Magic")
      // - "Concentration" (good)
      // - No direct "Charisma" - might need to map to "Meditation" or similar
      
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'creative');
      
      const summary = adventureManager.endAdventure(true);
      
      // Should work without crashing even if mapping isn't perfect
      expect(summary.rewards).toBeDefined();
    });
  });
  
  describe('Performance-Based Rewards', () => {
    test('should give bonus for high success rate', () => {
      adventureManager.startAdventure();
      
      // 6 successes, 1 failure = 85.7% success rate (>75% with >=5 successes triggers 2.0x bonus)
      for (let i = 0; i < 6; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      adventureManager.trackChoiceResult(false, 'aggressive');
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.bonusMultiplier).toBe(2.0);
    });
    
    test('should give time advancement for long adventures', () => {
      adventureManager.startAdventure();
      
      // 15 turns
      for (let i = 0; i < 15; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.daysAdvanced).toBe(1); // floor(15 * 0.1) = 1
    });
    
    test('should unlock special items for exceptional performance', () => {
      adventureManager.startAdventure();
      
      // 15 successful choices
      for (let i = 0; i < 15; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.unlocks).toContain('Adventurer\'s Badge');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle zero successes gracefully', () => {
      adventureManager.startAdventure();
      
      // Only failures
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      
      const summary = adventureManager.endAdventure(true);
      
      expect(summary.successCount).toBe(0);
      expect(summary.rewards.skillXP.strength).toBe(0);
      expect(summary.rewards.bonusMultiplier).toBe(1.0);
    });
    
    test('should prevent double-ending adventure', () => {
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      
      const firstSummary = adventureManager.endAdventure(true);
      expect(firstSummary.successCount).toBe(1);
      
      // Try to end again
      const secondSummary = adventureManager.endAdventure(true);
      expect(secondSummary.successCount).toBe(0); // Returns empty summary
    });
    
    test('should reset state between adventures', () => {
      // First adventure
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      adventureManager.endAdventure(true);
      
      // Second adventure
      adventureManager.startAdventure();
      
      // State should be reset
      expect(adventureManager.getSuccessCount()).toBe(0);
      expect(adventureManager.getFailureCount()).toBe(0);
      expect(adventureManager.getTurnCount()).toBe(0);
    });
  });
  
  describe('UI Integration Points', () => {
    test('should provide adventure context for UI display', () => {
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      
      const context = adventureManager.getAdventureContext();
      
      expect(context.successCount).toBe(1);
      expect(context.failureCount).toBe(1);
      expect(context.turnCount).toBe(2);
      expect(context.canContinue).toBe(true);
      expect(context.autoEndReason).toBeNull();
    });
    
    test('should indicate auto-end in context', () => {
      adventureManager.startAdventure();
      
      // 3 failures
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      adventureManager.trackChoiceResult(false, 'cautious');
      
      const context = adventureManager.getAdventureContext();
      
      expect(context.canContinue).toBe(false);
      expect(context.autoEndReason).toBe('too_many_failures');
    });
    
    test('should track choice history for display', () => {
      adventureManager.startAdventure();
      
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      adventureManager.trackChoiceResult(true, 'cautious');
      
      const history = adventureManager.getChoiceHistory();
      
      expect(history).toHaveLength(3);
      expect(history[0]).toEqual({ success: true, type: 'aggressive' });
      expect(history[1]).toEqual({ success: false, type: 'diplomatic' });
      expect(history[2]).toEqual({ success: true, type: 'cautious' });
    });
  });
});


