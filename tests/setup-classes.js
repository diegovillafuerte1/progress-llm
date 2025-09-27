// Shared setup for loading classes using VM module
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Create a controlled context with all required globals
const context = {
  // Mock functions that classes depend on - these will be replaced with Jest mocks in tests
  applyMultipliers: (value, multipliers) => {
    let finalMultiplier = 1;
    multipliers.forEach(multiplierFunction => {
      const multiplier = multiplierFunction();
      finalMultiplier *= multiplier;
    });
    return Math.round(value * finalMultiplier);
  },

  applySpeed: (value) => value,

  // Mock gameData
  gameData: {
    taskData: {},
    itemData: {},
    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,
    rebirthOneCount: 0,
    rebirthTwoCount: 0,
    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: []
  },

  // Mock itemCategories
  itemCategories: {
    "Properties": ["Homeless", "Tent", "Wooden hut", "Cottage", "House", "Large house", "Small palace", "Grand palace"],
    "Misc": ["Book", "Dumbbells", "Personal squire", "Steel longsword", "Butler", "Sapphire charm", "Study desk", "Library"]
  },

  // Mock daysToYears
  daysToYears: (days) => Math.floor(days / 365),

  // Mock console to avoid noise
  console: { log: () => {} }
};

// Create VM context
const vmContext = vm.createContext(context);

// Load and execute the classes file in the controlled context
const classesPath = path.join(__dirname, '../js/classes.js');
const classesContent = fs.readFileSync(classesPath, 'utf8');

try {
  // Wrap the classes in a function that returns them
  const wrappedCode = `
    (function() {
      ${classesContent}
      return {
        Task: Task,
        Job: Job,
        Skill: Skill,
        Item: Item,
        Requirement: Requirement,
        TaskRequirement: TaskRequirement,
        CoinRequirement: CoinRequirement,
        AgeRequirement: AgeRequirement,
        EvilRequirement: EvilRequirement
      };
    })()
  `;
  
  const result = vm.runInContext(wrappedCode, vmContext);
  
  // Add the classes to our context
  Object.assign(context, result);
  
  console.log('Classes loaded successfully');
  console.log('Task type:', typeof context.Task);
  
} catch (error) {
  console.error('Error loading classes:', error);
  throw error;
}

// Export the classes and context for use in tests
module.exports = {
  Task: context.Task,
  Job: context.Job,
  Skill: context.Skill,
  Item: context.Item,
  Requirement: context.Requirement,
  TaskRequirement: context.TaskRequirement,
  CoinRequirement: context.CoinRequirement,
  AgeRequirement: context.AgeRequirement,
  EvilRequirement: context.EvilRequirement,
  // Export the context so tests can access the same gameData and functions
  context: context
};
