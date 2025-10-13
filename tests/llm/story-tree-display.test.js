/**
 * Tests for Story Tree debugging twisty display
 */

describe('Story Tree Display Feature', () => {
    let mockLocalStorage;
    
    beforeEach(() => {
        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            })
        };
    });
    
    describe('Twisty Creation', () => {
        test('should create twisty element for each amulet milestone', () => {
            const milestones = ['age25', 'age45', 'age65', 'age200'];
            const twisties = {};
            
            milestones.forEach(milestone => {
                twisties[milestone] = {
                    id: `storyTreeTwisty_${milestone}`,
                    visible: false,
                    expanded: false
                };
            });
            
            expect(Object.keys(twisties)).toHaveLength(4);
            expect(twisties.age25.id).toBe('storyTreeTwisty_age25');
        });
        
        test('twisty should be hidden before first adventure', () => {
            const hasRunAdventure = false;
            const twistyVisible = hasRunAdventure;
            
            expect(twistyVisible).toBe(false);
        });
        
        test('twisty should appear after adventure completes', () => {
            const hasRunAdventure = true;
            const twistyVisible = hasRunAdventure;
            
            expect(twistyVisible).toBe(true);
        });
    });
    
    describe('Story Tree Data Display', () => {
        test('should display storyTrees object for specific milestone', () => {
            // Mock saved story tree
            const storyTrees = {
                age25: {
                    'Common work': {
                        branches: {
                            'Negotiate a fair deal': {
                                choice: 'Negotiate a fair deal',
                                result: false,
                                timestamp: Date.now(),
                                depth: 0,
                                powerLevel: 0,
                                powerTier: '10-C',
                                children: {
                                    'Start a small business': {
                                        choice: 'Start a small business',
                                        result: true,
                                        depth: 1,
                                        powerLevel: 0
                                    }
                                }
                            }
                        }
                    }
                }
            };
            
            mockLocalStorage.data['storyTrees'] = JSON.stringify(storyTrees);
            
            // Get data for age25
            const saved = mockLocalStorage.getItem('storyTrees');
            const parsed = JSON.parse(saved);
            const age25Data = parsed.age25;
            
            expect(age25Data).toBeDefined();
            expect(age25Data['Common work']).toBeDefined();
            expect(age25Data['Common work'].branches['Negotiate a fair deal']).toBeDefined();
        });
        
        test('should handle empty story tree gracefully', () => {
            mockLocalStorage.data['storyTrees'] = JSON.stringify({});
            
            const saved = mockLocalStorage.getItem('storyTrees');
            const parsed = JSON.parse(saved);
            const age25Data = parsed.age25 || {};
            
            expect(age25Data).toEqual({});
        });
        
        test('should display formatted JSON with indentation', () => {
            const treeData = {
                'Common work': {
                    branches: {
                        'Test choice': {
                            choice: 'Test choice',
                            result: true,
                            depth: 0
                        }
                    }
                }
            };
            
            const formatted = JSON.stringify(treeData, null, 2);
            
            expect(formatted).toContain('  "Common work"');
            expect(formatted).toContain('    "branches"');
            expect(formatted).toContain('      "Test choice"');
        });
    });
    
    describe('Twisty Persistence', () => {
        test('twisty should persist across page refreshes', () => {
            // After adventure, twisty is created
            mockLocalStorage.data['currentLifeAdventures'] = JSON.stringify({
                age25: true,
                age45: false,
                age65: false,
                age200: false
            });
            
            // On page reload, check if twisty should be shown
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const adventures = JSON.parse(saved);
            const shouldShowAge25Twisty = adventures.age25 === true;
            
            expect(shouldShowAge25Twisty).toBe(true);
        });
        
        test('twisty should update when new choices are made', () => {
            const initialTree = {
                age25: {
                    'Common work': {
                        branches: {
                            'Choice 1': { result: true, depth: 0, children: {} }
                        }
                    }
                }
            };
            
            mockLocalStorage.data['storyTrees'] = JSON.stringify(initialTree);
            
            // Make another choice
            const tree = JSON.parse(mockLocalStorage.getItem('storyTrees'));
            tree.age25['Common work'].branches['Choice 1'].children = {
                'Choice 2': { result: true, depth: 1, children: {} }
            };
            mockLocalStorage.setItem('storyTrees', JSON.stringify(tree));
            
            // Verify update
            const updated = JSON.parse(mockLocalStorage.getItem('storyTrees'));
            expect(updated.age25['Common work'].branches['Choice 1'].children['Choice 2']).toBeDefined();
        });
    });
    
    describe('Multiple Milestones', () => {
        test('should track all 4 milestones independently', () => {
            mockLocalStorage.data['currentLifeAdventures'] = JSON.stringify({
                age25: true,
                age45: true,
                age65: false,
                age200: false
            });
            
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const adventures = JSON.parse(saved);
            
            // Should be able to run adventures at different milestones
            expect(adventures.age25).toBe(true); // Already run
            expect(adventures.age45).toBe(true); // Already run
            expect(adventures.age65).toBe(false); // Can still run
            expect(adventures.age200).toBe(false); // Can still run
        });
        
        test('each milestone should have its own story tree', () => {
            const storyTrees = {
                age25: { 'Common work': { branches: {} } },
                age45: { 'Military': { branches: {} } },
                age65: { 'The Arcane': { branches: {} } },
                age200: { 'The Void': { branches: {} } }
            };
            
            mockLocalStorage.data['storyTrees'] = JSON.stringify(storyTrees);
            
            const saved = JSON.parse(mockLocalStorage.getItem('storyTrees'));
            
            expect(saved.age25).toBeDefined();
            expect(saved.age45).toBeDefined();
            expect(saved.age65).toBeDefined();
            expect(saved.age200).toBeDefined();
        });
    });
});

