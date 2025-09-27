// Shared test helpers and utilities
const { context } = require('./setup-classes');

/**
 * Standardized mock setup for all test files
 * This ensures consistent mocking across the entire test suite
 */
class TestMocks {
  static setupStandardMocks() {
    jest.clearAllMocks();
    
    // Standard applyMultipliers mock
    context.applyMultipliers = jest.fn((value, multipliers) => {
      let finalMultiplier = 1;
      multipliers.forEach(multiplierFunction => {
        const multiplier = multiplierFunction();
        finalMultiplier *= multiplier;
      });
      return Math.round(value * finalMultiplier);
    });
    
    // Standard applySpeed mock
    context.applySpeed = jest.fn((value) => value);
    
    // Standard daysToYears mock
    context.daysToYears = jest.fn((days) => Math.floor(days / 365));
    
    // Standard gameData mock
    context.gameData = {
      taskData: {},
      itemData: {},
      coins: 1000,
      days: 365 * 20, // 20 years
      evil: 0,
      paused: false,
      timeWarpingEnabled: true,
      rebirthOneCount: 0,
      rebirthTwoCount: 0,
      currentJob: null,
      currentSkill: null,
      currentProperty: null,
      currentMisc: []
    };
    
    // Standard itemCategories mock
    context.itemCategories = {
      "Properties": ["Homeless", "Tent", "Wooden hut", "Cottage", "House", "Large house", "Small palace", "Grand palace"],
      "Misc": ["Book", "Dumbbells", "Personal squire", "Steel longsword", "Butler", "Sapphire charm", "Study desk", "Library"]
    };
  }
  
  static setupMockElements() {
    return [
      { classList: { add: jest.fn(), remove: jest.fn() } },
      { classList: { add: jest.fn(), remove: jest.fn() } }
    ];
  }
  
  static resetGameData() {
    context.gameData = {
      taskData: {},
      itemData: {},
      coins: 1000,
      days: 365 * 20,
      evil: 0,
      paused: false,
      timeWarpingEnabled: true,
      rebirthOneCount: 0,
      rebirthTwoCount: 0,
      currentJob: null,
      currentSkill: null,
      currentProperty: null,
      currentMisc: []
    };
  }
}

/**
 * Standardized test data factory
 * Provides consistent test data across all test files
 */
class TestDataFactory {
  // Base test data constants
  static BASE_TASK_DATA = {
    name: 'Test Task',
    maxXp: 100,
    effect: 0.01,
    description: 'Test skill'
  };
  
  static BASE_JOB_DATA = {
    name: 'Test Job',
    maxXp: 100,
    income: 50
  };
  
  static BASE_SKILL_DATA = {
    name: 'Test Skill',
    maxXp: 100,
    effect: 0.01,
    description: 'Test skill effect'
  };
  
  static BASE_ITEM_DATA = {
    name: 'Test Item',
    expense: 100,
    effect: 1.5,
    description: 'Test item effect'
  };
  
  static BASE_REQUIREMENT_DATA = {
    task: 'Test Task',
    requirement: 10
  };
  
  // Common test values
  static TEST_VALUES = {
    LEVELS: [0, 1, 5, 10, 50, 100],
    XP_VALUES: [0, 10, 50, 100, 250, 1000],
    INCOME_VALUES: [5, 10, 50, 100, 500, 1000],
    EXPENSE_VALUES: [0, 50, 100, 500, 1000, 10000],
    EFFECT_VALUES: [0, 0.01, 0.1, 0.5, 1.0, 1.5, 2.0],
    MULTIPLIER_VALUES: [0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 5.0],
    COIN_VALUES: [0, 100, 500, 1000, 5000, 10000],
    AGE_VALUES: [0, 14, 20, 25, 50, 100],
    EVIL_VALUES: [0, 5, 10, 25, 50, 100]
  };
  
  // Common test scenarios
  static SCENARIOS = {
    BEGINNER: {
      level: 0,
      xp: 0,
      coins: 100,
      age: 14
    },
    INTERMEDIATE: {
      level: 10,
      xp: 500,
      coins: 1000,
      age: 25
    },
    ADVANCED: {
      level: 50,
      xp: 5000,
      coins: 10000,
      age: 50
    },
    EXPERT: {
      level: 100,
      xp: 50000,
      coins: 100000,
      age: 100
    }
  };
  
  static createTaskData(overrides = {}) {
    return { ...this.BASE_TASK_DATA, ...overrides };
  }
  
  static createJobData(overrides = {}) {
    return { ...this.BASE_JOB_DATA, ...overrides };
  }
  
  static createSkillData(overrides = {}) {
    return { ...this.BASE_SKILL_DATA, ...overrides };
  }
  
  static createItemData(overrides = {}) {
    return { ...this.BASE_ITEM_DATA, ...overrides };
  }
  
  static createRequirementData(overrides = {}) {
    return { ...this.BASE_REQUIREMENT_DATA, ...overrides };
  }
  
  // Scenario-based data creation
  static createTaskForScenario(scenario, overrides = {}) {
    const baseData = this.createTaskData(overrides);
    return {
      ...baseData,
      level: this.SCENARIOS[scenario].level,
      xp: this.SCENARIOS[scenario].xp
    };
  }
  
  static createJobForScenario(scenario, overrides = {}) {
    const baseData = this.createJobData(overrides);
    return {
      ...baseData,
      level: this.SCENARIOS[scenario].level,
      xp: this.SCENARIOS[scenario].xp
    };
  }
  
  static createSkillForScenario(scenario, overrides = {}) {
    const baseData = this.createSkillData(overrides);
    return {
      ...baseData,
      level: this.SCENARIOS[scenario].level,
      xp: this.SCENARIOS[scenario].xp
    };
  }
  
  // Edge case data creation
  static createEdgeCaseData() {
    return {
      ZERO_VALUES: {
        maxXp: 0,
        effect: 0,
        income: 0,
        expense: 0
      },
      NEGATIVE_VALUES: {
        maxXp: -100,
        effect: -0.01,
        income: -50,
        expense: -100
      },
      LARGE_VALUES: {
        maxXp: Number.MAX_SAFE_INTEGER,
        effect: 1000,
        income: Number.MAX_SAFE_INTEGER,
        expense: Number.MAX_SAFE_INTEGER
      },
      FLOATING_POINT: {
        maxXp: 100.5,
        effect: 0.0000001,
        income: 50.25,
        expense: 100.75
      }
    };
  }
  
  // Property-specific data creation
  static createPropertyItem(overrides = {}) {
    return this.createItemData({
      name: 'House',
      expense: 1000,
      effect: 2.0,
      description: 'Happiness',
      ...overrides
    });
  }
  
  static createMiscItem(overrides = {}) {
    return this.createItemData({
      name: 'Book',
      expense: 50,
      effect: 1.2,
      description: 'Skill XP',
      ...overrides
    });
  }
  
  // Requirement-specific data creation
  static createTaskRequirementData(overrides = {}) {
    return {
      task: 'Beggar',
      requirement: 5,
      ...overrides
    };
  }
  
  static createCoinRequirementData(overrides = {}) {
    return {
      requirement: 1000,
      ...overrides
    };
  }
  
  static createAgeRequirementData(overrides = {}) {
    return {
      requirement: 20,
      ...overrides
    };
  }
  
  static createEvilRequirementData(overrides = {}) {
    return {
      requirement: 10,
      ...overrides
    };
  }
}

/**
 * Standardized assertion helpers
 * Provides consistent assertion patterns across tests
 */
class TestAssertions {
  static expectTaskProperties(task, expectedData) {
    expect(task.baseData).toEqual(expectedData);
    expect(task.name).toBe(expectedData.name);
    expect(task.level).toBe(0);
    expect(task.maxLevel).toBe(0);
    expect(task.xp).toBe(0);
    expect(task.xpMultipliers).toEqual([]);
  }
  
  static expectJobProperties(job, expectedData) {
    this.expectTaskProperties(job, expectedData);
    expect(job.incomeMultipliers).toEqual([]);
  }
  
  static expectSkillProperties(skill, expectedData) {
    this.expectTaskProperties(skill, expectedData);
  }
  
  static expectItemProperties(item, expectedData) {
    expect(item.baseData).toEqual(expectedData);
    expect(item.name).toBe(expectedData.name);
    expect(item.expenseMultipliers).toEqual([]);
  }
  
  static expectRequirementProperties(requirement, elements, requirements) {
    expect(requirement.elements).toBe(elements);
    expect(requirement.requirements).toEqual(requirements);
    expect(requirement.completed).toBe(false);
  }
}

/**
 * Performance testing utilities
 */
class PerformanceTestUtils {
  static measureExecutionTime(fn) {
    const startTime = Date.now();
    fn();
    const endTime = Date.now();
    return endTime - startTime;
  }
  
  static createLargeDataset(size, factory) {
    const dataset = [];
    for (let i = 0; i < size; i++) {
      dataset.push(factory(i));
    }
    return dataset;
  }
  
  static expectPerformanceWithinThreshold(executionTime, thresholdMs) {
    expect(executionTime).toBeLessThan(thresholdMs);
  }
}

/**
 * Error testing utilities
 */
class ErrorTestUtils {
  static testInvalidInputs(constructor, validData, invalidInputs) {
    invalidInputs.forEach(invalidInput => {
      expect(() => new constructor(invalidInput)).toThrow();
    });
  }
  
  static testNullUndefinedInputs(constructor, validData) {
    expect(() => new constructor(null)).toThrow();
    expect(() => new constructor(undefined)).toThrow();
  }
  
  static testMissingProperties(constructor, requiredProperties) {
    requiredProperties.forEach(property => {
      const incompleteData = { ...TestDataFactory.createTaskData() };
      delete incompleteData[property];
      expect(() => new constructor(incompleteData)).toThrow();
    });
  }
}

module.exports = {
  TestMocks,
  TestDataFactory,
  TestAssertions,
  PerformanceTestUtils,
  ErrorTestUtils
};
