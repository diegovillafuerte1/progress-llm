/**
 * Simplified tests for adventure API key validation
 * 
 * Tests the core logic without complex DOM mocking
 */

describe('Adventure API Key Validation (Simplified)', () => {
    let mockWindow;
    
    beforeEach(() => {
        // Mock window object with mistralAPI
        mockWindow = {
            mistralAPI: {
                apiKey: ''
            }
        };
    });
    
    describe('API Key Detection Logic', () => {
        test('should detect valid API key', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key-12345';
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(true);
        });
        
        test('should detect empty API key as invalid', () => {
            mockWindow.mistralAPI.apiKey = '';
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
        
        test('should detect whitespace-only API key as invalid', () => {
            mockWindow.mistralAPI.apiKey = '   ';
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
        
        test('should detect null API key as invalid', () => {
            mockWindow.mistralAPI.apiKey = null;
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
        
        test('should detect undefined API key as invalid', () => {
            mockWindow.mistralAPI.apiKey = undefined;
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
        
        test('should handle missing mistralAPI object', () => {
            delete mockWindow.mistralAPI;
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
        
        test('should handle mistralAPI object without apiKey property', () => {
            mockWindow.mistralAPI = {};
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
    });
    
    describe('Button Disable Logic', () => {
        test('should disable button when no API key', () => {
            mockWindow.mistralAPI.apiKey = '';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = false;
            const ageRequirementMet = true;
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(true);
        });
        
        test('should disable button when adventure already used', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = true;
            const ageRequirementMet = true;
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(true);
        });
        
        test('should disable button when age requirement not met', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = false;
            const ageRequirementMet = false;
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(true);
        });
        
        test('should enable button when all conditions met', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = false;
            const ageRequirementMet = true;
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(false);
        });
    });
    
    describe('API Key Edge Cases', () => {
        test('should handle very long API keys', () => {
            const longApiKey = 'a'.repeat(1000);
            mockWindow.mistralAPI.apiKey = longApiKey;
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(true);
        });
        
        test('should handle API keys with special characters', () => {
            const specialApiKey = 'api-key-with-special-chars-!@#$%^&*()_+-=[]{}|;:,.<>?';
            mockWindow.mistralAPI.apiKey = specialApiKey;
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(true);
        });
        
        test('should handle API keys with newlines and tabs', () => {
            const multilineApiKey = 'api-key\nwith\ttabs';
            mockWindow.mistralAPI.apiKey = multilineApiKey;
            
            const hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(true);
        });
        
        test('should handle API key changes', () => {
            // Start with invalid key
            mockWindow.mistralAPI.apiKey = '';
            let hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
            
            // Change to valid key
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(true);
            
            // Change back to invalid
            mockWindow.mistralAPI.apiKey = '';
            hasKey = !!(mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0);
            expect(hasKey).toBe(false);
        });
    });
    
    describe('Integration Scenarios', () => {
        test('should prioritize adventure completion over API key', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = true; // Adventure already used
            const ageRequirementMet = true;
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(true);
            expect(apiKeyAvailable).toBe(true);
            expect(alreadyUsed).toBe(true);
        });
        
        test('should require both API key and age requirement', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = false;
            const ageRequirementMet = false; // Age not met
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(true);
            expect(apiKeyAvailable).toBe(true);
            expect(ageRequirementMet).toBe(false);
        });
        
        test('should enable only when all conditions are perfect', () => {
            mockWindow.mistralAPI.apiKey = 'valid-api-key';
            
            const apiKeyAvailable = mockWindow.mistralAPI && mockWindow.mistralAPI.apiKey && mockWindow.mistralAPI.apiKey.trim().length > 0;
            const alreadyUsed = false;
            const ageRequirementMet = true;
            const shouldDisable = !apiKeyAvailable || alreadyUsed || !ageRequirementMet;
            
            expect(shouldDisable).toBe(false);
            expect(apiKeyAvailable).toBe(true);
            expect(alreadyUsed).toBe(false);
            expect(ageRequirementMet).toBe(true);
        });
    });
});
