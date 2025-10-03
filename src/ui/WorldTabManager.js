/**
 * WorldTabManager - Manages the World tab content dynamically
 * This prevents hardcoding UI elements in HTML
 */

class WorldTabManager {
    constructor(gameState, mistralAPI, storyManager, adventureManager) {
        this.gameState = gameState;
        this.mistralAPI = mistralAPI;
        this.storyManager = storyManager;
        this.adventureManager = adventureManager;
        this.isInitialized = false;
    }

    /**
     * Initialize the World tab content
     */
    initialize() {
        if (this.isInitialized) return;
        
        const worldTab = document.getElementById('world');
        if (!worldTab) {
            console.warn('World tab not found');
            return;
        }

        // Clear any existing content
        worldTab.innerHTML = '';

        // Create the world exploration container
        const container = document.createElement('div');
        container.className = 'world-exploration-container';
        
        // Add CSS dynamically
        this.addDynamicCSS();
        
        // Create the content
        container.appendChild(this.createStoryAdventureSection());
        
        worldTab.appendChild(container);
        this.isInitialized = true;
    }

    /**
     * Add CSS dynamically to prevent hardcoding in HTML
     */
    addDynamicCSS() {
        // Check if CSS is already added
        if (document.getElementById('story-adventure-dynamic-css')) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'css/story-adventure.css';
        link.id = 'story-adventure-dynamic-css';
        document.head.appendChild(link);
    }

    /**
     * Create the Story Adventure section
     */
    createStoryAdventureSection() {
        const section = document.createElement('div');
        section.innerHTML = `
            <h2>Story Adventure</h2>
            <div class="api-config" style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <label for="mistralApiKey" style="display: block; margin-bottom: 10px; font-weight: bold;">Mistral API Key:</label>
                <input type="password" id="mistralApiKey" placeholder="Enter your Mistral API key" style="width: 400px; padding: 8px; border: 1px solid #ccc; border-radius: 3px;">
                <br>
                <small style="color: #666;">Get your free API key at <a href="https://console.mistral.ai" target="_blank">console.mistral.ai</a></small>
            </div>
            <div id="storyAdventure">
                <div class="adventure-intro">
                    <h3>Choose Your Adventure</h3>
                    <p>Start an interactive story adventure based on your character's current state. Your choices will shape the narrative and your character's development.</p>
                    <div class="adventure-features">
                        <div class="feature">
                            <strong>🎭 Dynamic Storytelling:</strong> Stories adapt to your character's traits, job, and moral alignment
                        </div>
                        <div class="feature">
                            <strong>⚔️ Multiple Choices:</strong> Each decision presents 4 different approaches to challenges
                        </div>
                        <div class="feature">
                            <strong>🔄 Character Development:</strong> Your choices influence your character's personality and abilities
                        </div>
                        <div class="feature">
                            <strong>🌍 Persistent World:</strong> Your actions have lasting consequences in the story world
                        </div>
                    </div>
                    <button onclick="storyAdventureUI.startNewStory()" class="w3-button button start-adventure-btn" style="margin-top: 15px; padding: 12px 24px; font-size: 16px;">
                        🚀 Start New Adventure
                    </button>
                </div>
            </div>
        `;
        return section;
    }

    /**
     * Clean up the World tab content
     */
    cleanup() {
        const worldTab = document.getElementById('world');
        if (worldTab) {
            worldTab.innerHTML = '<!-- World exploration content will be dynamically generated -->';
        }
        
        // Remove dynamic CSS
        const cssLink = document.getElementById('story-adventure-dynamic-css');
        if (cssLink) {
            cssLink.remove();
        }
        
        this.isInitialized = false;
    }
}
