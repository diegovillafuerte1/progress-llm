/**
 * HybridStateManager.js - Integrates paper-based improvements with existing game
 * 
 * This is the main integration point that combines:
 * - StateEncoder for structured JSON representation
 * - StateDiff for efficient change tracking
 * - TransitionClassifier for action vs environment separation
 * - WorldRules for explicit game rules
 * - StateValidator for consistency validation
 * - EnvironmentSimulator for reliable world simulation
 */

import { StateEncoder } from '../llm/StateEncoder.js';
import { StateDiff } from '../llm/StateDiff.js';
import { TransitionClassifier } from '../llm/TransitionClassifier.js';
import { WorldRules } from '../llm/WorldRules.js';
import { StateValidator } from '../llm/StateValidator.js';
import { EnvironmentSimulator } from './EnvironmentSimulator.js';

export class HybridStateManager {
    constructor(gameState, gameManager) {
        this.gameState = gameState;
        this.gameManager = gameManager;
        
        // Initialize all paper-based modules
        this.stateEncoder = new StateEncoder();
        this.stateDiff = new StateDiff();
        this.transitionClassifier = new TransitionClassifier();
        this.worldRules = new WorldRules();
        this.stateValidator = new StateValidator();
        this.environmentSimulator = new EnvironmentSimulator();
        
        // State tracking
        this.previousState = null;
        this.currentStateSnapshot = null;
        this.stateHistory = [];
        this.maxHistorySize = 20;
        
        // Performance metrics
        this.metrics = {
            totalTransitions: 0,
            actionDriven: 0,
            environmentDriven: 0,
            hybrid: 0,
            validationErrors: 0,
            llmCalls: 0,
            tokenUsage: 0
        };
        
        this.initializeStateTracking();
    }
    
    /**
     * Initialize state tracking and take initial snapshot
     */
    initializeStateTracking() {
        this.currentStateSnapshot = this.createStateSnapshot();
        this.previousState = this.currentStateSnapshot;
    }
    
    /**
     * Process a game action with hybrid state management
     * @param {Object} action - The action to process
     * @param {Object} context - Additional context
     * @returns {Object} Processing result
     */
    async processAction(action, context = {}) {
        try {
            // 1. Classify the transition type
            const classification = this.transitionClassifier.classifyTransition(action, this.gameState);
            this.updateMetrics(classification.type);
            
            // 2. Validate action against world rules
            const isValid = this.worldRules.validateAction(action);
            if (!isValid) {
                this.metrics.validationErrors++;
                return {
                    success: false,
                    error: 'Action violates world rules',
                    classification
                };
            }
            
            // 3. Take state snapshot before action
            this.previousState = this.currentStateSnapshot;
            
            // 4. Process based on classification
            let result;
            if (classification.type === 'action-driven') {
                result = await this.processActionDriven(action, context);
            } else if (classification.type === 'environment-driven') {
                result = await this.processEnvironmentDriven(action, context);
            } else if (classification.type === 'hybrid') {
                result = await this.processHybrid(action, context);
            } else {
                result = {
                    success: false,
                    error: 'Unknown transition type',
                    classification
                };
            }
            
            // 5. Take state snapshot after action
            this.currentStateSnapshot = this.createStateSnapshot();
            
            // 6. Calculate state differences
            const stateDiff = this.stateDiff.calculateDiff(this.previousState, this.currentStateSnapshot);
            
            // 7. Validate final state
            const validationReport = this.stateValidator.getValidationReport(this.gameState);
            if (!validationReport.overall) {
                this.metrics.validationErrors++;
                result.validationErrors = validationReport.issues;
            }
            
            // 8. Store in history
            this.storeInHistory(action, result, stateDiff, classification);
            
            return {
                success: result.success,
                result,
                classification,
                stateDiff,
                validationReport,
                metrics: this.getMetrics()
            };
            
        } catch (error) {
            console.error('Error processing action:', error);
            return {
                success: false,
                error: error.message,
                classification: { type: 'error' }
            };
        }
    }
    
    /**
     * Process action-driven transition (requires LLM)
     * @param {Object} action - The action
     * @param {Object} context - Additional context
     * @returns {Object} Processing result
     */
    async processActionDriven(action, context) {
        // For action-driven transitions, we need LLM for narrative
        // but the game mechanics are still handled by code
        
        // Get structured state for LLM
        const llmState = this.stateEncoder.getStateForLLM(this.gameState);
        
        // Get world rules for LLM
        const worldRules = this.worldRules.getRulesForLLM();
        
        // Prepare LLM context
        const llmContext = {
            action,
            gameState: llmState,
            worldRules,
            characterTraits: this.extractCharacterTraits(),
            storyContext: context.storyContext || {}
        };
        
        // Note: In a real implementation, this would call the LLM API
        // For now, we'll simulate the LLM response
        const llmResponse = await this.simulateLLMResponse(action, llmContext);
        
        // Apply mechanical changes (handled by game code)
        const mechanicalResult = this.applyMechanicalChanges(action, llmResponse);
        
        return {
            success: true,
            type: 'action-driven',
            llmResponse,
            mechanicalResult,
            narrative: llmResponse.narrative,
            stateChanges: mechanicalResult.stateChanges
        };
    }
    
    /**
     * Process environment-driven transition (code only)
     * @param {Object} action - The action
     * @param {Object} context - Additional context
     * @returns {Object} Processing result
     */
    async processEnvironmentDriven(action, context) {
        // Environment-driven transitions are handled entirely by code
        
        let simulationResult;
        
        switch (action.type) {
            case 'time_passage':
                simulationResult = this.environmentSimulator.simulateTimePassage(this.gameState, action.duration);
                break;
            case 'weather_change':
                simulationResult = this.environmentSimulator.simulateWeatherChanges(this.gameState);
                break;
            case 'npc_behavior':
                simulationResult = this.environmentSimulator.simulateNPCBehavior(this.gameState);
                break;
            case 'world_events':
                simulationResult = this.environmentSimulator.simulateWorldEvents(this.gameState);
                break;
            case 'economic_changes':
                simulationResult = this.environmentSimulator.simulateEconomicChanges(this.gameState);
                break;
            default:
                simulationResult = { effects: {}, success: true };
        }
        
        // Apply simulation results to game state
        this.applySimulationResults(simulationResult);
        
        return {
            success: true,
            type: 'environment-driven',
            simulationResult,
            stateChanges: this.extractStateChanges(simulationResult)
        };
    }
    
    /**
     * Process hybrid transition (both LLM and code)
     * @param {Object} action - The action
     * @param {Object} context - Additional context
     * @returns {Object} Processing result
     */
    async processHybrid(action, context) {
        // Hybrid transitions require both LLM and code
        
        // 1. Code determines the mechanical outcome
        const mechanicalResult = this.determineMechanicalOutcome(action);
        
        // 2. LLM generates narrative based on the outcome
        const llmState = this.stateEncoder.getStateForLLM(this.gameState);
        const worldRules = this.worldRules.getRulesForLLM();
        
        const llmContext = {
            action,
            mechanicalResult,
            gameState: llmState,
            worldRules,
            characterTraits: this.extractCharacterTraits()
        };
        
        const llmResponse = await this.simulateLLMResponse(action, llmContext, mechanicalResult);
        
        // 3. Apply mechanical changes
        this.applyMechanicalChanges(action, mechanicalResult);
        
        return {
            success: true,
            type: 'hybrid',
            mechanicalResult,
            llmResponse,
            narrative: llmResponse.narrative,
            stateChanges: mechanicalResult.stateChanges
        };
    }
    
    /**
     * Create a snapshot of current game state
     * @returns {Object} State snapshot
     */
    createStateSnapshot() {
        return {
            coins: this.gameState.getCoins(),
            days: this.gameState.getDays(),
            evil: this.gameState.getEvil(),
            paused: this.gameState.paused,
            timeWarpingEnabled: this.gameState.timeWarpingEnabled,
            currentJob: this.gameState.currentJob ? this.gameState.currentJob.name : null,
            currentSkill: this.gameState.currentSkill ? this.gameState.currentSkill.name : null,
            currentProperty: this.gameState.currentProperty ? this.gameState.currentProperty.name : null,
            currentMisc: this.gameState.currentMisc.map(item => item.name),
            taskData: this.snapshotTaskData(),
            itemData: this.snapshotItemData(),
            timestamp: Date.now()
        };
    }
    
    /**
     * Snapshot task data
     * @returns {Object} Task data snapshot
     */
    snapshotTaskData() {
        const snapshot = {};
        for (const [name, task] of Object.entries(this.gameState.taskData)) {
            snapshot[name] = {
                level: task.level,
                xp: task.xp,
                maxLevel: task.maxLevel
            };
        }
        return snapshot;
    }
    
    /**
     * Snapshot item data
     * @returns {Object} Item data snapshot
     */
    snapshotItemData() {
        const snapshot = {};
        for (const [name, item] of Object.entries(this.gameState.itemData)) {
            snapshot[name] = {
                level: item.level,
                xp: item.xp,
                maxLevel: item.maxLevel
            };
        }
        return snapshot;
    }
    
    /**
     * Extract character traits from game state
     * @returns {Object} Character traits
     */
    extractCharacterTraits() {
        return {
            age: this.gameState.getDays(),
            wealth: this.gameState.getCoins(),
            evil: this.gameState.getEvil(),
            rebirths: this.gameState.rebirthOneCount + this.gameState.rebirthTwoCount,
            currentJob: this.gameState.currentJob ? this.gameState.currentJob.name : null,
            currentSkill: this.gameState.currentSkill ? this.gameState.currentSkill.name : null,
            personality: this.determinePersonality(),
            motivations: this.determineMotivations(),
            fears: this.determineFears(),
            goals: this.determineGoals()
        };
    }
    
    /**
     * Determine personality based on game state
     * @returns {Array} Personality traits
     */
    determinePersonality() {
        const traits = [];
        const evil = this.gameState.getEvil();
        const rebirths = this.gameState.rebirthOneCount + this.gameState.rebirthTwoCount;
        const coins = this.gameState.getCoins();
        
        if (evil > 70) traits.push('malevolent', 'calculating');
        else if (evil > 30) traits.push('morally ambiguous');
        else traits.push('virtuous', 'compassionate');
        
        if (rebirths > 2) traits.push('ancient', 'wise');
        else if (rebirths > 0) traits.push('experienced');
        else traits.push('young', 'eager');
        
        if (coins > 100000) traits.push('influential', 'confident');
        else if (coins < 1000) traits.push('struggling', 'determined');
        
        return traits;
    }
    
    /**
     * Determine character motivations
     * @returns {Array} Motivations
     */
    determineMotivations() {
        const motivations = [];
        const evil = this.gameState.getEvil();
        const rebirths = this.gameState.rebirthOneCount + this.gameState.rebirthTwoCount;
        
        if (evil > 50) {
            motivations.push('seeking power', 'domination');
        } else {
            motivations.push('protecting others', 'seeking knowledge');
        }
        
        if (rebirths > 0) {
            motivations.push('breaking the cycle', 'transcending mortality');
        }
        
        return motivations;
    }
    
    /**
     * Determine character fears
     * @returns {Array} Fears
     */
    determineFears() {
        const fears = [];
        const evil = this.gameState.getEvil();
        const rebirths = this.gameState.rebirthOneCount + this.gameState.rebirthTwoCount;
        const age = this.gameState.getDays();
        
        if (rebirths > 0) {
            fears.push('eternal repetition', 'being trapped in cycles');
        }
        
        if (evil > 70) {
            fears.push('redemption', 'being forgotten');
        } else {
            fears.push('corruption', 'losing innocence');
        }
        
        if (age > 50) {
            fears.push('time running out', 'legacy');
        }
        
        return fears;
    }
    
    /**
     * Determine character goals
     * @returns {Array} Goals
     */
    determineGoals() {
        const goals = [];
        const evil = this.gameState.getEvil();
        const rebirths = this.gameState.rebirthOneCount + this.gameState.rebirthTwoCount;
        const currentJob = this.gameState.currentJob ? this.gameState.currentJob.name : '';
        
        if (rebirths > 0) {
            goals.push('transcending the cycle', 'achieving true freedom');
        }
        
        if (evil > 50) {
            goals.push('ultimate power', 'world domination');
        } else {
            goals.push('protecting the realm', 'bringing peace');
        }
        
        if (currentJob === 'Beggar') {
            goals.push('finding purpose', 'making a difference');
        }
        
        return goals;
    }
    
    /**
     * Simulate LLM response (placeholder for actual LLM integration)
     * @param {Object} action - The action
     * @param {Object} context - LLM context
     * @param {Object} mechanicalResult - Mechanical result (for hybrid)
     * @returns {Object} Simulated LLM response
     */
    async simulateLLMResponse(action, context, mechanicalResult = null) {
        // This is a placeholder - in real implementation, this would call the LLM API
        this.metrics.llmCalls++;
        
        const narrative = this.generateNarrative(action, context, mechanicalResult);
        
        return {
            narrative,
            choices: this.generateChoices(action),
            stateChanges: mechanicalResult ? mechanicalResult.stateChanges : {},
            confidence: 0.85
        };
    }
    
    /**
     * Generate narrative based on action and context
     * @param {Object} action - The action
     * @param {Object} context - Context
     * @param {Object} mechanicalResult - Mechanical result
     * @returns {String} Generated narrative
     */
    generateNarrative(action, context, mechanicalResult) {
        const characterName = context.characterTraits.name || 'Adventurer';
        const job = context.characterTraits.currentJob || 'Beggar';
        
        let narrative = '';
        
        if (action.type === 'combat') {
            narrative = `${characterName} prepares for combat, drawing upon their ${job} training.`;
        } else if (action.type === 'dialogue') {
            narrative = `${characterName} approaches the situation with diplomatic intent.`;
        } else if (action.type === 'skill_check') {
            narrative = `${characterName} focuses their skills to overcome the challenge.`;
        } else {
            narrative = `${characterName} takes action in the world.`;
        }
        
        if (mechanicalResult && mechanicalResult.success !== undefined) {
            narrative += mechanicalResult.success ? 
                ' The action succeeds!' : 
                ' The action fails, but valuable experience is gained.';
        }
        
        return narrative;
    }
    
    /**
     * Generate choices for narrative
     * @param {Object} action - The action
     * @returns {Array} Generated choices
     */
    generateChoices(action) {
        const baseChoices = [
            'Take an aggressive approach',
            'Proceed with caution',
            'Attempt diplomacy',
            'Try a creative solution'
        ];
        
        return baseChoices;
    }
    
    /**
     * Determine mechanical outcome for hybrid actions
     * @param {Object} action - The action
     * @returns {Object} Mechanical result
     */
    determineMechanicalOutcome(action) {
        // This would integrate with existing game mechanics
        // For now, we'll simulate based on action type
        
        let success = true;
        let stateChanges = {};
        
        if (action.type === 'skill_check') {
            success = Math.random() > 0.3; // 70% success rate
            if (success) {
                stateChanges.experience = 10;
            }
        } else if (action.type === 'combat') {
            success = Math.random() > 0.4; // 60% success rate
            if (success) {
                stateChanges.experience = 20;
                stateChanges.coins = 50;
            } else {
                stateChanges.health = -10;
            }
        }
        
        return {
            success,
            stateChanges,
            experience: stateChanges.experience || 0,
            coins: stateChanges.coins || 0,
            health: stateChanges.health || 0
        };
    }
    
    /**
     * Apply mechanical changes to game state
     * @param {Object} action - The action
     * @param {Object} result - The result
     */
    applyMechanicalChanges(action, result) {
        if (result.stateChanges) {
            for (const [property, value] of Object.entries(result.stateChanges)) {
                switch (property) {
                    case 'coins':
                        this.gameState.setCoins(this.gameState.getCoins() + value);
                        break;
                    case 'experience':
                        // Apply experience to current skill
                        if (this.gameState.currentSkill) {
                            this.gameState.currentSkill.xp += value;
                        }
                        break;
                    case 'health':
                        // Health changes would be handled by game mechanics
                        break;
                }
            }
        }
    }
    
    /**
     * Apply simulation results to game state
     * @param {Object} simulationResult - Simulation result
     */
    applySimulationResults(simulationResult) {
        if (simulationResult.newTime !== undefined) {
            // Time advancement would be handled by game loop
        }
        
        if (simulationResult.healthChange !== undefined) {
            // Health changes would be handled by game mechanics
        }
        
        if (simulationResult.reputationChange !== undefined) {
            // Reputation changes would be handled by game mechanics
        }
    }
    
    /**
     * Extract state changes from simulation result
     * @param {Object} simulationResult - Simulation result
     * @returns {Object} State changes
     */
    extractStateChanges(simulationResult) {
        const changes = {};
        
        if (simulationResult.newTime !== undefined) {
            changes.time = simulationResult.newTime;
        }
        
        if (simulationResult.healthChange !== undefined) {
            changes.health = simulationResult.healthChange;
        }
        
        if (simulationResult.reputationChange !== undefined) {
            changes.reputation = simulationResult.reputationChange;
        }
        
        return changes;
    }
    
    /**
     * Store action in history
     * @param {Object} action - The action
     * @param {Object} result - The result
     * @param {Object} stateDiff - State differences
     * @param {Object} classification - Classification
     */
    storeInHistory(action, result, stateDiff, classification) {
        const historyEntry = {
            timestamp: Date.now(),
            action,
            result,
            stateDiff,
            classification,
            metrics: { ...this.metrics }
        };
        
        this.stateHistory.push(historyEntry);
        
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    
    /**
     * Update metrics
     * @param {string} transitionType - Type of transition
     */
    updateMetrics(transitionType) {
        this.metrics.totalTransitions++;
        
        switch (transitionType) {
            case 'action-driven':
                this.metrics.actionDriven++;
                break;
            case 'environment-driven':
                this.metrics.environmentDriven++;
                break;
            case 'hybrid':
                this.metrics.hybrid++;
                break;
        }
    }
    
    /**
     * Get current metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            stateHistoryLength: this.stateHistory.length,
            lastAction: this.stateHistory.length > 0 ? 
                this.stateHistory[this.stateHistory.length - 1] : null
        };
    }
    
    /**
     * Get state for LLM consumption
     * @returns {Object} Formatted state for LLM
     */
    getStateForLLM() {
        return this.stateEncoder.getStateForLLM(this.gameState);
    }
    
    /**
     * Get world rules for LLM
     * @returns {Object} World rules
     */
    getWorldRulesForLLM() {
        return this.worldRules.getRulesForLLM();
    }
    
    /**
     * Validate current game state
     * @returns {Object} Validation report
     */
    validateCurrentState() {
        return this.stateValidator.getValidationReport(this.gameState);
    }
    
    /**
     * Get state differences since last action
     * @returns {Object} State differences
     */
    getStateDifferences() {
        if (!this.previousState || !this.currentStateSnapshot) {
            return null;
        }
        
        return this.stateDiff.calculateDiff(this.previousState, this.currentStateSnapshot);
    }
    
    /**
     * Get comprehensive system report
     * @returns {Object} System report
     */
    getSystemReport() {
        return {
            metrics: this.getMetrics(),
            validationReport: this.validateCurrentState(),
            stateDifferences: this.getStateDifferences(),
            worldRules: this.worldRules.getRuleMetrics(),
            environmentSimulation: this.environmentSimulator.getSimulationReport(this.gameState),
            stateHistory: this.stateHistory.slice(-5) // Last 5 actions
        };
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stateHistory = [];
        this.previousState = null;
        this.currentStateSnapshot = null;
        this.metrics = {
            totalTransitions: 0,
            actionDriven: 0,
            environmentDriven: 0,
            hybrid: 0,
            validationErrors: 0,
            llmCalls: 0,
            tokenUsage: 0
        };
    }
}
