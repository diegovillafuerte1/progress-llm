// UI updater for DOM manipulation and rendering
import { DOM_IDS, CSS_CLASSES } from '../config/GameConfig.js';
import { format, formatCoins, daysToYears } from '../utils/GameUtils.js';
import { itemCategories, headerRowColors } from '../data/GameData.js';

export class UIUpdater {
    constructor(gameState) {
        this.gameState = gameState;
        this.elements = this.cacheElements();
    }
    
    cacheElements() {
        return {
            // Sidebar elements
            ageDisplay: document.getElementById(DOM_IDS.AGE_DISPLAY),
            dayDisplay: document.getElementById(DOM_IDS.DAY_DISPLAY),
            lifespanDisplay: document.getElementById(DOM_IDS.LIFESPAN_DISPLAY),
            pauseButton: document.getElementById(DOM_IDS.PAUSE_BUTTON),
            coinDisplay: document.getElementById(DOM_IDS.COIN_DISPLAY),
            netDisplay: document.getElementById(DOM_IDS.NET_DISPLAY),
            incomeDisplay: document.getElementById(DOM_IDS.INCOME_DISPLAY),
            expenseDisplay: document.getElementById(DOM_IDS.EXPENSE_DISPLAY),
            happinessDisplay: document.getElementById(DOM_IDS.HAPPINESS_DISPLAY),
            evilDisplay: document.getElementById(DOM_IDS.EVIL_DISPLAY),
            evilGainDisplay: document.getElementById(DOM_IDS.EVIL_GAIN_DISPLAY),
            timeWarpingDisplay: document.getElementById(DOM_IDS.TIME_WARPING_DISPLAY),
            timeWarpingButton: document.getElementById(DOM_IDS.TIME_WARPING_BUTTON),
            quickTaskDisplay: document.getElementById(DOM_IDS.QUICK_TASK_DISPLAY),
            
            // Tab elements
            jobTabButton: document.getElementById(DOM_IDS.JOB_TAB_BUTTON),
            shopTabButton: document.getElementById(DOM_IDS.SHOP_TAB_BUTTON),
            rebirthTabButton: document.getElementById(DOM_IDS.REBIRTH_TAB_BUTTON),
            
            // Table elements
            jobTable: document.getElementById(DOM_IDS.JOB_TABLE),
            skillTable: document.getElementById(DOM_IDS.SKILL_TABLE),
            itemTable: document.getElementById(DOM_IDS.ITEM_TABLE),
            
            // Other elements
            body: document.getElementById(DOM_IDS.BODY),
            deathText: document.getElementById(DOM_IDS.DEATH_TEXT),
            importExportBox: document.getElementById(DOM_IDS.IMPORT_EXPORT_BOX),
            automation: document.getElementById(DOM_IDS.AUTOMATION),
            timeWarping: document.getElementById(DOM_IDS.TIME_WARPING),
            evilInfo: document.getElementById(DOM_IDS.EVIL_INFO),
            rebirthNote1: document.getElementById(DOM_IDS.REBIRTH_NOTE_1),
            rebirthNote2: document.getElementById(DOM_IDS.REBIRTH_NOTE_2),
            rebirthNote3: document.getElementById(DOM_IDS.REBIRTH_NOTE_3),
        };
    }
    
    updateUI() {
        try {
            this.updateTaskRows();
            this.updateItemRows();
            this.updateRequiredRows();
            this.updateHeaderRows();
            this.updateQuickTaskDisplay();
            this.hideEntities();
            this.updateText();
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }
    
    updateText() {
        // Sidebar text updates
        if (this.elements.ageDisplay) {
            this.elements.ageDisplay.textContent = daysToYears(this.gameState.getDays());
        }
        
        if (this.elements.dayDisplay) {
            this.elements.dayDisplay.textContent = this.getDay();
        }
        
        if (this.elements.lifespanDisplay) {
            this.elements.lifespanDisplay.textContent = daysToYears(this.getLifespan());
        }
        
        if (this.elements.pauseButton) {
            this.elements.pauseButton.textContent = this.gameState.paused ? "Play" : "Pause";
        }
        
        if (this.elements.coinDisplay) {
            formatCoins(this.gameState.getCoins(), this.elements.coinDisplay);
        }
        
        this.setSignDisplay();
        
        if (this.elements.netDisplay) {
            formatCoins(this.getNet(), this.elements.netDisplay);
        }
        
        if (this.elements.incomeDisplay) {
            formatCoins(this.getIncome(), this.elements.incomeDisplay);
        }
        
        if (this.elements.expenseDisplay) {
            formatCoins(this.getExpense(), this.elements.expenseDisplay);
        }
        
        if (this.elements.happinessDisplay) {
            this.elements.happinessDisplay.textContent = this.getHappiness().toFixed(1);
        }
        
        if (this.elements.evilDisplay) {
            this.elements.evilDisplay.textContent = this.gameState.getEvil().toFixed(1);
        }
        
        if (this.elements.evilGainDisplay) {
            this.elements.evilGainDisplay.textContent = this.getEvilGain().toFixed(1);
        }
        
        if (this.elements.timeWarpingDisplay) {
            const timeWarping = this.gameState.getTask("Time warping");
            const effect = (timeWarping && typeof timeWarping.getEffect === 'function') ? timeWarping.getEffect() : 1;
            this.elements.timeWarpingDisplay.textContent = "x" + effect.toFixed(2);
        }
        
        if (this.elements.timeWarpingButton) {
            this.elements.timeWarpingButton.textContent = this.gameState.timeWarpingEnabled ? 
                "Disable warp" : "Enable warp";
        }
    }
    
    setSignDisplay() {
        const signDisplay = document.getElementById("signDisplay");
        if (!signDisplay) return;
        
        const income = this.getIncome();
        const expense = this.getExpense();
        
        if (income > expense) {
            signDisplay.textContent = "+";
            signDisplay.style.color = "green";
        } else if (expense > income) {
            signDisplay.textContent = "-";
            signDisplay.style.color = "red";
        } else {
            signDisplay.textContent = "";
            signDisplay.style.color = "gray";
        }
    }
    
    updateTaskRows() {
        for (const taskName in this.gameState.taskData) {
            const task = this.gameState.taskData[taskName];
            const row = document.getElementById("row " + task.name);
            if (!row) continue;
            
            // Update level
            const levelElement = row.getElementsByClassName("level")[0];
            if (levelElement) {
                levelElement.textContent = task.level;
            }
            
            // Update XP gain
            const xpGainElement = row.getElementsByClassName("xpGain")[0];
            if (xpGainElement) {
                xpGainElement.textContent = format(task.getXpGain());
            }
            
            // Update XP left
            const xpLeftElement = row.getElementsByClassName("xpLeft")[0];
            if (xpLeftElement) {
                xpLeftElement.textContent = format(task.getXpLeft());
            }
            
            // Update max level
            const maxLevelElement = row.getElementsByClassName("maxLevel")[0];
            if (maxLevelElement) {
                maxLevelElement.textContent = task.maxLevel;
                if (this.gameState.rebirthOneCount > 0) {
                    maxLevelElement.classList.remove(CSS_CLASSES.HIDDEN);
                } else {
                    maxLevelElement.classList.add(CSS_CLASSES.HIDDEN);
                }
            }
            
            // Update progress bar
            const progressFill = row.getElementsByClassName("progressFill")[0];
            if (progressFill) {
                progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%";
                if (task === this.gameState.currentJob || task === this.gameState.currentSkill) {
                    progressFill.classList.add(CSS_CLASSES.CURRENT);
                } else {
                    progressFill.classList.remove(CSS_CLASSES.CURRENT);
                }
            }
            
            // Update value display
            const valueElement = row.getElementsByClassName("value")[0];
            if (valueElement) {
                const incomeElement = valueElement.getElementsByClassName("income")[0];
                const effectElement = valueElement.getElementsByClassName("effect")[0];
                
                if (incomeElement && effectElement) {
                    incomeElement.style.display = task.constructor.name === 'Job' ? 'block' : 'none';
                    effectElement.style.display = task.constructor.name === 'Skill' ? 'block' : 'none';
                }
                
                if (task.constructor.name === 'Job' && incomeElement) {
                    formatCoins(task.getIncome(), incomeElement);
                } else if (task.constructor.name === 'Skill' && effectElement) {
                    effectElement.textContent = task.getEffectDescription();
                }
            }
        }
    }
    
    updateItemRows() {
        for (const itemName in this.gameState.itemData) {
            const item = this.gameState.itemData[itemName];
            const row = document.getElementById("row " + item.name);
            if (!row) continue;
            
            // Update button state
            const button = row.getElementsByClassName("button")[0];
            if (button) {
                button.disabled = this.gameState.getCoins() < item.getExpense();
            }
            
            // Update active state
            const active = row.getElementsByClassName("active")[0];
            if (active) {
                const isActive = this.gameState.currentMisc.includes(item) || item === this.gameState.currentProperty;
                const color = this.getItemCategoryColor(item.name);
                active.style.backgroundColor = isActive ? color : "white";
            }
            
            // Update effect description
            const effectElement = row.getElementsByClassName("effect")[0];
            if (effectElement) {
                effectElement.textContent = item.getEffectDescription();
            }
            
            // Update expense
            const expenseElement = row.getElementsByClassName("expense")[0];
            if (expenseElement) {
                formatCoins(item.getExpense(), expenseElement);
            }
        }
    }
    
    updateRequiredRows() {
        // Implementation for required rows updates
        // This would depend on the specific requirement logic
    }
    
    updateHeaderRows() {
        // Implementation for header rows updates
        // This would depend on the specific header logic
    }
    
    updateQuickTaskDisplay() {
        if (!this.elements.quickTaskDisplay) return;
        
        // Update job display
        if (this.gameState.currentJob) {
            const jobProgressBar = this.elements.quickTaskDisplay.getElementsByClassName("job")[0];
            if (jobProgressBar) {
                const nameElement = jobProgressBar.getElementsByClassName("name")[0];
                const progressFill = jobProgressBar.getElementsByClassName("progressFill")[0];
                
                if (nameElement) {
                    nameElement.textContent = this.gameState.currentJob.name + " lvl " + this.gameState.currentJob.level;
                }
                
                if (progressFill) {
                    progressFill.style.width = this.gameState.currentJob.xp / this.gameState.currentJob.getMaxXp() * 100 + "%";
                }
            }
        }
        
        // Update skill display
        if (this.gameState.currentSkill) {
            const skillProgressBar = this.elements.quickTaskDisplay.getElementsByClassName("skill")[0];
            if (skillProgressBar) {
                const nameElement = skillProgressBar.getElementsByClassName("name")[0];
                const progressFill = skillProgressBar.getElementsByClassName("progressFill")[0];
                
                if (nameElement) {
                    nameElement.textContent = this.gameState.currentSkill.name + " lvl " + this.gameState.currentSkill.level;
                }
                
                if (progressFill) {
                    progressFill.style.width = this.gameState.currentSkill.xp / this.gameState.currentSkill.getMaxXp() * 100 + "%";
                }
            }
        }
    }
    
    hideEntities() {
        for (const reqName in this.gameState.requirements) {
            const requirement = this.gameState.requirements[reqName];
            const completed = requirement.isCompleted();
            
            for (const element of requirement.elements) {
                if (completed) {
                    element.classList.remove(CSS_CLASSES.HIDDEN);
                } else {
                    element.classList.add(CSS_CLASSES.HIDDEN);
                }
            }
        }
    }
    
    // Helper methods
    getDay() {
        return Math.floor(this.gameState.getDays() - daysToYears(this.gameState.getDays()) * 365);
    }
    
    getLifespan() {
        const immortality = this.gameState.getTask("Immortality");
        const superImmortality = this.gameState.getTask("Super immortality");
        
        const immortalityEffect = immortality ? immortality.getEffect() : 1;
        const superImmortalityEffect = superImmortality ? superImmortality.getEffect() : 1;
        
        return 365 * 70 * immortalityEffect * superImmortalityEffect;
    }
    
    getNet() {
        return Math.abs(this.getIncome() - this.getExpense());
    }
    
    getIncome() {
        if (!this.gameState.currentJob) return 0;
        return this.gameState.currentJob.getIncome();
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
    
    getHappiness() {
        const meditation = this.gameState.getTask("Meditation");
        const butler = this.gameState.getItem("Butler");
        const currentProperty = this.gameState.currentProperty;
        
        const meditationEffect = (meditation && typeof meditation.getEffect === 'function') ? meditation.getEffect() : 1;
        const butlerEffect = (butler && typeof butler.getEffect === 'function') ? butler.getEffect(this.gameState) : 1;
        const propertyEffect = (currentProperty && typeof currentProperty.getEffect === 'function') ? currentProperty.getEffect(this.gameState) : 1;
        
        return meditationEffect * butlerEffect * propertyEffect;
    }
    
    getEvilGain() {
        const evilControl = this.gameState.getTask("Evil control");
        const bloodMeditation = this.gameState.getTask("Blood meditation");
        
        const evilControlEffect = (evilControl && typeof evilControl.getEffect === 'function') ? evilControl.getEffect() : 1;
        const bloodMeditationEffect = (bloodMeditation && typeof bloodMeditation.getEffect === 'function') ? bloodMeditation.getEffect() : 1;
        
        return evilControlEffect * bloodMeditationEffect;
    }
    
    getItemCategoryColor(itemName) {
        if (itemCategories["Properties"].includes(itemName)) {
            return headerRowColors["Properties"];
        } else {
            return headerRowColors["Misc"];
        }
    }
    
    // Tab management
    setTab(element, selectedTab) {
        const tabs = Array.prototype.slice.call(document.getElementsByClassName(CSS_CLASSES.TAB));
        tabs.forEach(tab => {
            tab.style.display = "none";
        });
        
        const selectedTabElement = document.getElementById(selectedTab);
        if (selectedTabElement) {
            selectedTabElement.style.display = "block";
        }
        
        const tabButtons = document.getElementsByClassName(CSS_CLASSES.TAB_BUTTON);
        for (const tabButton of tabButtons) {
            tabButton.classList.remove(CSS_CLASSES.W3_BLUE_GRAY);
        }
        
        if (element) {
            element.classList.add(CSS_CLASSES.W3_BLUE_GRAY);
        }
    }
    
    // Cleanup
    destroy() {
        this.elements = null;
        this.gameState = null;
    }
}
