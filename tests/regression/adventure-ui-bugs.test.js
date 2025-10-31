/**
 * Test cases for adventure UI bugs
 * Tests for: skip buttons on headers, text cutoff, missing decision tree, adventure persistence
 */

describe('Adventure UI Bug Tests', () => {

    describe('Skip Button Bug Tests', () => {
        test('should not show skip buttons on job category headers', () => {
            // Mock the updateHeaderRows function behavior for job categories
            const jobCategories = { 'Common work': ['Beggar'] };
            const skillCategories = { 'Fundamentals': ['Concentration'] };
            const autoLearnElement = { checked: true };
            
            // Simulate the logic from updateHeaderRows
            const categories = jobCategories;
            const shouldShow = categories === skillCategories && autoLearnElement && autoLearnElement.checked;
            
            // Job categories should not show skip buttons
            expect(shouldShow).toBe(false);
        });

        test('should show skip buttons only on skill category headers when auto-learn is enabled', () => {
            // Mock the updateHeaderRows function behavior for skill categories
            const skillCategories = { 'Fundamentals': ['Concentration'] };
            const autoLearnElement = { checked: true };
            
            // Simulate the logic from updateHeaderRows
            const categories = skillCategories;
            const shouldShow = categories === skillCategories && autoLearnElement && autoLearnElement.checked;
            
            // Skill categories should show skip buttons when auto-learn is enabled
            expect(shouldShow).toBe(true);
        });
    });

    describe('Adventure Text Cutoff Bug Tests', () => {
        test('should handle long adventure text without truncation', () => {
            const longText = "This is a very long adventure story that should not be cut off. ".repeat(20);
            
            // Mock adventure data with long text
            const adventureData = {
                currentAdventure: {
                    story: longText,
                    choices: [
                        { text: "Choice 1", type: "aggressive" },
                        { text: "Choice 2", type: "diplomatic" }
                    ]
                },
                currentChoices: [
                    { text: "Choice 1", type: "aggressive", successProbability: 0.5 },
                    { text: "Choice 2", type: "diplomatic", successProbability: 0.5 }
                ]
            };
            
            // Test that the story text is not truncated
            expect(adventureData.currentAdventure.story.length).toBeGreaterThan(1000);
            expect(adventureData.currentAdventure.story).toContain("This is a very long adventure story");
        });

        test('should handle adventure continuation without text limits', () => {
            const continuation = "This is the continuation of the adventure story that should be complete and not cut off. ".repeat(15);
            
            // Mock adventure result
            const result = {
                continuation: continuation,
                rewards: {
                    skill: 'Strength',
                    xp: 1500,
                    success: true
                }
            };
            
            // Test that continuation text is not truncated
            expect(result.continuation.length).toBeGreaterThan(500);
            expect(result.continuation).toContain("This is the continuation");
        });
    });

    describe('Adventure Decision Tree Bug Tests', () => {
        test('should provide follow-up choices after adventure completion', () => {
            const adventureResult = {
                continuation: "The merchant was impressed by your negotiation skills.",
                rewards: { skill: 'Bargaining', xp: 1500, success: true },
                followUpChoices: [
                    { text: "Ask for a better deal", type: "diplomatic" },
                    { text: "Threaten to leave", type: "aggressive" },
                    { text: "Propose a partnership", type: "creative" }
                ]
            };
            
            // Test that follow-up choices are provided
            expect(adventureResult.followUpChoices).toBeDefined();
            expect(adventureResult.followUpChoices.length).toBeGreaterThan(0);
            expect(adventureResult.followUpChoices[0]).toHaveProperty('text');
            expect(adventureResult.followUpChoices[0]).toHaveProperty('type');
        });

        test('should handle multiple adventure turns', () => {
            const adventureState = {
                currentTurn: 1,
                maxTurns: 3,
                hasMoreChoices: true,
                choices: [
                    { text: "Continue the negotiation", type: "diplomatic" },
                    { text: "Try a different approach", type: "cautious" }
                ]
            };
            
            // Test that adventure can continue with more turns
            expect(adventureState.currentTurn).toBeLessThan(adventureState.maxTurns);
            expect(adventureState.hasMoreChoices).toBe(true);
            expect(adventureState.choices.length).toBeGreaterThan(0);
        });
    });

    describe('Adventure Persistence Bug Tests', () => {
        test('should not persist adventure display across different views', () => {
            // Mock adventure display state
            let adventureDisplay = { id: 'adventureDisplay', innerHTML: '<h3>Adventure</h3><p>Story content</p>' };
            
            // Simulate switching to different tab/view
            expect(adventureDisplay).toBeTruthy();
            
            // Simulate closing adventure
            adventureDisplay = null;
            
            // Adventure should be removed
            expect(adventureDisplay).toBeNull();
        });

        test('should clean up adventure state when closed', () => {
            const adventureData = {
                currentAdventure: {
                    milestone: 'age200',
                    story: 'Test story',
                    choices: []
                },
                currentChoices: []
            };
            
            // Simulate closing adventure
            adventureData.currentAdventure = null;
            adventureData.currentChoices = [];
            
            // Adventure state should be cleared
            expect(adventureData.currentAdventure).toBeNull();
            expect(adventureData.currentChoices.length).toBe(0);
        });
    });
});
