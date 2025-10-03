/**
 * StoryAdventureManager - Manages integration between story mode and game state
 * 
 * Responsibilities:
 * - Controls game pause/unpause during adventures
 * - Tracks success/failure and choice types
 * - Calculates rewards based on performance
 * - Applies rewards to game state
 */

class StoryAdventureManager {
    constructor(gameState, storyManager) {
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
        this.storyManager = storyManager;
        
        this.resetAdventureState();
    }
    
    /**
     * Reset adventure state to initial values
     */
    resetAdventureState() {
        this.adventureActive = false;
        this.successCount = 0;
        this.failureCount = 0;
        this.turnCount = 0;
        this.choiceTypes = {
            aggressive: 0,
            diplomatic: 0,
            cautious: 0,
            creative: 0
        };
        this.choiceHistory = [];
    }
    
    /**
     * Start a new adventure
     * Pauses the game and initializes tracking
     */
    startAdventure() {
        this.logger.debug('StoryAdventureManager.startAdventure() called');
        
        if (this.adventureActive) {
            throw new Error('Adventure already in progress');
        }
        
        // Reset state for new adventure
        this.resetAdventureState();
        this.adventureActive = true;
        
        this.logger.debug('About to pause game. gameState.setPaused exists:', typeof this.gameState.setPaused);
        this.logger.debug('Current paused state:', this.gameState.paused);
        
        // Pause the game (GameState uses setPaused(true))
        if (this.gameState.setPaused) {
            this.gameState.setPaused(true);
            this.logger.debug('Called gameState.setPaused(true). New paused state:', this.gameState.paused);
        } else if (this.gameState.pause) {
            // Fallback for compatibility
            this.gameState.pause();
            this.logger.debug('Called gameState.pause(). New paused state:', this.gameState.paused);
        } else {
            this.logger.error('No setPaused or pause method found on gameState!');
        }
        
        // Notify story manager
        if (this.storyManager && this.storyManager.startNewStory) {
            // Story manager will handle its own initialization
        }
    }
    
    /**
     * Track the result of a choice
     * @param {boolean} success - Whether the choice succeeded
     * @param {string} choiceType - Type of choice (aggressive, diplomatic, cautious, creative)
     */
    trackChoiceResult(success, choiceType) {
        if (!this.adventureActive) {
            throw new Error('No active adventure');
        }
        
        // Validate choice type
        const validTypes = ['aggressive', 'diplomatic', 'cautious', 'creative'];
        if (!validTypes.includes(choiceType)) {
            throw new Error('Invalid choice type');
        }
        
        // Update counts
        if (success) {
            this.successCount++;
        } else {
            this.failureCount++;
        }
        
        this.choiceTypes[choiceType]++;
        this.turnCount++;
        
        // Track history
        this.choiceHistory.push({
            success: success,
            type: choiceType
        });
    }
    
    /**
     * Check if adventure should auto-end (3 failures)
     */
    shouldAutoEnd() {
        return this.failureCount >= 3;
    }
    
    /**
     * Calculate rewards based on adventure performance
     * @param {boolean} isManualEnd - Whether this is a manual end
     * @returns {Object} Reward breakdown
     */
    calculateRewards(isManualEnd = false) {
        const rewards = {
            skillXP: {
                strength: 0,
                charisma: 0,
                concentration: 0,
                magic: 0
            },
            bonusMultiplier: 1.0,
            rewardMultiplier: 1.0,
            daysAdvanced: 0,
            unlocks: []
        };
        
        // Calculate base XP per success (scales with character level)
        const baseXP = this.calculateBaseXP();
        
        // Award XP only for successful choices
        // Aggressive → Strength
        rewards.skillXP.strength = this.choiceTypes.aggressive * baseXP;
        
        // Diplomatic → Charisma
        rewards.skillXP.charisma = this.choiceTypes.diplomatic * baseXP;
        
        // Cautious → Concentration
        rewards.skillXP.concentration = this.choiceTypes.cautious * baseXP;
        
        // Creative → Magic
        rewards.skillXP.magic = this.choiceTypes.creative * baseXP;
        
        // However, only count successful choices
        const successRate = this.getSuccessRate();
        
        // Reduce XP proportionally to success rate
        // (If you made 4 aggressive choices but only 2 succeeded, you get 50% of the XP)
        Object.keys(rewards.skillXP).forEach(skill => {
            rewards.skillXP[skill] = Math.floor(rewards.skillXP[skill] * successRate);
        });
        
        // Bonus multiplier for high success rate (>75% with at least 5 successes)
        if (successRate > 0.75 && this.successCount >= 5) {
            rewards.bonusMultiplier = 2.0; // Increased from 1.5
            
            // Apply bonus to XP
            Object.keys(rewards.skillXP).forEach(skill => {
                rewards.skillXP[skill] = Math.floor(rewards.skillXP[skill] * rewards.bonusMultiplier);
            });
        }
        
        // Additional bonus for very high success rate (>90% with at least 10 successes)
        if (successRate > 0.90 && this.successCount >= 10) {
            rewards.bonusMultiplier = 3.0;
            
            // Apply bonus to XP
            Object.keys(rewards.skillXP).forEach(skill => {
                rewards.skillXP[skill] = Math.floor(rewards.skillXP[skill] * 1.5); // Additional 1.5x multiplier
            });
        }
        
        // Time advancement for long adventures (>= 10 turns)
        if (this.turnCount >= 10) {
            rewards.daysAdvanced = Math.floor(this.turnCount * 0.1);
        }
        
        // Special unlocks for exceptional performance (>= 15 successes)
        if (this.successCount >= 15) {
            rewards.unlocks.push('Adventurer\'s Badge');
        }
        
        // Apply penalty for early manual end (< 5 turns) - reduced penalty and threshold
        if (isManualEnd && this.turnCount < 5) {
            rewards.rewardMultiplier = 0.9; // 10% penalty (reduced from 20%)
            
            Object.keys(rewards.skillXP).forEach(skill => {
                rewards.skillXP[skill] = Math.floor(rewards.skillXP[skill] * rewards.rewardMultiplier);
            });
        }
        
        return rewards;
    }
    
    /**
     * Calculate base XP per success based on character level
     * Higher level characters get more XP to stay relevant
     */
    calculateBaseXP() {
        if (!this.gameState.taskData) {
            return 500; // Default base XP (increased from 50)
        }
        
        // Find average skill level
        const skills = Object.values(this.gameState.taskData);
        const validSkills = skills.filter(s => s && s.level);
        
        if (validSkills.length === 0) {
            return 500;
        }
        
        const avgLevel = validSkills.reduce((sum, s) => sum + s.level, 0) / validSkills.length;
        
        // Base XP scales with level: 500 at level 1, 2000 at level 100
        // Much higher rewards to provide multiple level-ups
        const baseXP = 500 + Math.floor(avgLevel * 15);
        
        return Math.min(5000, Math.max(500, baseXP)); // Clamp between 500-5000
    }
    
    /**
     * End the adventure and apply rewards
     * @param {boolean} isManualEnd - Whether player manually ended
     * @returns {Object} Adventure summary with rewards
     */
    endAdventure(isManualEnd = false) {
        if (!this.adventureActive) {
            // Already ended, return empty summary
            return {
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                rewards: this.calculateRewards(isManualEnd)
            };
        }
        
        // Calculate rewards
        const rewards = this.calculateRewards(isManualEnd);
        
        // Apply rewards to game state
        this.applyRewards(rewards);
        
        // Create summary
        const summary = {
            successCount: this.successCount,
            failureCount: this.failureCount,
            successRate: this.getSuccessRate(),
            turnCount: this.turnCount,
            choiceTypes: { ...this.choiceTypes },
            rewards: rewards
        };
        
        // Reset adventure state
        this.resetAdventureState();
        
        // Unpause the game (GameState uses setPaused(false))
        if (this.gameState.setPaused) {
            this.gameState.setPaused(false);
        } else if (this.gameState.unpause) {
            // Fallback for compatibility
            this.gameState.unpause();
        }
        
        return summary;
    }
    
    /**
     * Apply calculated rewards to game state
     * @param {Object} rewards - Reward breakdown
     */
    applyRewards(rewards) {
        // Apply skill XP
        if (this.gameState.taskData && rewards.skillXP) {
            // Map our abstract skill names to actual game skill names
            // Based on src/data/GameData.js skillBaseData
            const skillMapping = {
                strength: 'Strength',              // Aggressive choices
                charisma: 'Meditation',            // Diplomatic choices (closest match)
                concentration: 'Concentration',     // Cautious choices
                magic: 'Mana control'              // Creative choices
            };
            
            Object.entries(rewards.skillXP).forEach(([skillName, xp]) => {
                if (xp > 0) {
                    const gameSkillName = skillMapping[skillName];
                    const skill = this.gameState.taskData[gameSkillName];
                    
                    if (skill) {
                        // Try addXp first (if exists), otherwise add directly to xp
                        if (typeof skill.addXp === 'function') {
                            skill.addXp(xp);
                        } else if (typeof skill.xp === 'number') {
                            // Directly add XP if no method available
                            skill.xp += xp;
                            
                            // Check if skill should level up
                            if (skill.getMaxXp && skill.xp >= skill.getMaxXp()) {
                                const excess = skill.xp - skill.getMaxXp();
                                skill.level += 1;
                                skill.xp = excess;
                            }
                        }
                    }
                }
            });
        }
        
        // Apply time advancement
        if (rewards.daysAdvanced > 0) {
            if (this.gameState.setDays && typeof this.gameState.getDays === 'function') {
                // Use setter if available
                this.gameState.setDays(this.gameState.getDays() + rewards.daysAdvanced);
            } else if (typeof this.gameState.days === 'number') {
                // Direct access fallback
                this.gameState.days += rewards.daysAdvanced;
            }
        }
        
        // Apply unlocks (for future implementation)
        if (rewards.unlocks && rewards.unlocks.length > 0) {
            // TODO: Implement item unlock system
            // For now, just log the unlocks
            this.logger.info('Adventure unlocks:', rewards.unlocks);
        }
    }
    
    /**
     * Check if game can be unpaused
     * Game cannot be unpaused while adventure is active
     */
    canUnpauseGame() {
        return !this.adventureActive;
    }
    
    /**
     * Check if adventure is currently active
     */
    isAdventureActive() {
        return this.adventureActive;
    }
    
    /**
     * Get current success count
     */
    getSuccessCount() {
        return this.successCount;
    }
    
    /**
     * Get current failure count
     */
    getFailureCount() {
        return this.failureCount;
    }
    
    /**
     * Get current turn count
     */
    getTurnCount() {
        return this.turnCount;
    }
    
    /**
     * Get count for specific choice type
     */
    getChoiceTypeCount(type) {
        return this.choiceTypes[type] || 0;
    }
    
    /**
     * Get complete choice history
     */
    getChoiceHistory() {
        return [...this.choiceHistory];
    }
    
    /**
     * Get current success rate
     */
    getSuccessRate() {
        const totalChoices = this.successCount + this.failureCount;
        if (totalChoices === 0) return 0;
        return this.successCount / totalChoices;
    }
    
    /**
     * Get current adventure state
     */
    getAdventureState() {
        return {
            isActive: this.adventureActive,
            successCount: this.successCount,
            failureCount: this.failureCount,
            turns: this.turnCount,
            choiceTypes: { ...this.choiceTypes },
            successRate: this.getSuccessRate()
        };
    }
    
    /**
     * Get adventure context for story manager
     */
    getAdventureContext() {
        return {
            successCount: this.successCount,
            failureCount: this.failureCount,
            turnCount: this.turnCount,
            canContinue: !this.shouldAutoEnd(),
            autoEndReason: this.shouldAutoEnd() ? 'too_many_failures' : null
        };
    }
}

// Export for both CommonJS and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryAdventureManager;
}
if (typeof window !== 'undefined') {
    window.StoryAdventureManager = StoryAdventureManager;
}
