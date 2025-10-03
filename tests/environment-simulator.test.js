/**
 * Tests for EnvironmentSimulator.js - Reliable world-driven transitions
 * Based on paper insights about environment-driven transitions being more reliable with code
 */

import { EnvironmentSimulator } from '../src/core/EnvironmentSimulator.js';
import { GameState } from '../src/core/GameState.js';

describe('EnvironmentSimulator', () => {
  let simulator;
  let gameState;

  beforeEach(() => {
    simulator = new EnvironmentSimulator();
    gameState = new GameState();
  });

  describe('simulateTimePassage', () => {
    test('should advance time and apply time-based effects', () => {
      gameState.setTime(100);
      gameState.setLocation('town');

      const result = simulator.simulateTimePassage(gameState, 60);

      expect(result.newTime).toBe(160);
      expect(result.effects).toHaveProperty('timeAdvanced', true);
    });

    test('should handle day/night transitions', () => {
      gameState.setTime(1080); // 18:00 (6 PM)
      gameState.setLocation('town');

      const result = simulator.simulateTimePassage(gameState, 120);

      expect(result.newTime).toBe(1200); // 20:00 (8 PM)
      expect(result.effects).toHaveProperty('dayNightTransition', true);
      expect(result.effects).toHaveProperty('shopsClosed', true);
    });

    test('should apply aging effects', () => {
      gameState.setAge(25);
      gameState.setTime(100);

      const result = simulator.simulateTimePassage(gameState, 1440); // 24 hours

      expect(result.effects).toHaveProperty('ageIncreased', true);
      expect(result.newAge).toBe(26);
    });
  });

  describe('simulateWeatherChanges', () => {
    test('should apply weather effects to movement', () => {
      gameState.setLocation('wilderness');
      gameState.setWeather('rain');

      const result = simulator.simulateWeatherChanges(gameState);

      expect(result.effects).toHaveProperty('movementPenalty', true);
      expect(result.effects).toHaveProperty('clothingWet', true);
    });

    test('should handle weather transitions', () => {
      gameState.setWeather('sunny');
      gameState.setLocation('wilderness');

      const result = simulator.simulateWeatherChanges(gameState);

      expect(result.effects).toHaveProperty('weatherChanged', true);
      expect(result.newWeather).toBeDefined();
    });

    test('should apply weather-based health effects', () => {
      gameState.setHealth(100);
      gameState.setWeather('storm');
      gameState.setLocation('wilderness');

      const result = simulator.simulateWeatherChanges(gameState);

      expect(result.effects).toHaveProperty('healthAffected', true);
      expect(result.healthChange).toBeLessThan(0);
    });
  });

  describe('simulateNPCBehavior', () => {
    test('should simulate guard patrols', () => {
      gameState.setTime(1200); // 8 PM
      gameState.setLocation('town');
      gameState.setReputation(50);

      const result = simulator.simulateNPCBehavior(gameState);

      expect(result.effects).toHaveProperty('guardsPatrolling', true);
      expect(result.effects).toHaveProperty('safetyLevel', 'high');
    });

    test('should handle hostile NPCs based on reputation', () => {
      gameState.setReputation(80); // High evil reputation
      gameState.setLocation('town');
      gameState.setTime(1200);

      const result = simulator.simulateNPCBehavior(gameState);

      expect(result.effects).toHaveProperty('guardsHostile', true);
      expect(result.effects).toHaveProperty('safetyLevel', 'low');
    });

    test('should simulate merchant behavior', () => {
      gameState.setTime(600); // 10 AM
      gameState.setLocation('town');
      gameState.setReputation(30);

      const result = simulator.simulateNPCBehavior(gameState);

      expect(result.effects).toHaveProperty('merchantsAvailable', true);
      expect(result.effects).toHaveProperty('shopPrices', 'normal');
    });
  });

  describe('simulateWorldEvents', () => {
    test('should trigger random world events', () => {
      gameState.setLocation('wilderness');
      gameState.setTime(1000);

      const result = simulator.simulateWorldEvents(gameState);

      expect(result.effects).toHaveProperty('worldEvent', true);
      expect(result.eventType).toBeDefined();
    });

    test('should handle quest-related events', () => {
      gameState.setLocation('dungeon');
      gameState.setQuestProgress('dragon_slayer', 0.8);

      const result = simulator.simulateWorldEvents(gameState);

      expect(result.effects).toHaveProperty('questEvent', true);
      expect(result.questProgress).toBeDefined();
    });

    test('should simulate monster spawns', () => {
      gameState.setLocation('dungeon');
      gameState.setDangerLevel('high');

      const result = simulator.simulateWorldEvents(gameState);

      expect(result.effects).toHaveProperty('monsterSpawn', true);
      expect(result.monsterType).toBeDefined();
    });
  });

  describe('simulateEconomicChanges', () => {
    test('should simulate price fluctuations', () => {
      gameState.setLocation('town');
      gameState.setTime(600);

      const result = simulator.simulateEconomicChanges(gameState);

      expect(result.effects).toHaveProperty('priceChanges', true);
      expect(result.priceModifiers).toBeDefined();
    });

    test('should handle supply and demand', () => {
      gameState.setLocation('town');
      gameState.setItemDemand('sword', 'high');

      const result = simulator.simulateEconomicChanges(gameState);

      expect(result.effects).toHaveProperty('supplyDemand', true);
      expect(result.priceModifiers.sword).toBeGreaterThan(1);
    });

    test('should simulate market events', () => {
      gameState.setLocation('town');
      gameState.setTime(600);

      const result = simulator.simulateEconomicChanges(gameState);

      expect(result.effects).toHaveProperty('marketEvent', true);
      expect(result.eventType).toBeDefined();
    });
  });

  describe('simulateSkillDecay', () => {
    test('should apply skill decay over time', () => {
      gameState.addSkill('Strength', 15);
      gameState.setTime(100);

      const result = simulator.simulateSkillDecay(gameState, 1440); // 24 hours

      expect(result.effects).toHaveProperty('skillDecay', true);
      expect(result.skillChanges).toBeDefined();
    });

    test('should handle skill maintenance', () => {
      gameState.addSkill('Strength', 15);
      gameState.setSkillUsage('Strength', 'high');

      const result = simulator.simulateSkillDecay(gameState, 1440);

      expect(result.effects).toHaveProperty('skillMaintained', true);
      expect(result.skillChanges.Strength).toBe(0);
    });
  });

  describe('simulateHealthEffects', () => {
    test('should apply hunger effects', () => {
      gameState.setHealth(100);
      gameState.setHunger(80);
      gameState.setTime(100);

      const result = simulator.simulateHealthEffects(gameState, 120);

      expect(result.effects).toHaveProperty('hungerIncreased', true);
      expect(result.healthChange).toBeLessThan(0);
    });

    test('should apply fatigue effects', () => {
      gameState.setHealth(100);
      gameState.setFatigue(70);
      gameState.setTime(100);

      const result = simulator.simulateHealthEffects(gameState, 120);

      expect(result.effects).toHaveProperty('fatigueIncreased', true);
      expect(result.healthChange).toBeLessThan(0);
    });

    test('should handle natural healing', () => {
      gameState.setHealth(80);
      gameState.setLocation('town');
      gameState.setTime(100);

      const result = simulator.simulateHealthEffects(gameState, 120);

      expect(result.effects).toHaveProperty('naturalHealing', true);
      expect(result.healthChange).toBeGreaterThan(0);
    });
  });

  describe('simulateReputationEffects', () => {
    test('should apply reputation decay over time', () => {
      gameState.setReputation(80);
      gameState.setTime(100);

      const result = simulator.simulateReputationEffects(gameState, 1440);

      expect(result.effects).toHaveProperty('reputationDecay', true);
      expect(result.reputationChange).toBeLessThan(0);
    });

    test('should handle reputation recovery', () => {
      gameState.setReputation(20);
      gameState.setLocation('town');
      gameState.setTime(100);

      const result = simulator.simulateReputationEffects(gameState, 1440);

      expect(result.effects).toHaveProperty('reputationRecovery', true);
      expect(result.reputationChange).toBeGreaterThan(0);
    });
  });

  describe('getSimulationReport', () => {
    test('should generate comprehensive simulation report', () => {
      gameState.setTime(100);
      gameState.setLocation('town');
      gameState.setHealth(100);
      gameState.setReputation(50);

      const report = simulator.getSimulationReport(gameState);

      expect(report).toHaveProperty('timeEffects');
      expect(report).toHaveProperty('weatherEffects');
      expect(report).toHaveProperty('npcEffects');
      expect(report).toHaveProperty('worldEvents');
      expect(report).toHaveProperty('economicChanges');
      expect(report).toHaveProperty('healthEffects');
      expect(report).toHaveProperty('reputationEffects');
    });

    test('should include effect summaries', () => {
      const report = simulator.getSimulationReport(gameState);

      expect(report).toHaveProperty('totalEffects');
      expect(report).toHaveProperty('effectCategories');
      expect(report).toHaveProperty('simulationComplexity');
    });
  });

  describe('validateSimulation', () => {
    test('should validate simulation results', () => {
      const simulation = {
        newTime: 160,
        healthChange: -5,
        reputationChange: 2,
        effects: {
          timeAdvanced: true,
          healthAffected: true
        }
      };

      const isValid = simulator.validateSimulation(simulation);

      expect(isValid).toBe(true);
    });

    test('should detect invalid simulation results', () => {
      const simulation = {
        newTime: -10, // Invalid negative time
        healthChange: 150, // Invalid health > 100
        reputationChange: 200, // Invalid reputation > 100
        effects: {
          timeAdvanced: true
        }
      };

      const isValid = simulator.validateSimulation(simulation);

      expect(isValid).toBe(false);
    });
  });
});
