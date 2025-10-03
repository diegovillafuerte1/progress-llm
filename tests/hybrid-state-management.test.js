/**
 * Integration tests for hybrid state management system
 * Tests the complete integration of all paper-based improvements
 */

import { StateEncoder } from '../src/llm/StateEncoder.js';
import { StateDiff } from '../src/llm/StateDiff.js';
import { TransitionClassifier } from '../src/llm/TransitionClassifier.js';
import { WorldRules } from '../src/llm/WorldRules.js';
import { StateValidator } from '../src/llm/StateValidator.js';
import { EnvironmentSimulator } from '../src/core/EnvironmentSimulator.js';
import { GameState } from '../src/core/GameState.js';

describe('Hybrid State Management System', () => {
  let stateEncoder;
  let stateDiff;
  let transitionClassifier;
  let worldRules;
  let stateValidator;
  let environmentSimulator;
  let gameState;

  beforeEach(() => {
    stateEncoder = new StateEncoder();
    stateDiff = new StateDiff();
    transitionClassifier = new TransitionClassifier();
    worldRules = new WorldRules();
    stateValidator = new StateValidator();
    environmentSimulator = new EnvironmentSimulator();
    gameState = new GameState();
  });

  describe('Complete State Management Flow', () => {
    test('should handle action-driven transition with full validation', () => {
      // Setup initial state
      gameState.setPlayerName('Hero');
      gameState.setHealth(100);
      gameState.setMana(50);
      gameState.setLocation('dungeon');
      gameState.addSkill('Strength', 10);
      gameState.addItem('sword', 1);

      // Encode state for LLM
      const encodedState = stateEncoder.encodeGameState(gameState);
      expect(encodedState).toHaveProperty('player');
      expect(encodedState).toHaveProperty('world');

      // Classify action as action-driven
      const action = {
        type: 'combat',
        playerChoice: 'attack',
        target: 'dragon',
        weapon: 'sword'
      };

      const classification = transitionClassifier.classifyTransition(action, gameState);
      expect(classification.type).toBe('action-driven');
      expect(classification.requiresLLM).toBe(true);

      // Validate action against rules
      const isValid = worldRules.validateAction(action);
      expect(isValid).toBe(true);

      // Simulate combat outcome (code-determined)
      const combatResult = {
        success: true,
        damage: 25,
        experience: 50
      };

      // Apply state changes
      gameState.setHealth(gameState.getHealth() - 15); // Player takes damage
      gameState.addSkill('Strength', 1); // Gain experience
      gameState.setTime(gameState.getTime() + 30); // Combat takes time

      // Calculate state diff
      const initialState = new GameState();
      initialState.setPlayerName('Hero');
      initialState.setHealth(100);
      initialState.setMana(50);
      initialState.setLocation('dungeon');
      initialState.addSkill('Strength', 10);
      initialState.addItem('sword', 1);

      const diff = stateDiff.calculateDiff(initialState, gameState);
      expect(diff.changes.health).toBeDefined();
      expect(diff.changes.skills.Strength).toBeDefined();

      // Validate final state
      const validationReport = stateValidator.getValidationReport(gameState);
      expect(validationReport.overall).toBe(true);
    });

    test('should handle environment-driven transition with simulation', () => {
      // Setup initial state
      gameState.setTime(100);
      gameState.setLocation('town');
      gameState.setHealth(80);
      gameState.setWeather('sunny');

      // Classify as environment-driven
      const action = {
        type: 'time_passage',
        duration: 120,
        automatic: true
      };

      const classification = transitionClassifier.classifyTransition(action, gameState);
      expect(classification.type).toBe('environment-driven');
      expect(classification.requiresCode).toBe(true);

      // Simulate environment changes
      const timeResult = environmentSimulator.simulateTimePassage(gameState, 120);
      expect(timeResult.newTime).toBe(220);
      expect(timeResult.effects.timeAdvanced).toBe(true);

      const weatherResult = environmentSimulator.simulateWeatherChanges(gameState);
      expect(weatherResult.effects.weatherChanged).toBe(true);

      const npcResult = environmentSimulator.simulateNPCBehavior(gameState);
      expect(npcResult.effects.npcBehaviorChanged).toBe(true);

      // Apply environment changes
      gameState.setTime(timeResult.newTime);
      gameState.setWeather(weatherResult.newWeather);

      // Validate final state
      const validationReport = stateValidator.getValidationReport(gameState);
      expect(validationReport.overall).toBe(true);
    });

    test('should handle hybrid transition with both LLM and code', () => {
      // Setup initial state
      gameState.setPlayerName('Hero');
      gameState.setHealth(100);
      gameState.setMana(50);
      gameState.addSkill('Magic', 8);
      gameState.setLocation('dungeon');

      // Classify as hybrid
      const action = {
        type: 'skill_check',
        skill: 'Magic',
        difficulty: 15,
        playerChoice: 'cast_healing_spell'
      };

      const classification = transitionClassifier.classifyTransition(action, gameState);
      expect(classification.type).toBe('hybrid');
      expect(classification.requiresLLM).toBe(true);
      expect(classification.requiresCode).toBe(true);

      // Code determines success
      const skillLevel = gameState.getSkillLevel('Magic');
      const success = skillLevel >= action.difficulty;
      const manaCost = 10;

      // Apply mechanical changes
      if (success) {
        gameState.setHealth(Math.min(100, gameState.getHealth() + 20));
        gameState.setMana(gameState.getMana() - manaCost);
        gameState.addSkill('Magic', 1); // Gain experience
      } else {
        gameState.setMana(gameState.getMana() - manaCost); // Still costs mana
      }

      // LLM would generate narrative based on outcome
      const llmState = stateEncoder.getStateForLLM(gameState);
      expect(llmState).toHaveProperty('currentState');
      expect(llmState).toHaveProperty('instructions');

      // Validate final state
      const validationReport = stateValidator.getValidationReport(gameState);
      expect(validationReport.overall).toBe(true);
    });
  });

  describe('State Consistency Validation', () => {
    test('should detect and prevent state inconsistencies', () => {
      // Setup state with inconsistency
      gameState.setHealth(150); // Invalid health > 100
      gameState.setMana(-10); // Invalid negative mana
      gameState.addItem('sword', -1); // Invalid negative quantity

      // Validate state
      const validationReport = stateValidator.getValidationReport(gameState);
      expect(validationReport.overall).toBe(false);
      expect(validationReport.issues).toContain('resources');
      expect(validationReport.issues).toContain('inventory');
    });

    test('should validate LLM output against game state', () => {
      // Setup state
      gameState.setHealth(80);
      gameState.setMana(5);
      gameState.addItem('sword', 0); // No sword

      // Invalid LLM output
      const invalidLLMOutput = {
        narrative: "You swing your sword at the dragon, dealing massive damage.",
        stateChanges: {
          health: -20,
          location: 'dungeon'
        }
      };

      const isValid = stateValidator.validateLLMOutput(invalidLLMOutput, gameState);
      expect(isValid).toBe(false);
    });

    test('should validate action against current state', () => {
      // Setup state
      gameState.setMana(5);
      gameState.addItem('potion', 0);

      // Invalid actions
      const invalidActions = [
        {
          type: 'cast_spell',
          spell: 'healing',
          manaCost: 20 // Insufficient mana
        },
        {
          type: 'use_item',
          item: 'potion',
          quantity: 1 // Don't have potion
        }
      ];

      for (const action of invalidActions) {
        const isValid = stateValidator.validateActionAgainstState(action, gameState);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('State Encoding and Decoding', () => {
    test('should maintain state integrity through encoding/decoding', () => {
      // Setup complex state
      gameState.setPlayerName('TestHero');
      gameState.setAge(25);
      gameState.setHealth(80);
      gameState.setMana(60);
      gameState.setCoins(1000);
      gameState.setLocation('dungeon');
      gameState.setTime(300);
      gameState.setReputation(75);
      gameState.addSkill('Strength', 15);
      gameState.addSkill('Magic', 12);
      gameState.addItem('sword', 1);
      gameState.addItem('potion', 5);

      // Encode state
      const encodedState = stateEncoder.encodeGameState(gameState);
      expect(encodedState).toHaveProperty('player');
      expect(encodedState).toHaveProperty('skills');
      expect(encodedState).toHaveProperty('inventory');

      // Decode state
      const decodedState = stateEncoder.decodeGameState(encodedState);
      expect(decodedState.getPlayerName()).toBe('TestHero');
      expect(decodedState.getAge()).toBe(25);
      expect(decodedState.getHealth()).toBe(80);
      expect(decodedState.getMana()).toBe(60);
      expect(decodedState.getCoins()).toBe(1000);
      expect(decodedState.getLocation()).toBe('dungeon');
      expect(decodedState.getTime()).toBe(300);
      expect(decodedState.getReputation()).toBe(75);
      expect(decodedState.getSkillLevel('Strength')).toBe(15);
      expect(decodedState.getSkillLevel('Magic')).toBe(12);
      expect(decodedState.getItemCount('sword')).toBe(1);
      expect(decodedState.getItemCount('potion')).toBe(5);
    });

    test('should validate encoded state against schema', () => {
      const validState = {
        player: {
          name: 'TestHero',
          age: 25,
          health: 80,
          mana: 60,
          coins: 1000,
          level: 5,
          reputation: 75
        },
        skills: {
          Strength: { level: 15, experience: 0 },
          Magic: { level: 12, experience: 0 }
        },
        inventory: {
          sword: 1,
          potion: 5
        },
        world: {
          location: 'dungeon',
          conditions: { dark: true },
          time: 300
        }
      };

      const isValid = stateEncoder.validateState(validState);
      expect(isValid).toBe(true);
    });
  });

  describe('State Difference Tracking', () => {
    test('should track and apply state differences efficiently', () => {
      // Setup initial state
      const initialState = new GameState();
      initialState.setPlayerName('Hero');
      initialState.setHealth(100);
      initialState.setMana(50);
      initialState.setLocation('town');
      initialState.addSkill('Strength', 10);
      initialState.addItem('sword', 1);

      // Create new state with changes
      const newState = new GameState();
      newState.setPlayerName('Hero');
      newState.setHealth(80); // Changed
      newState.setMana(40); // Changed
      newState.setLocation('dungeon'); // Changed
      newState.addSkill('Strength', 12); // Changed
      newState.addItem('sword', 1);
      newState.addItem('potion', 3); // Added

      // Calculate diff
      const diff = stateDiff.calculateDiff(initialState, newState);
      expect(diff.changes.health).toBeDefined();
      expect(diff.changes.mana).toBeDefined();
      expect(diff.changes.location).toBeDefined();
      expect(diff.changes.skills.Strength).toBeDefined();
      expect(diff.additions.inventory.potion).toBe(3);

      // Apply diff to initial state
      const resultState = stateDiff.applyDiff(initialState, diff);
      expect(resultState.getHealth()).toBe(80);
      expect(resultState.getMana()).toBe(40);
      expect(resultState.getLocation()).toBe('dungeon');
      expect(resultState.getSkillLevel('Strength')).toBe(12);
      expect(resultState.getItemCount('potion')).toBe(3);
    });

    test('should merge multiple diffs correctly', () => {
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
      expect(merged.changes.health).toBeDefined();
      expect(merged.changes.location).toBeDefined();
      expect(merged.additions.inventory.potion).toBe(1);
      expect(merged.additions.inventory.gold).toBe(100);
    });
  });

  describe('World Rules Integration', () => {
    test('should provide comprehensive rules for LLM', () => {
      const llmRules = worldRules.getRulesForLLM();
      expect(llmRules).toHaveProperty('systemPrompt');
      expect(llmRules).toHaveProperty('rules');
      expect(llmRules).toHaveProperty('examples');

      expect(llmRules.rules).toHaveProperty('combat');
      expect(llmRules.rules).toHaveProperty('magic');
      expect(llmRules.rules).toHaveProperty('time');
      expect(llmRules.rules).toHaveProperty('reputation');
    });

    test('should validate actions against world rules', () => {
      const validAction = {
        type: 'combat',
        action: 'attack',
        weapon: 'sword',
        skill: 'Strength',
        level: 10
      };

      const isValid = worldRules.validateAction(validAction);
      expect(isValid).toBe(true);

      const invalidAction = {
        type: 'combat',
        action: 'attack',
        weapon: null, // No weapon
        skill: 'Strength',
        level: 10
      };

      const isInvalid = worldRules.validateAction(invalidAction);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Environment Simulation', () => {
    test('should simulate comprehensive world changes', () => {
      gameState.setTime(100);
      gameState.setLocation('town');
      gameState.setHealth(80);
      gameState.setWeather('sunny');

      const report = environmentSimulator.getSimulationReport(gameState);
      expect(report).toHaveProperty('timeEffects');
      expect(report).toHaveProperty('weatherEffects');
      expect(report).toHaveProperty('npcEffects');
      expect(report).toHaveProperty('worldEvents');
      expect(report).toHaveProperty('economicChanges');
      expect(report).toHaveProperty('healthEffects');
      expect(report).toHaveProperty('reputationEffects');
    });

    test('should validate simulation results', () => {
      const validSimulation = {
        newTime: 160,
        healthChange: -5,
        reputationChange: 2,
        effects: {
          timeAdvanced: true,
          healthAffected: true
        }
      };

      const isValid = environmentSimulator.validateSimulation(validSimulation);
      expect(isValid).toBe(true);

      const invalidSimulation = {
        newTime: -10, // Invalid negative time
        healthChange: 150, // Invalid health > 100
        reputationChange: 200, // Invalid reputation > 100
        effects: {
          timeAdvanced: true
        }
      };

      const isInvalid = environmentSimulator.validateSimulation(invalidSimulation);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Performance and Efficiency', () => {
    test('should handle multiple rapid state changes efficiently', () => {
      const startTime = Date.now();
      
      // Perform multiple state operations
      for (let i = 0; i < 100; i++) {
        gameState.setHealth(100 - i);
        gameState.setMana(50 + i);
        gameState.setTime(i * 10);
        
        const encoded = stateEncoder.encodeGameState(gameState);
        const isValid = stateEncoder.validateState(encoded);
        expect(isValid).toBe(true);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    test('should maintain state consistency under load', () => {
      const states = [];
      
      // Generate multiple states
      for (let i = 0; i < 50; i++) {
        const state = new GameState();
        state.setPlayerName(`Hero${i}`);
        state.setHealth(100 - i);
        state.setMana(50 + i);
        state.setLocation(i % 2 === 0 ? 'town' : 'dungeon');
        states.push(state);
      }
      
      // Validate all states
      for (const state of states) {
        const validationReport = stateValidator.getValidationReport(state);
        expect(validationReport.overall).toBe(true);
      }
    });
  });
});
