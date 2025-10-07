/**
 * Career-Based Adventure Integration
 * Integrates career-based adventures with the main game
 */

// Global variables for career-based adventures
let careerBasedStoryAdventureUI;
let careerBasedIntegration;

// Initialize career-based adventure system
function initializeCareerBasedAdventures() {
    // Check if required classes are loaded
    if (typeof CareerBasedStoryAdventureUI === 'undefined' || 
        typeof CareerBasedAdventureIntegration === 'undefined') {
        console.warn('Career-based adventure classes not available - skipping initialization');
        return;
    }
    
    console.log('Initializing career-based adventure system...');
    
    try {
        // Initialize career-based adventure UI
        careerBasedStoryAdventureUI = new CareerBasedStoryAdventureUI(
            gameData,
            mistralAPI,
            storyManager,
            storyAdventureManager,
            null // gameManager not available, pass null
        );
        
        // Make it available globally
        window.careerBasedStoryAdventureUI = careerBasedStoryAdventureUI;
        
        console.log('Career-based adventure system initialized');
    } catch (error) {
        console.error('Failed to initialize career-based adventure system:', error);
    }
}

// Check for adventure availability (no automatic triggering)
function checkAdventureAvailability() {
    if (!careerBasedStoryAdventureUI) {
        return null;
    }
    
    const availability = careerBasedStoryAdventureUI.checkAdventureAvailability();
    return availability;
}

// Trigger career-based adventure
async function triggerCareerBasedAdventure(amuletPrompt) {
    if (!careerBasedStoryAdventureUI) {
        console.error('Career-based adventure UI not initialized');
        return;
    }
    
    // Pause the game
    gameData.paused = true;
    
    // Start the career-based adventure
    const result = await careerBasedStoryAdventureUI.startCareerBasedAdventure(amuletPrompt);
    
    if (result.success) {
        console.log('Career-based adventure started successfully');
    } else {
        console.error('Failed to start career-based adventure:', result.message);
        // Unpause the game if adventure failed to start
        gameData.paused = false;
    }
}

// Add career-based adventure check to the main game loop (no automatic triggering)
function addCareerBasedAdventureCheck() {
    // Store the original update function
    const originalUpdate = window.update;
    
    // Override the update function to include career-based adventure availability checks
    window.update = function() {
        // Call the original update function
        originalUpdate();
        
        // Check for adventure availability (but don't auto-trigger)
        const availability = checkAdventureAvailability();
        if (availability && availability.isAvailable) {
            // Update UI to show adventure is available
            updateAdventureAvailabilityUI(availability);
        }
    };
}

// Add career-based adventure UI to the page
function addCareerBasedAdventureUI() {
    // Create adventure container if it doesn't exist
    let adventureContainer = document.getElementById('adventureContainer');
    if (!adventureContainer) {
        adventureContainer = document.createElement('div');
        adventureContainer.id = 'adventureContainer';
        adventureContainer.style.display = 'none';
        adventureContainer.style.position = 'fixed';
        adventureContainer.style.top = '0';
        adventureContainer.style.left = '0';
        adventureContainer.style.width = '100%';
        adventureContainer.style.height = '100%';
        adventureContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        adventureContainer.style.zIndex = '1000';
        adventureContainer.style.padding = '20px';
        adventureContainer.style.boxSizing = 'border-box';
        adventureContainer.style.overflow = 'auto';
        
        document.body.appendChild(adventureContainer);
    }
    
    // Add CSS styles for career-based adventures
    const style = document.createElement('style');
    style.textContent = `
        .career-based-adventure {
            background: white;
            border-radius: 10px;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .adventure-header {
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .adventure-header h2 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .career-info {
            display: flex;
            gap: 15px;
        }
        
        .career-category, .amulet-prompt {
            background: #f0f0f0;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.9em;
        }
        
        .adventure-description {
            margin-bottom: 25px;
            line-height: 1.6;
        }
        
        .choices-container {
            display: grid;
            gap: 15px;
        }
        
        .choice-option {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            transition: border-color 0.3s;
        }
        
        .choice-option:hover {
            border-color: #007bff;
        }
        
        .choice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .choice-type {
            background: #007bff;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        
        .success-probability {
            background: #28a745;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        
        .choice-text {
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .choice-description {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        
        .choice-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .choice-button:hover {
            background: #0056b3;
        }
        
        .choice-result {
            background: white;
            border-radius: 10px;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .result-header h3 {
            margin: 0 0 10px 0;
            color: #28a745;
        }
        
        .result-details {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .story-continuation {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .result-actions {
            display: flex;
            gap: 10px;
        }
        
        .continue-button, .end-button, .close-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .end-button {
            background: #dc3545;
        }
        
        .close-button {
            background: #6c757d;
        }
        
        .loading-state {
            text-align: center;
            color: white;
        }
        
        .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-state {
            background: white;
            border-radius: 10px;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
        }
        
        .error-state h3 {
            color: #dc3545;
            margin: 0 0 15px 0;
        }
        
        .adventure-summary {
            background: white;
            border-radius: 10px;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
        }
        
        .summary-details {
            text-align: left;
            margin: 20px 0;
        }
        
        .summary-details p {
            margin: 10px 0;
        }
    `;
    document.head.appendChild(style);
}

// Initialize the career-based adventure system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add error handling first
    addErrorHandling();
    
    // Add the UI elements
    addCareerBasedAdventureUI();
    
    // Initialize the career-based adventure system
    initializeCareerBasedAdventures();
    
    // Add the career-based adventure check to the game loop
    addCareerBasedAdventureCheck();
    
    console.log('Career-based adventure integration loaded');
});

// Update adventure availability UI
function updateAdventureAvailabilityUI(availability) {
    // Find or create adventure availability indicator
    let indicator = document.getElementById('adventureAvailabilityIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'adventureAvailabilityIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1000;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
    }
    
    if (availability.isAvailable) {
        indicator.innerHTML = `
            <strong>🎯 Adventure Available!</strong><br>
            Age ${availability.currentAge} - ${availability.amuletPrompt}<br>
            <small>Click to start adventure</small>
        `;
        indicator.onclick = () => triggerCareerBasedAdventure(availability.amuletPrompt);
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

// Fix console errors by adding error handling
function addErrorHandling() {
    // Override console.error to catch and handle errors gracefully
    const originalConsoleError = console.error;
    console.error = function(...args) {
        // Filter out known browser extension errors
        const message = args.join(' ');
        if (message.includes('duplicate id') || 
            message.includes('LastPass') || 
            message.includes('runtime.lastError')) {
            // Ignore these common browser extension errors
            return;
        }
        
        // Log other errors normally
        originalConsoleError.apply(console, args);
    };
}

// Debug functions for story trees
function debugStoryTrees() {
    if (window.careerBasedStoryAdventureUI && window.careerBasedStoryAdventureUI.integration) {
        window.careerBasedStoryAdventureUI.integration.debugStoryTrees();
    } else {
        console.log('❌ Career-based adventure system not initialized');
    }
}

function getStoryTreeSummary() {
    if (window.careerBasedStoryAdventureUI && window.careerBasedStoryAdventureUI.integration) {
        return window.careerBasedStoryAdventureUI.integration.getStoryTreeSummary();
    } else {
        console.log('❌ Career-based adventure system not initialized');
        return { error: 'System not initialized' };
    }
}

// Export functions for global access
window.triggerCareerBasedAdventure = triggerCareerBasedAdventure;
window.checkAdventureAvailability = checkAdventureAvailability;
window.updateAdventureAvailabilityUI = updateAdventureAvailabilityUI;
window.debugStoryTrees = debugStoryTrees;
window.getStoryTreeSummary = getStoryTreeSummary;
