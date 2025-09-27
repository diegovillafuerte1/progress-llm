// Item class for properties and misc items
import { applyMultipliers } from '../utils/GameUtils.js';
import { itemCategories } from '../data/GameData.js';

export class Item {
    constructor(baseData) {  
        this.baseData = baseData
        this.name = baseData.name
        this.expenseMultipliers = []
    }

    getEffect(gameData) {
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
