# Test Suite Documentation

This document provides comprehensive documentation for the Progress Knight test suite, explaining the architecture, patterns, and complex test logic.

## Table of Contents

1. [Test Architecture](#test-architecture)
2. [Test Files Overview](#test-files-overview)
3. [Test Helpers and Utilities](#test-helpers-and-utilities)
4. [Complex Test Logic](#complex-test-logic)
5. [Mocking Strategy](#mocking-strategy)
6. [Performance Testing](#performance-testing)
7. [Error Handling Tests](#error-handling-tests)
8. [Integration Testing](#integration-testing)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Test Architecture

### VM Module Approach

The test suite uses Node.js's `vm` module to load classes in isolation without modifying source code:

```javascript
// tests/setup-classes.js
const vm = require('vm');
const context = { /* mocked globals */ };
const vmContext = vm.createContext(context);
vm.runInContext(classesContent, vmContext);
```

**Benefits:**
- Complete isolation from source code
- No modifications to original files
- Controlled environment for testing
- Safe execution context

### Test Structure

```
tests/
├── setup.js              # Jest environment setup
├── setup-classes.js      # VM-based class loading
├── test-helpers.js       # Shared utilities and factories
├── task.test.js          # Task class tests
├── job.test.js           # Job class tests
├── skill.test.js         # Skill class tests
├── item.test.js          # Item class tests
├── requirement.test.js   # Requirement classes tests
├── utilities.test.js     # Utility functions tests
├── error-handling.test.js # Error handling tests
├── integration.test.js   # Cross-class integration tests
├── performance.test.js   # Performance and load tests
└── README.md            # This documentation
```

## Test Files Overview

### Core Class Tests

#### Task Class Tests (`task.test.js`)
Tests the base Task class functionality:
- **Constructor**: Property initialization
- **getMaxXp**: XP calculation with level scaling
- **getXpLeft**: Remaining XP calculation
- **getMaxLevelMultiplier**: Level-based multiplier
- **getXpGain**: XP gain with multipliers
- **increaseXp**: XP progression and leveling

**Key Test Logic:**
```javascript
// XP calculation formula: maxXp * (level + 1) * Math.pow(1.01, level)
test('should calculate max XP correctly for level 1', () => {
  task.level = 1;
  const maxXp = task.getMaxXp();
  expect(maxXp).toBe(202); // 100 * (1 + 1) * Math.pow(1.01, 1) = 202
});
```

#### Job Class Tests (`job.test.js`)
Tests Job class extending Task:
- **Constructor**: Inheritance verification
- **getLevelMultiplier**: Logarithmic scaling
- **getIncome**: Income calculation with multipliers

**Key Test Logic:**
```javascript
// Level multiplier formula: 1 + Math.log10(level + 1)
test('should calculate multiplier correctly for level 9', () => {
  job.level = 9;
  const multiplier = job.getLevelMultiplier();
  expect(multiplier).toBe(2); // 1 + Math.log10(9 + 1) = 1 + 1 = 2
});
```

#### Skill Class Tests (`skill.test.js`)
Tests Skill class extending Task:
- **getEffect**: Linear effect calculation
- **getEffectDescription**: Formatted effect display

**Key Test Logic:**
```javascript
// Effect formula: 1 + effect * level
test('should calculate effect correctly for level 10', () => {
  skill.level = 10;
  const effect = skill.getEffect();
  expect(effect).toBe(1.1); // 1 + 0.01 * 10 = 1.1
});
```

#### Item Class Tests (`item.test.js`)
Tests Item class functionality:
- **getEffect**: Active/inactive state handling
- **getExpense**: Cost calculation with multipliers
- **getEffectDescription**: Property vs misc item handling

**Key Test Logic:**
```javascript
// Item effect depends on game state
test('should return base effect when item is current property', () => {
  context.gameData.currentProperty = item;
  const effect = item.getEffect();
  expect(effect).toBe(1.5);
});
```

#### Requirement Classes Tests (`requirement.test.js`)
Tests requirement system:
- **Base Requirement**: Core functionality
- **TaskRequirement**: Task level checking
- **CoinRequirement**: Coin amount checking
- **AgeRequirement**: Age calculation
- **EvilRequirement**: Evil value checking

**Key Test Logic:**
```javascript
// Requirement checking with game state
test('should return true when task level meets requirement', () => {
  context.gameData.taskData['Test Task'] = { level: 15 };
  const requirement = { task: 'Test Task', requirement: 10 };
  const result = taskRequirement.getCondition(requirement);
  expect(result).toBe(true);
});
```

### Specialized Test Files

#### Error Handling Tests (`error-handling.test.js`)
Comprehensive error handling coverage:
- **Invalid Inputs**: null, undefined, wrong types
- **Missing Properties**: Required field validation
- **Edge Cases**: Extreme values, floating point precision
- **Memory Issues**: Large datasets, circular references

#### Integration Tests (`integration.test.js`)
Cross-class interaction testing:
- **Task-Job Integration**: XP and income relationships
- **Item-Game State Integration**: Effect application
- **Requirement System Integration**: Complex requirement chains
- **Game Loop Integration**: Complete cycle simulation

#### Performance Tests (`performance.test.js`)
Load and performance testing:
- **Large Dataset Performance**: 1000+ entities
- **Complex Calculation Performance**: Heavy computations
- **Memory Performance**: Memory usage monitoring
- **Game Loop Performance**: Complete cycle timing

## Test Helpers and Utilities

### TestMocks Class
Standardized mock setup across all tests:

```javascript
class TestMocks {
  static setupStandardMocks() {
    // Consistent mock configuration
    context.applyMultipliers = jest.fn(/* implementation */);
    context.applySpeed = jest.fn(/* implementation */);
    context.gameData = { /* standard game state */ };
  }
}
```

### TestDataFactory Class
Centralized test data creation:

```javascript
class TestDataFactory {
  static BASE_TASK_DATA = {
    name: 'Test Task',
    maxXp: 100,
    effect: 0.01,
    description: 'Test skill'
  };
  
  static createTaskData(overrides = {}) {
    return { ...this.BASE_TASK_DATA, ...overrides };
  }
}
```

### TestAssertions Class
Standardized assertion patterns:

```javascript
class TestAssertions {
  static expectTaskProperties(task, expectedData) {
    expect(task.baseData).toEqual(expectedData);
    expect(task.name).toBe(expectedData.name);
    expect(task.level).toBe(0);
    // ... other assertions
  }
}
```

## Complex Test Logic

### XP Calculation Logic
The Task class uses a complex XP calculation formula:

```javascript
getMaxXp() {
  return this.baseData.maxXp * (this.level + 1) * Math.pow(1.01, this.level);
}
```

**Test Strategy:**
1. Test base case (level 0)
2. Test linear component (level + 1)
3. Test exponential component (Math.pow(1.01, level))
4. Test combined formula
5. Test edge cases (very large levels)

### Level Multiplier Logic
Jobs use logarithmic scaling for level multipliers:

```javascript
getLevelMultiplier() {
  return 1 + Math.log10(this.level + 1);
}
```

**Test Strategy:**
1. Test base case (level 0 = 1)
2. Test logarithmic progression
3. Test specific level milestones
4. Test floating point precision

### Requirement System Logic
Requirements check multiple conditions:

```javascript
isCompleted() {
  if (this.completed) return true;
  
  for (let requirement of this.requirements) {
    if (!this.getCondition(requirement)) {
      return false;
    }
  }
  
  this.completed = true;
  return true;
}
```

**Test Strategy:**
1. Test early return (completed = true)
2. Test single requirement success
3. Test single requirement failure
4. Test multiple requirements (all pass)
5. Test multiple requirements (one fails)
6. Test completion state persistence

## Mocking Strategy

### Global Function Mocking
Mock global functions that classes depend on:

```javascript
context.applyMultipliers = jest.fn((value, multipliers) => {
  let finalMultiplier = 1;
  multipliers.forEach(multiplierFunction => {
    const multiplier = multiplierFunction();
    finalMultiplier *= multiplier;
  });
  return Math.round(value * finalMultiplier);
});
```

### Game State Mocking
Mock the global game state:

```javascript
context.gameData = {
  taskData: {},
  itemData: {},
  coins: 1000,
  days: 365 * 20,
  evil: 0,
  currentJob: null,
  currentSkill: null,
  currentProperty: null,
  currentMisc: []
};
```

### DOM Element Mocking
Mock DOM elements for requirement classes:

```javascript
const mockElements = [
  { classList: { add: jest.fn(), remove: jest.fn() } },
  { classList: { add: jest.fn(), remove: jest.fn() } }
];
```

## Performance Testing

### Large Dataset Testing
Test performance with large numbers of entities:

```javascript
test('should handle creating 1000 tasks efficiently', () => {
  const executionTime = PerformanceTestUtils.measureExecutionTime(() => {
    const tasks = PerformanceTestUtils.createLargeDataset(1000, (i) => {
      return new Task(TestDataFactory.createTaskData({ name: `Task ${i}` }));
    });
  });
  
  PerformanceTestUtils.expectPerformanceWithinThreshold(executionTime, 100);
});
```

### Memory Leak Detection
Monitor memory usage during tests:

```javascript
test('should not leak memory with repeated operations', () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Perform many operations
  for (let i = 0; i < 1000; i++) {
    // ... operations
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
});
```

## Error Handling Tests

### Input Validation
Test invalid inputs and edge cases:

```javascript
test('should handle null baseData', () => {
  expect(() => new Task(null)).toThrow();
});

test('should handle baseData with missing required properties', () => {
  expect(() => new Task({})).toThrow();
  expect(() => new Task({ name: 'Test' })).toThrow();
});
```

### Edge Case Testing
Test extreme values and boundary conditions:

```javascript
test('should handle extremely large numbers', () => {
  const task = new Task({ name: 'Test', maxXp: Number.MAX_SAFE_INTEGER });
  task.level = Number.MAX_SAFE_INTEGER;
  expect(() => task.getMaxXp()).not.toThrow();
});
```

## Integration Testing

### Cross-Class Interactions
Test how classes work together:

```javascript
test('should work together in a typical game scenario', () => {
  const beggarTask = new Task({ name: 'Beggar', maxXp: 50, effect: 0.01 });
  const beggarJob = new Job({ name: 'Beggar', maxXp: 50, income: 5 });
  
  context.gameData.taskData['Beggar'] = beggarTask;
  
  const taskRequirement = new TaskRequirement(mockElements, []);
  const requirement = { task: 'Beggar', requirement: 1 };
  
  expect(taskRequirement.getCondition(requirement)).toBe(false);
  
  beggarTask.level = 1;
  context.gameData.taskData['Beggar'] = beggarTask;
  expect(taskRequirement.getCondition(requirement)).toBe(true);
});
```

### Game Loop Simulation
Test complete game cycles:

```javascript
test('should simulate a complete game cycle', () => {
  const beggarTask = new Task({ name: 'Beggar', maxXp: 50, effect: 0.01 });
  const beggarJob = new Job({ name: 'Beggar', maxXp: 50, income: 5 });
  const house = new Item({ name: 'House', expense: 1000, effect: 1.5, description: 'Happiness' });
  
  // Set up game state
  context.gameData.taskData['Beggar'] = beggarTask;
  context.gameData.currentJob = beggarJob;
  context.gameData.currentProperty = house;
  
  // Simulate XP gain
  beggarTask.increaseXp();
  
  // Simulate income generation
  const income = beggarJob.getIncome();
  
  // Simulate item effect
  const houseEffect = house.getEffect();
  
  // Verify results
  expect(income).toBe(5);
  expect(houseEffect).toBe(1.5);
});
```

## Best Practices

### Test Organization
1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** and isolated

### Mock Management
1. **Use consistent mock setup** across all tests
2. **Reset mocks** in beforeEach
3. **Mock at the right level** (not too deep, not too shallow)
4. **Verify mock interactions** when relevant

### Data Management
1. **Use factory methods** for test data creation
2. **Extract common values** into constants
3. **Use realistic test data** that matches game scenarios
4. **Test edge cases** with appropriate data

### Performance Testing
1. **Set reasonable thresholds** for performance tests
2. **Test with realistic data sizes** (not just tiny datasets)
3. **Monitor memory usage** in long-running tests
4. **Use appropriate timing** for different operations

## Troubleshooting

### Common Issues

#### VM Context Issues
**Problem**: Classes not available in test context
**Solution**: Ensure VM context is properly set up in `setup-classes.js`

#### Mock Not Working
**Problem**: Mocks not being called or returning wrong values
**Solution**: Check mock setup in `TestMocks.setupStandardMocks()`

#### Performance Test Failures
**Problem**: Tests timing out or taking too long
**Solution**: Adjust performance thresholds or optimize test data

#### Memory Leaks
**Problem**: Tests consuming too much memory
**Solution**: Check for proper cleanup and garbage collection

### Debugging Tips

1. **Use console.log** in tests to debug complex logic
2. **Check mock calls** with `toHaveBeenCalledWith`
3. **Verify test data** with `expect().toEqual()`
4. **Use Jest's verbose mode** for detailed output

### Test Maintenance

1. **Update tests** when source code changes
2. **Add new tests** for new functionality
3. **Remove obsolete tests** for removed features
4. **Keep documentation** up to date

## Conclusion

This test suite provides comprehensive coverage of the Progress Knight game logic with:

- **121+ tests** across 8 test files
- **Complete class coverage** for all game entities
- **Error handling** for edge cases and invalid inputs
- **Integration testing** for cross-class interactions
- **Performance testing** for large datasets
- **Standardized patterns** for maintainability

The suite is designed to catch regressions during refactoring while maintaining high code quality and reliability.
