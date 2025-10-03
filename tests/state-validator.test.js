/**
 * Tests for StateValidator.js - State consistency validation
 * Based on paper insights about 40%+ consistency error rate without validation
 */

import { StateValidator } from '../src/llm/StateValidator.js';
import { GameState } from '../src/core/GameState.js';

describe('StateValidator', () => {
  let validator;
  let gameState;

  beforeEach(() => {
    validator = new StateValidator();
    gameState = new GameState();
  });

  describe('validateInventoryConsistency', () => {
    test('should validate inventory consistency', () => {
      gameState.addItem('sword', 1);
      gameState.addItem('potion', 3);

      const isValid = validator.validateInventoryConsistency(gameState);

      expect(isValid).toBe(true);
    });

    test('should detect negative item quantities', () => {
      gameState.addItem('sword', -1); // Invalid negative quantity

      const isValid = validator.validateInventoryConsistency(gameState);

      expect(isValid).toBe(false);
    });

    test('should detect impossible item usage', () => {
      // Player tries to use item they don't have
      const action = {
        type: 'use_item',
        item: 'potion',
        quantity: 1
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate item usage with sufficient quantity', () => {
      gameState.addItem('potion', 3);

      const action = {
        type: 'use_item',
        item: 'potion',
        quantity: 2
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });
  });

  describe('validateLocationConsistency', () => {
    test('should validate location consistency', () => {
      gameState.setLocation('town');

      const isValid = validator.validateLocationConsistency(gameState);

      expect(isValid).toBe(true);
    });

    test('should detect impossible location changes', () => {
      gameState.setLocation('dungeon');

      const action = {
        type: 'move',
        destination: 'town',
        distance: 100, // Too far to travel in one turn
        timeRequired: 120
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate reasonable location changes', () => {
      gameState.setLocation('town');

      const action = {
        type: 'move',
        destination: 'dungeon',
        distance: 10,
        timeRequired: 30
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });
  });

  describe('validateSkillConsistency', () => {
    test('should validate skill requirements for actions', () => {
      gameState.addSkill('Magic', 10);

      const action = {
        type: 'cast_spell',
        spell: 'healing',
        skillRequired: 'Magic',
        minimumLevel: 8
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });

    test('should detect insufficient skill level', () => {
      gameState.addSkill('Magic', 5);

      const action = {
        type: 'cast_spell',
        spell: 'advanced_healing',
        skillRequired: 'Magic',
        minimumLevel: 10
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate skill prerequisites', () => {
      gameState.addSkill('Strength', 15);
      gameState.addSkill('Dexterity', 12);

      const action = {
        type: 'combat',
        weapon: 'sword',
        skillRequired: 'Strength',
        minimumLevel: 10,
        prerequisites: ['Dexterity', 10]
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });
  });

  describe('validateTimeConsistency', () => {
    test('should validate time-based actions', () => {
      gameState.setTime(120); // 2 minutes

      const action = {
        type: 'shop',
        shop: 'weapon_shop',
        time: 130,
        shopHours: { open: 8, close: 18 }
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });

    test('should detect shop access outside hours', () => {
      gameState.setTime(1200); // 20 minutes (8 PM)

      const action = {
        type: 'shop',
        shop: 'weapon_shop',
        time: 1200,
        shopHours: { open: 8, close: 18 }
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate time progression', () => {
      gameState.setTime(100);

      const action = {
        type: 'wait',
        duration: 60,
        newTime: 160
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });
  });

  describe('validateReputationConsistency', () => {
    test('should validate reputation-based actions', () => {
      gameState.setReputation(50);

      const action = {
        type: 'dialogue',
        npc: 'merchant',
        reputationRequired: 40,
        reputationEffect: 5
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });

    test('should detect insufficient reputation', () => {
      gameState.setReputation(20);

      const action = {
        type: 'dialogue',
        npc: 'noble',
        reputationRequired: 60,
        reputationEffect: 0
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate reputation changes', () => {
      gameState.setReputation(50);

      const action = {
        type: 'help_citizen',
        reputationEffect: 10,
        newReputation: 60
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });
  });

  describe('validateResourceConsistency', () => {
    test('should validate resource spending', () => {
      gameState.setCoins(1000);

      const action = {
        type: 'purchase',
        item: 'sword',
        cost: 500
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });

    test('should detect insufficient resources', () => {
      gameState.setCoins(100);

      const action = {
        type: 'purchase',
        item: 'expensive_sword',
        cost: 500
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate mana usage', () => {
      gameState.setMana(50);

      const action = {
        type: 'cast_spell',
        spell: 'healing',
        manaCost: 10
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(true);
    });

    test('should detect insufficient mana', () => {
      gameState.setMana(5);

      const action = {
        type: 'cast_spell',
        spell: 'powerful_healing',
        manaCost: 20
      };

      const isValid = validator.validateActionAgainstState(action, gameState);

      expect(isValid).toBe(false);
    });
  });

  describe('validateStateTransition', () => {
    test('should validate complete state transition', () => {
      const initialState = new GameState();
      initialState.setHealth(100);
      initialState.setMana(50);
      initialState.setCoins(1000);
      initialState.addItem('potion', 3);

      const action = {
        type: 'combat',
        outcome: 'victory',
        healthChange: -20,
        manaChange: -10,
        coinReward: 200,
        itemReward: { potion: 1 }
      };

      const newState = new GameState();
      newState.setHealth(80);
      newState.setMana(40);
      newState.setCoins(1200);
      newState.addItem('potion', 4);

      const isValid = validator.validateStateTransition(initialState, newState, action);

      expect(isValid).toBe(true);
    });

    test('should detect invalid state transition', () => {
      const initialState = new GameState();
      initialState.setHealth(100);
      initialState.setMana(50);

      const action = {
        type: 'combat',
        outcome: 'victory',
        healthChange: -20,
        manaChange: -10
      };

      const newState = new GameState();
      newState.setHealth(90); // Should be 80, not 90
      newState.setMana(40);

      const isValid = validator.validateStateTransition(initialState, newState, action);

      expect(isValid).toBe(false);
    });
  });

  describe('validateLLMOutput', () => {
    test('should validate LLM narrative against game state', () => {
      gameState.setLocation('dungeon');
      gameState.setHealth(80);
      gameState.addItem('sword', 1);

      const llmOutput = {
        narrative: "You swing your sword at the dragon, dealing damage.",
        stateChanges: {
          health: -10,
          location: 'dungeon'
        }
      };

      const isValid = validator.validateLLMOutput(llmOutput, gameState);

      expect(isValid).toBe(true);
    });

    test('should detect LLM output inconsistencies', () => {
      gameState.setLocation('town');
      gameState.setHealth(100);
      gameState.addItem('sword', 0); // No sword

      const llmOutput = {
        narrative: "You swing your sword at the dragon, dealing damage.",
        stateChanges: {
          health: -10,
          location: 'dungeon'
        }
      };

      const isValid = validator.validateLLMOutput(llmOutput, gameState);

      expect(isValid).toBe(false);
    });

    test('should validate LLM output against world rules', () => {
      gameState.setTime(1200); // 8 PM
      gameState.setLocation('town');

      const llmOutput = {
        narrative: "You enter the weapon shop and buy a sword.",
        stateChanges: {
          location: 'weapon_shop',
          coins: -100
        }
      };

      const isValid = validator.validateLLMOutput(llmOutput, gameState);

      expect(isValid).toBe(false); // Shop closed at night
    });
  });

  describe('getValidationReport', () => {
    test('should generate comprehensive validation report', () => {
      gameState.setHealth(100);
      gameState.setMana(50);
      gameState.setCoins(1000);
      gameState.addItem('sword', 1);

      const report = validator.getValidationReport(gameState);

      expect(report).toHaveProperty('overall', true);
      expect(report).toHaveProperty('inventory', true);
      expect(report).toHaveProperty('location', true);
      expect(report).toHaveProperty('skills', true);
      expect(report).toHaveProperty('time', true);
      expect(report).toHaveProperty('reputation', true);
      expect(report).toHaveProperty('resources', true);
    });

    test('should identify specific validation issues', () => {
      gameState.setHealth(-10); // Invalid health
      gameState.setMana(150); // Invalid mana
      gameState.addItem('sword', -1); // Invalid item quantity

      const report = validator.getValidationReport(gameState);

      expect(report.overall).toBe(false);
      expect(report.issues).toContain('health');
      expect(report.issues).toContain('mana');
      expect(report.issues).toContain('inventory');
    });
  });

  describe('getConsistencyMetrics', () => {
    test('should calculate consistency metrics', () => {
      const actions = [
        { type: 'combat', valid: true },
        { type: 'magic', valid: true },
        { type: 'dialogue', valid: false },
        { type: 'movement', valid: true }
      ];

      const metrics = validator.getConsistencyMetrics(actions);

      expect(metrics).toHaveProperty('totalActions', 4);
      expect(metrics).toHaveProperty('validActions', 3);
      expect(metrics).toHaveProperty('invalidActions', 1);
      expect(metrics).toHaveProperty('consistencyRate', 0.75);
    });
  });
});
