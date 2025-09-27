// Skill class - extends Task for effect generation
import { Task } from './Task.js';

export class Skill extends Task {
    constructor(baseData) {
        super(baseData)
    }

    getEffect() {
        var effect = 1 + this.baseData.effect * this.level
        return effect
    }

    getEffectDescription() {
        var description = this.baseData.description
        var text = "x" + String(this.getEffect().toFixed(2)) + " " + description
        return text
    }
}
