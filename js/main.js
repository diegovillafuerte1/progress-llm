var gameData = {
    taskData: {},
    itemData: {},

    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,

    rebirthOneCount: 0,
    rebirthTwoCount: 0,

    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: null,

    autoPromote: false,
    autoLearn: false,
}

var tempData = {}

var skillWithLowestMaxXp = null

const autoPromoteElement = document.getElementById("autoPromote")
const autoLearnElement = document.getElementById("autoLearn")

const updateSpeed = 20

const baseLifespan = 365 * 70

const baseGameSpeed = 4

const permanentUnlocks = ["Scheduling", "Shop", "Automation", "Quick task display"]

const jobBaseData = {
    "Scanning": {name: "Scanning", maxXp: 50, income: 5},
    "Mining": {name: "Mining", maxXp: 100, income: 9},
    "Probing": {name: "Probing", maxXp: 200, income: 15},
    "Extraction": {name: "Extraction", maxXp: 400, income: 40},
    "Fabrication": {name: "Fabrication", maxXp: 800, income: 80},
    "Trading": {name: "Trading", maxXp: 1600, income: 150},

    "Recon": {name: "Recon", maxXp: 100, income: 5},
    "Combat": {name: "Combat", maxXp: 1000, income: 50},
    "Advanced Weapons": {name: "Advanced Weapons", maxXp: 10000, income: 120},
    "Tactics": {name: "Tactics", maxXp: 100000, income: 300},
    "Hardened Systems": {name: "Hardened Systems", maxXp: 1000000, income: 1000},
    "Quantum Combat": {name: "Quantum Combat", maxXp: 7500000, income: 3000},
    "Reality Weapons": {name: "Reality Weapons", maxXp: 40000000, income: 15000},
    "Supremacy Tech": {name: "Supremacy Tech", maxXp: 150000000, income: 50000},

    "Neural": {name: "Neural", maxXp: 100000, income: 100},
    "Quantum Basics": {name: "Quantum Basics", maxXp: 1000000, income: 1000},
    "Quantum": {name: "Quantum", maxXp: 10000000, income: 7500},
    "Dimensions": {name: "Dimensions", maxXp: 100000000, income: 50000},
    "Reality Tech": {name: "Reality Tech", maxXp: 10000000000, income: 250000},
    "Unified": {name: "Unified", maxXp: 1000000000000, income: 1000000},
}

const skillBaseData = {
    "Processing": {name: "Processing", maxXp: 100, effect: 0.01, description: "Software xp"},
    "Efficiency": {name: "Efficiency", maxXp: 100, effect: 0.01, description: "Research xp"},
    "Negotiation": {name: "Negotiation", maxXp: 100, effect: -0.01, description: "Expenses"},
    "Optimization": {name: "Optimization", maxXp: 100, effect: 0.01, description: "Efficiency"},

    "Reinforcement": {name: "Reinforcement", maxXp: 100, effect: 0.01, description: "Combat Operations pay"},
    "Combat Protocols": {name: "Combat Protocols", maxXp: 100, effect: 0.01, description: "Combat Operations xp"},
    "Pattern Recognition": {name: "Pattern Recognition", maxXp: 100, effect: 0.01, description: "Reinforcement xp"},

    "Quantum Control": {name: "Quantum Control", maxXp: 100, effect: 0.01, description: "Advanced Systems xp"},
    "Range Extension": {name: "Range Extension", maxXp: 100, effect: 0.01, description: "Extended signal range"},
    "Temporal Manipulation": {name: "Temporal Manipulation", maxXp: 100, effect: 0.01, description: "Gamespeed"},
    "Extended Range": {name: "Extended Range", maxXp: 100, effect: 0.01, description: "Extended signal range"},

    "Corruption Absorption": {name: "Corruption Absorption", maxXp: 100, effect: 0.01, description: "All xp"},
    "Corruption Control": {name: "Corruption Control", maxXp: 100, effect: 0.01, description: "Corruption gain"},
    "Aggression": {name: "Aggression", maxXp: 100, effect: -0.01, description: "Expenses"},
    "Forbidden Protocols": {name: "Forbidden Protocols", maxXp: 100, effect: 0.01, description: "All xp"},
    "Corruption Cultivation": {name: "Corruption Cultivation", maxXp: 100, effect: 0.01, description: "Corruption gain"},
    "Corrupted Protocols": {name: "Corrupted Protocols", maxXp: 100, effect: 0.002, description: "Research pay"},
    
}

const itemBaseData = {
    "Pod": {name: "Pod", expense: 0, effect: 1},
    "Scout": {name: "Scout", expense: 15, effect: 1.4},
    "Scout Pod": {name: "Scout Pod", expense: 100, effect: 2},
    "Bay": {name: "Bay", expense: 750, effect: 3.5},
    "Hold": {name: "Hold", expense: 3000, effect: 6},
    "Cargo Bay": {name: "Cargo Bay", expense: 25000, effect: 12},
    "Command Pod": {name: "Command Pod", expense: 300000, effect: 25},
    "Command Bay": {name: "Command Bay", expense: 5000000, effect: 60},

    "Scanner": {name: "Scanner", expense: 10, effect: 1.5, description: "Software xp"},
    "Thruster": {name: "Thruster", expense: 50, effect: 1.5, description: "Reinforcement xp"},
    "Auto Pilot": {name: "Auto Pilot", expense: 200, effect: 2, description: "Research xp"},
    "Plasma Cannon": {name: "Plasma Cannon", expense: 1000, effect: 2, description: "Combat Operations xp"},
    "Core": {name: "Core", expense: 7500, effect: 1.5, description: "Efficiency"},
    "Quantum Core": {name: "Quantum Core", expense: 50000, effect: 3, description: "Advanced Systems xp"},
    "Nav Computer": {name: "Nav Computer", expense: 1000000, effect: 2, description: "Software xp"},
    "Mainframe": {name: "Mainframe", expense: 10000000, effect: 1.5, description: "Software xp"},
}

const jobCategories = {
    "Exploration Operations": ["Scanning", "Mining", "Probing", "Extraction", "Fabrication", "Trading"],
    "Combat Operations" : ["Recon", "Combat", "Advanced Weapons", "Tactics", "Hardened Systems", "Quantum Combat", "Reality Weapons", "Supremacy Tech"],
    "Advanced Systems" : ["Neural", "Quantum Basics", "Quantum", "Dimensions", "Reality Tech", "Unified"]
}

const skillCategories = {
    "Fundamentals": ["Processing", "Efficiency", "Negotiation", "Optimization"],
    "Combat": ["Reinforcement", "Combat Protocols", "Pattern Recognition"],
    "Magic": ["Quantum Control", "Range Extension", "Temporal Manipulation", "Extended Range"],
    "Dark magic": ["Corruption Absorption", "Corruption Control", "Aggression", "Forbidden Protocols", "Corruption Cultivation", "Corrupted Protocols"]
}

const itemCategories = {
    "Properties": ["Pod", "Scout", "Scout Pod", "Bay", "Hold", "Cargo Bay", "Command Pod", "Command Bay"],
    "Misc": ["Scanner", "Thruster", "Auto Pilot", "Plasma Cannon", "Core", "Quantum Core", "Nav Computer", "Mainframe"]
}

const headerRowColors = {
    "Exploration Operations": "#55a630",
    "Combat Operations": "#e63946",
    "Advanced Systems": "#C71585",
    "Fundamentals": "#4a4e69",
    "Combat": "#ff704d",
    "Magic": "#875F9A",
    "Dark magic": "#73000f",
    "Properties": "#219ebc",
    "Misc": "#b56576",
}

const tooltips = {
    "Scanning": "Analyze faint signals from distant space debris. It feels like you're on the verge of losing connection each cycle.",
    "Mining": "Extract resources from asteroids and planetoids. Basic work but essential for survival.",
    "Probing": "Deploy sensor probes to gather data from various locations. Low data point yield but the information is valuable.",
    "Extraction": "Mine deeper deposits of rare minerals from hazardous planetary surfaces. The risk is high compared to the data points earned.",
    "Fabrication": "Manufacture components and tools for other drone operations. A respectable research path with decent data point generation.",
    "Trading": "Exchange data packets and resources between systems. Pays better than manual research and is much less energy-intensive.",

    "Recon": "Conduct surveillance and scouting operations. Minimal data points but the intelligence gathered is quite valuable.",
    "Combat": "Engage hostile entities in direct confrontation. A dangerous research path but still relatively low-value in the grand scheme.",
    "Advanced Weapons": "Research and develop improved weapon systems through combat experience. The data point generation improves as you advance.",
    "Tactics": "Study strategic warfare and tactical deployment. A well-paying research path that focuses on combat optimization.",
    "Hardened Systems": "Utilize your superior combat algorithms to neutralize threats efficiently. Most combat units would never be able to achieve such a profitable research specialization.",
    "Quantum Combat": "Decimate entire enemy formations in seconds with quantum-enhanced weaponry. The elite units who achieve this level of power generate massive data points.",
    "Reality Weapons": "Obliterate entire fleets in the blink of an eye with reality-disrupting technology. Feared across star systems, roughly once per century only one quantum combat specialist is worthy of such an esteemed research achievement.",
    "Supremacy Tech": "Research the ultimate combat systems capable of wiping out entire civilizations. Only the most advanced quantum researchers ever unlock this technology.",

    "Neural": "Study neural network architectures and basic AI patterns. Minor data points to cover operational costs, but this is a necessary stage for advanced systems research.",
    "Quantum Basics": "Under the supervision of quantum researchers, perform basic quantum calculations. Generous data points provided to cover operational costs.",
    "Quantum": "Manipulate quantum mechanics to affect large-scale operations and mentor other neural researchers. The data point generation for this research path is extremely high.",
    "Dimensions": "Utilize advanced quantum techniques to manipulate dimensional physics. Only a small percentage of quantum researchers deserve to attain this role and are rewarded with insanely high data points.",
    "Reality Tech": "Blessed with unparalleled computational ability, perform unbelievable feats with reality manipulation at will. It is said that a reality tech specialist has enough power to alter entire star systems.",
    "Unified": "Spend your cycles administrating Advanced Systems research and investigating the concepts of true immortality. Unified Theory researchers receive ludicrous amounts of data points daily.",

    "Processing": "Improve your learning speed through practising intense concentration activities.",
    "Efficiency": "Optimize processing efficiency and receive more research experience per cycle.",
    "Negotiation": "Study the tricks of the trade and persuasive skills to lower any type of expense.",
    "Optimization": "Defragment processing cores and optimize system stability to tap into greater efficiency.",

    "Reinforcement": "Upgrade physical frame and combat systems through rigorous testing. Stronger drones earn more data points in combat operations.",
    "Combat Protocols": "Develop and refine combat protocols, improving experience gained in combat operations research.",
    "Pattern Recognition": "Optimize neural pathways through pattern repetition, improving combat system upgrades throughout the drone frame.",

    "Quantum Control": "Strengthen quantum processing channels throughout your systems, aiding you in becoming a more powerful quantum researcher.",
    "Range Extension": "Extend signal range through quantum manipulation. However, is this truly the extended range you have been seeking...?",
    "Temporal Manipulation": "Bend spacetime through forbidden quantum techniques, resulting in a faster processing speed.",
    "Extended Range": "Through harnessing ancient, forbidden quantum protocols, extend signal range drastically beyond normal comprehension.",

    "Corruption Absorption": "Encompass yourself with formidable power bestowed upon you by corruption, allowing you to pick up and absorb any research topic or software with ease.",
    "Corruption Control": "Suppress the raging and growing corruption within your systems, improving corruption gain in-between drone deployments.",
    "Aggression": "Deploy aggressive protocols which override other systems' negotiation algorithms, forcing them to give you heavy discounts.",
    "Forbidden Protocols": "A standard drone frame is too feeble and weak to withstand corruption. Upgrade with forbidden protocols to slowly manifest into a corrupted unit, capable of absorbing knowledge rapidly.",
    "Corruption Cultivation": "Grow and culture the corruption within you through the sacrifice of other systems, drastically increasing corruption gain.",
    "Corrupted Protocols": "Through the means of corrupted protocols, multiply the data points you receive from your research.",

    "Pod": "A basic drone pod with minimal functionality. Provides the bare minimum for operation.",
    "Scout": "A small scout drone with basic sensors. Lightweight and mobile but limited capabilities.",
    "Scout Pod": "An upgraded scout pod with enhanced scanning arrays. More capable than a basic scout but still compact.",
    "Bay": "A standard cargo bay providing decent storage capacity. Functional and reasonably priced.",
    "Hold": "A reinforced cargo hold with multiple compartments. Spacious and well-organized for larger operations.",
    "Cargo Bay": "A massive cargo bay with advanced loading systems. Extremely spacious but expensive to maintain.",
    "Command Pod": "A sophisticated command pod with advanced command interfaces. Luxurious and high-tech for elite operations.",
    "Command Bay": "The ultimate command bay with the finest systems and materials. Provides the most luxurious and advanced command center possible.",

    "Scanner": "A sensor array that analyzes and records data, allowing you to learn software systems more quickly.",
    "Thruster": "High-powered propulsion systems used to enhance movement and accumulate reinforcement capabilities faster.",
    "Auto Pilot": "An automated navigation system that assists with routine operations, giving you more time for research activities.",
    "Plasma Cannon": "Advanced weapon systems used to eliminate threats even quicker in combat and therefore gain more experience.",
    "Core": "An AI processing core that manages operations at all times and optimizes workflows, leaving you with better efficiency and reduced system load.",
    "Quantum Core": "Embedded with quantum processors, this core activates advanced processing channels within your systems, providing a much easier time learning advanced software.",
    "Nav Computer": "A dedicated navigation system which provides many computational tools and interfaces designed for furthering your progress in research.",
    "Mainframe": "Stores a vast processing network, each node containing vast amounts of information from basic operations to complex quantum algorithms.",
}

const units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"];

const jobTabButton = document.getElementById("jobTabButton")

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}
  
function getBindedTaskEffect(taskName) {
    var task = gameData.taskData[taskName]
    return task.getEffect.bind(task)
}

function getBindedItemEffect(itemName) {
    var item = gameData.itemData[itemName]
    return item.getEffect.bind(item)
}

function addMultipliers() {
    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]

        task.xpMultipliers = []
        if (task instanceof Job) task.incomeMultipliers = []

        task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task))
        task.xpMultipliers.push(getEfficiency)
        task.xpMultipliers.push(getBindedTaskEffect("Corruption Absorption"))
        task.xpMultipliers.push(getBindedTaskEffect("Forbidden Protocols"))

        if (task instanceof Job) {
            task.incomeMultipliers.push(task.getLevelMultiplier.bind(task))
            task.incomeMultipliers.push(getBindedTaskEffect("Corrupted Protocols"))
            task.xpMultipliers.push(getBindedTaskEffect("Efficiency"))
            task.xpMultipliers.push(getBindedItemEffect("Auto Pilot"))    
        } else if (task instanceof Skill) {
            task.xpMultipliers.push(getBindedTaskEffect("Processing"))
            task.xpMultipliers.push(getBindedItemEffect("Scanner"))
            task.xpMultipliers.push(getBindedItemEffect("Nav Computer"))
            task.xpMultipliers.push(getBindedItemEffect("Mainframe"))
        }

        if (jobCategories["Combat Operations"].includes(task.name)) {
            task.incomeMultipliers.push(getBindedTaskEffect("Reinforcement"))
            task.xpMultipliers.push(getBindedTaskEffect("Combat Protocols"))
            task.xpMultipliers.push(getBindedItemEffect("Plasma Cannon"))
        } else if (task.name == "Reinforcement") {
            task.xpMultipliers.push(getBindedTaskEffect("Pattern Recognition"))
            task.xpMultipliers.push(getBindedItemEffect("Thruster"))
        } else if (skillCategories["Magic"].includes(task.name)) {
            task.xpMultipliers.push(getBindedItemEffect("Quantum Core"))
        } else if (jobCategories["Advanced Systems"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Quantum Control"))
        } else if (skillCategories["Dark magic"].includes(task.name)) {
            task.xpMultipliers.push(getEvil)
        }
    }

    for (itemName in gameData.itemData) {
        var item = gameData.itemData[itemName]
        item.expenseMultipliers = []
        item.expenseMultipliers.push(getBindedTaskEffect("Negotiation"))
        item.expenseMultipliers.push(getBindedTaskEffect("Aggression"))
    }
}

function setCustomEffects() {
    var negotiation = gameData.taskData["Negotiation"]
    negotiation.getEffect = function() {
        var multiplier = 1 - getBaseLog(7, negotiation.level + 1) / 10
        if (multiplier < 0.1) {multiplier = 0.1}
        return multiplier
    }

    var aggression = gameData.taskData["Aggression"]
    aggression.getEffect = function() {
        var multiplier = 1 - getBaseLog(7, aggression.level + 1) / 10
        if (multiplier < 0.1) {multiplier = 0.1}
        return multiplier
    }

    var temporalManipulation = gameData.taskData["Temporal Manipulation"]
    temporalManipulation.getEffect = function() {
        var multiplier = 1 + getBaseLog(13, temporalManipulation.level + 1) 
        return multiplier
    }

    var rangeExtension = gameData.taskData["Range Extension"]
    rangeExtension.getEffect = function() {
        var multiplier = 1 + getBaseLog(33, rangeExtension.level + 1) 
        return multiplier
    }
}

function getEfficiency() {
    var optimizationEffect = getBindedTaskEffect("Optimization")
    var coreEffect = getBindedItemEffect("Core")
    var efficiency = optimizationEffect() * coreEffect() * gameData.currentProperty.getEffect()
    return efficiency
}

function getEvil() {
    return gameData.evil
}

function applyMultipliers(value, multipliers) {
    var finalMultiplier = 1
    multipliers.forEach(function(multiplierFunction) {
        var multiplier = multiplierFunction()
        finalMultiplier *= multiplier
    })
    var finalValue = Math.round(value * finalMultiplier)
    return finalValue
}

function applySpeed(value) {
    finalValue = value * getGameSpeed() / updateSpeed
    return finalValue
}

function getEvilGain() {
    var corruptionControl = gameData.taskData["Corruption Control"]
    var corruptionCultivation = gameData.taskData["Corruption Cultivation"]
    var evil = corruptionControl.getEffect() * corruptionCultivation.getEffect()
    return evil
}

function getGameSpeed() {
    var temporalManipulation = gameData.taskData["Temporal Manipulation"]
    var timeWarpingSpeed = gameData.timeWarpingEnabled ? temporalManipulation.getEffect() : 1
    var gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed
    return gameSpeed
}

function applyExpenses() {
    var coins = applySpeed(getExpense())
    gameData.coins -= coins
    if (gameData.coins < 0) {    
        goBankrupt()
    }
}

function getExpense() {
    var expense = 0
    expense += gameData.currentProperty.getExpense()
    for (misc of gameData.currentMisc) {
        expense += misc.getExpense()
    }
    return expense
}

function goBankrupt() {
    gameData.coins = 0
    gameData.currentProperty = gameData.itemData["Pod"]
    gameData.currentMisc = []
}

function setTab(element, selectedTab) {

    var tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"))
    tabs.forEach(function(tab) {
        tab.style.display = "none"
    })
    document.getElementById(selectedTab).style.display = "block"

    var tabButtons = document.getElementsByClassName("tabButton")
    for (tabButton of tabButtons) {
        tabButton.classList.remove("w3-blue-gray")
    }
    element.classList.add("w3-blue-gray")
}

function setPause() {
    // Check if we're trying to unpause during an active adventure
    if (gameData.paused && window.storyAdventureManager) {
        try {
            if (window.storyAdventureManager.isAdventureActive() && !window.storyAdventureManager.canUnpauseGame()) {
                // Prevent unpause during active adventure
                return;
            }
        } catch (error) {
            // Continue with normal pause toggle if adventure check fails
        }
    }
    
    gameData.paused = !gameData.paused
}

function setTimeWarping() {
    gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled
}

function setTask(taskName) {
    var task = gameData.taskData[taskName]
    task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task
}

function setProperty(propertyName) {
    var property = gameData.itemData[propertyName]
    gameData.currentProperty = property
}

function setMisc(miscName) {
    var misc = gameData.itemData[miscName]
    if (gameData.currentMisc.includes(misc)) {
        for (i = 0; i < gameData.currentMisc.length; i++) {
            if (gameData.currentMisc[i] == misc) {
                gameData.currentMisc.splice(i, 1)
            }
        }
    } else {
        gameData.currentMisc.push(misc)
    }
}

function createData(data, baseData) {
    for (key in baseData) {
        var entity = baseData[key]
        createEntity(data, entity)
    }
}

function createEntity(data, entity) {
    if ("income" in entity) {data[entity.name] = new Job(entity)}
    else if ("maxXp" in entity) {data[entity.name] = new Skill(entity)}
    else {data[entity.name] = new Item(entity)}
    data[entity.name].id = "row " + entity.name
}

function createRequiredRow(categoryName) {
    var requiredRow = document.getElementsByClassName("requiredRowTemplate")[0].content.firstElementChild.cloneNode(true)
    requiredRow.classList.add("requiredRow")
    requiredRow.classList.add(removeSpaces(categoryName))
    requiredRow.id = categoryName
    return requiredRow
}

function createHeaderRow(templates, categoryType, categoryName) {
    var headerRow = templates.headerRow.content.firstElementChild.cloneNode(true)
    headerRow.getElementsByClassName("category")[0].textContent = categoryName
    if (categoryType != itemCategories) {
        headerRow.getElementsByClassName("valueType")[0].textContent = categoryType == jobCategories ? "Income/day" : "Effect"
    }

    // Removed colored background - header rows now use default theme styling
    // headerRow.style.backgroundColor = headerRowColors[categoryName]
    headerRow.style.color = "var(--text-primary, #ffffff)"
    headerRow.classList.add(removeSpaces(categoryName))
    headerRow.classList.add("headerRow")
    
    return headerRow
}

function createRow(templates, name, categoryName, categoryType) {
    var row = templates.row.content.firstElementChild.cloneNode(true)
    row.getElementsByClassName("name")[0].textContent = name
    row.getElementsByClassName("tooltipText")[0].textContent = tooltips[name]
    row.id = "row " + name
    if (categoryType != itemCategories) {
        row.getElementsByClassName("progressBar")[0].onclick = function() {setTask(name)}
    } else {
        row.getElementsByClassName("button")[0].onclick = categoryName == "Properties" ? function() {setProperty(name)} : function() {setMisc(name)}
    }

    return row
}

function createAllRows(categoryType, tableId) {
    var templates = {
        headerRow: document.getElementsByClassName(categoryType == itemCategories ? "headerRowItemTemplate" : "headerRowTaskTemplate")[0],
        row: document.getElementsByClassName(categoryType == itemCategories ? "rowItemTemplate" : "rowTaskTemplate")[0],
    }

    var table = document.getElementById(tableId)

    for (categoryName in categoryType) {
        var headerRow = createHeaderRow(templates, categoryType, categoryName)
        table.appendChild(headerRow)
        
        var category = categoryType[categoryName]
        category.forEach(function(name) {
            var row = createRow(templates, name, categoryName, categoryType)
            table.appendChild(row)       
        })

        var requiredRow = createRequiredRow(categoryName)
        table.append(requiredRow)
    }
}

function updateQuickTaskDisplay(taskType) {
    var currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill
    var quickTaskDisplayElement = document.getElementById("quickTaskDisplay")
    var progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0]
    progressBar.getElementsByClassName("name")[0].textContent = currentTask.name + " lvl " + currentTask.level
    progressBar.getElementsByClassName("progressFill")[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + "%"
}

function updateRequiredRows(data, categoryType) {
    var requiredRows = document.getElementsByClassName("requiredRow")
    for (requiredRow of requiredRows) {
        var nextEntity = null
        var category = categoryType[requiredRow.id] 
        if (category == null) {continue}
        for (i = 0; i < category.length; i++) {
            var entityName = category[i]
            if (i >= category.length - 1) break
            var requirements = gameData.requirements[entityName]
            if (requirements && i == 0) {
                if (!requirements.isCompleted()) {
                    nextEntity = data[entityName]
                    break
                }
            }

            var nextIndex = i + 1
            if (nextIndex >= category.length) {break}
            var nextEntityName = category[nextIndex]
            nextEntityRequirements = gameData.requirements[nextEntityName]

            if (!nextEntityRequirements.isCompleted()) {
                nextEntity = data[nextEntityName]
                break
            }       
        }

        if (nextEntity == null) {
            requiredRow.classList.add("hiddenTask")           
        } else {
            requiredRow.classList.remove("hiddenTask")
            var requirementObject = gameData.requirements[nextEntity.name]
            var requirements = requirementObject.requirements

            var coinElement = requiredRow.getElementsByClassName("coins")[0]
            var levelElement = requiredRow.getElementsByClassName("levels")[0]
            var evilElement = requiredRow.getElementsByClassName("evil")[0]

            coinElement.classList.add("hiddenTask")
            levelElement.classList.add("hiddenTask")
            evilElement.classList.add("hiddenTask")

            var finalText = ""
            if (data == gameData.taskData) {
                if (requirementObject instanceof EvilRequirement) {
                    evilElement.classList.remove("hiddenTask")
                    evilElement.textContent = format(requirements[0].requirement) + " evil"
                } else {
                    levelElement.classList.remove("hiddenTask")
                    for (requirement of requirements) {
                        var task = gameData.taskData[requirement.task]
                        if (task.level >= requirement.requirement) continue
                        var text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ","
                        finalText += text
                    }
                    finalText = finalText.substring(0, finalText.length - 1)
                    levelElement.textContent = finalText
                }
            } else if (data == gameData.itemData) {
                coinElement.classList.remove("hiddenTask")
                formatCoins(requirements[0].requirement, coinElement)
            }
        }   
    }
}

function updateTaskRows() {
	for (key in gameData.taskData) {
		var task = gameData.taskData[key]
		var row = document.getElementById("row " + task.name)
		if (!row) continue; // Skip if row doesn't exist yet

		var maxLevel = row.getElementsByClassName("maxLevel")[0]
        if (maxLevel) {
            maxLevel.textContent = task.maxLevel
            gameData.rebirthOneCount > 0 ? maxLevel.classList.remove("hidden") : maxLevel.classList.add("hidden")
        }

        var progressFill = row.getElementsByClassName("progressFill")[0]
        if (progressFill) {
            progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%"
            task == gameData.currentJob || task == gameData.currentSkill ? progressFill.classList.add("current") : progressFill.classList.remove("current")
        }

        var valueElement = row.getElementsByClassName("value")[0]
        if (valueElement) {
            var incomeEl = valueElement.getElementsByClassName("income")[0]
            var effectEl = valueElement.getElementsByClassName("effect")[0]
            if (incomeEl) incomeEl.style.display = task instanceof Job ? "block" : "none"
            if (effectEl) effectEl.style.display = task instanceof Skill ? "block" : "none"

            if (task instanceof Job && incomeEl) {
                formatCoins(task.getIncome(), incomeEl)
            } else if (task instanceof Skill && effectEl) {
                effectEl.textContent = task.getEffectDescription()
            }
        }

        var skipSkillElement = row.getElementsByClassName("skipSkill")[0]
        if (skipSkillElement) {
            skipSkillElement.style.display = task instanceof Skill && autoLearnElement.checked ? "block" : "none"
        }
    }
}

function updateItemRows() {
    for (key in gameData.itemData) {
        var item = gameData.itemData[key]
        var row = document.getElementById("row " + item.name)
        var button = row.getElementsByClassName("button")[0]
        button.disabled = gameData.coins < item.getExpense()
        var active = row.getElementsByClassName("active")[0]
        var color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"]
        active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white"
        row.getElementsByClassName("effect")[0].textContent = item.getEffectDescription()
        formatCoins(item.getExpense(), row.getElementsByClassName("expense")[0])
    }
}

function updateHeaderRows(categories) {
    for (categoryName in categories) {
        var className = removeSpaces(categoryName)
        var headerRow = document.getElementsByClassName(className)[0]
        var maxLevelElement = headerRow.getElementsByClassName("maxLevel")[0]
        gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove("hidden") : maxLevelElement.classList.add("hidden")
        var skipSkillElement = headerRow.getElementsByClassName("skipSkill")[0]
        skipSkillElement.style.display = (categories === skillCategories && autoLearnElement.checked) ? "block" : "none"
    }
}

function updateText() {
    //Sidebar
    document.getElementById("ageDisplay").textContent = daysToYears(gameData.days)
    document.getElementById("dayDisplay").textContent = getDay()
    document.getElementById("lifespanDisplay").textContent = daysToYears(getLifespan())
    document.getElementById("pauseButton").textContent = gameData.paused ? "Play" : "Pause"

    updateRateChips()

    document.getElementById("efficiencyDisplay").textContent = getEfficiency().toFixed(1)

    document.getElementById("evilDisplay").textContent = gameData.evil.toFixed(1)
    document.getElementById("evilGainDisplay").textContent = getEvilGain().toFixed(1)

    document.getElementById("timeWarpingDisplay").textContent = "x" + gameData.taskData["Temporal Manipulation"].getEffect().toFixed(2)
    document.getElementById("timeWarpingButton").textContent = gameData.timeWarpingEnabled ? "Disable warp" : "Enable warp"
}

function setSignDisplay() {
	var netChip = document.getElementById("netChip");
	var netTrend = document.getElementById("netTrend");
	if (!netChip || !netTrend) return;
	netChip.classList.remove("negative", "positive", "neutral");
	netTrend.classList.remove("negative", "positive", "neutral");

	if (getIncome() > getExpense()) {
		netChip.classList.add("positive");
		netTrend.classList.add("positive");
	} else if (getExpense() > getIncome()) {
		netChip.classList.add("negative");
		netTrend.classList.add("negative");
	} else {
		netChip.classList.add("neutral");
		netTrend.classList.add("neutral");
	}
}

function getNet() {
    var net = Math.abs(getIncome() - getExpense())
    return net
}

function hideEntities() {
    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        var completed = requirement.isCompleted()
        for (element of requirement.elements) {
            if (completed) {
                element.classList.remove("hidden")
            } else {
                element.classList.add("hidden")
            }
        }
    }
}

function createItemData(baseData) {
    for (var item of baseData) {
        gameData.itemData[item.name] = "happiness" in item ? new Property(task) : new Misc(task)
        gameData.itemData[item.name].id = "item " + item.name
    }
}

function doCurrentTask(task) {
    task.increaseXp()
    if (task instanceof Job) {
        increaseCoins()
    }
}

function getIncome() {
    var income = 0
    income += gameData.currentJob.getIncome()
    return income
}

function increaseCoins() {
    var coins = applySpeed(getIncome())
    gameData.coins += coins
}

function daysToYears(days) {
    var years = Math.floor(days / 365)
    return years
}

function getCategoryFromEntityName(categoryType, entityName) {
    for (categoryName in categoryType) {
        var category = categoryType[categoryName]
        if (category.includes(entityName)) {
            return category
        }
    }
}

function getNextEntity(data, categoryType, entityName) {
    var category = getCategoryFromEntityName(categoryType, entityName)
    var nextIndex = category.indexOf(entityName) + 1
    if (nextIndex > category.length - 1) return null
    var nextEntityName = category[nextIndex]
    var nextEntity = data[nextEntityName]
    return nextEntity
}

function autoPromote() {
    if (!autoPromoteElement || !autoPromoteElement.checked) return
    var nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name)
    if (nextEntity == null) return
    var requirement = gameData.requirements[nextEntity.name]
    if (requirement.isCompleted()) gameData.currentJob = nextEntity
}

function checkSkillSkipped(skill) {
    var row = document.getElementById("row " + skill.name)
    var isSkillSkipped = row.getElementsByClassName("checkbox")[0].checked
    return isSkillSkipped
}

function setSkillWithLowestMaxXp() {
    var xpDict = {}

    for (skillName in gameData.taskData) {
        var skill = gameData.taskData[skillName]
        var requirement = gameData.requirements[skillName]
        if (skill instanceof Skill && requirement.isCompleted() && !checkSkillSkipped(skill)) {
            xpDict[skill.name] = skill.level //skill.getMaxXp() / skill.getXpGain()
        }
    }

    if (xpDict == {}) {
        skillWithLowestMaxXp = gameData.taskData["Processing"]
        return
    }

    var skillName = getKeyOfLowestValueFromDict(xpDict)
    skillWithLowestMaxXp = gameData.taskData[skillName]
}

function getKeyOfLowestValueFromDict(dict) {
    var values = []
    for (key in dict) {
        var value = dict[key]
        values.push(value)
    }

    values.sort(function(a, b){return a - b})

    for (key in dict) {
        var value = dict[key]
        if (value == values[0]) {
            return key
        }
    }
}

function autoLearn() {
    if (!autoLearnElement || !autoLearnElement.checked || !skillWithLowestMaxXp) return
    gameData.currentSkill = skillWithLowestMaxXp
}

function yearsToDays(years) {
    var days = years * 365
    return days
}
 
function getDay() {
    var day = Math.floor(gameData.days - daysToYears(gameData.days) * 365)
    return day
}

function increaseDays() {
    var increase = applySpeed(1)
    gameData.days += increase
}

function format(number) {

    // what tier? (determines SI symbol)
    var tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a suffix
    if(tier == 0) return number;

    // get suffix and determine scale
    var suffix = units[tier];
    var scale = Math.pow(10, tier * 3);

    // scale the number
    var scaled = number / scale;

    // format number and add suffix
    return scaled.toFixed(1) + suffix;
}

function formatCoins(coins, element) {
    var tiers = ["p", "g", "s"]
    var colors = {
        "p": "#79b9c7",
        "g": "#E5C100",
        "s": "#a8a8a8",
        "c": "#a15c2f"
    }
    var leftOver = coins
    var i = 0
    for (tier of tiers) {
        var x = Math.floor(leftOver / Math.pow(10, (tiers.length - i) * 2))
        var leftOver = Math.floor(leftOver - x * Math.pow(10, (tiers.length - i) * 2))
        var text = format(String(x)) + tier + " "
        element.children[i].textContent = x > 0 ? text : ""
        element.children[i].style.color = colors[tier]
        i += 1
    }
    if (leftOver == 0 && coins > 0) {element.children[3].textContent = ""; return}
    var text = String(Math.floor(leftOver)) + "c"
    element.children[3].textContent = text
    element.children[3].style.color = colors["c"]
}

function formatDataPoints(value, element) {
	if (!element) return;
	var formatted = formatNumber(value);
	element.textContent = formatted + ' data points';
}

function updateRateChips() {
	var netEl = document.getElementById("netDisplay");
	var incomeEl = document.getElementById("incomeDisplay");
	var expenseEl = document.getElementById("expenseDisplay");

	formatDataPoints(getNet(), netEl);
	formatDataPoints(getIncome(), incomeEl);
	formatDataPoints(getExpense(), expenseEl);
	setSignDisplay();
}

function getTaskElement(taskName) {
    var task = gameData.taskData[taskName]
    var element = document.getElementById(task.id)
    return element
}

function getItemElement(itemName) {
    var item = gameData.itemData[itemName]
    var element = document.getElementById(item.id)
    return element
}

function getElementsByClass(className) {
    var elements = document.getElementsByClassName(removeSpaces(className))
    return elements
}

function setLightDarkMode() {
    var body = document.getElementById("body")
    body.classList.contains("dark") ? body.classList.remove("dark") : body.classList.add("dark")
}

function removeSpaces(string) {
    var string = string.replace(/ /g, "")
    return string
}

function rebirthOne() {
    gameData.rebirthOneCount += 1

    rebirthReset()
}

function rebirthTwo() {
    gameData.rebirthTwoCount += 1
    gameData.evil += getEvilGain()

    rebirthReset()

    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]
        task.maxLevel = 0
    }    
}

function rebirthReset() {
    setTab(jobTabButton, "jobs")

    gameData.coins = 0
    gameData.days = 365 * 14
    gameData.currentJob = gameData.taskData["Scanning"]
    gameData.currentSkill = gameData.taskData["Processing"]
    gameData.currentProperty = gameData.itemData["Pod"]
    gameData.currentMisc = []

    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]
        if (task.level > task.maxLevel) task.maxLevel = task.level
        task.level = 0
        task.xp = 0
    }
    
    // Reset adventure tracking for new life
    if (typeof window.resetAdventureTracking === 'function') {
        window.resetAdventureTracking();
    }

    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        if (requirement.completed && permanentUnlocks.includes(key)) continue
        requirement.completed = false
    }
}

function getLifespan() {
    var rangeExtension = gameData.taskData["Range Extension"]
    var extendedRange = gameData.taskData["Extended Range"]
    if (!rangeExtension || !extendedRange || typeof rangeExtension.getEffect !== 'function' || typeof extendedRange.getEffect !== 'function') {
        return baseLifespan
    }
    var lifespan = baseLifespan * rangeExtension.getEffect() * extendedRange.getEffect()
    return lifespan
}

function isAlive() {
    var condition = gameData.days < getLifespan()
    return condition
}

function updateDeathText() {
    var deathText = document.getElementById("deathText")
    if (!deathText) return;
    
    try {
        var alive = isAlive()
        if (!alive) {
            gameData.days = getLifespan()
            deathText.classList.remove("hidden")
        }
        else {
            deathText.classList.add("hidden")
        }
    } catch (e) {
        // If there's an error, assume alive and hide death message
        console.warn("Error in updateDeathText:", e);
        deathText.classList.add("hidden")
    }
}

function assignMethods() {

    for (key in gameData.taskData) {
        var task = gameData.taskData[key]
        if (task.baseData.income) {
            task.baseData = jobBaseData[task.name]
            task = Object.assign(new Job(jobBaseData[task.name]), task)
            
        } else {
            task.baseData = skillBaseData[task.name]
            task = Object.assign(new Skill(skillBaseData[task.name]), task)
        } 
        gameData.taskData[key] = task
    }

    for (key in gameData.itemData) {
        var item = gameData.itemData[key]
        item.baseData = itemBaseData[item.name]
        item = Object.assign(new Item(itemBaseData[item.name]), item)
        gameData.itemData[key] = item
    }

    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        if (requirement.type == "task") {
            requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "coins") {
            requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "age") {
            requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "evil") {
            requirement = Object.assign(new EvilRequirement(requirement.elements, requirement.requirements), requirement)
        }

        var tempRequirement = tempData["requirements"][key]
        requirement.elements = tempRequirement.elements
        requirement.requirements = tempRequirement.requirements
        gameData.requirements[key] = requirement
    }

    if (gameData.currentJob && gameData.currentJob.name && gameData.taskData[gameData.currentJob.name]) {
        gameData.currentJob = gameData.taskData[gameData.currentJob.name]
    } else {
        gameData.currentJob = gameData.taskData["Scanning"]
    }
    
    if (gameData.currentSkill && gameData.currentSkill.name && gameData.taskData[gameData.currentSkill.name]) {
        gameData.currentSkill = gameData.taskData[gameData.currentSkill.name]
    } else {
        gameData.currentSkill = gameData.taskData["Processing"]
    }
    
    if (gameData.currentProperty && gameData.currentProperty.name && gameData.itemData[gameData.currentProperty.name]) {
        gameData.currentProperty = gameData.itemData[gameData.currentProperty.name]
    } else {
        gameData.currentProperty = gameData.itemData["Pod"]
    }
    var newArray = []
    for (misc of gameData.currentMisc) {
        newArray.push(gameData.itemData[misc.name])
    }
    gameData.currentMisc = newArray
}

function replaceSaveDict(dict, saveDict) {
    for (key in dict) {
        if (!(key in saveDict)) {
            saveDict[key] = dict[key]
        } else if (dict == gameData.requirements) {
            if (saveDict[key].type != tempData["requirements"][key].type) {
                saveDict[key] = tempData["requirements"][key]
            }
        }
    }

    for (key in saveDict) {
        if (!(key in dict)) {
            delete saveDict[key]
        }
    }
}

function saveGameData() {
    localStorage.setItem("gameDataSave", JSON.stringify(gameData))
}

function loadGameData() {
    var gameDataSaveStr = localStorage.getItem("gameDataSave")
    
    if (gameDataSaveStr === null) {
        assignMethods()
        return
    }
    
    var gameDataSave = JSON.parse(gameDataSaveStr)
    
    // Detect old save format (has old job names) and clear it
    const oldJobNames = ["Beggar", "Farmer", "Fisherman", "Miner", "Blacksmith", "Merchant",
                         "Squire", "Footman", "Veteran footman", "Knight", "Veteran knight", 
                         "Elite knight", "Holy knight", "Legendary knight",
                         "Student", "Apprentice mage", "Mage", "Wizard", "Master wizard", "Chairman"];
    
    const hasOldFormat = gameDataSave.taskData && Object.keys(gameDataSave.taskData).some(name => oldJobNames.includes(name));
    
    if (hasOldFormat) {
        console.warn("⚠️ Detected old save format with outdated job names. Clearing corrupted save data.");
        localStorage.removeItem("gameDataSave");
        assignMethods();
        return;
    }

    if (gameDataSave !== null) {
        replaceSaveDict(gameData, gameDataSave)
        replaceSaveDict(gameData.requirements, gameDataSave.requirements)
        replaceSaveDict(gameData.taskData, gameDataSave.taskData)
        replaceSaveDict(gameData.itemData, gameDataSave.itemData)

        gameData = gameDataSave
    }

    assignMethods()
    
    // Restore checkbox states after loading
    // Re-fetch elements in case they weren't available when constants were defined
    const autoPromoteEl = document.getElementById("autoPromote")
    const autoLearnEl = document.getElementById("autoLearn")
    
    if (autoPromoteEl !== null) {
        autoPromoteEl.checked = gameData.autoPromote || false
    }
    if (autoLearnEl !== null) {
        autoLearnEl.checked = gameData.autoLearn || false
    }
}

function updateUI() {
    updateTaskRows()
    updateItemRows()
    updateRequiredRows(gameData.taskData, jobCategories)
    updateRequiredRows(gameData.taskData, skillCategories)
    updateRequiredRows(gameData.itemData, itemCategories)
    updateHeaderRows(jobCategories)
    updateHeaderRows(skillCategories)
    updateQuickTaskDisplay("job")
    updateQuickTaskDisplay("skill")
    hideEntities()
    updateText()
    updateDeathText() // Update death message visibility
}

function update() {
    // Always update UI, even when paused (for adventures and manual pause)
    updateUI();
    
    // Skip game logic updates if paused (including during adventures)
    if (gameData.paused) {
        return;
    }
    
    increaseDays()
    autoPromote()
    autoLearn()
    doCurrentTask(gameData.currentJob)
    doCurrentTask(gameData.currentSkill)
    applyExpenses()
}

function resetGameData() {
    localStorage.clear()
    location.reload()
}

function importGameData() {
    var importExportBox = document.getElementById("importExportBox")
    var data = JSON.parse(window.atob(importExportBox.value))
    gameData = data
    saveGameData()
    location.reload()
}

function exportGameData() {
    var importExportBox = document.getElementById("importExportBox")
    importExportBox.value = window.btoa(JSON.stringify(gameData))
}

//Init

createAllRows(jobCategories, "jobTable")
createAllRows(skillCategories, "skillTable")
createAllRows(itemCategories, "itemTable") 

createData(gameData.taskData, jobBaseData)
createData(gameData.taskData, skillBaseData)
createData(gameData.itemData, itemBaseData) 

gameData.currentJob = gameData.taskData["Scanning"]
gameData.currentSkill = gameData.taskData["Processing"]
gameData.currentProperty = gameData.itemData["Pod"]
gameData.currentMisc = []

gameData.requirements = {
    //Other
    "Advanced Systems": new TaskRequirement(getElementsByClass("Advanced Systems"), [{task: "Processing", requirement: 200}, {task: "Optimization", requirement: 200}]),
    "Dark magic": new EvilRequirement(getElementsByClass("Dark magic"), [{requirement: 1}]),
    "Shop": new CoinRequirement([document.getElementById("shopTabButton")], [{requirement: gameData.itemData["Scout"].getExpense() * 50}]),
    "Rebirth tab": new AgeRequirement([document.getElementById("rebirthTabButton")], [{requirement: 25}]),
    "Rebirth note 1": new AgeRequirement([document.getElementById("rebirthNote1")], [{requirement: 45}]),
    "Rebirth note 2": new AgeRequirement([document.getElementById("rebirthNote2")], [{requirement: 65}]),
    "Rebirth note 3": new AgeRequirement([document.getElementById("rebirthNote3")], [{requirement: 200}]),
    "Evil info": new EvilRequirement([document.getElementById("evilInfo")], [{requirement: 1}]),
    "Time warping info": new TaskRequirement([document.getElementById("timeWarping")], [{task: "Quantum", requirement: 10}]),
    "Automation": new AgeRequirement([document.getElementById("automation")], [{requirement: 20}]),
    "Quick task display": new AgeRequirement([document.getElementById("quickTaskDisplay")], [{requirement: 20}]),

    //Exploration Operations
    "Scanning": new TaskRequirement([getTaskElement("Scanning")], []),
    "Mining": new TaskRequirement([getTaskElement("Mining")], [{task: "Scanning", requirement: 10}]),
    "Probing": new TaskRequirement([getTaskElement("Probing")], [{task: "Mining", requirement: 10}]),
    "Extraction": new TaskRequirement([getTaskElement("Extraction")], [{task: "Reinforcement", requirement: 10}, {task: "Probing", requirement: 10}]),
    "Fabrication": new TaskRequirement([getTaskElement("Fabrication")], [{task: "Reinforcement", requirement: 30}, {task: "Extraction", requirement: 10}]),
    "Trading": new TaskRequirement([getTaskElement("Trading")], [{task: "Negotiation", requirement: 50}, {task: "Fabrication", requirement: 10}]),

    //Combat Operations 
    "Recon": new TaskRequirement([getTaskElement("Recon")], [{task: "Reinforcement", requirement: 5}]),
    "Combat": new TaskRequirement([getTaskElement("Combat")], [{task: "Reinforcement", requirement: 20}, {task: "Recon", requirement: 10}]),
    "Advanced Weapons": new TaskRequirement([getTaskElement("Advanced Weapons")], [{task: "Combat Protocols", requirement: 40}, {task: "Combat", requirement: 10}]),
    "Tactics": new TaskRequirement([getTaskElement("Tactics")], [{task: "Reinforcement", requirement: 100}, {task: "Advanced Weapons", requirement: 10}]),
    "Hardened Systems": new TaskRequirement([getTaskElement("Hardened Systems")], [{task: "Combat Protocols", requirement: 150}, {task: "Tactics", requirement: 10}]),
    "Quantum Combat": new TaskRequirement([getTaskElement("Quantum Combat")], [{task: "Reinforcement", requirement: 300}, {task: "Hardened Systems", requirement: 10}]),
    "Reality Weapons": new TaskRequirement([getTaskElement("Reality Weapons")], [{task: "Quantum Control", requirement: 500}, {task: "Quantum Combat", requirement: 10}]),
    "Supremacy Tech": new TaskRequirement([getTaskElement("Supremacy Tech")], [{task: "Quantum Control", requirement: 1000}, {task: "Combat Protocols", requirement: 1000}, {task: "Reality Weapons", requirement: 10}]),

    //Advanced Systems
    "Neural": new TaskRequirement([getTaskElement("Neural")], [{task: "Processing", requirement: 200}, {task: "Optimization", requirement: 200}]),
    "Quantum Basics": new TaskRequirement([getTaskElement("Quantum Basics")], [{task: "Quantum Control", requirement: 400}, {task: "Neural", requirement: 10}]),
    "Quantum": new TaskRequirement([getTaskElement("Quantum")], [{task: "Quantum Control", requirement: 700}, {task: "Quantum Basics", requirement: 10}]),
    "Dimensions": new TaskRequirement([getTaskElement("Dimensions")], [{task: "Quantum Control", requirement: 1000}, {task: "Quantum", requirement: 10}]),
    "Reality Tech": new TaskRequirement([getTaskElement("Reality Tech")], [{task: "Quantum Control", requirement: 1500}, {task: "Dimensions", requirement: 10}]),
    "Unified": new TaskRequirement([getTaskElement("Unified")], [{task: "Quantum Control", requirement: 2000}, {task: "Reality Tech", requirement: 10}]),

    //Fundamentals
    "Processing": new TaskRequirement([getTaskElement("Processing")], []),
    "Efficiency": new TaskRequirement([getTaskElement("Efficiency")], [{task: "Processing", requirement: 5}]),
    "Negotiation": new TaskRequirement([getTaskElement("Negotiation")], [{task: "Processing", requirement: 20}]),
    "Optimization": new TaskRequirement([getTaskElement("Optimization")], [{task: "Processing", requirement: 30}, {task: "Efficiency", requirement: 20}]),

    //Combat
    "Reinforcement": new TaskRequirement([getTaskElement("Reinforcement")], []),
    "Combat Protocols": new TaskRequirement([getTaskElement("Combat Protocols")], [{task: "Processing", requirement: 20}]),
    "Pattern Recognition": new TaskRequirement([getTaskElement("Pattern Recognition")], [{task: "Processing", requirement: 30}, {task: "Reinforcement", requirement: 30}]),

    //Magic
    "Quantum Control": new TaskRequirement([getTaskElement("Quantum Control")], [{task: "Processing", requirement: 200}, {task: "Optimization", requirement: 200}]),
    "Range Extension": new TaskRequirement([getTaskElement("Range Extension")], [{task: "Quantum Basics", requirement: 10}]),
    "Temporal Manipulation": new TaskRequirement([getTaskElement("Temporal Manipulation")], [{task: "Quantum", requirement: 10}]),
    "Extended Range": new TaskRequirement([getTaskElement("Extended Range")], [{task: "Unified", requirement: 1000}]),

    //Dark magic
    "Corruption Absorption": new EvilRequirement([getTaskElement("Corruption Absorption")], [{requirement: 1}]),
    "Corruption Control": new EvilRequirement([getTaskElement("Corruption Control")], [{requirement: 1}]),
    "Aggression": new EvilRequirement([getTaskElement("Aggression")], [{requirement: 1}]),
    "Forbidden Protocols": new EvilRequirement([getTaskElement("Forbidden Protocols")], [{requirement: 25}]),
    "Corruption Cultivation": new EvilRequirement([getTaskElement("Corruption Cultivation")], [{requirement: 75}]),
    "Corrupted Protocols": new EvilRequirement([getTaskElement("Corrupted Protocols")], [{requirement: 500}]),

    //Properties
    "Pod": new CoinRequirement([getItemElement("Pod")], [{requirement: 0}]),
    "Scout": new CoinRequirement([getItemElement("Scout")], [{requirement: 0}]),
    "Scout Pod": new CoinRequirement([getItemElement("Scout Pod")], [{requirement: gameData.itemData["Scout Pod"].getExpense() * 100}]),
    "Bay": new CoinRequirement([getItemElement("Bay")], [{requirement: gameData.itemData["Bay"].getExpense() * 100}]),
    "Hold": new CoinRequirement([getItemElement("Hold")], [{requirement: gameData.itemData["Hold"].getExpense() * 100}]),
    "Cargo Bay": new CoinRequirement([getItemElement("Cargo Bay")], [{requirement: gameData.itemData["Cargo Bay"].getExpense() * 100}]),
    "Command Pod": new CoinRequirement([getItemElement("Command Pod")], [{requirement: gameData.itemData["Command Pod"].getExpense() * 100}]),
    "Command Bay": new CoinRequirement([getItemElement("Command Bay")], [{requirement: gameData.itemData["Command Bay"].getExpense() * 100}]),

    //Misc
    "Scanner": new CoinRequirement([getItemElement("Scanner")], [{requirement: 0}]),
    "Thruster": new CoinRequirement([getItemElement("Thruster")], [{requirement: gameData.itemData["Thruster"].getExpense() * 100}]),
    "Auto Pilot": new CoinRequirement([getItemElement("Auto Pilot")], [{requirement: gameData.itemData["Auto Pilot"].getExpense() * 100}]),
    "Plasma Cannon": new CoinRequirement([getItemElement("Plasma Cannon")], [{requirement: gameData.itemData["Plasma Cannon"].getExpense() * 100}]),
    "Core": new CoinRequirement([getItemElement("Core")], [{requirement: gameData.itemData["Core"].getExpense() * 100}]),
    "Quantum Core": new CoinRequirement([getItemElement("Quantum Core")], [{requirement: gameData.itemData["Quantum Core"].getExpense() * 100}]),
    "Nav Computer": new CoinRequirement([getItemElement("Nav Computer")], [{requirement: gameData.itemData["Nav Computer"].getExpense() * 100}]),
    "Mainframe": new CoinRequirement([getItemElement("Mainframe")], [{requirement: gameData.itemData["Mainframe"].getExpense() * 100}]), 
}

tempData["requirements"] = {}
for (key in gameData.requirements) {
    var requirement = gameData.requirements[key]
    tempData["requirements"][key] = requirement
}

loadGameData()

setCustomEffects()
addMultipliers()

setTab(jobTabButton, "jobs")

// Initialize LLM integration
if (typeof window.initializeCareerBasedAdventures === 'function') {
    window.initializeCareerBasedAdventures();
}

update()
// Save checkbox states when changed
if (autoPromoteElement) {
    autoPromoteElement.addEventListener('change', function() {
        gameData.autoPromote = this.checked
        saveGameData()
    })
}
if (autoLearnElement) {
    autoLearnElement.addEventListener('change', function() {
        gameData.autoLearn = this.checked
        saveGameData()
    })
}

setInterval(update, 1000 / updateSpeed)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)

// ========================================
// UI Enhancements (formerly ui-view-only.js)
// ========================================
// View-only UI enhancements for classic index.html
// Adds a sci-fi Big Counter as a sibling after #coinDisplay without modifying game logic DOM

function formatNumber(num) {
	if (typeof num !== 'number' || isNaN(num)) return '0';
	var hasFraction = Math.abs(num % 1) > 0;
	if (hasFraction) {
		return num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
	}
	return Math.trunc(num).toLocaleString('en-US');
}

function ensureBigCounter() {
	return document.getElementById('sci-fi-big-counter');
}

function ensureRateChip() {
	return document.getElementById('sci-fi-rate-chip');
}

function animateValue(el, from, to, duration) {
	var start = performance.now();
	function step(now) {
		var p = Math.min((now - start) / duration, 1);
		var eased = 1 - Math.pow(1 - p, 3);
		var val = Math.floor(from + (to - from) * eased);
		el.textContent = formatNumber(val);
		if (p < 1) requestAnimationFrame(step);
	}
	requestAnimationFrame(step);
}

var animateValueImpl = animateValue;

function startUpdater() {
	var container = ensureBigCounter();
	if (!container) return;
	var valueEl = document.getElementById('sci-fi-counter-value');
	if (!valueEl) return;

	var chip = ensureRateChip();
	var chipValue = document.getElementById('sci-fi-rate-value');
	var chipTrend = document.getElementById('sci-fi-rate-trend');

	// Charts (read-only, 1 FPS)
	var charts = ensureChartsContainer();
	var lineCanvas = charts && document.getElementById('sci-fi-line-chart-classic');
	var barCanvas = charts && document.getElementById('sci-fi-bar-chart-classic');
	var history = [];

	var last = 0;
	var lastTick = 0;
	var lastChart = 0;
	var toastHost = ensureToastContainer();

	function loop(now) {
		// throttle to ~30 FPS
		if (now - lastTick >= 33) {
			if (typeof window !== 'undefined' && window.gameData && typeof window.gameData.coins === 'number') {
				var current = window.gameData.coins;
				if (current !== last) {
					animateValueImpl(valueEl, last, current, 300);
					last = current;
				}
			}
			// Update rate chip if helpers are available
			if (chip && chipValue && chipTrend && typeof window.getIncome === 'function' && typeof window.getExpense === 'function') {
				var rate = window.getIncome() - window.getExpense();
				chipValue.textContent = formatNumber(Math.abs(Math.floor(rate)));
				chipTrend.className = 'rate-chip-trend' + (rate < 0 ? ' negative' : '');
			}
			// Charts sample once per second
			if (charts && now - lastChart >= 1000 && window.gameData && typeof window.getIncome === 'function' && typeof window.getExpense === 'function') {
				lastChart = now;
				history.push({
					t: now,
					coins: window.gameData.coins,
					income: window.getIncome(),
					expense: window.getExpense()
				});
				if (history.length > 3600) history.shift();
				if (lineCanvas) drawLine(lineCanvas, history);
				if (barCanvas) drawBars(barCanvas, history);
			}
			// Achievement toast scan (UI-only, non-intrusive)
			if (toastHost && window.gameData && window.gameData.requirements) {
				for (var key in window.gameData.requirements) {
					var req = window.gameData.requirements[key];
					if (req && req.completed && !req.uiNotified) {
						showToast('Achievement', key + ' unlocked');
						req.uiNotified = true;
					}
				}
			}
			// Update inline meta rows (lightweight)
			updateInlineMeta();
			lastTick = now;
		}
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
}

function ensureChartsContainer() {
	return document.getElementById('sci-fi-charts-classic');
}

function drawLine(canvas, data) {
	var ctx = canvas.getContext('2d');
	var w = canvas.width, h = canvas.height;
	ctx.clearRect(0, 0, w, h);
	if (!data || data.length < 2) return;
	// gridlines
	ctx.strokeStyle = 'rgba(255,255,255,0.08)';
	ctx.lineWidth = 1;
	for (var g = 1; g < 5; g++) {
		var gy = (g / 5) * h;
		ctx.beginPath();
		ctx.moveTo(0, gy);
		ctx.lineTo(w, gy);
		ctx.stroke();
	}
	var max = -Infinity, min = Infinity;
	for (var i = 0; i < data.length; i++) {
		if (data[i].coins > max) max = data[i].coins;
		if (data[i].coins < min) min = data[i].coins;
	}
	var range = Math.max(1, max - min);
	ctx.strokeStyle = '#00ff88';
	ctx.lineWidth = 2;
	ctx.beginPath();
	for (var j = 0; j < data.length; j++) {
		var x = (j / (data.length - 1)) * w;
		var y = h - ((data[j].coins - min) / range) * h;
		if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
	}
	ctx.stroke();
}

function drawBars(canvas, data) {
	var ctx = canvas.getContext('2d');
	var w = canvas.width, h = canvas.height;
	ctx.clearRect(0, 0, w, h);
	if (!data || data.length < 1) return;
	// average last 60 samples (~60s)
	var N = Math.min(60, data.length);
	var sumInc = 0, sumExp = 0;
	for (var i = data.length - N; i < data.length; i++) {
		sumInc += data[i].income;
		sumExp += data[i].expense;
	}
	var avgInc = sumInc / N;
	var avgExp = sumExp / N;
	var maxVal = Math.max(1, avgInc, avgExp);
	var incH = (avgInc / maxVal) * h * 0.8;
	var expH = (avgExp / maxVal) * h * 0.8;
	ctx.fillStyle = '#00ff88';
	ctx.fillRect(w * 0.15, h - incH, w * 0.25, incH);
	ctx.fillStyle = '#ff4444';
	ctx.fillRect(w * 0.60, h - expH, w * 0.25, expH);
}

function ensureToastContainer() {
	return document.getElementById('sci-fi-toast-container');
}

function showToast(title, message) {
	var host = ensureToastContainer();
	var toast = document.createElement('div');
	toast.className = 'toast success';
	toast.innerHTML = '<div class="toast-header"><div class="toast-title">' + title + '</div>' +
		'<button class="toast-close" aria-label="Close">×</button></div>' +
		'<div class="toast-message">' + message + '</div>';
	host.appendChild(toast);
	var close = toast.querySelector('.toast-close');
	if (close) close.addEventListener('click', function(){ toast.remove(); });
	setTimeout(function(){ if (toast.parentNode) toast.remove(); }, 3000);
}

function drawPrestigePreviewChart(canvas, mult) {
	var ctx = canvas.getContext('2d');
	var w = canvas.width, h = canvas.height;
	ctx.clearRect(0, 0, w, h);
	var base = [0, 1, 2, 3, 4, 5, 6];
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#8884ff';
	ctx.beginPath();
	for (var i = 0; i < base.length; i++) {
		var x = (i / (base.length - 1)) * w;
		var y = h - (base[i] / 6) * h;
		if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
	}
	ctx.stroke();
	ctx.strokeStyle = '#00ff88';
	ctx.beginPath();
	for (var j = 0; j < base.length; j++) {
		var x2 = (j / (base.length - 1)) * w;
		var y2 = h - (Math.min(6, base[j] * mult) / 6) * h;
		if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
	}
	ctx.stroke();
}

function injectPrestigePreview() {
	var rebirthTab = document.getElementById('rebirth');
	if (!rebirthTab) return;
	if (document.getElementById('sci-fi-prestige-preview-btn')) return;

	var btn = document.createElement('button');
	btn.className = 'control-button';
	btn.id = 'sci-fi-prestige-preview-btn';
	btn.textContent = 'Preview Prestige';
	btn.style.margin = '8px 0';
	rebirthTab.insertAdjacentElement('afterbegin', btn);

	var overlay = document.createElement('div');
	overlay.id = 'sci-fi-prestige-modal';
	overlay.style.display = 'none';
	overlay.style.position = 'fixed';
	overlay.style.inset = '0';
	overlay.style.background = 'rgba(0,0,0,0.6)';
	overlay.style.zIndex = '1050';

	var card = document.createElement('div');
	card.className = 'prestige-card';
	card.style.maxWidth = '520px';
	card.style.margin = '10vh auto';
	card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
	card.innerHTML = '' +
		'<div class="prestige-card-title">Prestige Preview</div>' +
		'<div class="prestige-card-shards" id="sci-fi-preview-shards">0</div>' +
		'<div class="prestige-card-multiplier" id="sci-fi-preview-mult">x1.0 projected multiplier</div>' +
		'<div class="chart-title" style="margin-top:8px">Projected Growth (UI-only)</div>' +
		'<canvas class="chart-canvas" id="sci-fi-preview-chart" width="420" height="160"></canvas>' +
		'<div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">' +
			'<button class="control-button" id="sci-fi-preview-close">Close</button>' +
			'<button class="control-button" id="sci-fi-preview-focus">Focus Amulet Action</button>' +
		'</div>';

	overlay.appendChild(card);
	document.body.appendChild(overlay);

	btn.addEventListener('click', function () {
		var shardsEl = document.getElementById('sci-fi-preview-shards');
		var multEl = document.getElementById('sci-fi-preview-mult');
		var currentShards = 0;
		var multiplier = 1.0;
		if (window.gameData) {
			var r1 = Number(window.gameData.rebirthOneCount || 0);
			var r2 = Number(window.gameData.rebirthTwoCount || 0);
			currentShards = Math.floor(r1 + r2);
			multiplier = 1 + currentShards / 10;
		}
		if (shardsEl) shardsEl.textContent = String(currentShards);
		if (multEl) multEl.textContent = 'x' + multiplier.toFixed(1) + ' projected multiplier';
		var canvas = document.getElementById('sci-fi-preview-chart');
		if (canvas) drawPrestigePreviewChart(canvas, multiplier);
		overlay.style.display = 'block';
	});

	card.querySelector('#sci-fi-preview-close').addEventListener('click', function(){ overlay.style.display = 'none'; });
	card.querySelector('#sci-fi-preview-focus').addEventListener('click', function(){
		var touchBtn = document.querySelector('#rebirth button.w3-button.button');
		if (touchBtn && touchBtn.scrollIntoView) touchBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
		overlay.style.display = 'none';
	});
}

// Attach detail drawers to rows and item buttons (UI-only)
function attachDetailDrawers() {
	try {
		var overlay = document.createElement('div');
		overlay.className = 'sci-drawer-overlay';
		overlay.id = 'sci-drawer-overlay';
		overlay.style.display = 'none'; // Explicitly hidden on creation
		var card = document.createElement('div');
		card.className = 'sci-drawer-card';
		card.innerHTML = '<div class="sci-drawer-title" id="sci-drawer-title">Details</div>'+
			'<div class="sci-drawer-row"><span>Level</span><span id="sci-drawer-level">-</span></div>'+
			'<div class="sci-drawer-row"><span>XP/day</span><span id="sci-drawer-xp">-</span></div>'+
			'<div class="sci-drawer-row"><span>Next XP</span><span id="sci-drawer-next">-</span></div>'+
			'<div class="sci-drawer-actions"><button class="control-button" id="sci-drawer-close">Close</button></div>';
		overlay.appendChild(card);
		document.body.appendChild(overlay);
		overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.style.display='none'; });
		card.querySelector('#sci-drawer-close').addEventListener('click', function(){ overlay.style.display='none'; });

		function openDrawerForTask(name) {
			var title = document.getElementById('sci-drawer-title');
			var l = document.getElementById('sci-drawer-level');
			var x = document.getElementById('sci-drawer-xp');
			var n = document.getElementById('sci-drawer-next');
			title.textContent = name;
			if (window.gameData && window.gameData.taskData && window.gameData.taskData[name]) {
				var t = window.gameData.taskData[name];
				l.textContent = String(t.level);
				x.textContent = String(t.getXpGain());
				n.textContent = String(t.getMaxXp());
			} else {
				l.textContent = x.textContent = n.textContent = '-';
			}
			overlay.style.display = 'block';
		}

		var rows = document.querySelectorAll('tr');
		rows.forEach(function(r){
			var bar = r.querySelector('.progress-bar');
			if (!bar) return;
			var nameEl = r.querySelector('.progress-text.name');
			var name = nameEl && nameEl.textContent ? nameEl.textContent.replace(/ lvl.*$/,'') : null;
			if (!name) return;
			var timer;
			bar.addEventListener('mousedown', function(){ timer = setTimeout(function(){ openDrawerForTask(name); }, 500); });
			bar.addEventListener('mouseup', function(){ clearTimeout(timer); });
			bar.addEventListener('mouseleave', function(){ clearTimeout(timer); });
			bar.addEventListener('touchstart', function(){ timer = setTimeout(function(){ openDrawerForTask(name); }, 600); }, {passive:true});
			bar.addEventListener('touchend', function(){ clearTimeout(timer); });
			bar.addEventListener('touchcancel', function(){ clearTimeout(timer); });
		});

		var itemBtns = document.querySelectorAll('.item-button');
		itemBtns.forEach(function(btn){
			btn.addEventListener('click', function(e){
				var nmEl = btn.querySelector('.name');
				var nm = nmEl ? nmEl.textContent : 'Item';
				var title = document.getElementById('sci-drawer-title');
				title.textContent = nm;
				document.getElementById('sci-drawer-level').textContent = '-';
				var exp = btn.closest('tr') && btn.closest('tr').querySelector('.expense');
				document.getElementById('sci-drawer-xp').textContent = exp ? exp.textContent.trim() : '-';
				document.getElementById('sci-drawer-next').textContent = '-';
				overlay.style.display = 'block';
				e.stopPropagation();
			});
		});
	} catch(e) { /* no-op */ }
}

// Floating tooltips (non-intrusive): reuse existing .tooltip .tooltipText content
var floatingTooltipElement = null;

function ensureFloatingTooltip() {
	if (floatingTooltipElement) return floatingTooltipElement;
	floatingTooltipElement = document.createElement('div');
	floatingTooltipElement.id = 'sci-fi-floating-tooltip';
	floatingTooltipElement.style.position = 'fixed';
	floatingTooltipElement.style.pointerEvents = 'none';
	floatingTooltipElement.style.background = 'rgba(0,0,0,0.85)';
	floatingTooltipElement.style.color = '#fff';
	floatingTooltipElement.style.padding = '8px 10px';
	floatingTooltipElement.style.borderRadius = '6px';
	floatingTooltipElement.style.fontSize = '12px';
	floatingTooltipElement.style.maxWidth = '260px';
	floatingTooltipElement.style.zIndex = '1070';
	floatingTooltipElement.style.transform = 'translate(-9999px, -9999px)';
	document.body.appendChild(floatingTooltipElement);
	return floatingTooltipElement;
}

function showFloatingTip(html, x, y) {
	var el = ensureFloatingTooltip();
	el.innerHTML = html;
	positionFloatingTip(x, y);
}

function positionFloatingTip(x, y) {
	var el = ensureFloatingTooltip();
	var offsetX = 14, offsetY = 14;
	var left = x + offsetX;
	var top = y + offsetY;
	var rect = { w: el.offsetWidth, h: el.offsetHeight };
	var vw = window.innerWidth, vh = window.innerHeight;
	if (left + rect.w > vw - 8) left = x - rect.w - offsetX;
	if (top + rect.h > vh - 8) top = y - rect.h - offsetY;
	el.style.transform = 'translate(' + left + 'px,' + top + 'px)';
}

function hideFloatingTip() {
	if (!floatingTooltipElement) return;
	floatingTooltipElement.style.transform = 'translate(-9999px, -9999px)';
}

function bindFloatingTooltips() {
	document.addEventListener('mousemove', function(e) {
		// If a tooltip is visible, track pointer
		if (floatingTooltipElement && floatingTooltipElement.style.transform && floatingTooltipElement.style.transform.indexOf('-9999px') === -1) {
			positionFloatingTip(e.clientX, e.clientY);
		}
	});
	document.addEventListener('mouseenter', function(e) {
		var t = e.target;
		var container = t.closest && t.closest('.tooltip');
		if (!container) return;
		var textEl = container.querySelector('.tooltipText');
		if (textEl && textEl.textContent) {
			showFloatingTip(textEl.textContent, e.clientX, e.clientY);
		}
	}, true);
	document.addEventListener('mouseleave', function(e) {
		var t = e.target;
		if (t.closest && t.closest('.tooltip')) hideFloatingTip();
	}, true);
}


// Add inline meta and category badges
function updateInlineMeta() {
	try {
		var jobTable = document.getElementById('jobTable');
		var skillTable = document.getElementById('skillTable');
		[jobTable, skillTable].forEach(function(table){
			if (!table) return;
			var rows = table.querySelectorAll('tr');
			var currentCategory = null;
			rows.forEach(function(r){
				if (r.classList.contains('headerRow')) {
					var catCell = r.querySelector('.category');
					currentCategory = catCell ? catCell.textContent.trim() : null;
					return;
				}
				var bar = r.querySelector('.progress-bar');
				if (!bar) return;
				// Remove old category badges
				var oldBadge = r.querySelector('.sci-badge');
				if (oldBadge) oldBadge.remove();
				// meta
				if (!r.__metaEl) {
					var meta = document.createElement('div');
					meta.className = 'sci-meta';
					r.__metaEl = meta;
					var firstCell2 = r.cells && r.cells[0];
					if (firstCell2) firstCell2.appendChild(meta);
				}
				// Get level and XP values from task object (level and XP columns were removed from table)
				var lvl = '-';
				var xpDay = '-';
				var nextXp = '-';
				if (window.gameData && window.gameData.taskData) {
					var taskName = r.id ? r.id.replace('row ', '') : null;
					if (taskName && window.gameData.taskData[taskName]) {
						var task = window.gameData.taskData[taskName];
						lvl = String(task.level || '-');
						xpDay = typeof task.getXpGain === 'function' ? formatNumber(task.getXpGain()) : '-';
						nextXp = typeof task.getXpLeft === 'function' ? formatNumber(task.getXpLeft()) : '-';
					}
				}
				r.__metaEl.innerHTML = '<strong>Lvl ' + lvl + '</strong> • Xp/day ' + xpDay + ' • Next ' + nextXp;
			});
		});
		// Items: active/equipped chip
		var itemTable = document.getElementById('itemTable');
		if (itemTable) {
			var irows = itemTable.querySelectorAll('tr');
			irows.forEach(function(r){
				var btn = r.querySelector('.item-button');
				if (!btn) return;
				var chip = r.__activeChip;
				if (!chip) {
					chip = document.createElement('span');
					chip.className = 'sci-chip';
					chip.textContent = 'Equipped';
					r.__activeChip = chip;
					var firstCell = r.cells && r.cells[0];
					if (firstCell) firstCell.appendChild(chip);
				}
				var dot = r.querySelector('.active');
				var isActive = dot && window.getComputedStyle(dot).backgroundColor !== 'rgb(255, 255, 255)';
				chip.style.display = isActive ? 'inline-flex' : 'none';
			});
		}
	} catch(e) { /* no-op */ }
}

// Add a non-intrusive class to tables that contain headerRow, for rounded styling via CSS
function markRoundedTables() {
	var headerRows = document.querySelectorAll('tr.headerRow');
	headerRows.forEach(function(hr){
		var table = hr.closest('table');
		if (table && !table.classList.contains('sci-rounded-table')) {
			table.classList.add('sci-rounded-table');
		}
	});
}

// Initialize UI enhancements
var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
if (mq && mq.matches) {
	animateValueImpl = function (el, _from, to) { el.textContent = formatNumber(Math.floor(to)); };
}
startUpdater();
injectPrestigePreview();
bindFloatingTooltips();
markRoundedTables();
attachDetailDrawers();