/**
 * Tests for StateDiff.js - State difference tracking for efficiency
 * Based on paper insights about state difference prediction being more efficient
 */

import { StateDiff } from '../src/llm/StateDiff.js';
import { GameState } from '../src/core/GameState.js';

describe('StateDiff', () => {
  let stateDiff;
  let initialState;
  let updatedState;

  beforeEach(() => {
    stateDiff = new StateDiff();
    initialState = new GameState();
    updatedState = new GameState();
  });

  describe('calculateDiff', () => {
    test('should identify changes between two states', () => {
      // Initial state
      initialState.setPlayerName('Hero');
      initialState.setHealth(100);
      initialState.setLocation('town');
      initialState.addSkill('Strength', 10);
      initialState.addItem('sword', 1);

      // Updated state
      updatedState.setPlayerName('Hero');
      updatedState.setHealth(80); // Changed
      updatedState.setLocation('dungeon'); // Changed
      updatedState.addSkill('Strength', 12); // Changed
      updatedState.addItem('sword', 1);
      updatedState.addItem('potion', 3); // Added

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff).toHaveProperty('changes');
      expect(diff).toHaveProperty('additions');
      expect(diff).toHaveProperty('removals');
      expect(diff).toHaveProperty('modifications');
    });

    test('should track health changes', () => {
      initialState.setHealth(100);
      updatedState.setHealth(80);

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff.changes.health).toEqual({
        from: 100,
        to: 80,
        delta: -20
      });
    });

    test('should track location changes', () => {
      initialState.setLocation('town');
      updatedState.setLocation('dungeon');

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff.changes.location).toEqual({
        from: 'town',
        to: 'dungeon'
      });
    });

    test('should track skill level changes', () => {
      initialState.addSkill('Strength', 10);
      updatedState.addSkill('Strength', 12);

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff.changes.skills.Strength).toEqual({
        from: 10,
        to: 12,
        delta: 2
      });
    });

    test('should track inventory changes', () => {
      initialState.addItem('sword', 1);
      updatedState.addItem('sword', 1);
      updatedState.addItem('potion', 3);

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff.additions.inventory).toContain('potion');
      expect(diff.additions.inventory.potion).toBe(3);
    });

    test('should track item quantity changes', () => {
      initialState.addItem('potion', 5);
      updatedState.addItem('potion', 3);

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff.changes.inventory.potion).toEqual({
        from: 5,
        to: 3,
        delta: -2
      });
    });

    test('should track item removals', () => {
      initialState.addItem('sword', 1);
      initialState.addItem('potion', 3);
      updatedState.addItem('potion', 3);

      const diff = stateDiff.calculateDiff(initialState, updatedState);

      expect(diff.removals.inventory).toContain('sword');
    });
  });

  describe('applyDiff', () => {
    test('should apply diff to a state', () => {
      const diff = {
        changes: {
          health: { from: 100, to: 80, delta: -20 },
          location: { from: 'town', to: 'dungeon' }
        },
        additions: {
          inventory: { potion: 3 }
        },
        modifications: {
          skills: { Strength: { from: 10, to: 12, delta: 2 } }
        }
      };

      const result = stateDiff.applyDiff(initialState, diff);

      expect(result.getHealth()).toBe(80);
      expect(result.getLocation()).toBe('dungeon');
      expect(result.getItemCount('potion')).toBe(3);
      expect(result.getSkillLevel('Strength')).toBe(12);
    });

    test('should handle empty diff', () => {
      const emptyDiff = {
        changes: {},
        additions: {},
        removals: {},
        modifications: {}
      };

      const result = stateDiff.applyDiff(initialState, emptyDiff);

      expect(result.getHealth()).toBe(initialState.getHealth());
      expect(result.getLocation()).toBe(initialState.getLocation());
    });
  });

  describe('getDiffForLLM', () => {
    test('should format diff for LLM consumption', () => {
      const diff = {
        changes: {
          health: { from: 100, to: 80, delta: -20 },
          location: { from: 'town', to: 'dungeon' }
        },
        additions: {
          inventory: { potion: 3 }
        }
      };

      const llmDiff = stateDiff.getDiffForLLM(diff);

      expect(llmDiff).toHaveProperty('summary');
      expect(llmDiff).toHaveProperty('changes');
      expect(llmDiff).toHaveProperty('instructions');
      expect(llmDiff.instructions).toContain('narrative');
      expect(llmDiff.instructions).toContain('describe');
    });

    test('should include context about what changed', () => {
      const diff = {
        changes: {
          health: { from: 100, to: 80, delta: -20 }
        }
      };

      const llmDiff = stateDiff.getDiffForLLM(diff);

      expect(llmDiff.summary).toContain('health');
      expect(llmDiff.summary).toContain('decreased');
    });
  });

  describe('validateDiff', () => {
    test('should validate diff structure', () => {
      const validDiff = {
        changes: { health: { from: 100, to: 80, delta: -20 } },
        additions: {},
        removals: {},
        modifications: {}
      };

      const isValid = stateDiff.validateDiff(validDiff);
      expect(isValid).toBe(true);
    });

    test('should reject invalid diff structure', () => {
      const invalidDiff = {
        changes: { health: { from: 100 } }, // missing 'to' and 'delta'
        additions: {},
        removals: {},
        modifications: {}
      };

      const isValid = stateDiff.validateDiff(invalidDiff);
      expect(isValid).toBe(false);
    });
  });

  describe('getDiffMetrics', () => {
    test('should calculate diff statistics', () => {
      const diff = {
        changes: {
          health: { from: 100, to: 80, delta: -20 },
          location: { from: 'town', to: 'dungeon' }
        },
        additions: {
          inventory: { potion: 3, gold: 100 }
        },
        removals: {
          inventory: { sword: 1 }
        },
        modifications: {
          skills: { Strength: { from: 10, to: 12, delta: 2 } }
        }
      };

      const metrics = stateDiff.getDiffMetrics(diff);

      expect(metrics).toHaveProperty('totalChanges', 4);
      expect(metrics).toHaveProperty('additions', 2);
      expect(metrics).toHaveProperty('removals', 1);
      expect(metrics).toHaveProperty('modifications', 1);
      expect(metrics).toHaveProperty('complexity', 'medium');
    });

    test('should classify diff complexity', () => {
      const simpleDiff = {
        changes: { health: { from: 100, to: 80, delta: -20 } },
        additions: {},
        removals: {},
        modifications: {}
      };

      const metrics = stateDiff.getDiffMetrics(simpleDiff);
      expect(metrics.complexity).toBe('low');

      const complexDiff = {
        changes: {
          health: { from: 100, to: 80, delta: -20 },
          location: { from: 'town', to: 'dungeon' },
          mana: { from: 50, to: 30, delta: -20 }
        },
        additions: {
          inventory: { potion: 3, gold: 100, key: 1 }
        },
        removals: {
          inventory: { sword: 1, shield: 1 }
        },
        modifications: {
          skills: { Strength: { from: 10, to: 12, delta: 2 }, Magic: { from: 5, to: 7, delta: 2 } }
        }
      };

      const complexMetrics = stateDiff.getDiffMetrics(complexDiff);
      expect(complexMetrics.complexity).toBe('high');
    });
  });

  describe('mergeDiffs', () => {
    test('should merge multiple diffs', () => {
      const diff1 = {
        changes: { health: { from: 100, to: 80, delta: -20 } },
        additions: { inventory: { potion: 1 } },
        removals: {},
        modifications: {}
      };

      const diff2 = {
        changes: { location: { from: 'town', to: 'dungeon' } },
        additions: { inventory: { gold: 100 } },
        removals: {},
        modifications: {}
      };

      const merged = stateDiff.mergeDiffs([diff1, diff2]);

      expect(merged.changes).toHaveProperty('health');
      expect(merged.changes).toHaveProperty('location');
      expect(merged.additions.inventory.potion).toBe(1);
      expect(merged.additions.inventory.gold).toBe(100);
    });

    test('should handle conflicting changes', () => {
      const diff1 = {
        changes: { health: { from: 100, to: 80, delta: -20 } },
        additions: {},
        removals: {},
        modifications: {}
      };

      const diff2 = {
        changes: { health: { from: 80, to: 90, delta: 10 } },
        additions: {},
        removals: {},
        modifications: {}
      };

      const merged = stateDiff.mergeDiffs([diff1, diff2]);

      // Should use the final value
      expect(merged.changes.health.to).toBe(90);
    });
  });
});
