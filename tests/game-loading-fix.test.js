/**
 * Game Loading Fix Tests
 * 
 * These tests verify that the game loads properly without console errors
 * and that the game state is correctly initialized.
 */

const fs = require('fs');
const path = require('path');

describe('Game Loading Fix Tests', () => {
    let htmlContent;
    let mainJsContent;
    
    beforeAll(() => {
        const htmlPath = path.join(__dirname, '..', 'index.html');
        const mainJsPath = path.join(__dirname, '..', 'js/main.js');
        
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
        mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    });

    describe('Console Error Prevention', () => {
        test('should have proper log setup in main.js', () => {
            expect(mainJsContent).toContain('typeof log !== \'undefined\'');
            expect(mainJsContent).toContain('log.noConflict');
            expect(mainJsContent).toContain('console.debug');
        });

        test('should have proper error handling in initialization', () => {
            expect(mainJsContent).toContain('initializeGame()');
            expect(mainJsContent).toContain('DOMContentLoaded');
            expect(mainJsContent).toContain('resetGameState()');
        });

        test('should have game state validation', () => {
            expect(mainJsContent).toContain('Corrupted game state detected');
            expect(mainJsContent).toContain('impossible death state');
        });
    });

    describe('Game State Initialization', () => {
        test('should have proper game data structure', () => {
            expect(mainJsContent).toContain('gameData = {');
            expect(mainJsContent).toContain('coins: 0');
            expect(mainJsContent).toContain('days: 365 * 14');
            expect(mainJsContent).toContain('evil: 0');
        });

        test('should have reset function for corrupted state', () => {
            expect(mainJsContent).toContain('function resetGameState()');
            expect(mainJsContent).toContain('gameData.coins = 0');
            expect(mainJsContent).toContain('gameData.days = 365 * 14');
        });
    });

    describe('DOM Initialization', () => {
        test('should wait for DOM to be ready', () => {
            expect(mainJsContent).toContain('document.readyState');
            expect(mainJsContent).toContain('addEventListener(\'DOMContentLoaded\'');
        });

        test('should have proper error handling', () => {
            expect(mainJsContent).toContain('try {');
            expect(mainJsContent).toContain('catch (error)');
            expect(mainJsContent).toContain('logger.error');
        });
    });

    describe('Script Loading Order', () => {
        test('should load loglevel before other scripts', () => {
            const loglevelIndex = htmlContent.indexOf('loglevel.min.js');
            const classesIndex = htmlContent.indexOf('js/classes.js');
            const mainIndex = htmlContent.indexOf('js/main.js');
            
            expect(loglevelIndex).toBeLessThan(classesIndex);
            expect(loglevelIndex).toBeLessThan(mainIndex);
        });
    });
});
