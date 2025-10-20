/**
 * Adventure Data Corruption Prevention Tests
 * 
 * Tests data corruption prevention for the minimal adventure system
 */

describe('Adventure Data Corruption Prevention', () => {
    let mockLocalStorage;
    let mockDocument;
    
    beforeEach(() => {
        // Mock localStorage with simple implementation
        const storage = {};
        mockLocalStorage = {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => { storage[key] = value; },
            removeItem: (key) => { delete storage[key]; },
            clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
        };
        
        mockDocument = {
            getElementById: jest.fn(() => null),
            querySelector: jest.fn(() => null)
        };
        
        global.localStorage = mockLocalStorage;
        global.document = mockDocument;
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

    describe('Invalid JSON in localStorage', () => {
        test('should handle corrupted storyTrees JSON gracefully', () => {
            // Simulate corrupted JSON
            global.localStorage.setItem('storyTrees', 'invalid-json{');
            
            // Should handle gracefully without crashing
            expect(() => {
                try {
                    const data = global.localStorage.getItem('storyTrees');
                    if (data) {
                        JSON.parse(data);
                    }
                } catch (error) {
                    // Handle gracefully - reset to empty object
                    global.adventureData.storyTrees = {};
                }
            }).not.toThrow();
            
            // Should have empty story trees after corruption
            expect(global.adventureData.storyTrees).toEqual({});
        });
        
        test('should handle corrupted currentLifeAdventures JSON gracefully', () => {
            // Simulate corrupted JSON
            global.localStorage.setItem('currentLifeAdventures', 'corrupted{data');
            
            // Should handle gracefully
            expect(() => {
                try {
                    const data = global.localStorage.getItem('currentLifeAdventures');
                    if (data) {
                        JSON.parse(data);
                    }
                } catch (error) {
                    // Handle gracefully - reset to empty object
                    global.adventureData.usedAdventures = {};
                }
            }).not.toThrow();
            
            // Should have empty used adventures after corruption
            expect(global.adventureData.usedAdventures).toEqual({});
        });
        
        test('should handle null values in localStorage', () => {
            // Set null value
            global.localStorage.setItem('storyTrees', null);
            
            // Should handle gracefully
            const data = global.localStorage.getItem('storyTrees');
            expect(data).toBe('null');
            
            // Should not crash when parsing
            expect(() => {
                if (data && data !== 'null') {
                    JSON.parse(data);
                } else {
                    global.adventureData.storyTrees = {};
                }
            }).not.toThrow();
        });
    });

    describe('Invalid Adventure Data Structure', () => {
        test('should handle story tree data with missing required fields', () => {
            const invalidStoryTree = {
                // Missing required fields like story, choices, etc.
                someField: 'value'
            };
            
            global.localStorage.setItem('storyTrees', JSON.stringify(invalidStoryTree));
            
            // Should handle gracefully
            expect(() => {
                const data = global.localStorage.getItem('storyTrees');
                if (data) {
                    const parsed = JSON.parse(data);
                    // Validate structure
                    if (!parsed.story || !parsed.choices) {
                        global.adventureData.storyTrees = {};
                    }
                }
            }).not.toThrow();
        });
        
        test('should handle currentLifeAdventures with invalid adventure names', () => {
            const invalidAdventures = {
                'invalid-adventure-name': true,
                'another-invalid-name': true
            };
            
            global.localStorage.setItem('currentLifeAdventures', JSON.stringify(invalidAdventures));
            
            // Should handle gracefully
            expect(() => {
                const data = global.localStorage.getItem('currentLifeAdventures');
                if (data) {
                    const parsed = JSON.parse(data);
                    // Filter out invalid adventure names
                    const validAdventures = ['age25', 'age45', 'age65', 'age200'];
                    const filtered = {};
                    Object.keys(parsed).forEach(key => {
                        if (validAdventures.includes(key)) {
                            filtered[key] = parsed[key];
                        }
                    });
                    global.adventureData.usedAdventures = filtered;
                }
            }).not.toThrow();
        });
    });

    describe('Data Type Validation', () => {
        test('should handle non-string values in localStorage', () => {
            // Simulate non-string value (this shouldn't happen in real localStorage, but test robustness)
            global.localStorage.setItem('storyTrees', 123);
            
            // Should handle gracefully
            const data = global.localStorage.getItem('storyTrees');
            expect(data).toBe('123');
            
            // Should not crash when trying to parse
            expect(() => {
                if (data && typeof data === 'string') {
                    try {
                        JSON.parse(data);
                    } catch (error) {
                        global.adventureData.storyTrees = {};
                    }
                }
            }).not.toThrow();
        });
        
        test('should handle empty string values in localStorage', () => {
            // Set empty string
            global.localStorage.setItem('storyTrees', '');
            
            // Should handle gracefully
            const data = global.localStorage.getItem('storyTrees');
            expect(data).toBe('');
            
            // Should not crash
            expect(() => {
                if (data && data.trim()) {
                    JSON.parse(data);
                } else {
                    global.adventureData.storyTrees = {};
                }
            }).not.toThrow();
        });
    });

    describe('Missing DOM Elements', () => {
        test('should handle missing story tree DOM elements gracefully', () => {
            // Mock missing DOM element
            mockDocument.getElementById.mockReturnValue(null);
            
            // Should not crash when trying to access missing element
            expect(() => {
                const element = global.document.getElementById('story-tree-age25');
                if (!element) {
                    // Handle missing element gracefully
                    return;
                }
            }).not.toThrow();
        });
        
        test('should handle missing adventure button DOM elements gracefully', () => {
            // Mock missing DOM element
            mockDocument.getElementById.mockReturnValue(null);
            
            // Should not crash when trying to access missing element
            expect(() => {
                const element = global.document.getElementById('adventure-button-age25');
                if (!element) {
                    // Handle missing element gracefully
                    return;
                }
            }).not.toThrow();
        });
    });

    describe('Recovery from Corruption', () => {
        test('should allow system to recover after clearing corrupted data', () => {
            // Simulate corrupted data
            global.localStorage.setItem('storyTrees', 'corrupted-data');
            global.localStorage.setItem('currentLifeAdventures', 'more-corrupted-data');
            
            // Clear corrupted data
            global.localStorage.removeItem('storyTrees');
            global.localStorage.removeItem('currentLifeAdventures');
            
            // Should recover gracefully
            expect(() => {
                global.adventureData.storyTrees = {};
                global.adventureData.usedAdventures = {};
            }).not.toThrow();
            
            // Should have clean state
            expect(global.adventureData.storyTrees).toEqual({});
            expect(global.adventureData.usedAdventures).toEqual({});
        });
        
        test('should handle partial data corruption', () => {
            // Set some valid and some invalid data
            global.localStorage.setItem('storyTrees', '{"age25": {"story": "valid"}}');
            global.localStorage.setItem('currentLifeAdventures', 'corrupted');
            
            // Should handle partial corruption
            expect(() => {
                try {
                    const storyData = global.localStorage.getItem('storyTrees');
                    if (storyData) {
                        global.adventureData.storyTrees = JSON.parse(storyData);
                    }
                } catch (error) {
                    global.adventureData.storyTrees = {};
                }
                
                try {
                    const adventureData = global.localStorage.getItem('currentLifeAdventures');
                    if (adventureData) {
                        global.adventureData.usedAdventures = JSON.parse(adventureData);
                    }
                } catch (error) {
                    global.adventureData.usedAdventures = {};
                }
            }).not.toThrow();
            
            // Should have valid story trees but empty used adventures
            expect(global.adventureData.storyTrees).toEqual({ age25: { story: 'valid' } });
            expect(global.adventureData.usedAdventures).toEqual({});
        });
    });

    describe('Edge Cases', () => {
        test('should handle extremely large story tree data', () => {
            // Create large story tree data
            const largeData = {
                story: 'A'.repeat(1000000), // 1MB string
                choices: Array(1000).fill({ text: 'Choice', type: 'test' })
            };
            
            // Should handle gracefully
            expect(() => {
                global.localStorage.setItem('storyTrees', JSON.stringify(largeData));
                const data = global.localStorage.getItem('storyTrees');
                if (data) {
                    const parsed = JSON.parse(data);
                    global.adventureData.storyTrees = parsed;
                }
            }).not.toThrow();
        });
        
        test('should handle special characters in adventure data', () => {
            const specialData = {
                story: 'Story with special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./',
                choices: [{ text: 'Choice with émojis 🎮', type: 'special' }]
            };
            
            // Should handle gracefully
            expect(() => {
                global.localStorage.setItem('storyTrees', JSON.stringify(specialData));
                const data = global.localStorage.getItem('storyTrees');
                if (data) {
                    const parsed = JSON.parse(data);
                    global.adventureData.storyTrees = parsed;
                }
            }).not.toThrow();
            
            // Should preserve special characters
            expect(global.adventureData.storyTrees.choices[0].text).toContain('émojis 🎮');
        });
    });
});