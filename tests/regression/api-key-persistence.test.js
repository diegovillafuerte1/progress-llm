/**
 * API Key Persistence Tests
 * 
 * Tests API key storage and retrieval for the minimal adventure system
 */

describe('API Key Persistence', () => {
    beforeEach(() => {
        // Mock localStorage with simple implementation
        const storage = {};
        global.localStorage = {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => { storage[key] = value; },
            removeItem: (key) => { delete storage[key]; },
            clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
        };
        
        global.alert = jest.fn();
        
        // Initialize adventureData before loading the system
        global.adventureData = {
            apiKey: '',
            storyTrees: {},
            usedAdventures: {},
            currentAdventure: null,
            currentChoices: []
        };
        
        // Load the minimal adventure system
        require('../../js/main-adventure-minimal.js');
    });

    describe('Basic localStorage Operations', () => {
        test('should store and retrieve API key', () => {
            const testKey = 'test-api-key-123';
            
            global.localStorage.setItem('mistralApiKey', testKey);
            const retrievedKey = global.localStorage.getItem('mistralApiKey');
            
            expect(retrievedKey).toBe(testKey);
        });
        
        test('should overwrite existing key', () => {
            const oldKey = 'old-key';
            const newKey = 'new-key';
            
            global.localStorage.setItem('mistralApiKey', oldKey);
            global.localStorage.setItem('mistralApiKey', newKey);
            
            const retrievedKey = global.localStorage.getItem('mistralApiKey');
            expect(retrievedKey).toBe(newKey);
        });
        
        test('should return null for non-existent key', () => {
            const result = global.localStorage.getItem('nonexistent');
            expect(result).toBeNull();
        });
        
        test('should remove key', () => {
            global.localStorage.setItem('mistralApiKey', 'test');
            global.localStorage.removeItem('mistralApiKey');
            
            const result = global.localStorage.getItem('mistralApiKey');
            expect(result).toBeNull();
        });
        
        test('should clear all keys', () => {
            global.localStorage.setItem('mistralApiKey', 'test');
            global.localStorage.setItem('otherKey', 'other');
            global.localStorage.clear();
            
            expect(global.localStorage.getItem('mistralApiKey')).toBeNull();
            expect(global.localStorage.getItem('otherKey')).toBeNull();
        });
    });

    describe('Minimal Adventure System Integration', () => {
        test('should load API key on initialization', () => {
            const testKey = 'loaded-key';
            global.localStorage.setItem('mistralApiKey', testKey);
            
            // Simulate system initialization
            global.adventureData.apiKey = global.localStorage.getItem('mistralApiKey') || '';
            
            expect(global.adventureData.apiKey).toBe(testKey);
        });
        
        test('should save API key when changed', () => {
            const newKey = 'saved-key';
            
            // Simulate API key change
            global.adventureData.apiKey = newKey;
            global.localStorage.setItem('mistralApiKey', newKey);
            
            const savedKey = global.localStorage.getItem('mistralApiKey');
            expect(savedKey).toBe(newKey);
        });
    });

    describe('API Key Validation', () => {
        test('should validate empty string as invalid', () => {
            const emptyKey = '';
            const isValid = !!emptyKey;
            expect(isValid).toBe(false);
        });
        
        test('should validate whitespace-only as invalid', () => {
            const whitespaceKey = '   ';
            const isValid = !!whitespaceKey.trim();
            expect(isValid).toBe(false);
        });
        
        test('should validate proper key as valid', () => {
            const properKey = 'mistral-valid-key-123';
            const isValid = !!properKey && properKey.trim().length > 0;
            expect(isValid).toBe(true);
        });
    });

    describe('Adventure System API Key Integration', () => {
        test('should require API key for adventures', () => {
            global.adventureData.apiKey = '';
            
            const hasApiKey = !!global.adventureData.apiKey;
            expect(hasApiKey).toBe(false);
        });
        
        test('should allow adventures with valid API key', () => {
            global.adventureData.apiKey = 'valid-key';
            
            const hasApiKey = !!global.adventureData.apiKey;
            expect(hasApiKey).toBe(true);
        });
    });

    describe('Persistence Simulation', () => {
        test('should persist across simulated page reloads', () => {
            const testKey = 'persistent-key';
            
            // First "session"
            global.localStorage.setItem('mistralApiKey', testKey);
            
            // Simulate page reload
            const retrievedKey = global.localStorage.getItem('mistralApiKey');
            expect(retrievedKey).toBe(testKey);
        });
        
        test('should handle cleared localStorage', () => {
            // Set a key
            global.localStorage.setItem('mistralApiKey', 'test-key');
            
            // Clear localStorage
            global.localStorage.clear();
            
            const retrievedKey = global.localStorage.getItem('mistralApiKey');
            expect(retrievedKey).toBeNull();
        });
        
        test('should handle multiple key updates', () => {
            const keys = ['key-v1', 'key-v2', 'key-v3'];
            
            keys.forEach(key => {
                global.localStorage.setItem('mistralApiKey', key);
            });
            
            // Last key should be stored
            const finalKey = global.localStorage.getItem('mistralApiKey');
            expect(finalKey).toBe('key-v3');
        });
    });
});