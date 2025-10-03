/**
 * Tests for success roll and chance calculation system
 */

let StoryManager;
try {
  StoryManager = require('../src/llm/StoryManager');
} catch (e) {
  StoryManager = global.StoryManager;
}

describe('Success Roll System', () => {
  let storyManager;
  
  beforeEach(() => {
    storyManager = new StoryManager();
  });

  describe('rollForSuccess', () => {
    test('should succeed when roll is less than success chance', () => {
      // Mock Math.random to return a low value
      const originalRandom = Math.random;
      Math.random = () => 0.30; // 30%
      
      const result = storyManager.rollForSuccess(50);
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(30);
      expect(result.needed).toBe(50);
      
      Math.random = originalRandom;
    });

    test('should succeed when roll equals success chance', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.50; // 50%
      
      const result = storyManager.rollForSuccess(50);
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(50);
      expect(result.needed).toBe(50);
      
      Math.random = originalRandom;
    });

    test('should fail when roll is greater than success chance', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.70; // 70%
      
      const result = storyManager.rollForSuccess(50);
      
      expect(result.success).toBe(false);
      expect(result.roll).toBe(70);
      expect(result.needed).toBe(50);
      
      Math.random = originalRandom;
    });

    test('should handle edge case of 100% success', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.99; // 99%
      
      const result = storyManager.rollForSuccess(100);
      
      expect(result.success).toBe(true);
      expect(result.roll).toBe(99);
      
      Math.random = originalRandom;
    });

    test('should handle edge case of 0% success', () => {
      const originalRandom = Math.random;
      Math.random = () => 0.01; // 1%
      
      const result = storyManager.rollForSuccess(0);
      
      expect(result.success).toBe(false);
      expect(result.roll).toBe(1);
      
      Math.random = originalRandom;
    });
  });

  describe('calculateSuccessChance - Skills Integration', () => {
    test('should calculate different chances for different action types based on skills', () => {
      const characterState = {
        age: 30,
        coins: 1000,
        evil: 0,
        rebirthCount: 0,
        currentJob: 'Adventurer',
        skills: [
          { name: 'Strength', level: 100 },
          { name: 'Productivity', level: 50 },
          { name: 'Concentration', level: 50 },
          { name: 'Bargaining', level: 10 }
        ]
      };

      const story = 'A simple challenge.';

      const aggressiveChance = storyManager.calculateSuccessChance(
        'Attack the enemy with strength!',
        characterState,
        story
      );

      const cautiousChance = storyManager.calculateSuccessChance(
        'Carefully retreat and hide',
        characterState,
        story
      );

      const diplomaticChance = storyManager.calculateSuccessChance(
        'Try to negotiate peacefully',
        characterState,
        story
      );

      // Aggressive should be higher or equal because Strength is 100
      expect(aggressiveChance).toBeGreaterThanOrEqual(cautiousChance);
      
      // Cautious should be higher than diplomatic because Productivity/Concentration > Bargaining
      expect(cautiousChance).toBeGreaterThan(diplomaticChance);
      
      // Aggressive and diplomatic should be different
      expect(aggressiveChance).not.toBe(diplomaticChance);
    });

    test('should give high success for action matching high skill', () => {
      const characterState = {
        age: 30,
        coins: 1000,
        evil: 0,
        rebirthCount: 0,
        currentJob: 'Adventurer',
        skills: [
          { name: 'Strength', level: 1000 }, // Very high strength
          { name: 'Concentration', level: 10 }
        ]
      };

      const story = 'A weak opponent.';

      const aggressiveChance = storyManager.calculateSuccessChance(
        'Attack with all my might!',
        characterState,
        story
      );

      // With 1000 strength, should get +50% bonus (1000/20)
      expect(aggressiveChance).toBeGreaterThanOrEqual(90);
    });

    test('should give low success for action not matching skills', () => {
      const characterState = {
        age: 30,
        coins: 1000,
        evil: 0,
        rebirthCount: 0,
        currentJob: 'Adventurer',
        skills: [
          { name: 'Bargaining', level: 5 }, // Very low skills
          { name: 'Concentration', level: 5 }
        ]
      };

      const story = 'A difficult challenge.';

      const diplomaticChance = storyManager.calculateSuccessChance(
        'Try to persuade them',
        characterState,
        story
      );

      // With very low skills, should have low success
      expect(diplomaticChance).toBeLessThan(60);
    });
  });

  describe('getSkillLevel', () => {
    test('should find skill by exact name', () => {
      const skills = [
        { name: 'Strength', level: 100 },
        { name: 'Concentration', level: 50 }
      ];

      const level = storyManager.getSkillLevel(skills, 'strength');
      expect(level).toBe(100);
    });

    test('should find skill by partial name match', () => {
      const skills = [
        { name: 'Concentration', level: 75 }
      ];

      const level = storyManager.getSkillLevel(skills, 'concent');
      expect(level).toBe(75);
    });

    test('should return 0 for missing skill', () => {
      const skills = [
        { name: 'Strength', level: 100 }
      ];

      const level = storyManager.getSkillLevel(skills, 'magic');
      expect(level).toBe(0);
    });

    test('should handle empty skills array', () => {
      const level = storyManager.getSkillLevel([], 'strength');
      expect(level).toBe(0);
    });

    test('should handle case insensitive matching', () => {
      const skills = [
        { name: 'STRENGTH', level: 100 }
      ];

      const level = storyManager.getSkillLevel(skills, 'strength');
      expect(level).toBe(100);
    });
  });

  describe('calculateSuccessChance - Difficulty Integration', () => {
    test('should reduce success chance for overwhelming odds', () => {
      const characterState = {
        age: 30,
        coins: 1000,
        evil: 0,
        rebirthCount: 0,
        currentJob: 'Adventurer',
        skills: [{ name: 'Strength', level: 100 }]
      };

      const easyStory = 'A single weak guard.';
      const hardStory = 'A hundred powerful warriors surround you.';

      const easyChance = storyManager.calculateSuccessChance(
        'Attack them!',
        characterState,
        easyStory
      );

      const hardChance = storyManager.calculateSuccessChance(
        'Attack them!',
        characterState,
        hardStory
      );

      expect(easyChance).toBeGreaterThan(hardChance);
    });
  });
});
