// Centralized game state management
import { GAME_CONFIG } from '../config/GameConfig.js';

export class GameState {
    constructor() {
        this.taskData = {};
        this.itemData = {};
        this.requirements = {};
        
        this.coins = GAME_CONFIG.INITIAL_COINS;
        this.days = GAME_CONFIG.INITIAL_AGE;
        this.evil = GAME_CONFIG.INITIAL_EVIL;
        this.paused = false;
        this.timeWarpingEnabled = true;
        
        this.rebirthOneCount = 0;
        this.rebirthTwoCount = 0;
        
        this.currentJob = null;
        this.currentSkill = null;
        this.currentProperty = null;
        this.currentMisc = [];
        
        this.observers = [];
    }
    
    // Observer pattern for state changes
    subscribe(observer) {
        this.observers.push(observer);
    }
    
    unsubscribe(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }
    
    notifyObservers(property, value) {
        this.observers.forEach(observer => {
            if (typeof observer === 'function') {
                observer(property, value);
            } else if (observer && typeof observer.update === 'function') {
                observer.update(property, value);
            }
        });
    }
    
    // Getters with validation
    getCoins() {
        return this.coins;
    }
    
    getDays() {
        return this.days;
    }
    
    getEvil() {
        return this.evil;
    }
    
    // Setters with validation and notifications
    setCoins(value) {
        if (typeof value !== 'number' || value < 0) {
            throw new Error('Invalid coins value');
        }
        this.coins = value;
        this.notifyObservers('coins', value);
    }
    
    setDays(value) {
        if (typeof value !== 'number' || value < 0) {
            throw new Error('Invalid days value');
        }
        this.days = value;
        this.notifyObservers('days', value);
    }
    
    setEvil(value) {
        if (typeof value !== 'number' || value < 0) {
            throw new Error('Invalid evil value');
        }
        this.evil = value;
        this.notifyObservers('evil', value);
    }
    
    setPaused(value) {
        if (typeof value !== 'boolean') {
            throw new Error('Invalid paused value');
        }
        this.paused = value;
        this.notifyObservers('paused', value);
    }
    
    setTimeWarpingEnabled(value) {
        if (typeof value !== 'boolean') {
            throw new Error('Invalid timeWarpingEnabled value');
        }
        this.timeWarpingEnabled = value;
        this.notifyObservers('timeWarpingEnabled', value);
    }
    
    // Task and item management
    getTask(name) {
        return this.taskData[name];
    }
    
    setTask(name, task) {
        this.taskData[name] = task;
        this.notifyObservers('taskData', this.taskData);
    }
    
    getItem(name) {
        return this.itemData[name];
    }
    
    setItem(name, item) {
        this.itemData[name] = item;
        this.notifyObservers('itemData', this.itemData);
    }
    
    getRequirement(name) {
        return this.requirements[name];
    }
    
    setRequirement(name, requirement) {
        this.requirements[name] = requirement;
        this.notifyObservers('requirements', this.requirements);
    }
    
    // Current entity management
    setCurrentJob(job) {
        if (job && !this.taskData[job.name]) {
            throw new Error('Job not found in taskData');
        }
        this.currentJob = job;
        this.notifyObservers('currentJob', job);
    }
    
    setCurrentSkill(skill) {
        if (skill && !this.taskData[skill.name]) {
            throw new Error('Skill not found in taskData');
        }
        this.currentSkill = skill;
        this.notifyObservers('currentSkill', skill);
    }
    
    setCurrentProperty(property) {
        if (property && !this.itemData[property.name]) {
            throw new Error('Property not found in itemData');
        }
        this.currentProperty = property;
        this.notifyObservers('currentProperty', property);
    }
    
    addMiscItem(item) {
        if (!this.itemData[item.name]) {
            throw new Error('Item not found in itemData');
        }
        if (!this.currentMisc.includes(item)) {
            this.currentMisc.push(item);
            this.notifyObservers('currentMisc', this.currentMisc);
        }
    }
    
    removeMiscItem(item) {
        const index = this.currentMisc.indexOf(item);
        if (index > -1) {
            this.currentMisc.splice(index, 1);
            this.notifyObservers('currentMisc', this.currentMisc);
        }
    }
    
    // Rebirth management
    incrementRebirthOne() {
        this.rebirthOneCount++;
        this.notifyObservers('rebirthOneCount', this.rebirthOneCount);
    }
    
    incrementRebirthTwo() {
        this.rebirthTwoCount++;
        this.notifyObservers('rebirthTwoCount', this.rebirthTwoCount);
    }
    
    // Serialization for save/load
    toJSON() {
        return {
            taskData: this.taskData,
            itemData: this.itemData,
            requirements: this.requirements,
            coins: this.coins,
            days: this.days,
            evil: this.evil,
            paused: this.paused,
            timeWarpingEnabled: this.timeWarpingEnabled,
            rebirthOneCount: this.rebirthOneCount,
            rebirthTwoCount: this.rebirthTwoCount,
            currentJob: this.currentJob ? this.currentJob.name : null,
            currentSkill: this.currentSkill ? this.currentSkill.name : null,
            currentProperty: this.currentProperty ? this.currentProperty.name : null,
            currentMisc: this.currentMisc.map(item => item.name)
        };
    }
    
    loadFromJSON(data) {
        if (!data) return;
        
        // Load basic properties
        this.coins = data.coins || GAME_CONFIG.INITIAL_COINS;
        this.days = data.days || GAME_CONFIG.INITIAL_AGE;
        this.evil = data.evil || GAME_CONFIG.INITIAL_EVIL;
        this.paused = data.paused || false;
        this.timeWarpingEnabled = data.timeWarpingEnabled !== undefined ? data.timeWarpingEnabled : true;
        this.rebirthOneCount = data.rebirthOneCount || 0;
        this.rebirthTwoCount = data.rebirthTwoCount || 0;
        
        // Load task data
        if (data.taskData) {
            this.taskData = data.taskData;
        }
        
        // Load item data
        if (data.itemData) {
            this.itemData = data.itemData;
        }
        
        // Load requirements
        if (data.requirements) {
            this.requirements = data.requirements;
        }
        
        // Load current entities by name
        if (data.currentJob && this.taskData[data.currentJob]) {
            this.currentJob = this.taskData[data.currentJob];
        }
        
        if (data.currentSkill && this.taskData[data.currentSkill]) {
            this.currentSkill = this.taskData[data.currentSkill];
        }
        
        if (data.currentProperty && this.itemData[data.currentProperty]) {
            this.currentProperty = this.itemData[data.currentProperty];
        }
        
        if (data.currentMisc && Array.isArray(data.currentMisc)) {
            this.currentMisc = data.currentMisc
                .map(itemName => this.itemData[itemName])
                .filter(item => item !== undefined);
        }
        
        this.notifyObservers('loaded', data);
    }
    
    // Reset to initial state
    reset() {
        this.coins = GAME_CONFIG.INITIAL_COINS;
        this.days = GAME_CONFIG.INITIAL_AGE;
        this.evil = GAME_CONFIG.INITIAL_EVIL;
        this.paused = false;
        this.timeWarpingEnabled = true;
        this.rebirthOneCount = 0;
        this.rebirthTwoCount = 0;
        this.currentJob = null;
        this.currentSkill = null;
        this.currentProperty = null;
        this.currentMisc = [];
        
        // Reset all tasks
        for (const taskName in this.taskData) {
            const task = this.taskData[taskName];
            if (task.level > task.maxLevel) {
                task.maxLevel = task.level;
            }
            task.level = 0;
            task.xp = 0;
        }
        
        // Reset requirements
        for (const reqName in this.requirements) {
            const requirement = this.requirements[reqName];
            if (!requirement.completed || !GAME_CONFIG.PERMANENT_UNLOCKS.includes(reqName)) {
                requirement.completed = false;
            }
        }
        
        this.notifyObservers('reset', null);
    }
}
