/**
 * Tests for StateEncoder.js - Structured state representation for LLM
 * Based on paper insights about JSON representation improving LLM accuracy
 */

import { StateEncoder } from '../src/llm/StateEncoder.js';
import { GameState } from '../src/core/GameState.js';

describe('StateEncoder', () => {
  let gameState;
  let stateEncoder;

  beforeEach(() => {
    gameState = new GameState();
    stateEncoder = new StateEncoder();
  });

  describe('encodeGameState', () => {
    test('should encode basic game state to structured JSON', () => {
      // Setup initial state
      gameState.setPlayerName('TestPlayer');
      gameState.setAge(25);
      gameState.setLocation('town');
      gameState.addSkill('Strength', 10);
      gameState.addItem('sword', 1);

      const encoded = stateEncoder.encodeGameState(gameState);

      expect(encoded).toHaveProperty('player');
      expect(encoded).toHaveProperty('world');
      expect(encoded).toHaveProperty('inventory');
      expect(encoded).toHaveProperty('skills');
      expect(encoded).toHaveProperty('location');
      expect(encoded).toHaveProperty('time');
    });

    test('should include all player properties', () => {
      gameState.setPlayerName('Hero');
      gameState.setAge(30);
      gameState.setHealth(100);
      gameState.setMana(50);
      gameState.setCoins(1000);

      const encoded = stateEncoder.encodeGameState(gameState);
      const player = encoded.player;

      expect(player.name).toBe('Hero');
      expect(player.age).toBe(30);
      expect(player.health).toBe(100);
      expect(player.mana).toBe(50);
      expect(player.coins).toBe(1000);
    });

    test('should encode skills with levels and experience', () => {
      gameState.addSkill('Strength', 15);
      gameState.addSkill('Magic', 8);
      gameState.addSkill('Dexterity', 12);

      const encoded = stateEncoder.encodeGameState(gameState);
      const skills = encoded.skills;

      expect(skills.Strength).toEqual({ level: 15, experience: 0 });
      expect(skills.Magic).toEqual({ level: 8, experience: 0 });
      expect(skills.Dexterity).toEqual({ level: 12, experience: 0 });
    });

    test('should encode inventory with quantities', () => {
      gameState.addItem('sword', 1);
      gameState.addItem('potion', 5);
      gameState.addItem('gold', 100);

      const encoded = stateEncoder.encodeGameState(gameState);
      const inventory = encoded.inventory;

      expect(inventory.sword).toBe(1);
      expect(inventory.potion).toBe(5);
      expect(inventory.gold).toBe(100);
    });

    test('should encode world state including location and NPCs', () => {
      gameState.setLocation('dungeon');
      gameState.setWorldCondition('dark', true);
      gameState.setWorldCondition('dangerous', true);

      const encoded = stateEncoder.encodeGameState(gameState);
      const world = encoded.world;

      expect(world.location).toBe('dungeon');
      expect(world.conditions).toEqual({
        dark: true,
        dangerous: true
      });
    });

    test('should include time and progression state', () => {
      gameState.setTime(120); // 2 minutes
      gameState.setLevel(5);
      gameState.setReputation(75);

      const encoded = stateEncoder.encodeGameState(gameState);

      expect(encoded.time).toBe(120);
      expect(encoded.level).toBe(5);
      expect(encoded.reputation).toBe(75);
    });
  });

  describe('decodeGameState', () => {
    test('should decode JSON back to game state', () => {
      const jsonState = {
        player: {
          name: 'TestPlayer',
          age: 25,
          health: 100,
          mana: 50,
          coins: 500
        },
        skills: {
          Strength: { level: 10, experience: 0 },
          Magic: { level: 5, experience: 0 }
        },
        inventory: {
          sword: 1,
          potion: 3
        },
        world: {
          location: 'town',
          conditions: { safe: true }
        },
        time: 60,
        level: 3,
        reputation: 50
      };

      const decodedState = stateEncoder.decodeGameState(jsonState);

      expect(decodedState.getPlayerName()).toBe('TestPlayer');
      expect(decodedState.getAge()).toBe(25);
      expect(decodedState.getHealth()).toBe(100);
      expect(decodedState.getMana()).toBe(50);
      expect(decodedState.getCoins()).toBe(500);
      expect(decodedState.getLocation()).toBe('town');
      expect(decodedState.getTime()).toBe(60);
      expect(decodedState.getLevel()).toBe(3);
      expect(decodedState.getReputation()).toBe(50);
    });

    test('should handle missing properties gracefully', () => {
      const incompleteJson = {
        player: { name: 'Test' }
      };

      const decodedState = stateEncoder.decodeGameState(incompleteJson);

      expect(decodedState.getPlayerName()).toBe('Test');
      expect(decodedState.getAge()).toBe(0); // default value
      expect(decodedState.getHealth()).toBe(100); // default value
    });
  });

  describe('getStateSchema', () => {
    test('should return structured schema for LLM prompts', () => {
      const schema = stateEncoder.getStateSchema();

      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('player');
      expect(schema.properties).toHaveProperty('world');
      expect(schema.properties).toHaveProperty('inventory');
      expect(schema.properties).toHaveProperty('skills');
    });

    test('should include validation rules in schema', () => {
      const schema = stateEncoder.getStateSchema();

      expect(schema.properties.player.properties.health).toHaveProperty('minimum', 0);
      expect(schema.properties.player.properties.health).toHaveProperty('maximum', 100);
      expect(schema.properties.player.properties.age).toHaveProperty('minimum', 0);
    });
  });

  describe('validateState', () => {
    test('should validate state against schema', () => {
      const validState = {
        player: { name: 'Test', age: 25, health: 100 },
        world: { location: 'town' },
        inventory: {},
        skills: {}
      };

      const isValid = stateEncoder.validateState(validState);
      expect(isValid).toBe(true);
    });

    test('should reject invalid state', () => {
      const invalidState = {
        player: { name: 'Test', age: -5, health: 150 }, // negative age, health > 100
        world: { location: 'town' },
        inventory: {},
        skills: {}
      };

      const isValid = stateEncoder.validateState(invalidState);
      expect(isValid).toBe(false);
    });
  });

  describe('getStateForLLM', () => {
    test('should return formatted state for LLM consumption', () => {
      gameState.setPlayerName('Hero');
      gameState.setLocation('dungeon');
      gameState.addSkill('Strength', 10);
      gameState.addItem('sword', 1);

      const llmState = stateEncoder.getStateForLLM(gameState);

      expect(llmState).toHaveProperty('currentState');
      expect(llmState).toHaveProperty('schema');
      expect(llmState).toHaveProperty('instructions');
      expect(llmState.instructions).toContain('JSON');
      expect(llmState.instructions).toContain('structured');
    });

    test('should include context about what LLM should focus on', () => {
      const llmState = stateEncoder.getStateForLLM(gameState);

      expect(llmState.instructions).toContain('narrative');
      expect(llmState.instructions).toContain('story');
      expect(llmState.instructions).toContain('dialogue');
    });
  });
});
