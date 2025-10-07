/**
 * Amulet Adventure Integration
 * Integrates the story adventure system with the amulet system
 */

// Global variables for amulet adventure integration
let amuletAdventureIntegration;
let amuletStoryAdventureUI;

// Initialize amulet adventure integration
function initializeAmuletAdventureIntegration() {
    // Check if required classes are loaded
    if (typeof CareerBasedAdventureIntegration === 'undefined' || 
        typeof CareerBasedStoryAdventureUI === 'undefined') {
        console.warn('Amulet adventure classes not available - skipping initialization');
        return;
    }
    
    try {
        // Check if CareerBasedAdventureIntegration is available
        if (typeof CareerBasedAdventureIntegration === 'undefined') {
            console.warn('CareerBasedAdventureIntegration not available - skipping amulet adventure integration');
            return;
        }
        
        // Create integration instance
        amuletAdventureIntegration = new CareerBasedAdventureIntegration();
        
        // Create UI instance - use the same pattern as the career-based system
        amuletStoryAdventureUI = new CareerBasedStoryAdventureUI(
            gameData,
            amuletAdventureIntegration
        );
        
        // Make it available globally
        window.amuletStoryAdventureUI = amuletStoryAdventureUI;
        
        console.log('Amulet adventure integration initialized successfully');
        
        // Initialize the adventure availability check
        updateAmuletAdventureAvailability();
    } catch (error) {
        console.error('Failed to initialize amulet adventure integration:', error);
    }
}

// Start amulet adventure
async function startAmuletAdventure(amuletPrompt) {
    console.log(`🌟 Starting amulet adventure: ${amuletPrompt}`);
    
    try {
        // Check if adventure is available
        const currentAge = Math.floor(gameData.days / 365);
        
        // Simple age-based check instead of relying on integration
        const ageRequirements = {
            'age25': 25,
            'age45': 45,
            'age65': 65,
            'age200': 200
        };
        
        const requiredAge = ageRequirements[amuletPrompt];
        if (!requiredAge || currentAge < requiredAge) {
            console.warn(`Adventure not available: You must be at least ${requiredAge} years old. Current age: ${currentAge}`);
            return;
        }
        
        // Start the adventure using the existing career-based system
        const result = await amuletStoryAdventureUI.startCareerBasedAdventure(amuletPrompt);
        
        if (result.success) {
            console.log('Amulet adventure started successfully');
            updateAmuletAdventureUI(amuletPrompt);
            
            // Show the adventure content in the story adventure section
            const adventureContent = document.getElementById('adventureContent');
            if (adventureContent && result.adventure) {
                adventureContent.innerHTML = `
                    <div style="text-align: center;">
                        <h3 style="color: #4CAF50;">🌟 Adventure Active</h3>
                        <p><strong>${result.adventure.title}</strong></p>
                        <p>${result.adventure.description}</p>
                        <div style="margin-top: 15px;">
                            ${result.adventure.choices.map((choice, index) => `
                                <button class="w3-button button" style="margin: 5px;" onclick="makeAdventureChoice(${index})">
                                    ${choice}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        } else {
            console.error('Failed to start amulet adventure:', result.message);
            console.warn(`Adventure start failed: ${result.message}`);
        }
        
    } catch (error) {
        console.error('Error starting amulet adventure:', error);
        console.warn(`Adventure error: ${error.message}`);
    }
}

// Update amulet adventure UI
function updateAmuletAdventureUI(amuletPrompt) {
    // Hide all adventure buttons
    const adventureButtons = ['adventureButton25', 'adventureButton45', 'adventureButton65', 'adventureButton200'];
    adventureButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = 'none';
        }
    });
    
    // Show adventure content
    const adventureContent = document.getElementById('adventureContent');
    if (adventureContent) {
        adventureContent.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #4CAF50;">🌟 Adventure in Progress</h3>
                <p>Amulet Prompt: <strong>${amuletPrompt}</strong></p>
                <p style="color: #666;">Your adventure is currently active. Check the adventure content below.</p>
            </div>
        `;
    }
}

// Throttle button visibility updates to prevent console spam
let lastButtonUpdate = 0;
const BUTTON_UPDATE_THROTTLE = 5000; // Only update every 5 seconds

// Check and update amulet adventure availability
function updateAmuletAdventureAvailability() {
    const now = Date.now();
    if (now - lastButtonUpdate < BUTTON_UPDATE_THROTTLE) {
        return; // Skip update if too soon
    }
    lastButtonUpdate = now;
    
    const currentAge = Math.floor(gameData.days / 365);
    
    // Hide all adventure buttons first
    const adventureButtons = [
        { id: 'adventureButton25', prompt: 'age25', minAge: 25 },
        { id: 'adventureButton45', prompt: 'age45', minAge: 45 },
        { id: 'adventureButton65', prompt: 'age65', minAge: 65 },
        { id: 'adventureButton200', prompt: 'age200', minAge: 200 }
    ];
    
    let availablePrompt = null;
    let buttonsChanged = false;
    
    adventureButtons.forEach(({ id, prompt, minAge }) => {
        const button = document.getElementById(id);
        if (button) {
            const shouldShow = currentAge >= minAge;
            const isCurrentlyShown = button.style.display === 'block';
            
            if (shouldShow && !isCurrentlyShown) {
                button.style.display = 'block';
                availablePrompt = prompt;
                buttonsChanged = true;
            } else if (!shouldShow && isCurrentlyShown) {
                button.style.display = 'none';
                buttonsChanged = true;
            }
        }
    });
    
    // Only log when buttons actually change
    if (buttonsChanged) {
        console.log(`Adventure buttons updated for age ${currentAge}`);
    }
    
    // Update adventure content
    const adventureContent = document.getElementById('adventureContent');
    if (adventureContent) {
        if (availablePrompt) {
            adventureContent.innerHTML = `
                <div style="text-align: center;">
                    <h3 style="color: #4CAF50;">🌟 Adventure Available!</h3>
                    <p>You have reached the <strong>${availablePrompt}</strong> milestone.</p>
                    <p style="color: #666;">Click the "Start Adventure" button above to begin your story.</p>
                </div>
            `;
        } else {
            adventureContent.innerHTML = `
                <p style="color: #666; font-style: italic;">Adventures are only available when you reach the amulet milestones at ages 25, 45, 65, and 200.</p>
            `;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a short delay to ensure other systems are loaded
    setTimeout(initializeAmuletAdventureIntegration, 500);
    
    // Also try to show buttons immediately if age is appropriate
    setTimeout(() => {
        const currentAge = Math.floor(gameData.days / 365);
        if (currentAge >= 25) {
            console.log('Player is age', currentAge, '- showing adventure buttons');
            updateAmuletAdventureAvailability();
        }
    }, 1000);
    
    // Fallback: Always try to show buttons after a longer delay
    setTimeout(() => {
        console.log('Fallback: Checking adventure button visibility');
        updateAmuletAdventureAvailability();
    }, 2000);
});

// Handle adventure choice
function makeAdventureChoice(choiceIndex) {
    if (!amuletStoryAdventureUI) {
        console.error('Amulet story adventure UI not initialized');
        return;
    }
    
    try {
        // Make the choice using the existing system
        amuletStoryAdventureUI.makeChoice(choiceIndex);
        
        // Update the UI to show the result
        updateAmuletAdventureUI();
        
    } catch (error) {
        console.error('Error making adventure choice:', error);
        console.warn(`Choice error: ${error.message}`);
    }
}

// Update availability when game updates
if (typeof window !== 'undefined') {
    // Override the existing update function to include amulet adventure updates
    const originalUpdate = window.update;
    if (originalUpdate) {
        window.update = function() {
            originalUpdate();
            updateAmuletAdventureAvailability();
        };
    } else {
        // If no existing update function, create one
        window.update = function() {
            updateAmuletAdventureAvailability();
        };
    }
    
    // Also expose the function globally for manual testing
    window.updateAmuletAdventureAvailability = updateAmuletAdventureAvailability;
}
