// Main game loop and update logic
import { GAME_CONFIG } from '../config/GameConfig.js';
import { applySpeed, daysToYears } from '../utils/GameUtils.js';

export class GameLoop {
    constructor(gameState, uiUpdater) {
        this.gameState = gameState;
        this.uiUpdater = uiUpdater;
        this.isRunning = false;
        this.intervalId = null;
        this.saveIntervalId = null;
        this.skillUpdateIntervalId = null;
        
        // Bind methods to preserve context
        this.update = this.update.bind(this);
        this.saveGame = this.saveGame.bind(this);
        this.setSkillWithLowestMaxXp = this.setSkillWithLowestMaxXp.bind(this);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Main game loop
        this.intervalId = setInterval(this.update, 1000 / GAME_CONFIG.UPDATE_SPEED);
        
        // Auto-save
        this.saveIntervalId = setInterval(this.saveGame, GAME_CONFIG.SAVE_INTERVAL);
        
        // Skill optimization
        this.skillUpdateIntervalId = setInterval(this.setSkillWithLowestMaxXp, GAME_CONFIG.SKILL_UPDATE_INTERVAL);
        
        console.log('Game loop started');
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.saveIntervalId) {
            clearInterval(this.saveIntervalId);
            this.saveIntervalId = null;
        }
        
        if (this.skillUpdateIntervalId) {
            clearInterval(this.skillUpdateIntervalId);
            this.skillUpdateIntervalId = null;
        }
        
        console.log('Game loop stopped');
    }
    
    update() {
        try {
            this.increaseDays();
            this.autoPromote();
            this.autoLearn();
            this.doCurrentTask(this.gameState.currentJob);
            this.doCurrentTask(this.gameState.currentSkill);
            this.applyExpenses();
            this.uiUpdater.updateUI();
        } catch (error) {
            console.error('Error in game loop update:', error);
        }
    }
    
    increaseDays() {
        const increase = applySpeed(1, this.getGameSpeed(), GAME_CONFIG.UPDATE_SPEED);
        this.gameState.setDays(this.gameState.getDays() + increase);
    }
    
    doCurrentTask(task) {
        if (!task) return;
        
        task.increaseXp();
        if (task.constructor.name === 'Job') {
            this.increaseCoins();
        }
    }
    
    increaseCoins() {
        if (!this.gameState.currentJob) return;
        
        const coins = applySpeed(this.getIncome(), this.getGameSpeed(), GAME_CONFIG.UPDATE_SPEED);
        this.gameState.setCoins(this.gameState.getCoins() + coins);
    }
    
    getIncome() {
        if (!this.gameState.currentJob) return 0;
        return this.gameState.currentJob.getIncome();
    }
    
    applyExpenses() {
        const coins = applySpeed(this.getExpense(), this.getGameSpeed(), GAME_CONFIG.UPDATE_SPEED);
        const newCoins = this.gameState.getCoins() - coins;
        
        if (newCoins < 0) {
            this.goBankrupt();
        } else {
            this.gameState.setCoins(newCoins);
        }
    }
    
    getExpense() {
        let expense = 0;
        
        if (this.gameState.currentProperty) {
            expense += this.gameState.currentProperty.getExpense();
        }
        
        for (const misc of this.gameState.currentMisc) {
            expense += misc.getExpense();
        }
        
        return expense;
    }
    
    goBankrupt() {
        this.gameState.setCoins(0);
        this.gameState.setCurrentProperty(this.gameState.getItem("Homeless"));
        this.gameState.currentMisc = [];
        this.gameState.notifyObservers('currentMisc', []);
    }
    
    getGameSpeed() {
        const timeWarping = this.gameState.getTask("Time warping");
        let timeWarpingSpeed = 1;
        
        if (this.gameState.timeWarpingEnabled && timeWarping && typeof timeWarping.getEffect === 'function') {
            timeWarpingSpeed = timeWarping.getEffect();
        }
        
        return GAME_CONFIG.BASE_GAME_SPEED * 
               +!this.gameState.paused * 
               +this.isAlive() * 
               timeWarpingSpeed;
    }
    
    isAlive() {
        const condition = this.gameState.getDays() < this.getLifespan();
        
        if (!condition) {
            this.gameState.setDays(this.getLifespan());
            this.gameState.notifyObservers('death', true);
        }
        
        return condition;
    }
    
    getLifespan() {
        const immortality = this.gameState.getTask("Immortality");
        const superImmortality = this.gameState.getTask("Super immortality");
        
        const immortalityEffect = (immortality && typeof immortality.getEffect === 'function') ? immortality.getEffect() : 1;
        const superImmortalityEffect = (superImmortality && typeof superImmortality.getEffect === 'function') ? superImmortality.getEffect() : 1;
        
        return GAME_CONFIG.BASE_LIFESPAN * immortalityEffect * superImmortalityEffect;
    }
    
    autoPromote() {
        // Implementation would depend on auto-promote logic
        // This is a placeholder for the auto-promotion feature
    }
    
    autoLearn() {
        // Implementation would depend on auto-learn logic
        // This is a placeholder for the auto-learning feature
    }
    
    setSkillWithLowestMaxXp() {
        // Implementation would depend on skill optimization logic
        // This is a placeholder for the skill optimization feature
    }
    
    saveGame() {
        try {
            const gameData = this.gameState.toJSON();
            localStorage.setItem('gameDataSave', JSON.stringify(gameData));
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }
    
    loadGame() {
        try {
            const savedData = localStorage.getItem('gameDataSave');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                this.gameState.loadFromJSON(gameData);
            }
        } catch (error) {
            console.error('Error loading game:', error);
        }
    }
    
    // Control methods
    togglePause() {
        this.gameState.setPaused(!this.gameState.paused);
    }
    
    toggleTimeWarping() {
        this.gameState.setTimeWarpingEnabled(!this.gameState.timeWarpingEnabled);
    }
    
    // Cleanup
    destroy() {
        this.stop();
        this.gameState = null;
        this.uiUpdater = null;
    }
}
