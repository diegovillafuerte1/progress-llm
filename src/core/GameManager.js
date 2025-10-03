// Main game manager that coordinates all game systems
import { GameState } from './GameState.js';
import { GameLoop } from './GameLoop.js';
import { UIUpdater } from '../ui/UIUpdater.js';
import { HybridStateManager } from './HybridStateManager.js';
import { 
    jobBaseData, 
    skillBaseData, 
    itemBaseData, 
    jobCategories, 
    skillCategories, 
    itemCategories 
} from '../data/GameData.js';
import { 
    Task, 
    Job, 
    Skill, 
    Item, 
    TaskRequirement, 
    CoinRequirement, 
    AgeRequirement, 
    EvilRequirement 
} from '../entities/index.js';
import { GAME_CONFIG } from '../config/GameConfig.js';
import log from 'loglevel';

export class GameManager {
    constructor() {
        // Set up logging
        this.logger = log.noConflict(); // Avoid conflicts with console.log
        this.logger.setLevel('warn'); // Only show warnings and errors in production
        
        this.gameState = new GameState();
        this.uiUpdater = new UIUpdater(this.gameState);
        this.gameLoop = new GameLoop(this.gameState, this.uiUpdater);
        
        // Initialize hybrid state management system
        this.hybridStateManager = new HybridStateManager(this.gameState, this);
        
        this.initialized = false;
    }
    
    async initialize() {
        try {
            this.logger.info('Initializing game...');
            
            // Create all game entities
            this.createGameEntities();
            
            // Set up initial state
            this.setupInitialState();
            
            // Create requirements
            this.createRequirements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load saved game if available
            this.gameLoop.loadGame();
            
            // Start the game loop
            this.gameLoop.start();
            
            this.initialized = true;
            this.logger.info('Game initialized successfully');
            
        } catch (error) {
            this.logger.error('Error initializing game:', error);
            throw error;
        }
    }
    
    createGameEntities() {
        // Create jobs
        for (const jobName in jobBaseData) {
            const jobData = jobBaseData[jobName];
            const job = new Job(jobData);
            job.id = "row " + jobName;
            this.gameState.setTask(jobName, job);
        }
        
        // Create skills
        for (const skillName in skillBaseData) {
            const skillData = skillBaseData[skillName];
            const skill = new Skill(skillData);
            skill.id = "row " + skillName;
            this.gameState.setTask(skillName, skill);
        }
        
        // Create items
        for (const itemName in itemBaseData) {
            const itemData = itemBaseData[itemName];
            const item = new Item(itemData);
            item.id = "row " + itemName;
            this.gameState.setItem(itemName, item);
        }
    }
    
    setupInitialState() {
        // Set initial current entities
        this.gameState.setCurrentJob(this.gameState.getTask("Beggar"));
        this.gameState.setCurrentSkill(this.gameState.getTask("Concentration"));
        this.gameState.setCurrentProperty(this.gameState.getItem("Homeless"));
        this.gameState.currentMisc = [];
    }
    
    createRequirements() {
        // Create requirement objects for game progression
        // This is a simplified version - the full implementation would include all requirements
        
        const requirements = {
            // Basic requirements
            "Beggar": new TaskRequirement([this.getTaskElement("Beggar")], []),
            "Concentration": new TaskRequirement([this.getTaskElement("Concentration")], []),
            "Homeless": new CoinRequirement([this.getItemElement("Homeless")], [{requirement: 0}]),
            
            // Job requirements
            "Farmer": new TaskRequirement([this.getTaskElement("Farmer")], [
                {task: "Beggar", requirement: 10}
            ]),
            
            // Item requirements
            "Tent": new CoinRequirement([this.getItemElement("Tent")], [
                {requirement: this.gameState.getItem("Tent").getExpense() * 100}
            ]),
            
            // Age requirements
            "Rebirth tab": new AgeRequirement([document.getElementById("rebirthTabButton")], [
                {requirement: 25}
            ]),
            
            // Evil requirements
            "Dark magic": new EvilRequirement([this.getElementsByClass("Dark magic")], [
                {requirement: 1}
            ]),
        };
        
        // Set all requirements in game state
        for (const reqName in requirements) {
            this.gameState.setRequirement(reqName, requirements[reqName]);
        }
    }
    
    setupEventListeners() {
        // Set up global event listeners for game controls
        
        // Pause button
        const pauseButton = document.getElementById("pauseButton");
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.gameLoop.togglePause();
            });
        }
        
        // Time warping button
        const timeWarpingButton = document.getElementById("timeWarpingButton");
        if (timeWarpingButton) {
            timeWarpingButton.addEventListener('click', () => {
                this.gameLoop.toggleTimeWarping();
            });
        }
        
        // Tab buttons
        const jobTabButton = document.getElementById("jobTabButton");
        if (jobTabButton) {
            jobTabButton.addEventListener('click', () => {
                this.uiUpdater.setTab(jobTabButton, "jobs");
            });
        }
        
        const skillTabButton = document.getElementById("skills");
        if (skillTabButton) {
            skillTabButton.addEventListener('click', () => {
                this.uiUpdater.setTab(skillTabButton, "skills");
            });
        }
        
        const shopTabButton = document.getElementById("shopTabButton");
        if (shopTabButton) {
            shopTabButton.addEventListener('click', () => {
                this.uiUpdater.setTab(shopTabButton, "shop");
            });
        }
        
        const rebirthTabButton = document.getElementById("rebirthTabButton");
        if (rebirthTabButton) {
            rebirthTabButton.addEventListener('click', () => {
                this.uiUpdater.setTab(rebirthTabButton, "rebirth");
            });
        }
        
        // Settings tab
        const settingsTabButton = document.querySelector('[onClick*="settings"]');
        if (settingsTabButton) {
            settingsTabButton.addEventListener('click', () => {
                this.uiUpdater.setTab(settingsTabButton, "settings");
            });
        }
        
        // Rebirth buttons
        const rebirthOneButton = document.querySelector('[onClick*="rebirthOne"]');
        if (rebirthOneButton) {
            rebirthOneButton.addEventListener('click', () => {
                this.rebirthOne();
            });
        }
        
        const rebirthTwoButton = document.querySelector('[onClick*="rebirthTwo"]');
        if (rebirthTwoButton) {
            rebirthTwoButton.addEventListener('click', () => {
                this.rebirthTwo();
            });
        }
        
        // Settings buttons
        const lightDarkButton = document.querySelector('[onClick*="setLightDarkMode"]');
        if (lightDarkButton) {
            lightDarkButton.addEventListener('click', () => {
                this.toggleLightDarkMode();
            });
        }
        
        const resetButton = document.querySelector('[onClick*="resetGameData"]');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetGameData();
            });
        }
        
        const importButton = document.querySelector('[onClick*="importGameData"]');
        if (importButton) {
            importButton.addEventListener('click', () => {
                this.importGameData();
            });
        }
        
        const exportButton = document.querySelector('[onClick*="exportGameData"]');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                this.exportGameData();
            });
        }
    }
    
    // Game control methods
    setTask(taskName) {
        const task = this.gameState.getTask(taskName);
        if (!task) return;
        
        if (task.constructor.name === 'Job') {
            this.gameState.setCurrentJob(task);
        } else {
            this.gameState.setCurrentSkill(task);
        }
    }
    
    setProperty(propertyName) {
        const property = this.gameState.getItem(propertyName);
        if (!property) return;
        
        this.gameState.setCurrentProperty(property);
    }
    
    setMisc(miscName) {
        const misc = this.gameState.getItem(miscName);
        if (!misc) return;
        
        if (this.gameState.currentMisc.includes(misc)) {
            this.gameState.removeMiscItem(misc);
        } else {
            this.gameState.addMiscItem(misc);
        }
    }
    
    rebirthOne() {
        this.gameState.incrementRebirthOne();
        this.gameState.reset();
        
        // Reset to initial state
        this.setupInitialState();
        
        // Switch to jobs tab
        this.uiUpdater.setTab(document.getElementById("jobTabButton"), "jobs");
    }
    
    rebirthTwo() {
        this.gameState.incrementRebirthTwo();
        this.gameState.setEvil(this.gameState.getEvil() + this.uiUpdater.getEvilGain());
        this.gameState.reset();
        
        // Reset max levels
        for (const taskName in this.gameState.taskData) {
            const task = this.gameState.taskData[taskName];
            task.maxLevel = 0;
        }
        
        // Reset to initial state
        this.setupInitialState();
        
        // Switch to jobs tab
        this.uiUpdater.setTab(document.getElementById("jobTabButton"), "jobs");
    }
    
    toggleLightDarkMode() {
        const body = document.getElementById("body");
        if (body) {
            body.classList.toggle("dark");
        }
    }
    
    resetGameData() {
        localStorage.clear();
        location.reload();
    }
    
    importGameData() {
        const importExportBox = document.getElementById("importExportBox");
        if (!importExportBox) return;
        
        try {
            const data = JSON.parse(window.atob(importExportBox.value));
            this.gameState.loadFromJSON(data);
            this.gameLoop.saveGame();
            location.reload();
        } catch (error) {
            this.logger.error('Error importing game data:', error);
            alert('Invalid import data');
        }
    }
    
    exportGameData() {
        const importExportBox = document.getElementById("importExportBox");
        if (!importExportBox) return;
        
        try {
            const gameData = this.gameState.toJSON();
            importExportBox.value = window.btoa(JSON.stringify(gameData));
        } catch (error) {
            this.logger.error('Error exporting game data:', error);
        }
    }
    
    // Helper methods
    getTaskElement(taskName) {
        const task = this.gameState.getTask(taskName);
        if (!task) return null;
        return document.getElementById(task.id);
    }
    
    getItemElement(itemName) {
        const item = this.gameState.getItem(itemName);
        if (!item) return null;
        return document.getElementById(item.id);
    }
    
    getElementsByClass(className) {
        return document.getElementsByClassName(className.replace(/ /g, ""));
    }
    
    // Hybrid State Management Methods
    
    /**
     * Process an action through the hybrid state management system
     * @param {Object} action - The action to process
     * @param {Object} context - Additional context
     * @returns {Promise<Object>} Processing result
     */
    async processAction(action, context = {}) {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return await this.hybridStateManager.processAction(action, context);
    }
    
    /**
     * Get state for LLM consumption
     * @returns {Object} Formatted state for LLM
     */
    getStateForLLM() {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return this.hybridStateManager.getStateForLLM();
    }
    
    /**
     * Get world rules for LLM
     * @returns {Object} World rules
     */
    getWorldRulesForLLM() {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return this.hybridStateManager.getWorldRulesForLLM();
    }
    
    /**
     * Validate current game state
     * @returns {Object} Validation report
     */
    validateCurrentState() {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return this.hybridStateManager.validateCurrentState();
    }
    
    /**
     * Get system metrics and performance data
     * @returns {Object} System metrics
     */
    getSystemMetrics() {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return this.hybridStateManager.getMetrics();
    }
    
    /**
     * Get comprehensive system report
     * @returns {Object} System report
     */
    getSystemReport() {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return this.hybridStateManager.getSystemReport();
    }
    
    /**
     * Get state differences since last action
     * @returns {Object} State differences
     */
    getStateDifferences() {
        if (!this.hybridStateManager) {
            throw new Error('Hybrid state manager not initialized');
        }
        
        return this.hybridStateManager.getStateDifferences();
    }
    
    // Cleanup
    destroy() {
        if (this.gameLoop) {
            this.gameLoop.destroy();
        }
        
        if (this.uiUpdater) {
            this.uiUpdater.destroy();
        }
        
        if (this.hybridStateManager) {
            this.hybridStateManager.destroy();
        }
        
        this.gameState = null;
        this.initialized = false;
    }
}
