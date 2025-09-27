// Job class - extends Task for income generation
import { Task } from './Task.js';
import { applyMultipliers } from '../utils/GameUtils.js';

export class Job extends Task {
    constructor(baseData) {
        super(baseData)   
        this.incomeMultipliers = []
    }

    getLevelMultiplier() {
        var levelMultiplier = 1 + Math.log10(this.level + 1)
        return levelMultiplier
    }
    
    getIncome() {
        return applyMultipliers(this.baseData.income, this.incomeMultipliers) 
    }
}
