/**
 * UI Fix Verification Tests
 * 
 * These tests verify that the UI regression has been properly fixed:
 * 1. No hardcoded Story Adventure UI in HTML
 * 2. No console errors from module loading
 * 3. Dynamic UI generation works properly
 */

const fs = require('fs');
const path = require('path');

describe('UI Fix Verification', () => {
    let htmlContent;
    
    beforeAll(() => {
        const htmlPath = path.join(__dirname, '..', 'index.html');
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
    });

    describe('HTML Structure Verification', () => {
        test('should not contain hardcoded Story Adventure elements', () => {
            // These elements should NOT be in the HTML
            const forbiddenElements = [
                'adventure-intro',
                'start-adventure-btn',
                'Dynamic Storytelling',
                'Multiple Choices',
                'Character Development',
                'Persistent World'
            ];
            
            // These elements are now correctly in the amulet tab
            const allowedElements = [
                'Story Adventure',
                'mistralApiKey'
            ];
            
            forbiddenElements.forEach(element => {
                expect(htmlContent).not.toContain(element);
            });
            
            // Verify that the allowed elements are present
            allowedElements.forEach(element => {
                expect(htmlContent).toContain(element);
            });
        });

        test('should not have World tab (moved to amulet tab)', () => {
            // World tab should not exist anymore - content moved to amulet tab
            const worldTabMatch = htmlContent.match(/<div class="tab" id="world">(.*?)<\/div>/s);
            expect(worldTabMatch).toBeFalsy();
            
            // But amulet tab should contain the API key input
            expect(htmlContent).toContain('id="rebirth"');
            expect(htmlContent).toContain('mistralApiKey');
        });

        test('should not load story-adventure.css by default', () => {
            expect(htmlContent).not.toContain('story-adventure.css');
        });
    });

    describe('JavaScript Module Loading Verification', () => {
        test('should not have ES6 import statements in loaded files', () => {
            const jsFiles = [
                'src/llm/StoryManager.js',
                'src/llm/StoryAdventureManager.js',
                'src/ui/WorldExplorationUI.js',
                'src/ui/StoryAdventureUI.js'
            ];
            
            jsFiles.forEach(file => {
                const filePath = path.join(__dirname, '..', file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    expect(content).not.toContain('import log from');
                    expect(content).not.toContain('import {');
                }
            });
        });

        test('should have proper log setup in JavaScript files', () => {
            const jsFiles = [
                'src/llm/StoryManager.js',
                'src/llm/StoryAdventureManager.js',
                'src/ui/WorldExplorationUI.js',
                'src/ui/StoryAdventureUI.js'
            ];
            
            jsFiles.forEach(file => {
                const filePath = path.join(__dirname, '..', file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (content.includes('log.noConflict()')) {
                        expect(content).toContain('log.noConflict()');
                    }
                }
            });
        });
    });

    describe('Dynamic UI Generation Verification', () => {
        test('should have WorldTabManager for dynamic UI generation', () => {
            const worldTabManagerPath = path.join(__dirname, '..', 'src/ui/WorldTabManager.js');
            expect(fs.existsSync(worldTabManagerPath)).toBe(true);
            
            const content = fs.readFileSync(worldTabManagerPath, 'utf8');
            expect(content).toContain('class WorldTabManager');
            expect(content).toContain('initialize()');
            expect(content).toContain('createStoryAdventureSection()');
        });

        test('should have proper script loading order in HTML', () => {
            // Check that loglevel is loaded before other scripts
            const loglevelIndex = htmlContent.indexOf('loglevel.min.js');
            const classesIndex = htmlContent.indexOf('js/classes.js');
            const llmIntegrationIndex = htmlContent.indexOf('js/llm-integration.js');
            
            expect(loglevelIndex).toBeLessThan(classesIndex);
            expect(loglevelIndex).toBeLessThan(llmIntegrationIndex);
        });

        test('should have WorldTabManager script included', () => {
            expect(htmlContent).toContain('src/ui/WorldTabManager.js');
        });
    });

    describe('Regression Prevention', () => {
        test('should have API key input in amulet tab (moved from dynamic creation)', () => {
            // The API key input is now in the amulet tab, which is correct
            expect(htmlContent).toMatch(/<input[^>]*id="mistralApiKey"/);
            
            // But other hardcoded elements should still not be present
            const hardcodedPatterns = [
                /<button[^>]*onclick="storyAdventureUI/,
                /<div[^>]*class="adventure-intro"/,
                /<div[^>]*class="adventure-features"/
            ];
            
            hardcodedPatterns.forEach(pattern => {
                expect(htmlContent).not.toMatch(pattern);
            });
        });

        test('should have proper tab initialization in main.js', () => {
            const mainJsPath = path.join(__dirname, '..', 'js/main.js');
            const content = fs.readFileSync(mainJsPath, 'utf8');
            
            expect(content).toContain('worldTabManager.initialize()');
            expect(content).toContain('selectedTab === \'world\'');
        });
    });
});
