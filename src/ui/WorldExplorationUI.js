/**
 * World Exploration UI - Handles UI for LLM-generated world exploration
 */

class WorldExplorationUI {
    constructor(gameState, mistralAPI) {
        // Set up logging
        if (typeof log !== 'undefined' && log.noConflict) {
            this.logger = log.noConflict();
        } else if (typeof log !== 'undefined') {
            this.logger = log;
        } else {
            // Fallback to console if loglevel is not available
            this.logger = {
                debug: console.debug,
                info: console.info,
                warn: console.warn,
                error: console.error,
                setLevel: function() {}
            };
        }
        this.logger.setLevel('warn'); // Only show warnings and errors in production
        
        this.gameState = gameState;
        this.mistralAPI = mistralAPI;
        this.isGenerating = false;
    }
    
    /**
     * Explore the world using LLM generation
     */
    async exploreWorld() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.showLoadingState();
        
        try {
            const characterState = CharacterEncoder.encodeCharacterState(this.gameState);
            const worldDescription = await this.mistralAPI.generateWorldDescription(characterState);
            this.displayWorldDescription(worldDescription);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.isGenerating = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Display world description in UI
     * @param {string} description - World description from LLM
     */
    displayWorldDescription(description) {
        const worldContainer = document.getElementById('worldExploration');
        if (!worldContainer) {
            this.logger.warn('worldExploration element not found');
            return;
        }
        
        worldContainer.innerHTML = `
            <div class="world-description">
                <h3>World Exploration</h3>
                <div class="description-text">${description}</div>
                <button onclick="worldExplorationUI.exploreWorld()" class="explore-button">
                    Continue Exploring
                </button>
            </div>
        `;
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        const worldContainer = document.getElementById('worldExploration');
        if (!worldContainer) return;
        
        worldContainer.innerHTML = `
            <div class="loading-state">
                <h3>Generating World...</h3>
                <div class="loading-spinner">⏳</div>
                <p>Creating your adventure...</p>
            </div>
        `;
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Loading state is replaced by displayWorldDescription
    }
    
    /**
     * Show error message
     * @param {string} errorMessage - Error message to display
     */
    showError(errorMessage) {
        const worldContainer = document.getElementById('worldExploration');
        if (!worldContainer) return;
        
        worldContainer.innerHTML = `
            <div class="error-state">
                <h3>Error</h3>
                <div class="error-message">${errorMessage}</div>
                <button onclick="worldExplorationUI.exploreWorld()" class="retry-button">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorldExplorationUI;
}
if (typeof window !== 'undefined') {
    window.WorldExplorationUI = WorldExplorationUI;
}
