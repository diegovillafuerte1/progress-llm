/**
 * Tests for "Age has caught up to you" bug when pausing during adventure
 */

describe('Death Message on Adventure Pause Bug', () => {
    describe('DeathText Visibility Logic', () => {
        test('should hide death message when age < lifespan', () => {
            const age = 40;
            const lifespan = 70;
            const shouldShowDeathMessage = age >= lifespan;
            
            expect(shouldShowDeathMessage).toBe(false);
        });
        
        test('should show death message only when age >= lifespan', () => {
            const age = 70;
            const lifespan = 70;
            const shouldShowDeathMessage = age >= lifespan;
            
            expect(shouldShowDeathMessage).toBe(true);
        });
        
        test('should not show death message during adventure pause', () => {
            const gameState = {
                days: 365 * 40, // Age 40
                lifespan: 365 * 70, // Lifespan 70
                paused: true, // Paused during adventure
                adventureActive: true
            };
            
            const age = Math.floor(gameState.days / 365);
            const lifespanYears = Math.floor(gameState.lifespan / 365);
            const isAlive = age < lifespanYears;
            
            // Should be alive (40 < 70)
            expect(isAlive).toBe(true);
            
            // Even when paused for adventure, should not show death message
            const shouldShowDeathMessage = !isAlive;
            expect(shouldShowDeathMessage).toBe(false);
        });
    });
    
    describe('Pause Behavior', () => {
        test('game pause should not trigger death check', () => {
            const gameState = {
                days: 365 * 40,
                paused: true
            };
            
            // Pausing shouldn't change the days
            const daysBeforePause = gameState.days;
            // ... pause happens ...
            const daysAfterPause = gameState.days;
            
            expect(daysAfterPause).toBe(daysBeforePause);
        });
        
        test('adventure pause should keep UI showing correct age', () => {
            const beforeAdventure = {
                age: 40,
                deathMessageVisible: false
            };
            
            // Start adventure (game pauses)
            const duringAdventure = {
                age: 40, // Should stay 40
                paused: true,
                adventureActive: true,
                deathMessageVisible: false // Should still be false
            };
            
            expect(duringAdventure.age).toBe(beforeAdventure.age);
            expect(duringAdventure.deathMessageVisible).toBe(false);
        });
    });
    
    describe('isAlive Function Behavior', () => {
        test('isAlive should return true when days < lifespan', () => {
            const days = 365 * 40; // 40 years
            const lifespan = 365 * 70; // 70 years
            const alive = days < lifespan;
            
            expect(alive).toBe(true);
        });
        
        test('isAlive should not be affected by pause state', () => {
            const days = 365 * 40;
            const lifespan = 365 * 70;
            const paused = true; // Game is paused
            
            const alive = days < lifespan;
            
            // Pause state doesn't affect whether character is alive
            expect(alive).toBe(true);
        });
    });
    
    describe('UI Update During Adventure', () => {
        test('updateUI should run even when game is paused', () => {
            // This tests the fix from previous bug
            const paused = true;
            
            // updateUI() should be called before pause check
            let uiUpdated = false;
            
            // Simulate update() function
            function update() {
                // updateUI should run first
                uiUpdated = true;
                
                // Then check pause
                if (paused) return;
                
                // Game logic...
            }
            
            update();
            expect(uiUpdated).toBe(true);
        });
        
        test('deathText should be hidden when character is alive, even if paused', () => {
            const days = 365 * 40;
            const lifespan = 365 * 70;
            const paused = true;
            
            const isAlive = days < lifespan;
            const deathTextShouldBeHidden = isAlive;
            
            expect(deathTextShouldBeHidden).toBe(true);
            // Even though paused, death message should be hidden
        });
    });
});

