const { TestMocks, TestDataFactory } = require('./test-helpers');

// Handle both Node.js and browser environments
let StoryAdventureManager;
try {
  StoryAdventureManager = require('../src/llm/StoryAdventureManager');
} catch (e) {
  StoryAdventureManager = global.StoryAdventureManager;
}

describe('Story Adventure Manager - Game Integration Tests', () => {
  let adventureManager;
  let mockGameState;
  let mockStoryManager;
  
  beforeEach(() => {
    TestMocks.setupStandardMocks();
    
    // Mock game state with pause/unpause functionality
    mockGameState = {
      isPaused: false,
      paused: false,
      days: 365 * 25,
      coins: 5000,
      evil: 10,
      
      setPaused: jest.fn(function(value) { this.paused = value; this.isPaused = value; }),
      getDays: jest.fn(function() { return this.days; }),
      setDays: jest.fn(function(value) { this.days = value; }),
      
      // Skill system (using actual game skill names)
      taskData: {
        'Strength': { 
          name: 'Strength', 
          level: 20, 
          xp: 0,
          getMaxXp: jest.fn(() => 100),
          addXp: jest.fn(function(xp) { this.xp += xp; }) 
        },
        'Mana control': { 
          name: 'Mana control', 
          level: 10, 
          xp: 0,
          getMaxXp: jest.fn(() => 100),
          addXp: jest.fn(function(xp) { this.xp += xp; }) 
        },
        'Meditation': { 
          name: 'Meditation', 
          level: 5, 
          xp: 0,
          getMaxXp: jest.fn(() => 100),
          addXp: jest.fn(function(xp) { this.xp += xp; }) 
        },
        'Concentration': { 
          name: 'Concentration', 
          level: 15, 
          xp: 0,
          getMaxXp: jest.fn(() => 100),
          addXp: jest.fn(function(xp) { this.xp += xp; }) 
        }
      }
    };
    
    // Mock story manager
    mockStoryManager = {
      startNewStory: jest.fn(),
      continueStory: jest.fn(),
      getStorySummary: jest.fn(() => ({ turns: 0 }))
    };
    
    adventureManager = new StoryAdventureManager(mockGameState, mockStoryManager);
  });

  describe('Adventure Lifecycle', () => {
    test('should start new adventure and pause game', () => {
      adventureManager.startAdventure();
      
      expect(mockGameState.setPaused).toHaveBeenCalledWith(true);
      expect(mockGameState.paused).toBe(true);
      expect(adventureManager.isAdventureActive()).toBe(true);
      expect(adventureManager.getSuccessCount()).toBe(0);
      expect(adventureManager.getFailureCount()).toBe(0);
    });

    test('should prevent starting multiple adventures simultaneously', () => {
      adventureManager.startAdventure();
      
      expect(() => adventureManager.startAdventure()).toThrow('Adventure already in progress');
    });

    test('should track adventure state', () => {
      adventureManager.startAdventure();
      
      const state = adventureManager.getAdventureState();
      expect(state.isActive).toBe(true);
      expect(state.successCount).toBe(0);
      expect(state.failureCount).toBe(0);
      expect(state.turns).toBe(0);
      expect(state.choiceTypes).toEqual({
        aggressive: 0,
        diplomatic: 0,
        cautious: 0,
        creative: 0
      });
    });

    test('should not allow unpause while adventure is active', () => {
      adventureManager.startAdventure();
      
      // Adventure manager should prevent unpause
      expect(adventureManager.canUnpauseGame()).toBe(false);
      
      // Even if someone tries to unpause manually, adventure manager says no
      expect(mockGameState.paused).toBe(true);
    });
  });

  describe('Choice Tracking', () => {
    beforeEach(() => {
      adventureManager.startAdventure();
    });

    test('should track successful aggressive choice', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      
      expect(adventureManager.getSuccessCount()).toBe(1);
      expect(adventureManager.getFailureCount()).toBe(0);
      expect(adventureManager.getChoiceTypeCount('aggressive')).toBe(1);
    });

    test('should track failed diplomatic choice', () => {
      adventureManager.trackChoiceResult(false, 'diplomatic');
      
      expect(adventureManager.getSuccessCount()).toBe(0);
      expect(adventureManager.getFailureCount()).toBe(1);
      expect(adventureManager.getChoiceTypeCount('diplomatic')).toBe(1);
    });

    test('should track multiple choices correctly', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      adventureManager.trackChoiceResult(false, 'cautious');
      adventureManager.trackChoiceResult(true, 'creative');
      
      expect(adventureManager.getSuccessCount()).toBe(3);
      expect(adventureManager.getFailureCount()).toBe(1);
      expect(adventureManager.getChoiceTypeCount('aggressive')).toBe(1);
      expect(adventureManager.getChoiceTypeCount('diplomatic')).toBe(1);
      expect(adventureManager.getChoiceTypeCount('cautious')).toBe(1);
      expect(adventureManager.getChoiceTypeCount('creative')).toBe(1);
    });

    test('should increment turn count on each choice', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      
      expect(adventureManager.getTurnCount()).toBe(2);
    });

    test('should validate choice type', () => {
      expect(() => adventureManager.trackChoiceResult(true, 'invalid'))
        .toThrow('Invalid choice type');
    });
  });

  describe('End Conditions', () => {
    beforeEach(() => {
      adventureManager.startAdventure();
    });

    test('should end adventure after 3 failures', () => {
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      
      expect(adventureManager.shouldAutoEnd()).toBe(false);
      
      adventureManager.trackChoiceResult(false, 'cautious');
      
      expect(adventureManager.shouldAutoEnd()).toBe(true);
    });

    test('should allow manual ending before 3 failures', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      
      const rewards = adventureManager.endAdventure(true); // manual end
      
      expect(adventureManager.isAdventureActive()).toBe(false);
      expect(rewards).toBeDefined();
    });

    test('should not allow unpause until adventure ends', () => {
      expect(adventureManager.canUnpauseGame()).toBe(false);
      
      adventureManager.endAdventure(true);
      
      expect(adventureManager.canUnpauseGame()).toBe(true);
    });
  });

  describe('Reward Calculation', () => {
    beforeEach(() => {
      adventureManager.startAdventure();
    });

    test('should calculate basic skill XP rewards', () => {
      adventureManager.trackChoiceResult(true, 'aggressive'); // Strength
      adventureManager.trackChoiceResult(true, 'diplomatic'); // Charisma
      adventureManager.trackChoiceResult(true, 'cautious'); // Concentration
      adventureManager.trackChoiceResult(true, 'creative'); // Magic
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.skillXP).toBeDefined();
      expect(rewards.skillXP.strength).toBeGreaterThan(0);
      expect(rewards.skillXP.charisma).toBeGreaterThan(0);
      expect(rewards.skillXP.concentration).toBeGreaterThan(0);
      expect(rewards.skillXP.magic).toBeGreaterThan(0);
    });

    test('should not reward failed choices', () => {
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.skillXP.strength).toBe(0);
      expect(rewards.skillXP.charisma).toBe(0);
    });

    test('should scale XP with success count', () => {
      // Single success
      adventureManager.trackChoiceResult(true, 'aggressive');
      const singleReward = adventureManager.calculateRewards();
      
      adventureManager = new StoryAdventureManager(mockGameState, mockStoryManager);
      adventureManager.startAdventure();
      
      // Multiple successes
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'aggressive');
      const multipleReward = adventureManager.calculateRewards();
      
      expect(multipleReward.skillXP.strength).toBeGreaterThan(singleReward.skillXP.strength);
    });

    test('should award bonus multiplier for high success rate', () => {
      // 5 successes, 1 failure = 83% success rate (>75% threshold)
      for (let i = 0; i < 5; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      adventureManager.trackChoiceResult(false, 'aggressive');
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.bonusMultiplier).toBe(2.0);
    });

    test('should not award bonus for low success rate', () => {
      // 3 successes, 3 failures = 50% success rate (<75% threshold)
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'aggressive');
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.bonusMultiplier).toBe(1.0);
    });

    test('should not award bonus for too few successes', () => {
      // 4 successes (100% rate) but below 5 threshold
      for (let i = 0; i < 4; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.bonusMultiplier).toBe(1.0);
    });

    test('should award time advancement for long adventures', () => {
      // Simulate 12 turns (>= 10 threshold)
      for (let i = 0; i < 12; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.daysAdvanced).toBeGreaterThan(0);
      expect(rewards.daysAdvanced).toBe(1); // 12 turns * 0.1 = 1.2, floored to 1
    });

    test('should not award time advancement for short adventures', () => {
      // Only 5 turns
      for (let i = 0; i < 5; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.daysAdvanced).toBe(0);
    });

    test('should award special unlocks for exceptional performance', () => {
      // 15 successes
      for (let i = 0; i < 15; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards();
      
      expect(rewards.unlocks).toBeDefined();
      expect(rewards.unlocks.length).toBeGreaterThan(0);
      expect(rewards.unlocks).toContain('Adventurer\'s Badge');
    });

    test('should calculate base XP relative to character level', () => {
      // Higher level character should get more XP
      const highLevelGameState = {
        ...mockGameState,
        taskData: {
          strength: { name: 'Strength', level: 100, addExperience: jest.fn() }
        }
      };
      
      const highLevelManager = new StoryAdventureManager(highLevelGameState, mockStoryManager);
      highLevelManager.startAdventure();
      highLevelManager.trackChoiceResult(true, 'aggressive');
      
      const highLevelRewards = highLevelManager.calculateRewards();
      
      adventureManager.trackChoiceResult(true, 'aggressive');
      const normalRewards = adventureManager.calculateRewards();
      
      expect(highLevelRewards.skillXP.strength).toBeGreaterThan(normalRewards.skillXP.strength);
    });
  });

  describe('Reward Application', () => {
    beforeEach(() => {
      adventureManager.startAdventure();
    });

    test('should apply skill XP to game state', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      
      adventureManager.endAdventure(true);
      
      expect(mockGameState.taskData['Strength'].addXp).toHaveBeenCalled();
      expect(mockGameState.taskData['Meditation'].addXp).toHaveBeenCalled();
    });

    test('should apply time advancement to game state', () => {
      // Long adventure
      for (let i = 0; i < 12; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const initialDays = mockGameState.days;
      adventureManager.endAdventure(true);
      
      expect(mockGameState.setDays).toHaveBeenCalled();
      expect(mockGameState.days).toBeGreaterThan(initialDays);
    });

    test('should unlock special items for exceptional performance', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      for (let i = 0; i < 15; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const summary = adventureManager.endAdventure(true);
      
      // Check that unlocks are included in rewards
      expect(summary.rewards.unlocks).toContain('Adventurer\'s Badge');
      
      // Note: Console log expectation removed since we now use logger.info
      // The unlock logging is now handled by logger.info instead of console.log
      
      consoleSpy.mockRestore();
    });

    test('should unpause game after applying rewards', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.endAdventure(true);
      
      expect(mockGameState.setPaused).toHaveBeenCalledWith(false);
      expect(mockGameState.paused).toBe(false);
    });

    test('should return reward summary', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      
      const summary = adventureManager.endAdventure(true);
      
      expect(summary).toBeDefined();
      expect(summary.successCount).toBe(2);
      expect(summary.failureCount).toBe(0);
      expect(summary.successRate).toBe(1.0);
      expect(summary.rewards).toBeDefined();
    });
  });

  describe('Manual vs Auto End', () => {
    beforeEach(() => {
      adventureManager.startAdventure();
    });

    test('should reduce rewards for early manual end', () => {
      // Only 2 successes then manual end
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'aggressive');
      
      const manualEndRewards = adventureManager.calculateRewards(true); // manual end flag
      
      adventureManager = new StoryAdventureManager(mockGameState, mockStoryManager);
      adventureManager.startAdventure();
      
      // Same performance but auto end
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'aggressive');
      
      const autoEndRewards = adventureManager.calculateRewards(false);
      
      // Manual end should have penalty (e.g., 80% of normal rewards)
      expect(manualEndRewards.rewardMultiplier).toBeLessThan(autoEndRewards.rewardMultiplier);
    });

    test('should not penalize manual end for long adventures', () => {
      // 10+ turns, manual end should not be penalized
      for (let i = 0; i < 12; i++) {
        adventureManager.trackChoiceResult(true, 'aggressive');
      }
      
      const rewards = adventureManager.calculateRewards(true); // manual end
      
      expect(rewards.rewardMultiplier).toBe(1.0); // No penalty
    });
  });

  describe('Adventure Statistics', () => {
    beforeEach(() => {
      adventureManager.startAdventure();
    });

    test('should track complete adventure history', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      adventureManager.trackChoiceResult(true, 'cautious');
      
      const history = adventureManager.getChoiceHistory();
      
      expect(history).toHaveLength(3);
      expect(history[0]).toEqual({ success: true, type: 'aggressive' });
      expect(history[1]).toEqual({ success: false, type: 'diplomatic' });
      expect(history[2]).toEqual({ success: true, type: 'cautious' });
    });

    test('should calculate success rate', () => {
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.trackChoiceResult(true, 'diplomatic');
      adventureManager.trackChoiceResult(false, 'cautious');
      
      expect(adventureManager.getSuccessRate()).toBeCloseTo(0.667, 2);
    });

    test('should handle zero choices', () => {
      expect(adventureManager.getSuccessRate()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle ending adventure with no choices', () => {
      adventureManager.startAdventure();
      
      expect(() => adventureManager.endAdventure(true)).not.toThrow();
      
      const summary = adventureManager.endAdventure(true);
      expect(summary.successCount).toBe(0);
      expect(summary.rewards.skillXP.strength).toBe(0);
    });

    test('should prevent tracking choices without active adventure', () => {
      expect(() => adventureManager.trackChoiceResult(true, 'aggressive'))
        .toThrow('No active adventure');
    });

    test('should reset state after adventure ends', () => {
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.endAdventure(true);
      
      expect(adventureManager.isAdventureActive()).toBe(false);
      expect(adventureManager.getSuccessCount()).toBe(0);
      expect(adventureManager.getFailureCount()).toBe(0);
    });

    test('should allow starting new adventure after previous ends', () => {
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      adventureManager.endAdventure(true);
      
      expect(() => adventureManager.startAdventure()).not.toThrow();
      expect(adventureManager.isAdventureActive()).toBe(true);
    });

    test('should handle missing game state methods gracefully', () => {
      const minimalGameState = {
        isPaused: false,
        pause: jest.fn(),
        unpause: jest.fn()
      };
      
      const manager = new StoryAdventureManager(minimalGameState, mockStoryManager);
      manager.startAdventure();
      manager.trackChoiceResult(true, 'aggressive');
      
      // Should not crash when applying rewards
      expect(() => manager.endAdventure(true)).not.toThrow();
    });
  });

  describe('Integration with StoryManager', () => {
    test('should have story manager available for integration', () => {
      adventureManager.startAdventure();
      
      // Story manager is available for UI layer to call startNewStory
      // The adventureManager just manages the game state integration
      expect(adventureManager.storyManager).toBe(mockStoryManager);
      expect(adventureManager.isAdventureActive()).toBe(true);
    });

    test('should provide adventure context to story manager', () => {
      adventureManager.startAdventure();
      adventureManager.trackChoiceResult(true, 'aggressive');
      
      const context = adventureManager.getAdventureContext();
      
      expect(context).toBeDefined();
      expect(context.successCount).toBe(1);
      expect(context.failureCount).toBe(0);
      expect(context.canContinue).toBe(true);
    });

    test('should indicate when adventure should end', () => {
      adventureManager.startAdventure();
      
      // 3 failures
      adventureManager.trackChoiceResult(false, 'aggressive');
      adventureManager.trackChoiceResult(false, 'diplomatic');
      adventureManager.trackChoiceResult(false, 'cautious');
      
      const context = adventureManager.getAdventureContext();
      expect(context.canContinue).toBe(false);
      expect(context.autoEndReason).toBe('too_many_failures');
    });
  });
});
