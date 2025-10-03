// Set up logging
var logger;
if (typeof log !== 'undefined' && log.noConflict) {
    logger = log.noConflict();
} else if (typeof log !== 'undefined') {
    logger = log;
} else {
    // Fallback to console if loglevel is not available
    logger = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
        setLevel: function() {}
    };
}
logger.setLevel('warn'); // Only show warnings and errors in production

class Task {
    constructor(baseData) {
        // Validate input data
        if (!baseData || typeof baseData !== 'object') {
            throw new Error('Task constructor requires valid baseData object')
        }
        
        if (!baseData.name || typeof baseData.name !== 'string') {
            throw new Error('Task constructor requires valid name property')
        }
        
        if (typeof baseData.maxXp !== 'number' || baseData.maxXp <= 0) {
            throw new Error('Task constructor requires valid maxXp property')
        }
        
        this.baseData = baseData
        this.name = baseData.name
        this.level = 0
        this.maxLevel = 0 
        this.xp = 0

        this.xpMultipliers = []
    }

    getMaxXp() {
        var maxXp = Math.round(this.baseData.maxXp * (this.level + 1) * Math.pow(1.01, this.level))
        return maxXp
    }

    getXpLeft() {
        return Math.round(this.getMaxXp() - this.xp)
    }

    getMaxLevelMultiplier() {
        var maxLevelMultiplier = 1 + this.maxLevel / 10
        return maxLevelMultiplier
    }

    getXpGain() {
        return applyMultipliers(10, this.xpMultipliers)
    }

    increaseXp() {
        try {
            const xpGain = this.getXpGain()
            if (typeof xpGain !== 'number' || xpGain < 0) {
                logger.warn("Invalid XP gain calculated:", xpGain)
                return
            }
            
            this.xp += applySpeed(xpGain)
            
            if (this.xp >= this.getMaxXp()) {
                var excess = this.xp - this.getMaxXp()
                while (excess >= 0) {
                    this.level += 1
                    excess -= this.getMaxXp()
                }
                this.xp = this.getMaxXp() + excess
            }
            
            // Validate state after XP increase with config limits
            if (this.level < 0 || this.level > 1000) {
                logger.warn("Invalid level after XP increase, clamping")
                this.level = Math.max(0, Math.min(1000, this.level))
            }
            
            if (this.xp < 0 || this.xp > 1000000000000) {
                logger.warn("Invalid XP after XP increase, clamping")
                this.xp = Math.max(0, Math.min(1000000000000, this.xp))
            }
            
        } catch (error) {
            if (typeof logger !== 'undefined' && logger.error) {
                logger.error("Error in increaseXp:", error)
            }
        }
    }
}

class Job extends Task {
    constructor(baseData) {
        super(baseData)
        
        // Validate job-specific properties
        if (typeof baseData.income !== 'number' || baseData.income < 0) {
            throw new Error('Job constructor requires valid income property')
        }
        
        this.incomeMultipliers = []
    }

    getLevelMultiplier() {
        var levelMultiplier = 1 + Math.log10(this.level + 1)
        return levelMultiplier
    }
    
    getIncome() {
        try {
            if (!this.incomeMultipliers || !Array.isArray(this.incomeMultipliers)) {
                logger.warn("Invalid incomeMultipliers, using base income")
                return this.baseData.income || 0
            }
            
            return applyMultipliers(this.baseData.income, this.incomeMultipliers)
        } catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error("Error in getIncome:", error)
            }
            return this.baseData.income || 0
        }
    }
}

class Skill extends Task {
    constructor(baseData) {
        super(baseData)
        
        // Validate skill-specific properties
        if (typeof baseData.effect !== 'number') {
            throw new Error('Skill constructor requires valid effect property')
        }
        
        if (!baseData.description || typeof baseData.description !== 'string') {
            throw new Error('Skill constructor requires valid description property')
        }
    }

    getEffect() {
        try {
            if (typeof this.level !== 'number' || this.level < 0) {
                console.warn("Invalid skill level:", this.level)
                return 1
            }
            
            var effect = 1 + this.baseData.effect * this.level
            return effect
        } catch (error) {
            if (typeof console !== 'undefined' && console.error) {
                console.error("Error in getEffect:", error)
            }
            return 1
        }
    }

    getEffectDescription() {
        var description = this.baseData.description
        var text = "x" + String(this.getEffect().toFixed(2)) + " " + description
        return text
    }
}

class Item {
    constructor(baseData) {  
        this.baseData = baseData
        this.name = baseData.name
        this.expenseMultipliers = [
         
        ]
    }

    getEffect() {
        if (gameData.currentProperty != this && !gameData.currentMisc.includes(this)) return 1
        var effect = this.baseData.effect
        return effect
    }

    getEffectDescription() {
        var description = this.baseData.description
        if (itemCategories["Properties"].includes(this.name)) description = "Happiness"
        var text = "x" + this.baseData.effect.toFixed(1) + " " + description
        return text
    }

    getExpense() {
        return applyMultipliers(this.baseData.expense, this.expenseMultipliers)
    }
}

class Requirement {
    constructor(elements, requirements) {
        this.elements = elements
        this.requirements = requirements
        this.completed = false
    }

    isCompleted() {
        if (this.completed) {return true}
        for (var requirement of this.requirements) {
            if (!this.getCondition(requirement)) {
                return false
            }
        }
        this.completed = true
        return true
    }
}

class TaskRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "task"
    }

    getCondition(requirement) {
        return gameData.taskData[requirement.task].level >= requirement.requirement
    }
}

class CoinRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "coins"
    }

    getCondition(requirement) {
        return gameData.coins >= requirement.requirement
    }
}

class AgeRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "age"
    }

    getCondition(requirement) {
        return daysToYears(gameData.days) >= requirement.requirement
    }
}

class EvilRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "evil"
    }

    getCondition(requirement) {
        return gameData.evil >= requirement.requirement
    }    
}