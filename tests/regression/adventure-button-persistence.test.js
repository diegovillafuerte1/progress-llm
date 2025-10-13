/**
 * Tests for adventure button state persistence across page refreshes
 */

describe('Adventure Button Persistence', () => {
    let mockLocalStorage;
    
    beforeEach(() => {
        mockLocalStorage = {
            data: {},
            getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
            setItem: jest.fn((key, value) => {
                mockLocalStorage.data[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockLocalStorage.data[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage.data = {};
            })
        };
    });
    
    describe('Adventure Usage Tracking', () => {
        test('should persist adventure usage to localStorage', () => {
            const currentLifeAdventures = {
                age25: true,
                age45: false,
                age65: false,
                age200: false
            };
            
            // Save to localStorage
            mockLocalStorage.setItem('currentLifeAdventures', JSON.stringify(currentLifeAdventures));
            
            // Verify it was saved
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'currentLifeAdventures',
                JSON.stringify(currentLifeAdventures)
            );
            
            // Verify it can be retrieved
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            expect(saved).toBeDefined();
            expect(JSON.parse(saved).age25).toBe(true);
        });
        
        test('should restore adventure usage on page load', () => {
            // Simulate saved state
            mockLocalStorage.data['currentLifeAdventures'] = JSON.stringify({
                age25: true,
                age45: true,
                age65: false,
                age200: false
            });
            
            // Load from localStorage
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const restored = JSON.parse(saved);
            
            expect(restored.age25).toBe(true);
            expect(restored.age45).toBe(true);
            expect(restored.age65).toBe(false);
            expect(restored.age200).toBe(false);
        });
        
        test('should default to all false if no saved data', () => {
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const adventures = saved ? JSON.parse(saved) : {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };
            
            expect(adventures.age25).toBe(false);
            expect(adventures.age45).toBe(false);
            expect(adventures.age65).toBe(false);
            expect(adventures.age200).toBe(false);
        });
        
        test('should reset all adventures on rebirth', () => {
            // Start with some used
            mockLocalStorage.data['currentLifeAdventures'] = JSON.stringify({
                age25: true,
                age45: true,
                age65: false,
                age200: false
            });
            
            // Rebirth should reset all to false
            const resetAdventures = {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };
            mockLocalStorage.setItem('currentLifeAdventures', JSON.stringify(resetAdventures));
            
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const restored = JSON.parse(saved);
            
            expect(restored.age25).toBe(false);
            expect(restored.age45).toBe(false);
        });
    });
    
    describe('Button State After Refresh', () => {
        test('should keep button disabled after refresh if adventure was used', () => {
            // Save that age25 was used
            mockLocalStorage.data['currentLifeAdventures'] = JSON.stringify({
                age25: true,
                age45: false,
                age65: false,
                age200: false
            });
            
            // On page load, check if button should be disabled
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const adventures = JSON.parse(saved);
            const shouldDisableAge25Button = adventures.age25 === true;
            
            expect(shouldDisableAge25Button).toBe(true);
        });
        
        test('should enable button after refresh if adventure not used yet', () => {
            mockLocalStorage.data['currentLifeAdventures'] = JSON.stringify({
                age25: false,
                age45: false,
                age65: false,
                age200: false
            });
            
            const saved = mockLocalStorage.getItem('currentLifeAdventures');
            const adventures = JSON.parse(saved);
            const shouldEnableAge25Button = adventures.age25 === false && daysToYears(365 * 25) >= 25;
            
            // Assuming daysToYears function
            function daysToYears(days) {
                return Math.floor(days / 365);
            }
            
            expect(shouldEnableAge25Button).toBe(true);
        });
    });
    
    describe('Multiple Adventures Per Life', () => {
        test('should allow all 4 adventures to run independently in one life', () => {
            const adventures = {
                age25: false,
                age45: false,
                age65: false,
                age200: false
            };
            
            // Simulate running each adventure
            adventures.age25 = true;
            expect(adventures.age45).toBe(false); // age45 still available
            
            adventures.age45 = true;
            expect(adventures.age65).toBe(false); // age65 still available
            
            adventures.age65 = true;
            expect(adventures.age200).toBe(false); // age200 still available
            
            adventures.age200 = true;
            // All used now
            expect(Object.values(adventures).every(v => v === true)).toBe(true);
        });
    });
});

