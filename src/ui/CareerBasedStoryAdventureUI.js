/**
 * CareerBasedStoryAdventureUI - Enhanced UI for career-based story adventures
 * Integrates with the existing StoryAdventureUI and adds career-based functionality
 */

// Dependencies will be loaded via script tags

class CareerBasedStoryAdventureUI {
    constructor(gameState, mistralAPI, storyManager, adventureManager = null, gameManager = null) {
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
        this.logger.setLevel('warn');
        
        this.gameState = gameState;
        this.mistralAPI = mistralAPI;
        this.storyManager = storyManager;
        this.adventureManager = adventureManager;
        this.gameManager = gameManager;
        
        // Initialize career-based integration
        this.careerBasedIntegration = new CareerBasedAdventureIntegration(
            gameState, 
            storyManager, 
            mistralAPI
        );
        
        this.isGenerating = false;
        this.currentStory = null;
        this.currentChoices = [];
        this.choiceSuccessChances = [];
        
        this.logger.debug('CareerBasedStoryAdventureUI initialized');
    }

    /**
     * Check if an adventure is available at the current age
     * @returns {Object} - Adventure availability info
     */
    checkAdventureAvailability() {
        const currentAge = Math.floor(this.gameState.days / 365);
        const amuletPrompt = this.careerBasedIntegration.getAvailableAmuletPrompt(currentAge);
        const isAvailable = this.careerBasedIntegration.isAdventureAvailable(currentAge);
        
        return {
            currentAge,
            amuletPrompt,
            isAvailable,
            message: isAvailable ? 
                `Adventure available at age ${currentAge}` : 
                `No adventure available at age ${currentAge}`
        };
    }

    /**
     * Start a career-based adventure
     * @param {string} amuletPrompt - The amulet prompt key
     * @returns {Promise<Object>} - Adventure result
     */
    async startCareerBasedAdventure(amuletPrompt) {
        this.logger.debug('Starting career-based adventure for:', amuletPrompt);
        
        if (this.isGenerating) {
            return { success: false, message: 'Already generating' };
        }

        this.isGenerating = true;
        this.showLoadingState('Starting career-based adventure...');

        try {
            const result = await this.careerBasedIntegration.startCareerBasedAdventure(amuletPrompt);
            
            if (result.success) {
                this.currentStory = result.adventure;
                this.currentChoices = result.adventure.prompt.choices;
                this.choiceSuccessChances = this.currentChoices.map(choice => choice.successProbability);
                
                this.displayCareerBasedAdventure(result.adventure);
            } else {
                this.showError(result.message);
            }
            
            return result;
            
        } catch (error) {
            this.logger.error('Error starting career-based adventure:', error);
            this.showError('Failed to start career-based adventure');
            return { success: false, error: error.message };
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Display career-based adventure
     * @param {Object} adventure - Adventure data
     */
    displayCareerBasedAdventure(adventure) {
        const adventureContainer = document.getElementById('adventureContainer');
        if (!adventureContainer) {
            this.logger.error('Adventure container not found');
            return;
        }

        // Clear previous content
        adventureContainer.innerHTML = '';

        // Create adventure display
        const adventureHTML = `
            <div class="career-based-adventure">
                <div class="adventure-header">
                    <h2>${adventure.prompt.title}</h2>
                    <div class="career-info">
                        <span class="career-category">${adventure.careerCategory}</span>
                        <span class="amulet-prompt">${adventure.amuletPrompt}</span>
                    </div>
                </div>
                
                <div class="adventure-description">
                    <p>${adventure.prompt.description}</p>
                </div>
                
                <div class="adventure-choices">
                    <h3>Choose your approach:</h3>
                    <div class="choices-container">
                        ${adventure.prompt.choices.map((choice, index) => `
                            <div class="choice-option" data-choice-index="${index}">
                                <div class="choice-header">
                                    <span class="choice-type">${choice.choiceType}</span>
                                    <span class="success-probability">${Math.round(choice.successProbability * 100)}% success</span>
                                </div>
                                <div class="choice-text">${choice.text}</div>
                                <div class="choice-description">${choice.description}</div>
                                <button class="choice-button" onclick="window.careerBasedStoryAdventureUI.selectChoice(${index})">
                                    Choose This Option
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        adventureContainer.innerHTML = adventureHTML;
        adventureContainer.style.display = 'block';
    }

    /**
     * Select a choice in the career-based adventure
     * @param {number} choiceIndex - Index of the selected choice
     */
    async selectChoice(choiceIndex) {
        if (!this.currentStory || !this.currentChoices[choiceIndex]) {
            this.logger.error('Invalid choice selection');
            return;
        }

        const choice = this.currentChoices[choiceIndex];
        this.logger.debug('Selected choice:', choice.text);

        // Show loading state
        this.showLoadingState('Processing your choice...');

        try {
            // Determine success based on probability
            const isSuccess = Math.random() < choice.successProbability;
            
            // Handle the choice
            const result = await this.careerBasedIntegration.handleCareerBasedChoice(
                choice.text, 
                isSuccess
            );

            if (result.success) {
                this.displayChoiceResult(result);
            } else {
                this.showError(result.message);
            }

        } catch (error) {
            this.logger.error('Error processing choice:', error);
            this.showError('Failed to process choice');
        }
    }

    /**
     * Display choice result
     * @param {Object} result - Choice result
     */
    displayChoiceResult(result) {
        const adventureContainer = document.getElementById('adventureContainer');
        if (!adventureContainer) {
            this.logger.error('Adventure container not found');
            return;
        }

        const resultHTML = `
            <div class="choice-result">
                <div class="result-header">
                    <h3>${result.choiceResult.success ? 'Success!' : 'Failure!'}</h3>
                    <div class="result-details">
                        <span class="choice-type">${result.choiceResult.choiceType}</span>
                        <span class="success-probability">${Math.round(result.choiceResult.successProbability * 100)}% chance</span>
                    </div>
                </div>
                
                <div class="story-continuation">
                    <h4>Story Continues...</h4>
                    <p>${result.storyContinuation.story}</p>
                </div>
                
                <div class="result-actions">
                    <button class="continue-button" onclick="window.careerBasedStoryAdventureUI.continueAdventure()">
                        Continue Adventure
                    </button>
                    <button class="end-button" onclick="window.careerBasedStoryAdventureUI.endAdventure()">
                        End Adventure
                    </button>
                </div>
            </div>
        `;

        adventureContainer.innerHTML = resultHTML;
    }

    /**
     * Continue the adventure
     */
    async continueAdventure() {
        this.logger.debug('Continuing adventure...');
        
        // For now, just end the adventure
        // In a full implementation, this would generate new choices
        await this.endAdventure();
    }

    /**
     * End the current adventure
     */
    async endAdventure() {
        this.logger.debug('Ending career-based adventure...');
        
        try {
            const result = this.careerBasedIntegration.endCareerBasedAdventure();
            
            if (result.success) {
                this.showAdventureSummary(result.summary);
            } else {
                this.showError(result.message);
            }
            
            // Clear current adventure
            this.currentStory = null;
            this.currentChoices = [];
            this.choiceSuccessChances = [];
            
        } catch (error) {
            this.logger.error('Error ending adventure:', error);
            this.showError('Failed to end adventure');
        }
    }

    /**
     * Show adventure summary
     * @param {Object} summary - Adventure summary
     */
    showAdventureSummary(summary) {
        const adventureContainer = document.getElementById('adventureContainer');
        if (!adventureContainer) {
            this.logger.error('Adventure container not found');
            return;
        }

        const summaryHTML = `
            <div class="adventure-summary">
                <h3>Adventure Complete!</h3>
                <div class="summary-details">
                    <p><strong>Amulet Prompt:</strong> ${summary.amuletPrompt}</p>
                    <p><strong>Career Category:</strong> ${summary.careerCategory}</p>
                    <p><strong>Duration:</strong> ${Math.round(summary.duration / 1000)}s</p>
                    <p><strong>Choices Available:</strong> ${summary.choices}</p>
                </div>
                <button class="close-button" onclick="window.careerBasedStoryAdventureUI.closeAdventure()">
                    Close Adventure
                </button>
            </div>
        `;

        adventureContainer.innerHTML = summaryHTML;
    }

    /**
     * Close the adventure
     */
    closeAdventure() {
        const adventureContainer = document.getElementById('adventureContainer');
        if (adventureContainer) {
            adventureContainer.style.display = 'none';
            adventureContainer.innerHTML = '';
        }
        
        // Unpause the game
        if (this.gameState) {
            this.gameState.paused = false;
        }
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoadingState(message) {
        const adventureContainer = document.getElementById('adventureContainer');
        if (!adventureContainer) {
            this.logger.error('Adventure container not found');
            return;
        }

        adventureContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        adventureContainer.style.display = 'block';
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const adventureContainer = document.getElementById('adventureContainer');
        if (!adventureContainer) {
            this.logger.error('Adventure container not found');
            return;
        }

        adventureContainer.innerHTML = `
            <div class="error-state">
                <h3>Error</h3>
                <p>${message}</p>
                <button class="close-button" onclick="window.careerBasedStoryAdventureUI.closeAdventure()">
                    Close
                </button>
            </div>
        `;
        adventureContainer.style.display = 'block';
    }

    /**
     * Get career analysis
     * @returns {Object} - Career analysis
     */
    getCareerAnalysis() {
        return this.careerBasedIntegration.getCareerAnalysis();
    }

    /**
     * Get story tree statistics
     * @returns {Object} - Story tree statistics
     */
    getStoryTreeStats() {
        return this.careerBasedIntegration.getStoryTreeStats();
    }

    /**
     * Check if adventure is active
     * @returns {boolean} - Whether adventure is active
     */
    isAdventureActive() {
        return this.careerBasedIntegration.isAdventureActive();
    }
}

// Export for global usage
if (typeof window !== 'undefined') {
    window.CareerBasedStoryAdventureUI = CareerBasedStoryAdventureUI;
}
