// Requirement classes for game progression
import { daysToYears } from '../utils/GameUtils.js';

export class Requirement {
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

export class TaskRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "task"
    }

    getCondition(requirement, gameData) {
        return gameData.taskData[requirement.task].level >= requirement.requirement
    }
}

export class CoinRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "coins"
    }

    getCondition(requirement, gameData) {
        return gameData.coins >= requirement.requirement
    }
}

export class AgeRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "age"
    }

    getCondition(requirement, gameData) {
        return daysToYears(gameData.days) >= requirement.requirement
    }
}

export class EvilRequirement extends Requirement {
    constructor(elements, requirements) {
        super(elements, requirements)
        this.type = "evil"
    }

    getCondition(requirement, gameData) {
        return gameData.evil >= requirement.requirement
    }    
}
