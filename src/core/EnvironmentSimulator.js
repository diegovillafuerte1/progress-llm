/**
 * EnvironmentSimulator.js - Reliable world-driven transitions
 * Based on paper insights about environment-driven transitions being more reliable with code
 * 
 * Handles deterministic world changes that don't require LLM interpretation.
 * Ensures reliable and consistent world simulation.
 */

export class EnvironmentSimulator {
  constructor() {
    this.simulationRules = this.initializeSimulationRules();
    this.simulationHistory = [];
    this.maxHistorySize = 50;
  }

  /**
   * Simulate time passage and its effects
   * @param {GameState} gameState - Current game state
   * @param {number} duration - Time to advance in minutes
   * @returns {Object} Simulation results
   */
  simulateTimePassage(gameState, duration) {
    const currentTime = gameState.getTime() || 0;
    const newTime = currentTime + duration;
    
    const result = {
      newTime,
      effects: {
        timeAdvanced: true
      },
      healthChange: 0,
      manaChange: 0,
      reputationChange: 0
    };
    
    // Check for day/night transitions
    const wasDay = this.isDaytime(currentTime);
    const isDay = this.isDaytime(newTime);
    
    if (wasDay !== isDay) {
      result.effects.dayNightTransition = true;
      result.effects.shopsClosed = !isDay;
      result.effects.guardsPatrolling = !isDay;
    }
    
    // Apply aging effects
    const ageIncrease = Math.floor(duration / 1440); // 24 hours = 1 day
    if (ageIncrease > 0) {
      result.effects.ageIncreased = true;
      result.newAge = (gameState.getAge() || 0) + ageIncrease;
    }
    
    // Apply natural healing over time
    const healingAmount = Math.floor(duration / 60); // 1 health per hour
    if (healingAmount > 0) {
      result.effects.naturalHealing = true;
      result.healthChange = Math.min(healingAmount, 100 - (gameState.getHealth() || 100));
    }
    
    this.recordSimulation('time_passage', result);
    return result;
  }

  /**
   * Simulate weather changes and effects
   * @param {GameState} gameState - Current game state
   * @returns {Object} Weather simulation results
   */
  simulateWeatherChanges(gameState) {
    const currentWeather = gameState.getWeather() || 'sunny';
    const location = gameState.getLocation() || 'town';
    
    const result = {
      newWeather: this.generateWeatherChange(currentWeather),
      effects: {
        weatherChanged: true
      },
      healthChange: 0
    };
    
    // Apply weather effects based on location
    if (location === 'wilderness') {
      if (result.newWeather === 'rain' || result.newWeather === 'storm') {
        result.effects.movementPenalty = true;
        result.effects.clothingWet = true;
        result.healthChange = -2; // Minor health penalty
      } else if (result.newWeather === 'storm') {
        result.effects.dangerous = true;
        result.healthChange = -5; // Storm damage
      }
    }
    
    this.recordSimulation('weather_change', result);
    return result;
  }

  /**
   * Simulate NPC behavior changes
   * @param {GameState} gameState - Current game state
   * @returns {Object} NPC behavior simulation results
   */
  simulateNPCBehavior(gameState) {
    const time = gameState.getTime() || 0;
    const location = gameState.getLocation() || 'town';
    const reputation = gameState.getReputation() || 50;
    
    const result = {
      effects: {
        npcBehaviorChanged: true
      },
      safetyLevel: 'medium'
    };
    
    // Simulate guard behavior
    if (location === 'town') {
      if (this.isNighttime(time)) {
        result.effects.guardsPatrolling = true;
        result.safetyLevel = 'high';
      } else {
        result.effects.guardsPatrolling = false;
        result.safetyLevel = 'medium';
      }
      
      // Check reputation effects on guards
      if (reputation > 70) {
        result.effects.guardsHostile = true;
        result.safetyLevel = 'low';
      } else if (reputation < 30) {
        result.effects.guardsFriendly = true;
        result.safetyLevel = 'high';
      }
    }
    
    // Simulate merchant behavior
    if (location === 'town' && this.isDaytime(time)) {
      result.effects.merchantsAvailable = true;
      result.effects.shopPrices = reputation > 60 ? 'discounted' : 'normal';
    } else {
      result.effects.merchantsAvailable = false;
    }
    
    this.recordSimulation('npc_behavior', result);
    return result;
  }

  /**
   * Simulate world events
   * @param {GameState} gameState - Current game state
   * @returns {Object} World event simulation results
   */
  simulateWorldEvents(gameState) {
    const location = gameState.getLocation() || 'town';
    const time = gameState.getTime() || 0;
    
    const result = {
      effects: {
        worldEvent: true
      },
      eventType: this.generateWorldEvent(location, time)
    };
    
    // Apply event-specific effects
    switch (result.eventType) {
      case 'monster_spawn':
        result.effects.monsterSpawn = true;
        result.monsterType = this.generateMonsterType(location);
        break;
      case 'quest_event':
        result.effects.questEvent = true;
        result.questProgress = this.generateQuestProgress();
        break;
      case 'economic_event':
        result.effects.economicEvent = true;
        result.priceModifiers = this.generatePriceModifiers();
        break;
    }
    
    this.recordSimulation('world_event', result);
    return result;
  }

  /**
   * Simulate economic changes
   * @param {GameState} gameState - Current game state
   * @returns {Object} Economic simulation results
   */
  simulateEconomicChanges(gameState) {
    const location = gameState.getLocation() || 'town';
    const time = gameState.getTime() || 0;
    
    const result = {
      effects: {
        economicChanges: true
      },
      priceModifiers: {}
    };
    
    // Simulate price fluctuations
    if (location === 'town') {
      result.priceModifiers.sword = this.generatePriceModifier(0.8, 1.2);
      result.priceModifiers.potion = this.generatePriceModifier(0.9, 1.1);
      result.priceModifiers.gold = this.generatePriceModifier(0.95, 1.05);
    }
    
    // Simulate supply and demand
    const demand = this.calculateDemand(location, time);
    for (const [item, modifier] of Object.entries(result.priceModifiers)) {
      result.priceModifiers[item] *= demand;
    }
    
    // Simulate market events
    if (Math.random() < 0.1) { // 10% chance
      result.effects.marketEvent = true;
      result.eventType = this.generateMarketEvent();
    }
    
    this.recordSimulation('economic_change', result);
    return result;
  }

  /**
   * Simulate skill decay over time
   * @param {GameState} gameState - Current game state
   * @param {number} duration - Time duration in minutes
   * @returns {Object} Skill decay simulation results
   */
  simulateSkillDecay(gameState, duration) {
    const result = {
      effects: {
        skillDecay: true
      },
      skillChanges: {}
    };
    
    const skillNames = ['Strength', 'Magic', 'Dexterity', 'Intelligence', 'Charisma'];
    const decayRate = duration / 10080; // 1 week = 10080 minutes
    
    for (const skillName of skillNames) {
      const currentLevel = gameState.getSkillLevel(skillName) || 0;
      const usage = gameState.getSkillUsage?.(skillName) || 'low';
      
      let decayAmount = 0;
      if (usage === 'low') {
        decayAmount = Math.floor(currentLevel * decayRate * 0.1); // 10% decay
      } else if (usage === 'medium') {
        decayAmount = Math.floor(currentLevel * decayRate * 0.05); // 5% decay
      }
      // No decay for high usage
      
      if (decayAmount > 0) {
        result.skillChanges[skillName] = -decayAmount;
      } else {
        result.effects.skillMaintained = true;
        result.skillChanges[skillName] = 0;
      }
    }
    
    this.recordSimulation('skill_decay', result);
    return result;
  }

  /**
   * Simulate health effects over time
   * @param {GameState} gameState - Current game state
   * @param {number} duration - Time duration in minutes
   * @returns {Object} Health simulation results
   */
  simulateHealthEffects(gameState, duration) {
    const result = {
      effects: {},
      healthChange: 0
    };
    
    const currentHealth = gameState.getHealth() || 100;
    const location = gameState.getLocation() || 'town';
    const weather = gameState.getWeather() || 'sunny';
    
    // Apply hunger effects
    const hungerIncrease = duration / 60; // 1 hunger per hour
    if (hungerIncrease > 0) {
      result.effects.hungerIncreased = true;
      result.healthChange -= Math.floor(hungerIncrease * 0.5); // 0.5 health per hunger
    }
    
    // Apply fatigue effects
    const fatigueIncrease = duration / 120; // 1 fatigue per 2 hours
    if (fatigueIncrease > 0) {
      result.effects.fatigueIncreased = true;
      result.healthChange -= Math.floor(fatigueIncrease * 0.3); // 0.3 health per fatigue
    }
    
    // Apply natural healing in safe locations
    if (location === 'town') {
      const healingAmount = Math.floor(duration / 60); // 1 health per hour
      result.effects.naturalHealing = true;
      result.healthChange += Math.min(healingAmount, 100 - currentHealth);
    }
    
    // Apply weather effects
    if (location === 'wilderness' && (weather === 'rain' || weather === 'storm')) {
      result.healthChange -= Math.floor(duration / 30); // Weather damage
    }
    
    this.recordSimulation('health_effects', result);
    return result;
  }

  /**
   * Simulate reputation effects over time
   * @param {GameState} gameState - Current game state
   * @param {number} duration - Time duration in minutes
   * @returns {Object} Reputation simulation results
   */
  simulateReputationEffects(gameState, duration) {
    const result = {
      effects: {},
      reputationChange: 0
    };
    
    const currentReputation = gameState.getReputation() || 50;
    const location = gameState.getLocation() || 'town';
    
    // Apply reputation decay over time
    const decayRate = duration / 10080; // 1 week = 10080 minutes
    const decayAmount = Math.floor(currentReputation * decayRate * 0.05); // 5% decay per week
    
    if (decayAmount > 0) {
      result.effects.reputationDecay = true;
      result.reputationChange = -decayAmount;
    }
    
    // Apply reputation recovery in town
    if (location === 'town') {
      const recoveryAmount = Math.floor(duration / 1440); // 1 reputation per day
      result.effects.reputationRecovery = true;
      result.reputationChange += Math.min(recoveryAmount, 100 - currentReputation);
    }
    
    this.recordSimulation('reputation_effects', result);
    return result;
  }

  /**
   * Get comprehensive simulation report
   * @param {GameState} gameState - Current game state
   * @returns {Object} Simulation report
   */
  getSimulationReport(gameState) {
    const report = {
      timeEffects: this.simulateTimePassage(gameState, 0),
      weatherEffects: this.simulateWeatherChanges(gameState),
      npcEffects: this.simulateNPCBehavior(gameState),
      worldEvents: this.simulateWorldEvents(gameState),
      economicChanges: this.simulateEconomicChanges(gameState),
      healthEffects: this.simulateHealthEffects(gameState, 0),
      reputationEffects: this.simulateReputationEffects(gameState, 0)
    };
    
    return {
      ...report,
      totalEffects: Object.keys(report).length,
      effectCategories: Object.keys(report),
      simulationComplexity: this.calculateSimulationComplexity(report)
    };
  }

  /**
   * Validate simulation results
   * @param {Object} simulation - Simulation results to validate
   * @returns {boolean} Whether simulation is valid
   */
  validateSimulation(simulation) {
    try {
      // Check time validity
      if (simulation.newTime !== undefined && simulation.newTime < 0) {
        return false;
      }
      
      // Check health validity
      if (simulation.healthChange !== undefined) {
        const newHealth = 100 + simulation.healthChange;
        if (newHealth < 0 || newHealth > 100) {
          return false;
        }
      }
      
      // Check mana validity
      if (simulation.manaChange !== undefined) {
        const newMana = 50 + simulation.manaChange;
        if (newMana < 0 || newMana > 100) {
          return false;
        }
      }
      
      // Check reputation validity
      if (simulation.reputationChange !== undefined) {
        const newReputation = 50 + simulation.reputationChange;
        if (newReputation < 0 || newReputation > 100) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if time is daytime
   * @param {number} time - Time in minutes
   * @returns {boolean} Whether it's daytime
   */
  isDaytime(time) {
    const hour = (time % 1440) / 60; // 24 hours = 1440 minutes
    return hour >= 6 && hour < 18;
  }

  /**
   * Check if time is nighttime
   * @param {number} time - Time in minutes
   * @returns {boolean} Whether it's nighttime
   */
  isNighttime(time) {
    return !this.isDaytime(time);
  }

  /**
   * Generate weather change
   * @param {string} currentWeather - Current weather
   * @returns {string} New weather
   */
  generateWeatherChange(currentWeather) {
    const weatherOptions = ['sunny', 'cloudy', 'rain', 'storm'];
    const currentIndex = weatherOptions.indexOf(currentWeather);
    
    // 70% chance to stay same, 30% chance to change
    if (Math.random() < 0.7) {
      return currentWeather;
    }
    
    const newIndex = Math.floor(Math.random() * weatherOptions.length);
    return weatherOptions[newIndex];
  }

  /**
   * Generate world event
   * @param {string} location - Current location
   * @param {number} time - Current time
   * @returns {string} Event type
   */
  generateWorldEvent(location, time) {
    const events = ['monster_spawn', 'quest_event', 'economic_event'];
    const weights = [0.3, 0.4, 0.3];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < events.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return events[i];
      }
    }
    
    return events[0];
  }

  /**
   * Generate monster type
   * @param {string} location - Current location
   * @returns {string} Monster type
   */
  generateMonsterType(location) {
    const monsters = {
      dungeon: ['goblin', 'skeleton', 'spider'],
      wilderness: ['wolf', 'bear', 'bandit'],
      town: ['thief', 'pickpocket']
    };
    
    const locationMonsters = monsters[location] || ['creature'];
    return locationMonsters[Math.floor(Math.random() * locationMonsters.length)];
  }

  /**
   * Generate quest progress
   * @returns {Object} Quest progress
   */
  generateQuestProgress() {
    return {
      quest: 'dragon_slayer',
      progress: Math.random() * 0.5 + 0.5, // 50-100% progress
      stage: 'final_battle'
    };
  }

  /**
   * Generate price modifiers
   * @returns {Object} Price modifiers
   */
  generatePriceModifiers() {
    return {
      sword: this.generatePriceModifier(0.8, 1.2),
      potion: this.generatePriceModifier(0.9, 1.1),
      gold: this.generatePriceModifier(0.95, 1.05)
    };
  }

  /**
   * Generate price modifier
   * @param {number} min - Minimum modifier
   * @param {number} max - Maximum modifier
   * @returns {number} Price modifier
   */
  generatePriceModifier(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Calculate demand
   * @param {string} location - Current location
   * @param {number} time - Current time
   * @returns {number} Demand multiplier
   */
  calculateDemand(location, time) {
    let demand = 1.0;
    
    if (location === 'town' && this.isDaytime(time)) {
      demand = 1.2; // Higher demand during day
    } else if (location === 'dungeon') {
      demand = 0.8; // Lower demand in dangerous areas
    }
    
    return demand;
  }

  /**
   * Generate market event
   * @returns {string} Market event type
   */
  generateMarketEvent() {
    const events = ['sale', 'shortage', 'surplus', 'new_item'];
    return events[Math.floor(Math.random() * events.length)];
  }

  /**
   * Calculate simulation complexity
   * @param {Object} report - Simulation report
   * @returns {string} Complexity level
   */
  calculateSimulationComplexity(report) {
    const effectCount = Object.keys(report).length;
    
    if (effectCount > 5) return 'high';
    if (effectCount > 3) return 'medium';
    return 'low';
  }

  /**
   * Record simulation in history
   * @param {string} type - Simulation type
   * @param {Object} result - Simulation result
   */
  recordSimulation(type, result) {
    this.simulationHistory.push({
      type,
      result,
      timestamp: Date.now()
    });
    
    if (this.simulationHistory.length > this.maxHistorySize) {
      this.simulationHistory.shift();
    }
  }

  /**
   * Initialize simulation rules
   * @returns {Object} Initialized simulation rules
   */
  initializeSimulationRules() {
    return {
      timePassage: {
        healingRate: 1, // health per hour
        agingRate: 1, // days per day
        naturalHealing: true
      },
      weather: {
        changeRate: 0.3,
        effects: {
          rain: { movementPenalty: 0.2, healthPenalty: 0.1 },
          storm: { movementPenalty: 0.5, healthPenalty: 0.3 },
          sunny: { movementPenalty: 0, healthPenalty: 0 }
        }
      },
      npcBehavior: {
        guardPatrols: { night: true, day: false },
        merchantHours: { open: 8, close: 18 },
        reputationThresholds: { hostile: 70, friendly: 30 }
      }
    };
  }
}
