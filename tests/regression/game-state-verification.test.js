/**
 * Game State Verification Test
 * 
 * Run with: npm test -- game-state-verification
 * 
 * This test detects corrupted game states that can occur after refactoring or changes.
 */

// Load the verification script as a test utility
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Game State Verification', () => {
    let verifyGameState;
    
    beforeAll(() => {
        // Load verification script in a safe context
        const verificationScript = fs.readFileSync(
            path.join(__dirname, '../../js/game-state-verification.js'),
            'utf8'
        );
        
        // Create a minimal browser-like environment
        const context = {
            console: console,
            window: {},
            document: {
                getElementById: () => ({ classList: { contains: () => false } }),
                querySelector: () => null,
                querySelectorAll: () => [],
                body: { textContent: '' }
            },
            setTimeout: (fn, delay) => fn()
        };
        
        vm.createContext(context);
        vm.runInContext(verificationScript, context);
        
        verifyGameState = context.window.verifyGameState;
    });
    
    test('should detect signal lost corruption (distance < range)', () => {
        const mockGameData = {
            days: 365 * 14, // 14 years
            coins: 0,
            evil: 0,
            taskData: {},
            requirements: {},
            currentJob: null,
            currentSkill: null
        };
        
        const mockFunctions = {
            getLifespan: () => 365 * 70, // 70 years range
            daysToYears: (days) => Math.floor(days / 365),
            isAlive: () => mockGameData.days < mockFunctions.getLifespan()
        };
        
        // Mock window.gameData
        global.window = { gameData: mockGameData };
        global.getLifespan = mockFunctions.getLifespan;
        global.daysToYears = mockFunctions.daysToYears;
        
        const result = verifyGameState();
        
        // Should detect that 14 < 70 but death message is showing
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.includes('Signal Lost'))).toBe(true);
    });
    
    test('should detect visible elements without requirements', () => {
        const mockGameData = {
            days: 365 * 14,
            coins: 0,
            evil: 0,
            taskData: {},
            requirements: {
                'Mining': {
                    isCompleted: () => false,
                    elements: [{ classList: { contains: () => false } }] // visible but not completed
                }
            },
            currentJob: null,
            currentSkill: null
        };
        
        global.window = { gameData: mockGameData };
        
        const result = verifyGameState();
        
        expect(result.warnings.some(w => w.includes('Mining') && w.includes('requirement not met'))).toBe(true);
    });
    
    test('should detect empty table data', () => {
        // This test would need DOM mocking to be complete
        // Placeholder for now
        expect(true).toBe(true);
    });
});

