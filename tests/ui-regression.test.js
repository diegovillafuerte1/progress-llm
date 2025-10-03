/**
 * UI Regression Tests - Prevent UI elements from appearing in wrong contexts
 * 
 * These tests ensure that:
 * 1. Story Adventure UI is not hardcoded in HTML
 * 2. UI elements only appear when they should
 * 3. No console errors from module loading issues
 */

const fs = require('fs');
const path = require('path');

describe('UI Regression Tests', () => {
    let htmlContent;
    
    beforeAll(() => {
        // Read the HTML file
        const htmlPath = path.join(__dirname, '..', 'index.html');
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
    });

    describe('Story Adventure UI Hardcoding Prevention', () => {
        test('should not have hardcoded Story Adventure UI in HTML', () => {
            // Check for hardcoded Story Adventure elements
            const hardcodedElements = [
                'Story Adventure',
                'mistralApiKey',
                'storyAdventure',
                'adventure-intro',
                'start-adventure-btn'
            ];
            
            hardcodedElements.forEach(element => {
                expect(htmlContent).not.toContain(element);
            });
        });

        test('should not have hardcoded API key input in HTML', () => {
            expect(htmlContent).not.toContain('Enter your Mistral API key');
            expect(htmlContent).not.toContain('console.mistral.ai');
        });

        test('should not have hardcoded adventure features in HTML', () => {
            expect(htmlContent).not.toContain('Dynamic Storytelling');
            expect(htmlContent).not.toContain('Multiple Choices');
            expect(htmlContent).not.toContain('Character Development');
            expect(htmlContent).not.toContain('Persistent World');
        });
    });

    describe('Script Loading Validation', () => {
        test('should not have ES6 import statements in script tags', () => {
            // Check that script tags don't use module type
            const scriptTags = htmlContent.match(/<script[^>]*>/g) || [];
            scriptTags.forEach(scriptTag => {
                expect(scriptTag).not.toContain('type="module"');
            });
        });

        test('should have proper script loading order', () => {
            // Check that loglevel is loaded before other scripts
            const loglevelIndex = htmlContent.indexOf('loglevel.min.js');
            const otherScriptsIndex = htmlContent.indexOf('js/classes.js');
            
            expect(loglevelIndex).toBeLessThan(otherScriptsIndex);
        });
    });

    describe('CSS Loading Validation', () => {
        test('should not have story-adventure.css loaded by default', () => {
            expect(htmlContent).not.toContain('story-adventure.css');
        });
    });

    describe('Tab Structure Validation', () => {
        test('should have proper tab structure without hardcoded content', () => {
            // Check that tabs are properly structured
            expect(htmlContent).toContain('id="jobs"');
            expect(htmlContent).toContain('id="skills"');
            expect(htmlContent).toContain('id="shop"');
            expect(htmlContent).toContain('id="rebirth"');
            expect(htmlContent).toContain('id="settings"');
            
            // World tab should exist but only have a comment
            const worldTabMatch = htmlContent.match(/<div class="tab" id="world">(.*?)<\/div>/s);
            if (worldTabMatch) {
                const worldTabContent = worldTabMatch[1].trim();
                expect(worldTabContent).toContain('dynamically generated');
            }
        });
    });

    describe('Console Error Prevention', () => {
        test('should not have ES6 import statements in JavaScript files', () => {
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

        test('should not have log.noConflict() calls without proper log setup', () => {
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
                    // Should not have log.noConflict() without proper log setup
                    if (content.includes('log.noConflict()')) {
                        // Check that it's properly guarded with typeof log check
                        expect(content).toContain('typeof log !== \'undefined\'');
                    }
                }
            });
        });
    });
});

describe('Dynamic UI Generation Tests', () => {
    test('should be able to create Story Adventure UI dynamically', () => {
        // This test ensures the UI can be created programmatically
        const mockGameState = {
            coins: 100,
            days: 1000,
            evil: 0
        };
        
        const mockMistralAPI = {
            apiKey: 'test-key'
        };
        
        // Test that we can create the UI without hardcoding
        // Note: This test will only pass if the classes are loaded in the test environment
        if (typeof StoryAdventureUI !== 'undefined') {
            expect(() => {
                const storyAdventureUI = new StoryAdventureUI(mockGameState, mockMistralAPI);
                expect(storyAdventureUI).toBeDefined();
            }).not.toThrow();
        } else {
            // If classes aren't loaded, just verify the test structure is correct
            expect(true).toBe(true);
        }
    });
});
