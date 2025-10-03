/**
 * StoryAdventureUI - Enhanced UI for story-based adventures with choices
 * Inspired by the ai-text-adventure repository structure
 */

class StoryAdventureUI {
    constructor(gameState, mistralAPI, storyManager, adventureManager = null) {
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
        
        // Generate unique instance ID
        this.instanceId = 'SAUI_' + Math.random().toString(36).substr(2, 9);
        
        this.logger.debug('StoryAdventureUI constructor called - Instance ID:', this.instanceId);
        this.logger.debug('adventureManager parameter:', !!adventureManager);
        this.logger.debug('adventureManager type:', typeof adventureManager);
        
        this.gameState = gameState;
        this.mistralAPI = mistralAPI;
        this.storyManager = storyManager;
        this.adventureManager = adventureManager;
        this.isGenerating = false;
        this.currentStory = null;
        this.currentChoices = [];
        this.choiceSuccessChances = []; // Store success chances for each choice
        
        this.logger.debug('StoryAdventureUI constructor completed - Instance ID:', this.instanceId, 'this.adventureManager:', !!this.adventureManager);
    }
    
    /**
     * Start a new story adventure
     */
    async startNewStory() {
        this.logger.debug('🟢 startNewStory called - Instance ID:', this.instanceId);
        if (this.isGenerating) return;
        
        // Check if adventure is already active
        if (this.adventureManager && this.adventureManager.isAdventureActive()) {
            this.logger.info('Adventure already in progress');
            return;
        }
        
        this.isGenerating = true;
        this.logger.debug('🟢 startNewStory - isGenerating set to TRUE - Instance ID:', this.instanceId);
        this.showLoadingState('Starting new adventure...');
        
        try {
            // Start adventure manager if available
            this.logger.debug('StoryAdventureUI.startNewStory() called');
            this.logger.debug('adventureManager exists:', !!this.adventureManager);
            if (this.adventureManager) {
                this.logger.debug('About to call adventureManager.startAdventure()');
                this.adventureManager.startAdventure();
                this.logger.debug('adventureManager.startAdventure() completed');
            } else {
                this.logger.error('No adventureManager available!');
            }
            
            // Get character state
            const characterState = CharacterEncoder.encodeCharacterState(this.gameState);
            
            // Initialize story
            const storyContext = this.storyManager.startNewStory(characterState);
            
            // Get difficulty labels for prompt
            const difficultyLabels = this.storyManager.getDifficultyLabels();
            
            // Generate story prompt with difficulty labels
            const prompt = StoryPromptGenerator.generateStoryPrompt(characterState, storyContext, true, difficultyLabels);
            
            // Get system message with character name
            const systemMessage = this.storyManager.getSystemMessage();
            
            // Create initial message with prompt
            const messages = [{
                role: 'user',
                content: prompt
            }];
            
            // Get story from LLM with system message and messages
            const response = await this.mistralAPI.generateWorldDescription(characterState, null, messages, systemMessage);
            
            // Debug: Log the raw response
            this.logger.debug('Raw LLM Response (New Story):', response);
            
            // Parse response
            const parsedStory = StoryPromptGenerator.parseStoryResponse(response);
            
            // Debug: Log the parsed story
            this.logger.debug('Parsed Story (New Story):', parsedStory);
            
            if (parsedStory.hasValidFormat) {
                this.currentStory = parsedStory.story;
                this.currentChoices = parsedStory.choices;
                
                // Calculate success chances for each choice (with choice index for difficulty coefficient)
                this.choiceSuccessChances = parsedStory.choices.map((choice, index) => 
                    this.storyManager.calculateSuccessChance(choice, characterState, parsedStory.story, index)
                );
                
                // Add initial story to conversation history
                this.storyManager.addStoryResponse(parsedStory.story, parsedStory.choices);
                
                this.displayStoryWithChoices(parsedStory, storyContext);
            } else {
                throw new Error('Invalid story format received from LLM');
            }
            
        } catch (error) {
            this.showError(`Failed to start adventure: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.logger.debug('🟢 startNewStory - isGenerating set to FALSE - Instance ID:', this.instanceId);
            // Don't call hideLoadingState here - displayStoryWithChoices or showError will handle UI updates
        }
    }
    
    /**
     * Continue story with a choice
     */
    async continueStory(choice, rollResult) {
        this.logger.debug('🟢 continueStory called - Instance ID:', this.instanceId);
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.logger.debug('🟢 continueStory - isGenerating set to TRUE - Instance ID:', this.instanceId);
        this.showLoadingState('Continuing adventure...');
        
        try {
            // Track choice result in adventure manager
            if (this.adventureManager) {
                const choiceType = this.classifyChoiceType(choice);
                this.adventureManager.trackChoiceResult(rollResult.success, choiceType);
                
                // Check if adventure should auto-end
                if (this.adventureManager.shouldAutoEnd()) {
                    // Hide loading state before ending
                    this.hideLoadingState();
                    await this.endAdventure(false); // Auto-end
                    return;
                }
            }
            
            // Get character state
            const characterState = CharacterEncoder.encodeCharacterState(this.gameState);
            
            // Debug: Log roll result details
            this.logger.debug('Roll Result Details:', {
                success: rollResult.success,
                roll: rollResult.roll,
                needed: rollResult.needed,
                choice: choice
            });
            
            // Create choice text with result
            const resultText = rollResult.success ? 'SUCCEEDED' : 'FAILED';
            const choiceWithResult = `${choice} (The character ${resultText}! Rolled ${rollResult.roll}, needed ${rollResult.needed})`;
            
            this.logger.debug('Choice with result being sent to LLM:', choiceWithResult);
            
            // Continue story with choice
            const storyContext = this.storyManager.continueStory(choiceWithResult, characterState);
            
            // Get system message with character name
            const systemMessage = this.storyManager.getSystemMessage();
            
            // Get full message history
            const messages = this.storyManager.getMessagesForAPI();
            
            // Get story from LLM with full conversation history
            const response = await this.mistralAPI.generateWorldDescription(characterState, null, messages, systemMessage);
            
            // Debug: Log the raw response
            this.logger.debug('Raw LLM Response:', response);
            
            // Validate response before parsing
            if (!response || typeof response !== 'string') {
                throw new Error('Invalid response from LLM');
            }
            
            // Parse response
            const parsedStory = StoryPromptGenerator.parseStoryResponse(response);
            
            // Debug: Log the parsed story
            this.logger.debug('Parsed Story:', parsedStory);
            
            if (parsedStory.hasValidFormat) {
                this.currentStory = parsedStory.story;
                this.currentChoices = parsedStory.choices;
                
                // Calculate success chances for each choice (with choice index for difficulty coefficient)
                this.choiceSuccessChances = parsedStory.choices.map((choice, index) => 
                    this.storyManager.calculateSuccessChance(choice, characterState, parsedStory.story, index)
                );
                
                // Add story response to conversation history
                this.storyManager.addStoryResponse(parsedStory.story, parsedStory.choices);
                
                // Debug: Log story context
                this.logger.debug('Story Context:', storyContext);
                
                // Ensure storyContext has required properties
                const safeStoryContext = storyContext || { genre: 'Fantasy', context: 'adventure' };
                
                this.displayStoryWithChoices(parsedStory, safeStoryContext);
            } else {
                throw new Error('Invalid story format received from LLM');
            }
            
        } catch (error) {
            this.logger.error('Error in continueStory:', error);
            this.showError(`Failed to continue adventure: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.logger.debug('🟢 continueStory - isGenerating set to FALSE - Instance ID:', this.instanceId);
            // Don't call hideLoadingState here - displayStoryWithChoices or showError will handle UI updates
        }
    }
    
    /**
     * Display story with choices
     */
    displayStoryWithChoices(parsedStory, storyContext) {
        this.logger.debug('🟢 displayStoryWithChoices called - Instance ID:', this.instanceId, 'with:', { parsedStory, storyContext });
        
        const storyContainer = document.getElementById('storyAdventure');
        if (!storyContainer) {
            this.logger.warn('storyAdventure element not found');
            return;
        }
        
        this.logger.debug('Story container found, updating innerHTML...');
        
        // Set up a mutation observer to detect any changes to the container
        if (!this.mutationObserver) {
            this.mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        this.logger.debug('🔍 DOM mutation detected:', {
                            type: mutation.type,
                            target: mutation.target,
                            addedNodes: mutation.addedNodes.length,
                            removedNodes: mutation.removedNodes.length,
                            newInnerHTML: mutation.target.innerHTML ? mutation.target.innerHTML.substring(0, 100) + '...' : 'N/A'
                        });
                        
                        // Check if this is the loading spinner being set
                        if (mutation.target.id === 'storyAdventure' && mutation.target.innerHTML.includes('loading-container')) {
                            this.logger.warn('🚨 LOADING SPINNER DETECTED - This should not happen after story content is set!');
                            this.logger.warn('🚨 Full innerHTML:', mutation.target.innerHTML);
                            this.logger.debug('🚨 Call stack when loading spinner was set:', new Error().stack);
                        }
                    }
                });
            });
            this.mutationObserver.observe(storyContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            this.logger.debug('🔍 Mutation observer set up for storyAdventure container');
        }
        
        const storySummary = this.storyManager.getStorySummary();
        
        try {
            // Log what we're about to set
            this.logger.debug('About to set innerHTML. Current innerHTML length:', storyContainer.innerHTML.length);
            this.logger.debug('Current innerHTML content preview:', storyContainer.innerHTML.substring(0, 200) + '...');
            
            const newContent = `
                <div class="story-adventure-container">
                    <div class="story-header">
                        <h3>${storyContext.genre || 'Fantasy'} Adventure</h3>
                        <div class="story-stats">
                            <span class="turn-counter">Turn ${storySummary.turns}</span>
                            <span class="genre-tag">${storyContext.genre || 'Fantasy'}</span>
                        </div>
                    </div>
                    
                    <div class="story-content">
                        <div class="story-text">
                            ${this.formatStoryText(parsedStory.story)}
                        </div>
                        
                        <div class="story-choices">
                            <h4>What do you choose?</h4>
                            <div class="choices-grid">
                                ${this.renderChoices(parsedStory.choices)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="story-controls">
                        ${this.renderAdventureControls()}
                        <button onclick="storyAdventureUI.showCharacterInfo()" class="character-info-btn">
                            Character Info
                        </button>
                    </div>
                    
                    ${this.renderAdventureStatus()}
                </div>
            `;
            
            this.logger.debug('New content length:', newContent.length);
            this.logger.debug('New content preview:', newContent.substring(0, 200) + '...');
            
            storyContainer.innerHTML = newContent;
            
            // Verify what was actually set
            this.logger.debug('innerHTML set. New innerHTML length:', storyContainer.innerHTML.length);
            this.logger.debug('New innerHTML content preview:', storyContainer.innerHTML.substring(0, 200) + '...');
            
            // Check if loading container is still present
            const hasLoadingContainer = storyContainer.innerHTML.includes('loading-container');
            const hasStoryContainer = storyContainer.innerHTML.includes('story-adventure-container');
            this.logger.debug('After setting innerHTML - hasLoadingContainer:', hasLoadingContainer, 'hasStoryContainer:', hasStoryContainer);
            
            // Force a small delay and check again
            setTimeout(() => {
                this.logger.debug('After 100ms delay - innerHTML length:', storyContainer.innerHTML.length);
                this.logger.debug('After 100ms delay - hasLoadingContainer:', storyContainer.innerHTML.includes('loading-container'));
                this.logger.debug('After 100ms delay - hasStoryContainer:', storyContainer.innerHTML.includes('story-adventure-container'));
            }, 100);
        } catch (error) {
            this.logger.error('Error updating story container innerHTML:', error);
            // Fallback to simple content if complex rendering fails
            storyContainer.innerHTML = `
                <div class="story-adventure-container">
                    <div class="story-content">
                        <div class="story-text">
                            ${this.formatStoryText(parsedStory.story)}
                        </div>
                        <div class="story-choices">
                            <h4>What do you choose?</h4>
                            <div class="choices-grid">
                                ${this.renderChoices(parsedStory.choices)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            this.logger.info('Fallback story content applied');
        }
    }
    
    /**
     * Format story text for display
     */
    formatStoryText(story) {
        // Split into paragraphs and format
        const paragraphs = story.split('\n\n').filter(p => p.trim().length > 0);
        return paragraphs.map(paragraph => 
            `<p class="story-paragraph">${paragraph.trim()}</p>`
        ).join('');
    }
    
    /**
     * Render choices as buttons
     */
    renderChoices(choices) {
        return choices.map((choice, index) => {
            // Properly escape the choice text for HTML
            const escapedChoice = this.escapeHtml(choice);
            
            // Get success chance for this choice
            const successChance = this.choiceSuccessChances[index] || 50;
            
            // Determine color based on success chance
            let chanceColor = '#4CAF50'; // Green for high
            if (successChance < 30) chanceColor = '#f44336'; // Red for low
            else if (successChance < 60) chanceColor = '#ff9800'; // Orange for medium
            
            // Store choice index instead of the text itself
            return `
                <button 
                    class="choice-btn" 
                    onclick="storyAdventureUI.makeChoiceByIndex(${index})"
                    data-choice="${index + 1}"
                >
                    <span class="choice-number">${index + 1}</span>
                    <span class="choice-text">${escapedChoice}</span>
                    <span class="success-chance" style="color: ${chanceColor};">(${successChance}% success)</span>
                </button>
            `;
        }).join('');
    }
    
    /**
     * Make choice by index (safer than passing the full text)
     */
    makeChoiceByIndex(index) {
        if (index >= 0 && index < this.currentChoices.length) {
            const choice = this.currentChoices[index];
            const successChance = this.choiceSuccessChances[index] || 50;
            
            // Roll for success/failure
            const rollResult = this.storyManager.rollForSuccess(successChance);
            
            // Show roll result visually
            this.showRollResult(rollResult, choice);
            
            // Continue with the choice, passing the result
            setTimeout(() => {
                this.makeChoice(choice, rollResult);
            }, 2000); // Wait 2 seconds to show the roll result
        }
    }
    
    /**
     * Classify choice type based on keywords
     */
    classifyChoiceType(choice) {
        const lowerChoice = choice.toLowerCase();
        
        // Aggressive choices
        if (lowerChoice.includes('attack') || lowerChoice.includes('fight') || 
            lowerChoice.includes('charge') || lowerChoice.includes('confront') ||
            lowerChoice.includes('strike') || lowerChoice.includes('battle')) {
            return 'aggressive';
        }
        
        // Diplomatic choices
        if (lowerChoice.includes('talk') || lowerChoice.includes('negotiate') ||
            lowerChoice.includes('persuade') || lowerChoice.includes('reason') ||
            lowerChoice.includes('bargain') || lowerChoice.includes('convince')) {
            return 'diplomatic';
        }
        
        // Cautious choices
        if (lowerChoice.includes('sneak') || lowerChoice.includes('hide') ||
            lowerChoice.includes('retreat') || lowerChoice.includes('stealth') ||
            lowerChoice.includes('observe') || lowerChoice.includes('careful')) {
            return 'cautious';
        }
        
        // Default to creative for unclear choices
        return 'creative';
    }
    
    /**
     * End adventure and apply rewards
     */
    async endAdventure(isManualEnd = true) {
        if (!this.adventureManager) {
            this.logger.warn('No adventure manager available');
            return;
        }
        
        try {
            // Hide any loading state first
            this.hideLoadingState();
            
            const summary = this.adventureManager.endAdventure(isManualEnd);
            
            // Display reward summary
            this.showRewardSummary(summary);
            
            return summary;
        } catch (error) {
            this.logger.error('Error ending adventure:', error);
            this.showError(`Failed to end adventure: ${error.message}`);
        }
    }
    
    /**
     * Check if game can be unpaused
     */
    canUnpauseGame() {
        if (!this.adventureManager) return true;
        return this.adventureManager.canUnpauseGame();
    }
    
    /**
     * Get current adventure status
     */
    getAdventureStatus() {
        if (!this.adventureManager) {
            return { isActive: false, successCount: 0, failureCount: 0, turnCount: 0 };
        }
        
        return {
            isActive: this.adventureManager.isAdventureActive(),
            successCount: this.adventureManager.getSuccessCount(),
            failureCount: this.adventureManager.getFailureCount(),
            turnCount: this.adventureManager.getTurnCount()
        };
    }
    
    /**
     * Format reward summary for display
     */
    formatRewardSummary(rewards) {
        let summary = '<div class="reward-summary">';
        summary += '<h3>Adventure Rewards</h3>';
        
        // Skill XP
        if (rewards.skillXP) {
            summary += '<div class="skill-rewards">';
            summary += '<h4>Skill Experience:</h4>';
            
            Object.entries(rewards.skillXP).forEach(([skill, xp]) => {
                if (xp > 0) {
                    summary += `<div class="skill-xp">${skill}: +${xp} XP</div>`;
                }
            });
            summary += '</div>';
        }
        
        // Bonus multiplier
        if (rewards.bonusMultiplier > 1.0) {
            summary += `<div class="bonus">Bonus Multiplier: ${rewards.bonusMultiplier}x</div>`;
        }
        
        // Time advancement
        if (rewards.daysAdvanced > 0) {
            summary += `<div class="time-advancement">Time Advanced: ${rewards.daysAdvanced} days</div>`;
        }
        
        // Unlocks
        if (rewards.unlocks && rewards.unlocks.length > 0) {
            summary += '<div class="unlocks">';
            summary += '<h4>Unlocked:</h4>';
            rewards.unlocks.forEach(unlock => {
                summary += `<div class="unlock">${unlock}</div>`;
            });
            summary += '</div>';
        }
        
        // Check if no rewards
        const hasRewards = rewards.skillXP && Object.values(rewards.skillXP).some(xp => xp > 0) ||
                          rewards.daysAdvanced > 0 || (rewards.unlocks && rewards.unlocks.length > 0);
        
        if (!hasRewards) {
            summary += '<div class="no-rewards">No rewards earned this adventure.</div>';
        }
        
        summary += '</div>';
        return summary;
    }
    
    /**
     * Show reward summary modal
     */
    showRewardSummary(summary) {
        const modal = document.createElement('div');
        modal.className = 'reward-modal';
        modal.innerHTML = `
            <div class="reward-modal-content">
                <h2>Adventure Complete!</h2>
                <div class="adventure-stats">
                    <div>Successes: ${summary.successCount}</div>
                    <div>Failures: ${summary.failureCount}</div>
                    <div>Success Rate: ${Math.round(summary.successRate * 100)}%</div>
                </div>
                ${this.formatRewardSummary(summary.rewards)}
                <button onclick="storyAdventureUI.closeRewardModal(this)" class="close-reward-btn">
                    Continue
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Close reward modal and reset UI to initial state
     */
    closeRewardModal(buttonElement) {
        // Remove the modal
        const modal = buttonElement.closest('.reward-modal');
        if (modal) {
            modal.remove();
        }
        
        // Reset UI to initial state
        this.resetToInitialState();
    }
    
    /**
     * Reset UI to initial state (show full initial UI with features and descriptions)
     */
    resetToInitialState() {
        this.logger.debug('🔄 resetToInitialState called - Instance ID:', this.instanceId);
        
        const storyContainer = document.getElementById('storyAdventure');
        if (storyContainer) {
            this.logger.debug('🔄 Resetting storyAdventure container to full initial state');
            const fullInitialHtml = this.renderFullInitialState();
            this.logger.debug('🔄 renderFullInitialState returned:', fullInitialHtml.substring(0, 200) + '...');
            storyContainer.innerHTML = fullInitialHtml;
            this.logger.debug('🔄 StoryAdventure container reset complete. New innerHTML length:', storyContainer.innerHTML.length);
        } else {
            this.logger.warn('🔄 StoryAdventure container not found');
        }
    }

    /**
     * Render the full initial state UI (matches the HTML structure)
     */
    renderFullInitialState() {
        return `
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
        `;
    }

    /**
     * Render adventure status for display
     */
    renderAdventureStatus() {
        const status = this.getAdventureStatus();
        
        if (!status.isActive) {
            return '';
        }
        
        return `
            <div class="adventure-status">
                <div class="status-item">Successes: ${status.successCount}</div>
                <div class="status-item">Failures: ${status.failureCount}</div>
                <div class="status-item">Turns: ${status.turnCount}</div>
            </div>
        `;
    }
    
    /**
     * Render adventure controls
     */
    renderAdventureControls() {
        const status = this.getAdventureStatus();
        
        if (status.isActive) {
            return `
                <div class="adventure-controls">
                    <button onclick="storyAdventureUI.endAdventure(true)" class="end-adventure-btn">
                        End Adventure
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="adventure-controls">
                    <button onclick="storyAdventureUI.startNewStory()" class="start-adventure-btn">
                        Start New Adventure
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Show the dice roll result
     */
    showRollResult(rollResult, choice) {
        const storyContainer = document.getElementById('storyAdventure');
        if (!storyContainer) return;
        
        const resultClass = rollResult.success ? 'roll-success' : 'roll-failure';
        const resultText = rollResult.success ? 'SUCCESS!' : 'FAILURE!';
        const resultColor = rollResult.success ? '#4CAF50' : '#f44336';
        
        // Create roll result overlay
        const rollOverlay = document.createElement('div');
        rollOverlay.className = 'roll-result-overlay';
        rollOverlay.innerHTML = `
            <div class="roll-result ${resultClass}">
                <div class="roll-result-title" style="color: ${resultColor};">${resultText}</div>
                <div class="roll-result-details">
                    Rolled: ${rollResult.roll} / Needed: ${rollResult.needed}
                </div>
                <div class="roll-result-action">
                    ${this.escapeHtml(choice)}
                </div>
            </div>
        `;
        
        storyContainer.appendChild(rollOverlay);
        
        // Remove overlay after 2 seconds
        setTimeout(() => {
            rollOverlay.remove();
        }, 1900);
    }
    
    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Escape JavaScript string
     */
    escapeJavaScript(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
    
    /**
     * Handle choice selection
     */
    makeChoice(choice, rollResult) {
        if (this.isGenerating) return;
        
        try {
            // Add choice feedback
            this.showChoiceFeedback(choice);
            
            // Continue story with roll result
            this.continueStory(choice, rollResult);
        } catch (error) {
            this.logger.error('Error in makeChoice:', error);
            this.showError(`Failed to process choice: ${error.message}`);
        }
    }
    
    /**
     * Show feedback for choice selection
     */
    showChoiceFeedback(choice) {
        const choiceButtons = document.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        
        // Find and highlight selected choice
        const selectedBtn = Array.from(choiceButtons).find(btn => 
            btn.textContent.includes(choice)
        );
        
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
        
        // Show processing message
        const choicesContainer = document.querySelector('.story-choices');
        if (choicesContainer) {
            const processingMsg = document.createElement('div');
            processingMsg.className = 'processing-message';
            processingMsg.textContent = 'Processing your choice...';
            choicesContainer.appendChild(processingMsg);
        }
    }
    
    /**
     * Show character information
     */
    showCharacterInfo() {
        try {
            const characterState = CharacterEncoder.encodeCharacterState(this.gameState);
            const storySummary = this.storyManager.getStorySummary();
            
            // Remove any existing modal first
            const existingModal = document.querySelector('.character-info-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            const infoModal = document.createElement('div');
            infoModal.className = 'character-info-modal';
            infoModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Character Information</h3>
                        <button onclick="this.closest('.character-info-modal').remove()" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="character-stats">
                            <h4>Basic Stats</h4>
                            <p><strong>Age:</strong> ${this.escapeHtml(characterState.age)} years</p>
                            <p><strong>Job:</strong> ${this.escapeHtml(characterState.currentJob)}</p>
                            <p><strong>Skill:</strong> ${this.escapeHtml(characterState.currentSkill)}</p>
                            <p><strong>Wealth:</strong> ${this.formatCoins(characterState.coins)}</p>
                            <p><strong>Evil Level:</strong> ${characterState.evil}</p>
                            <p><strong>Rebirths:</strong> ${characterState.rebirthCount}</p>
                        </div>
                        
                        <div class="story-stats">
                            <h4>Adventure Stats</h4>
                            <p><strong>Story Turns:</strong> ${storySummary.turns}</p>
                            <p><strong>Genre:</strong> ${this.escapeHtml(storySummary.genre || 'Fantasy')}</p>
                            <p><strong>Last Choice:</strong> ${this.escapeHtml(storySummary.lastChoice || 'None')}</p>
                        </div>
                        
                        <div class="character-traits">
                            <h4>Character Traits</h4>
                            ${this.formatCharacterTraitsForDisplay(storySummary.characterTraits)}
                        </div>
                    </div>
                </div>
            `;
            
            // Add click outside to close
            infoModal.addEventListener('click', (e) => {
                if (e.target === infoModal) {
                    infoModal.remove();
                }
            });
            
            // Add escape key to close
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    infoModal.remove();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            document.body.appendChild(infoModal);
        } catch (error) {
            this.logger.error('Error showing character info:', error);
            this.showError(`Failed to show character info: ${error.message}`);
        }
    }
    
    /**
     * Format character traits for display
     */
    formatCharacterTraitsForDisplay(traits) {
        if (!traits) return '<p>No traits identified yet.</p>';
        
        let html = '';
        
        if (traits.personality && traits.personality.length > 0) {
            html += `<p><strong>Personality:</strong> ${traits.personality.join(', ')}</p>`;
        }
        
        if (traits.motivations && traits.motivations.length > 0) {
            html += `<p><strong>Motivations:</strong> ${traits.motivations.join(', ')}</p>`;
        }
        
        if (traits.specialAbilities && traits.specialAbilities.length > 0) {
            html += `<p><strong>Abilities:</strong> ${traits.specialAbilities.join(', ')}</p>`;
        }
        
        return html || '<p>No traits identified yet.</p>';
    }
    
    /**
     * Format coins for display
     */
    formatCoins(coins) {
        if (coins >= 1000000) {
            return `${(coins / 1000000).toFixed(1)}M`;
        } else if (coins >= 1000) {
            return `${(coins / 1000).toFixed(1)}K`;
        } else {
            return coins.toString();
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState(message = 'Generating...') {
        this.logger.debug('🔴 showLoadingState called with message:', message);
        this.logger.debug('🔴 showLoadingState - isGenerating flag:', this.isGenerating);
        this.logger.debug('🔴 showLoadingState - instance ID:', this.instanceId || 'NO_ID');
        
        // Get detailed call stack
        const stack = new Error().stack;
        this.logger.debug('🔴 showLoadingState - FULL CALL STACK:', stack);
        
        // Guard against showing loading state when not actually generating
        if (!this.isGenerating) {
            this.logger.debug('🔴 showLoadingState - BLOCKED: isGenerating is false, not showing loading state');
            this.logger.debug('🔴 showLoadingState - BLOCKED call stack:', stack);
            return;
        }
        
        const storyContainer = document.getElementById('storyAdventure');
        if (storyContainer) {
            this.logger.debug('🔴 showLoadingState - Current innerHTML length before setting loading:', storyContainer.innerHTML.length);
            this.logger.debug('🔴 showLoadingState - Current content preview:', storyContainer.innerHTML.substring(0, 100) + '...');
            
            storyContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            `;
            
            this.logger.debug('🔴 showLoadingState - innerHTML set to loading state');
            this.logger.debug('🔴 showLoadingState - New innerHTML length:', storyContainer.innerHTML.length);
        } else {
            this.logger.error('🔴 showLoadingState - storyAdventure container not found!');
        }
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.logger.debug('🟡 hideLoadingState called - Instance ID:', this.instanceId);
        this.logger.debug('hideLoadingState call stack:', new Error().stack);
        
        const storyContainer = document.getElementById('storyAdventure');
        if (storyContainer) {
            this.logger.debug('🟡 hideLoadingState - Clearing innerHTML. Current length:', storyContainer.innerHTML.length);
            storyContainer.innerHTML = ''; // Explicitly clear the content
            this.logger.debug('🟡 hideLoadingState - innerHTML cleared.');
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const storyContainer = document.getElementById('storyAdventure');
        if (storyContainer) {
            storyContainer.innerHTML = `
                <div class="error-container">
                    <h3>Error</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <div class="error-actions">
                        <button onclick="storyAdventureUI.startNewStory()" class="retry-btn">
                            Start New Adventure
                        </button>
                        <button onclick="storyAdventureUI.clearState()" class="clear-btn">
                            Clear State & Restart
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Clear all state and restart
     */
    clearState() {
        try {
            // Reset story manager
            this.storyManager.initializeStory();
            
            // Clear current state
            this.currentStory = null;
            this.currentChoices = [];
            this.isGenerating = false;
            
            // Show intro screen
            const storyContainer = document.getElementById('storyAdventure');
            if (storyContainer) {
                storyContainer.innerHTML = `
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
                `;
            }
        } catch (error) {
            this.logger.error('Error clearing state:', error);
            // Force page reload as last resort
            window.location.reload();
        }
    }
    
    /**
     * Get current story state
     */
    getCurrentStoryState() {
        return {
            hasActiveStory: this.currentStory !== null,
            currentStory: this.currentStory,
            currentChoices: this.currentChoices,
            storySummary: this.storyManager.getStorySummary()
        };
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryAdventureUI;
}
if (typeof window !== 'undefined') {
    window.StoryAdventureUI = StoryAdventureUI;
}
