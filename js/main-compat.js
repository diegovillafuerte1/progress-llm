// Compatibility layer for main.js - exports to global scope
import { 
    jobBaseData, 
    skillBaseData, 
    itemBaseData, 
    jobCategories, 
    skillCategories, 
    itemCategories, 
    headerRowColors, 
    tooltips, 
    units 
} from '../src/data/GameData.js';

import { 
    getBaseLog, 
    applyMultipliers, 
    applySpeed, 
    daysToYears, 
    yearsToDays, 
    format, 
    formatCoins, 
    removeSpaces, 
    getKeyOfLowestValueFromDict, 
    getCategoryFromEntityName, 
    getNextEntity 
} from '../src/utils/GameUtils.js';

import { GAME_CONFIG } from '../src/config/GameConfig.js';

// Export to global scope for compatibility
window.jobBaseData = jobBaseData;
window.skillBaseData = skillBaseData;
window.itemBaseData = itemBaseData;
window.jobCategories = jobCategories;
window.skillCategories = skillCategories;
window.itemCategories = itemCategories;
window.headerRowColors = headerRowColors;
window.tooltips = tooltips;
window.units = units;

window.getBaseLog = getBaseLog;
window.applyMultipliers = applyMultipliers;
window.applySpeed = applySpeed;
window.daysToYears = daysToYears;
window.yearsToDays = yearsToDays;
window.format = format;
window.formatCoins = formatCoins;
window.removeSpaces = removeSpaces;
window.getKeyOfLowestValueFromDict = getKeyOfLowestValueFromDict;
window.getCategoryFromEntityName = getCategoryFromEntityName;
window.getNextEntity = getNextEntity;

// Export config constants
window.updateSpeed = GAME_CONFIG.UPDATE_SPEED;
window.baseLifespan = GAME_CONFIG.BASE_LIFESPAN;
window.baseGameSpeed = GAME_CONFIG.BASE_GAME_SPEED;
window.permanentUnlocks = GAME_CONFIG.PERMANENT_UNLOCKS;
