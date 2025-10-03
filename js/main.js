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

    // Methods for external control (used by StoryAdventureManager)
    setPaused: function(paused) {
        this.paused = paused;
    },
    
    setDays: function(days) {
        this.days = days;
    },
    
    getDays: function() {
        return this.days;
    },
    
    setCoins: function(coins) {
        this.coins = coins;
    },
    
    getCoins: function() {
        return this.coins;
    }
}

// Performance optimization: Cache DOM elements
var domCache = {
    elements: {},
    lastUpdate: 0,
    updateThrottle: 50, // Update UI max every 50ms (20 FPS)
    dirtyFlags: {
        tasks: false,
        items: false,
        text: false,
        requirements: false
    }
}

// Cache frequently used DOM elements
function cacheDOMElements() {
    domCache.elements = {
        // Sidebar elements
        ageDisplay: document.getElementById("ageDisplay"),
        dayDisplay: document.getElementById("dayDisplay"),
        lifespanDisplay: document.getElementById("lifespanDisplay"),
        pauseButton: document.getElementById("pauseButton"),
        coinDisplay: document.getElementById("coinDisplay"),
        netDisplay: document.getElementById("netDisplay"),
        incomeDisplay: document.getElementById("incomeDisplay"),
        expenseDisplay: document.getElementById("expenseDisplay"),
        happinessDisplay: document.getElementById("happinessDisplay"),
        evilDisplay: document.getElementById("evilDisplay"),
        evilGainDisplay: document.getElementById("evilGainDisplay"),
        timeWarpingDisplay: document.getElementById("timeWarpingDisplay"),
        timeWarpingButton: document.getElementById("timeWarpingButton"),
        signDisplay: document.getElementById("signDisplay"),
        
        // Task and item rows (will be populated dynamically)
        taskRows: {},
        itemRows: {},
        requiredRows: document.getElementsByClassName("requiredRow")
    }
    
    // Cache task rows
    for (key in gameData.taskData) {
        const task = gameData.taskData[key]
        const row = document.getElementById("row " + task.name)
        if (row) {
            domCache.elements.taskRows[task.name] = {
                element: row,
                level: row.getElementsByClassName("level")[0],
                xpGain: row.getElementsByClassName("xpGain")[0],
                xpLeft: row.getElementsByClassName("xpLeft")[0],
                maxLevel: row.getElementsByClassName("maxLevel")[0],
                progressFill: row.getElementsByClassName("progressFill")[0],
                valueElement: row.getElementsByClassName("value")[0],
                income: row.getElementsByClassName("income")[0],
                effect: row.getElementsByClassName("effect")[0],
                skipSkill: row.getElementsByClassName("skipSkill")[0]
            }
        }
    }
    
    // Cache item rows
    for (key in gameData.itemData) {
        const item = gameData.itemData[key]
        const row = document.getElementById("row " + item.name)
        if (row) {
            domCache.elements.itemRows[item.name] = {
                element: row,
                button: row.getElementsByClassName("button")[0],
                active: row.getElementsByClassName("active")[0],
                effect: row.getElementsByClassName("effect")[0],
                expense: row.getElementsByClassName("expense")[0]
            }
        }
    }
    
    logger.info("DOM elements cached for performance optimization")
}

var tempData = {}

var skillWithLowestMaxXp = null

const autoPromoteElement = document.getElementById("autoPromote")
const autoLearnElement = document.getElementById("autoLearn")

// Configuration constants - centralized for better maintainability
const GAME_CONFIG = {
    // Timing
    UPDATE_SPEED: 20,
    BASE_LIFESPAN: 365 * 70,
    BASE_GAME_SPEED: 4,
    
    // Save intervals
    SAVE_INTERVAL: 3000, // 3 seconds
    SKILL_UPDATE_INTERVAL: 1000, // 1 second
    
    // Initial values
    INITIAL_AGE: 365 * 14, // 14 years
    INITIAL_COINS: 0,
    INITIAL_EVIL: 0,
    
    // Permanent unlocks
    PERMANENT_UNLOCKS: ["Scheduling", "Shop", "Automation", "Quick task display"],
    
    // UI
    TAB_UPDATE_SPEED: 1000 / 20, // 20 FPS
    
    // Validation limits
    MAX_LEVEL: 1000,
    MAX_XP: 1000000000000,
    MAX_COINS: 1000000000000,
    MAX_AGE: 1000,
    MAX_EVIL: 1000
}

// Backward compatibility
const updateSpeed = GAME_CONFIG.UPDATE_SPEED
const baseLifespan = GAME_CONFIG.BASE_LIFESPAN
const baseGameSpeed = GAME_CONFIG.BASE_GAME_SPEED
const permanentUnlocks = GAME_CONFIG.PERMANENT_UNLOCKS

const jobBaseData = {
    "Beggar": {name: "Beggar", maxXp: 50, income: 5},
    "Farmer": {name: "Farmer", maxXp: 100, income: 9},
    "Fisherman": {name: "Fisherman", maxXp: 200, income: 15},
    "Miner": {name: "Miner", maxXp: 400, income: 40},
    "Blacksmith": {name: "Blacksmith", maxXp: 800, income: 80},
    "Merchant": {name: "Merchant", maxXp: 1600, income: 150},

    "Squire": {name: "Squire", maxXp: 100, income: 5},
    "Footman": {name: "Footman", maxXp: 1000, income: 50},
    "Veteran footman": {name: "Veteran footman", maxXp: 10000, income: 120},
    "Knight": {name: "Knight", maxXp: 100000, income: 300},
    "Veteran knight": {name: "Veteran knight", maxXp: 1000000, income: 1000},
    "Elite knight": {name: "Elite knight", maxXp: 7500000, income: 3000},
    "Holy knight": {name: "Holy knight", maxXp: 40000000, income: 15000},
    "Legendary knight": {name: "Legendary knight", maxXp: 150000000, income: 50000},

    "Student": {name: "Student", maxXp: 100000, income: 100},
    "Apprentice mage": {name: "Apprentice mage", maxXp: 1000000, income: 1000},
    "Mage": {name: "Mage", maxXp: 10000000, income: 7500},
    "Wizard": {name: "Wizard", maxXp: 100000000, income: 50000},
    "Master wizard": {name: "Master wizard", maxXp: 10000000000, income: 250000},
    "Chairman": {name: "Chairman", maxXp: 1000000000000, income: 1000000},
}

const skillBaseData = {
    "Concentration": {name: "Concentration", maxXp: 100, effect: 0.01, description: "Skill xp"},
    "Productivity": {name: "Productivity", maxXp: 100, effect: 0.01, description: "Job xp"},
    "Bargaining": {name: "Bargaining", maxXp: 100, effect: -0.01, description: "Expenses"},
    "Meditation": {name: "Meditation", maxXp: 100, effect: 0.01, description: "Happiness"},

    "Strength": {name: "Strength", maxXp: 100, effect: 0.01, description: "Military pay"},
    "Battle tactics": {name: "Battle tactics", maxXp: 100, effect: 0.01, description: "Military xp"},
    "Muscle memory": {name: "Muscle memory", maxXp: 100, effect: 0.01, description: "Strength xp"},

    "Mana control": {name: "Mana control", maxXp: 100, effect: 0.01, description: "T.A.A. xp"},
    "Immortality": {name: "Immortality", maxXp: 100, effect: 0.01, description: "Longer lifespan"},
    "Time warping": {name: "Time warping", maxXp: 100, effect: 0.01, description: "Gamespeed"},
    "Super immortality": {name: "Super immortality", maxXp: 100, effect: 0.01, description: "Longer lifespan"},

    "Dark influence": {name: "Dark influence", maxXp: 100, effect: 0.01, description: "All xp"},
    "Evil control": {name: "Evil control", maxXp: 100, effect: 0.01, description: "Evil gain"},
    "Intimidation": {name: "Intimidation", maxXp: 100, effect: -0.01, description: "Expenses"},
    "Demon training": {name: "Demon training", maxXp: 100, effect: 0.01, description: "All xp"},
    "Blood meditation": {name: "Blood meditation", maxXp: 100, effect: 0.01, description: "Evil gain"},
    "Demon's wealth": {name: "Demon's wealth", maxXp: 100, effect: 0.002, description: "Job pay"},
    
}

const itemBaseData = {
    "Homeless": {name: "Homeless", expense: 0, effect: 1},
    "Tent": {name: "Tent", expense: 15, effect: 1.4},
    "Wooden hut": {name: "Wooden hut", expense: 100, effect: 2},
    "Cottage": {name: "Cottage", expense: 750, effect: 3.5},
    "House": {name: "House", expense: 3000, effect: 6},
    "Large house": {name: "Large house", expense: 25000, effect: 12},
    "Small palace": {name: "Small palace", expense: 300000, effect: 25},
    "Grand palace": {name: "Grand palace", expense: 5000000, effect: 60},

    "Book": {name: "Book", expense: 10, effect: 1.5, description: "Skill xp"},
    "Dumbbells": {name: "Dumbbells", expense: 50, effect: 1.5, description: "Strength xp"},
    "Personal squire": {name: "Personal squire", expense: 200, effect: 2, description: "Job xp"},
    "Steel longsword": {name: "Steel longsword", expense: 1000, effect: 2, description: "Military xp"},
    "Butler": {name: "Butler", expense: 7500, effect: 1.5, description: "Happiness"},
    "Sapphire charm": {name: "Sapphire charm", expense: 50000, effect: 3, description: "Magic xp"},
    "Study desk": {name: "Study desk", expense: 1000000, effect: 2, description: "Skill xp"},
    "Library": {name: "Library", expense: 10000000, effect: 1.5, description: "Skill xp"},
}

const jobCategories = {
    "Common work": ["Beggar", "Farmer", "Fisherman", "Miner", "Blacksmith", "Merchant"],
    "Military" : ["Squire", "Footman", "Veteran footman", "Knight", "Veteran knight", "Elite knight", "Holy knight", "Legendary knight"],
    "The Arcane Association" : ["Student", "Apprentice mage", "Mage", "Wizard", "Master wizard", "Chairman"]
}

const skillCategories = {
    "Fundamentals": ["Concentration", "Productivity", "Bargaining", "Meditation"],
    "Combat": ["Strength", "Battle tactics", "Muscle memory"],
    "Magic": ["Mana control", "Immortality", "Time warping", "Super immortality"],
    "Dark magic": ["Dark influence", "Evil control", "Intimidation", "Demon training", "Blood meditation", "Demon's wealth"]
}

const itemCategories = {
    "Properties": ["Homeless", "Tent", "Wooden hut", "Cottage", "House", "Large house", "Small palace", "Grand palace"],
    "Misc": ["Book", "Dumbbells", "Personal squire", "Steel longsword", "Butler", "Sapphire charm", "Study desk", "Library"]
}

const headerRowColors = {
    "Common work": "#55a630",
    "Military": "#e63946",
    "The Arcane Association": "#C71585",
    "Fundamentals": "#4a4e69",
    "Combat": "#ff704d",
    "Magic": "#875F9A",
    "Dark magic": "#73000f",
    "Properties": "#219ebc",
    "Misc": "#b56576",
}

const tooltips = {
    "Beggar": "Struggle day and night for a couple of copper coins. It feels like you are at the brink of death each day.",
    "Farmer": "Plow the fields and grow the crops. It's not much but it's honest work.",
    "Fisherman": "Reel in various fish and sell them for a handful of coins. A relaxing but still a poor paying job.",
    "Miner": "Delve into dangerous caverns and mine valuable ores. The pay is quite meager compared to the risk involved.",
    "Blacksmith": "Smelt ores and carefully forge weapons for the military. A respectable and OK paying commoner job.",
    "Merchant": "Travel from town to town, bartering fine goods. The job pays decently well and is a lot less manually-intensive.",

    "Squire": "Carry around your knight's shield and sword along the battlefield. Very meager pay but the work experience is quite valuable.",
    "Footman": "Put down your life to battle with enemy soldiers. A courageous, respectable job but you are still worthless in the grand scheme of things.",
    "Veteran footman": "More experienced and useful than the average footman, take out the enemy forces in battle with your might. The pay is not that bad.",
    "Knight": "Slash and pierce through enemy soldiers with ease, while covered in steel from head to toe. A decently paying and very respectable job.",
    "Veteran knight": "Utilising your unmatched combat ability, slaugher enemies effortlessly. Most footmen in the military would never be able to acquire such a well paying job like this.",
    "Elite knight": "Obliterate squadrons of enemy soldiers in one go with extraordinary proficiency, while equipped with the finest gear. Such a feared unit on the battlefield is paid extremely well.",
    "Holy knight": "Collapse entire armies in mere seconds with your magically imbued blade. The handful of elite knights who attain this level of power are showered with coins.",
    "Legendary knight": "Feared worldwide, obliterate entire nations in a blink of an eye. Roughly every century, only one holy knight is worthy of receiving such an esteemed title.",

    "Student": "Study the theory of mana and practice basic spells. There is minor pay to cover living costs, however, this is a necessary stage in becoming a mage.",
    "Apprentice mage": "Under the supervision of a mage, perform basic spells against enemies in battle. Generous pay will be provided to cover living costs.",
    "Mage": "Turn the tides of battle through casting intermediate spells and mentor other apprentices. The pay for this particular job is extremely high.",
    "Wizard": "Utilise advanced spells to ravage and destroy entire legions of enemy soldiers. Only a small percentage of mages deserve to attain this role and are rewarded with an insanely high pay.",
    "Master wizard": "Blessed with unparalleled talent, perform unbelievable feats with magic at will. It is said that a master wizard has enough destructive power to wipe an empire off the map.",
    "Chairman": "Spend your days administrating The Arcane Association and investigate the concepts of true immortality. The chairman receives ludicrous amounts of pay daily.",

    "Concentration": "Improve your learning speed through practising intense concentration activities.",
    "Productivity": "Learn to procrastinate less at work and receive more job experience per day.",
    "Bargaining": "Study the tricks of the trade and persuasive skills to lower any type of expense.",
    "Meditation": "Fill your mind with peace and tranquility to tap into greater happiness from within.",

    "Strength": "Condition your body and strength through harsh training. Stronger individuals are paid more in the military.",
    "Battle tactics": "Create and revise battle strategies, improving experience gained in the military.",
    "Muscle memory": "Strengthen your neurons through habit and repetition, improving strength gains throughout the body.",

    "Mana control": "Strengthen your mana channels throughout your body, aiding you in becoming a more powerful magical user.",
    "Immortality": "Lengthen your lifespan through the means of magic. However, is this truly the immortality you have tried seeking for...?",
    "Time warping": "Bend space and time through forbidden techniques, resulting in a faster gamespeed.",
    "Super immortality": "Through harnessing ancient, forbidden techniques, lengthen your lifespan drastically beyond comprehension.",

    "Dark influence": "Encompass yourself with formidable power bestowed upon you by evil, allowing you to pick up and absorb any job or skill with ease.",
    "Evil control": "Tame the raging and growing evil within you, improving evil gain in-between rebirths.",
    "Intimidation": "Learn to emit a devilish aura which strikes extreme fear into other merchants, forcing them to give you heavy discounts.",
    "Demon training": "A mere human body is too feeble and weak to withstand evil. Train with forbidden methods to slowly manifest into a demon, capable of absorbing knowledge rapidly.",
    "Blood meditation": "Grow and culture the evil within you through the sacrifise of other living beings, drastically increasing evil gain.",
    "Demon's wealth": "Through the means of dark magic, multiply the raw matter of the coins you receive from your job.",

    "Homeless": "Sleep on the uncomfortable, filthy streets while almost freezing to death every night. It cannot get any worse than this.",
    "Tent": "A thin sheet of tattered cloth held up by a couple of feeble, wooden sticks. Horrible living conditions but at least you have a roof over your head.",
    "Wooden hut": "Shabby logs and dirty hay glued together with horse manure. Much more sturdy than a tent, however, the stench isn't very pleasant.",
    "Cottage": "Structured with a timber frame and a thatched roof. Provides decent living conditions for a fair price.",
    "House": "A building formed from stone bricks and sturdy timber, which contains a few rooms. Although quite expensive, it is a comfortable abode.",
    "Large house": "Much larger than a regular house, which boasts even more rooms and multiple floors. The building is quite spacious but comes with a hefty price tag.",
    "Small palace": "A very rich and meticulously built structure rimmed with fine metals such as silver. Extremely high expenses to maintain for a lavish lifestyle.",
    "Grand palace": "A grand residence completely composed of gold and silver. Provides the utmost luxurious and comfortable living conditions possible for a ludicrous price.",

    "Book": "A place to write down all your thoughts and discoveries, allowing you to learn a lot more quickly.",
    "Dumbbells": "Heavy tools used in strenuous exercise to toughen up and accumulate strength even faster than before. ",
    "Personal squire": "Assists you in completing day to day activities, giving you more time to be productive at work.",
    "Steel longsword": "A fine blade used to slay enemies even quicker in combat and therefore gain more experience.",
    "Butler": "Keeps your household clean at all times and also prepares three delicious meals per day, leaving you in a happier, stress-free mood.",
    "Sapphire charm": "Embedded with a rare sapphire, this charm activates more mana channels within your body, providing a much easier time learning magic.",
    "Study desk": "A dedicated area which provides many fine stationary and equipment designed for furthering your progress in research.",
    "Library": "Stores a collection of books, each containing vast amounts of information from basic life skills to complex magic spells.",
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
        task.xpMultipliers.push(getHappiness)
        task.xpMultipliers.push(getBindedTaskEffect("Dark influence"))
        task.xpMultipliers.push(getBindedTaskEffect("Demon training"))

        if (task instanceof Job) {
            task.incomeMultipliers.push(task.getLevelMultiplier.bind(task))
            task.incomeMultipliers.push(getBindedTaskEffect("Demon's wealth"))
            task.xpMultipliers.push(getBindedTaskEffect("Productivity"))
            task.xpMultipliers.push(getBindedItemEffect("Personal squire"))    
        } else if (task instanceof Skill) {
            task.xpMultipliers.push(getBindedTaskEffect("Concentration"))
            task.xpMultipliers.push(getBindedItemEffect("Book"))
            task.xpMultipliers.push(getBindedItemEffect("Study desk"))
            task.xpMultipliers.push(getBindedItemEffect("Library"))
        }

        if (jobCategories["Military"].includes(task.name)) {
            task.incomeMultipliers.push(getBindedTaskEffect("Strength"))
            task.xpMultipliers.push(getBindedTaskEffect("Battle tactics"))
            task.xpMultipliers.push(getBindedItemEffect("Steel longsword"))
        } else if (task.name == "Strength") {
            task.xpMultipliers.push(getBindedTaskEffect("Muscle memory"))
            task.xpMultipliers.push(getBindedItemEffect("Dumbbells"))
        } else if (skillCategories["Magic"].includes(task.name)) {
            task.xpMultipliers.push(getBindedItemEffect("Sapphire charm"))
        } else if (jobCategories["The Arcane Association"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Mana control"))
        } else if (skillCategories["Dark magic"].includes(task.name)) {
            task.xpMultipliers.push(getEvil)
        }
    }

    for (itemName in gameData.itemData) {
        var item = gameData.itemData[itemName]
        item.expenseMultipliers = []
        item.expenseMultipliers.push(getBindedTaskEffect("Bargaining"))
        item.expenseMultipliers.push(getBindedTaskEffect("Intimidation"))
    }
}

function setCustomEffects() {
    var bargaining = gameData.taskData["Bargaining"]
    bargaining.getEffect = function() {
        var multiplier = 1 - getBaseLog(7, bargaining.level + 1) / 10
        if (multiplier < 0.1) {multiplier = 0.1}
        return multiplier
    }

    var intimidation = gameData.taskData["Intimidation"]
    intimidation.getEffect = function() {
        var multiplier = 1 - getBaseLog(7, intimidation.level + 1) / 10
        if (multiplier < 0.1) {multiplier = 0.1}
        return multiplier
    }

    var timeWarping = gameData.taskData["Time warping"]
    timeWarping.getEffect = function() {
        var multiplier = 1 + getBaseLog(13, timeWarping.level + 1) 
        return multiplier
    }

    var immortality = gameData.taskData["Immortality"]
    immortality.getEffect = function() {
        var multiplier = 1 + getBaseLog(33, immortality.level + 1) 
        return multiplier
    }
}

function getHappiness() {
    var meditationEffect = getBindedTaskEffect("Meditation")
    var butlerEffect = getBindedItemEffect("Butler")
    var happiness = meditationEffect() * butlerEffect() * gameData.currentProperty.getEffect()
    return happiness
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
    var evilControl = gameData.taskData["Evil control"]
    var bloodMeditation = gameData.taskData["Blood meditation"]
    var evil = evilControl.getEffect() * bloodMeditation.getEffect()
    return evil
}

function getGameSpeed() {
    var timeWarping = gameData.taskData["Time warping"]
    var timeWarpingSpeed = gameData.timeWarpingEnabled ? timeWarping.getEffect() : 1
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
    try {
        var expense = 0
        
        if (gameData.currentProperty && typeof gameData.currentProperty.getExpense === 'function') {
            expense += gameData.currentProperty.getExpense()
        }
        
        if (gameData.currentMisc && Array.isArray(gameData.currentMisc)) {
            for (misc of gameData.currentMisc) {
                if (misc && typeof misc.getExpense === 'function') {
                    expense += misc.getExpense()
                }
            }
        }
        
        return expense
    } catch (error) {
        logger.error("Error in getExpense:", error)
        return 0
    }
}

function goBankrupt() {
    gameData.coins = 0
    gameData.currentProperty = gameData.itemData["Homeless"]
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
    
    // Initialize World tab content dynamically when clicked
    if (selectedTab === 'world' && window.worldTabManager) {
        window.worldTabManager.initialize();
    }
}

function setPause() {
    // Check if we're trying to unpause during an active adventure
    if (gameData.paused && window.storyAdventureManager) {
        try {
            if (window.storyAdventureManager.isAdventureActive() && !window.storyAdventureManager.canUnpauseGame()) {
                // Prevent unpause during active adventure
                logger.info('Cannot unpause during active adventure');
                return;
            }
        } catch (error) {
            logger.warn('Error checking adventure status:', error);
            // Continue with normal pause toggle if adventure check fails
        }
    }
    
    gameData.paused = !gameData.paused
}

function getPauseButtonState() {
    const state = {
        canUnpause: true,
        reason: null
    };
    
    if (window.storyAdventureManager) {
        try {
            if (window.storyAdventureManager.isAdventureActive() && !window.storyAdventureManager.canUnpauseGame()) {
                state.canUnpause = false;
                state.reason = 'adventure_active';
            }
        } catch (error) {
            logger.warn('Error checking adventure status for pause button:', error);
            // Default to allowing unpause if check fails
        }
    }
    
    return state;
}

function setTimeWarping() {
    gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled
}

function setTask(taskName) {
    var task = gameData.taskData[taskName]
    task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task
    domCache.dirtyFlags.tasks = true // Mark tasks as dirty
}

function setProperty(propertyName) {
    var property = gameData.itemData[propertyName]
    gameData.currentProperty = property
    domCache.dirtyFlags.items = true // Mark items as dirty
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
    domCache.dirtyFlags.items = true // Mark items as dirty
}

function createData(data, baseData) {
    for (var key in baseData) {
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

    // Ensure style property exists before setting properties
    if (!headerRow.style) {
        headerRow.style = {};
    }
    
    // Ensure classList property exists before setting properties
    if (!headerRow.classList) {
        headerRow.classList = {
            add: function(className) {
                if (!this.classNames) this.classNames = [];
                if (!this.classNames.includes(className)) {
                    this.classNames.push(className);
                }
            },
            remove: function(className) {
                if (this.classNames) {
                    this.classNames = this.classNames.filter(c => c !== className);
                }
            },
            contains: function(className) {
                return this.classNames ? this.classNames.includes(className) : false;
            }
        };
    }
    
    headerRow.style.backgroundColor = headerRowColors[categoryName]
    headerRow.style.color = "#ffffff"
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

    for (var categoryName in categoryType) {
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
    // Use cached DOM elements for better performance
    for (key in gameData.taskData) {
        var task = gameData.taskData[key]
        var cached = domCache.elements.taskRows[task.name]
        
        if (!cached) continue // Skip if not cached yet
        
        // Update text content using cached elements
        cached.level.textContent = task.level
        cached.xpGain.textContent = format(task.getXpGain())
        cached.xpLeft.textContent = format(task.getXpLeft())

        // Update max level display
        cached.maxLevel.textContent = task.maxLevel
        if (gameData.rebirthOneCount > 0) {
            cached.maxLevel.classList.remove("hidden")
        } else {
            cached.maxLevel.classList.add("hidden")
        }

        // Update progress bar
        cached.progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%"
        if (task == gameData.currentJob || task == gameData.currentSkill) {
            cached.progressFill.classList.add("current")
        } else {
            cached.progressFill.classList.remove("current")
        }

        // Update value display
        cached.income.style.display = task instanceof Job ? "block" : "none"
        cached.effect.style.display = task instanceof Skill ? "block" : "none"

        // Update skip skill display
        cached.skipSkill.style.display = task instanceof Skill && autoLearnElement.checked ? "block" : "none"

        // Update income/effect values
        if (task instanceof Job) {
            formatCoins(task.getIncome(), cached.income)
        } else {
            cached.effect.textContent = task.getEffectDescription()
        }
    }
}

function updateItemRows() {
    // Use cached DOM elements for better performance
    for (key in gameData.itemData) {
        var item = gameData.itemData[key]
        var cached = domCache.elements.itemRows[item.name]
        
        if (!cached) continue // Skip if not cached yet
        
        // Update button state
        cached.button.disabled = gameData.coins < item.getExpense()
        
        // Update active state
        var color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"]
        cached.active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white"
        
        // Update effect and expense
        cached.effect.textContent = item.getEffectDescription()
        formatCoins(item.getExpense(), cached.expense)
    }
}

function updateHeaderRows(categories) {
    for (categoryName in categories) {
        var className = removeSpaces(categoryName)
        var headerRow = document.getElementsByClassName(className)[0]
        var maxLevelElement = headerRow.getElementsByClassName("maxLevel")[0]
        gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove("hidden") : maxLevelElement.classList.add("hidden")
        var skipSkillElement = headerRow.getElementsByClassName("skipSkill")[0]
        skipSkillElement.style.display = categories == skillCategories && autoLearnElement.checked ? "block" : "none"
    }
}

function updateText() {
    // Use cached DOM elements for better performance
    var elements = domCache.elements
    
    // Update sidebar text using cached elements
    elements.ageDisplay.textContent = daysToYears(gameData.days)
    elements.dayDisplay.textContent = getDay()
    elements.lifespanDisplay.textContent = daysToYears(getLifespan())
    // Update pause button with adventure status
    const pauseState = getPauseButtonState();
    if (gameData.paused && !pauseState.canUnpause) {
        elements.pauseButton.textContent = "Paused (Adventure Active)";
        elements.pauseButton.disabled = true;
    } else {
        elements.pauseButton.textContent = gameData.paused ? "Play" : "Pause";
        elements.pauseButton.disabled = false;
    }

    formatCoins(gameData.coins, elements.coinDisplay)
    setSignDisplay()
    formatCoins(getNet(), elements.netDisplay)
    formatCoins(getIncome(), elements.incomeDisplay)
    formatCoins(getExpense(), elements.expenseDisplay)

    elements.happinessDisplay.textContent = getHappiness().toFixed(1)
    elements.evilDisplay.textContent = gameData.evil.toFixed(1)
    elements.evilGainDisplay.textContent = getEvilGain().toFixed(1)

    elements.timeWarpingDisplay.textContent = "x" + gameData.taskData["Time warping"].getEffect().toFixed(2)
    elements.timeWarpingButton.textContent = gameData.timeWarpingEnabled ? "Disable warp" : "Enable warp"
}

function setSignDisplay() {
    // Use cached DOM element for better performance
    var signDisplay = domCache.elements.signDisplay
    if (getIncome() > getExpense()) {
        signDisplay.textContent = "+"
        signDisplay.style.color = "green"
    } else if (getExpense() > getIncome()) {
        signDisplay.textContent = "-"
        signDisplay.style.color = "red"
    } else {
        signDisplay.textContent = ""
        signDisplay.style.color = "gray"
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
    try {
        if (!task) {
            console.warn("doCurrentTask called with null/undefined task")
            return
        }
        
        if (typeof task.increaseXp !== 'function') {
            console.warn("Task does not have increaseXp method:", task)
            return
        }
        
        task.increaseXp()
        
        if (task instanceof Job) {
            increaseCoins()
        }
        
    } catch (error) {
        console.error("Error in doCurrentTask:", error, "Task:", task)
    }
}

function getIncome() {
    try {
        var income = 0
        if (gameData.currentJob && typeof gameData.currentJob.getIncome === 'function') {
            income += gameData.currentJob.getIncome()
        }
        return income
    } catch (error) {
        console.error("Error in getIncome:", error)
        return 0
    }
}

function increaseCoins() {
    var coins = applySpeed(getIncome())
    gameData.coins += coins
    
    // Validate and clamp coins to prevent overflow
    if (gameData.coins < 0) {
        gameData.coins = 0
    } else if (gameData.coins > GAME_CONFIG.MAX_COINS) {
        gameData.coins = GAME_CONFIG.MAX_COINS
        console.warn("Coins capped at maximum value:", GAME_CONFIG.MAX_COINS)
    }
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
    if (!autoPromoteElement.checked) return
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
        skillWithLowestMaxXp = gameData.taskData["Concentration"]
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
    if (!autoLearnElement.checked || !skillWithLowestMaxXp) return
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
    
    // Validate and clamp days to prevent overflow
    if (gameData.days < 0) {
        gameData.days = 0
    } else if (gameData.days > GAME_CONFIG.MAX_AGE * 365) {
        gameData.days = GAME_CONFIG.MAX_AGE * 365
        console.warn("Age capped at maximum value:", GAME_CONFIG.MAX_AGE, "years")
    }
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
    gameData.currentJob = gameData.taskData["Beggar"]
    gameData.currentSkill = gameData.taskData["Concentration"]
    gameData.currentProperty = gameData.itemData["Homeless"]
    gameData.currentMisc = []

    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]
        if (task.level > task.maxLevel) task.maxLevel = task.level
        task.level = 0
        task.xp = 0
    }

    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        if (requirement.completed && permanentUnlocks.includes(key)) continue
        requirement.completed = false
    }
}

function getLifespan() {
    var immortality = gameData.taskData["Immortality"]
    var superImmortality = gameData.taskData["Super immortality"]
    var lifespan = baseLifespan * immortality.getEffect() * superImmortality.getEffect()
    return lifespan
}

function isAlive() {
    var condition = gameData.days < getLifespan()
    var deathText = document.getElementById("deathText")
    if (!condition) {
        gameData.days = getLifespan()
        deathText.classList.remove("hidden")
    }
    else {
        deathText.classList.add("hidden")
    }
    return condition
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

    // Safely reassign current entities with error handling
    try {
        if (gameData.currentJob && gameData.currentJob.name && gameData.taskData[gameData.currentJob.name]) {
            gameData.currentJob = gameData.taskData[gameData.currentJob.name]
        } else {
            console.warn("Invalid currentJob, resetting to Beggar")
            gameData.currentJob = gameData.taskData["Beggar"]
        }
        
        if (gameData.currentSkill && gameData.currentSkill.name && gameData.taskData[gameData.currentSkill.name]) {
            gameData.currentSkill = gameData.taskData[gameData.currentSkill.name]
        } else {
            console.warn("Invalid currentSkill, resetting to Concentration")
            gameData.currentSkill = gameData.taskData["Concentration"]
        }
        
        if (gameData.currentProperty && gameData.currentProperty.name && gameData.itemData[gameData.currentProperty.name]) {
            gameData.currentProperty = gameData.itemData[gameData.currentProperty.name]
        } else {
            console.warn("Invalid currentProperty, resetting to Homeless")
            gameData.currentProperty = gameData.itemData["Homeless"]
        }
        
        var newArray = []
        if (gameData.currentMisc && Array.isArray(gameData.currentMisc)) {
            for (misc of gameData.currentMisc) {
                if (misc && misc.name && gameData.itemData[misc.name]) {
                    newArray.push(gameData.itemData[misc.name])
                }
            }
        }
        gameData.currentMisc = newArray
        
    } catch (error) {
        console.error("Error in assignMethods:", error)
        // Reset to safe defaults
        gameData.currentJob = gameData.taskData["Beggar"]
        gameData.currentSkill = gameData.taskData["Concentration"]
        gameData.currentProperty = gameData.itemData["Homeless"]
        gameData.currentMisc = []
    }
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
    try {
        // Validate game data before saving
        if (!isValidGameData(gameData)) {
            console.warn("Invalid game data detected, skipping save")
            return
        }
        
        localStorage.setItem("gameDataSave", JSON.stringify(gameData))
    } catch (error) {
        console.error("Error saving game data:", error)
        // Try to clear corrupted data
        try {
            localStorage.removeItem("gameDataSave")
        } catch (clearError) {
            console.error("Failed to clear corrupted save data:", clearError)
        }
    }
}

function loadGameData() {
    try {
        var gameDataSave = localStorage.getItem("gameDataSave")
        
        if (gameDataSave === null) {
            logger.info("No saved game data found, starting fresh")
            return
        }

        var parsedData = JSON.parse(gameDataSave)
        
        // Validate that the saved data has the required structure
        if (!isValidGameData(parsedData)) {
            logger.warn("Invalid saved game data detected, starting fresh")
            localStorage.removeItem("gameDataSave")
            return
        }

        // Additional validation for game state consistency
        if (parsedData.days && parsedData.days < 0) {
            logger.warn("Invalid days value in saved data, resetting to 14 years")
            parsedData.days = 365 * 14
        }

        replaceSaveDict(gameData, parsedData)
        replaceSaveDict(gameData.requirements, parsedData.requirements)
        replaceSaveDict(gameData.taskData, parsedData.taskData)
        replaceSaveDict(gameData.itemData, parsedData.itemData)

        gameData = parsedData
        logger.info("Game data loaded successfully")
        
    } catch (error) {
        logger.error("Error loading game data:", error)
        console.error("Error loading game data:", error)
        logger.info("Starting with fresh game data")
        localStorage.removeItem("gameDataSave")
    }

    assignMethods()
}

function isValidGameData(data) {
    // Check if data has required properties
    if (!data || typeof data !== 'object') {
        return false
    }
    
    // Check required top-level properties
    const requiredProps = ['taskData', 'itemData', 'requirements', 'coins', 'days', 'evil']
    for (const prop of requiredProps) {
        if (!(prop in data)) {
            console.warn(`Missing required property: ${prop}`)
            return false
        }
    }
    
    // Check that currentJob and currentSkill are properly set
    if (!data.currentJob || !data.currentSkill) {
        console.warn("Missing currentJob or currentSkill")
        return false
    }
    
    // Check that required tasks exist (handle both string names and object references)
    const currentJobName = typeof data.currentJob === 'string' ? data.currentJob : data.currentJob.name
    const currentSkillName = typeof data.currentSkill === 'string' ? data.currentSkill : data.currentSkill.name
    
    if (!data.taskData[currentJobName] || !data.taskData[currentSkillName]) {
        console.warn("Current job or skill not found in taskData")
        return false
    }
    
    // Check that required items exist (handle both string names and object references)
    if (data.currentProperty) {
        const currentPropertyName = typeof data.currentProperty === 'string' ? data.currentProperty : data.currentProperty.name
        if (!data.itemData[currentPropertyName]) {
            console.warn("Current property not found in itemData")
            return false
        }
    }
    
    return true
}

function validateGameDataRanges(data) {
    try {
        // Validate basic numeric ranges
        if (typeof data.coins !== 'number' || data.coins < 0 || data.coins > GAME_CONFIG.MAX_COINS) {
            console.warn("Invalid coins value:", data.coins)
            return false
        }
        
        if (typeof data.days !== 'number' || data.days < 0 || data.days > GAME_CONFIG.MAX_AGE * 365) {
            console.warn("Invalid days value:", data.days)
            return false
        }
        
        if (typeof data.evil !== 'number' || data.evil < 0 || data.evil > GAME_CONFIG.MAX_EVIL) {
            console.warn("Invalid evil value:", data.evil)
            return false
        }
        
        // Validate task data
        if (data.taskData) {
            for (const taskName in data.taskData) {
                const task = data.taskData[taskName]
                if (typeof task.level !== 'number' || task.level < 0 || task.level > GAME_CONFIG.MAX_LEVEL) {
                    console.warn("Invalid task level:", taskName, task.level)
                    return false
                }
                if (typeof task.xp !== 'number' || task.xp < 0 || task.xp > GAME_CONFIG.MAX_XP) {
                    console.warn("Invalid task XP:", taskName, task.xp)
                    return false
                }
            }
        }
        
        // Validate item data
        if (data.itemData) {
            for (const itemName in data.itemData) {
                const item = data.itemData[itemName]
                if (typeof item.level !== 'number' || item.level < 0 || item.level > GAME_CONFIG.MAX_LEVEL) {
                    console.warn("Invalid item level:", itemName, item.level)
                    return false
                }
            }
        }
        
        return true
        
    } catch (error) {
        console.error("Error validating game data ranges:", error)
        return false
    }
}

function updateUI() {
    // Performance optimization: Throttle UI updates
    var now = Date.now()
    if (now - domCache.lastUpdate < domCache.updateThrottle) {
        return // Skip update if too soon
    }
    domCache.lastUpdate = now
    
    // Only update what's necessary based on dirty flags
    if (domCache.dirtyFlags.tasks) {
        updateTaskRows()
        domCache.dirtyFlags.tasks = false
    }
    
    if (domCache.dirtyFlags.items) {
        updateItemRows()
        domCache.dirtyFlags.items = false
    }
    
    if (domCache.dirtyFlags.requirements) {
        updateRequiredRows(gameData.taskData, jobCategories)
        updateRequiredRows(gameData.taskData, skillCategories)
        updateRequiredRows(gameData.itemData, itemCategories)
        updateHeaderRows(jobCategories)
        updateHeaderRows(skillCategories)
        domCache.dirtyFlags.requirements = false
    }
    
    if (domCache.dirtyFlags.text) {
        updateQuickTaskDisplay("job")
        updateQuickTaskDisplay("skill")
        hideEntities()
        updateText()
        domCache.dirtyFlags.text = false
    }
}

function update() {
    try {
        // Skip all game updates if paused (including during adventures)
        if (gameData.paused) {
            return;
        }
        
        increaseDays()
        autoPromote()
        autoLearn()
        
        // Safely execute current tasks with error handling
        if (gameData.currentJob && typeof gameData.currentJob.increaseXp === 'function') {
            doCurrentTask(gameData.currentJob)
            domCache.dirtyFlags.tasks = true // Mark tasks as dirty
        } else {
            console.warn("Invalid currentJob, skipping task execution")
        }
        
        if (gameData.currentSkill && typeof gameData.currentSkill.increaseXp === 'function') {
            doCurrentTask(gameData.currentSkill)
            domCache.dirtyFlags.tasks = true // Mark tasks as dirty
        } else {
            console.warn("Invalid currentSkill, skipping task execution")
        }
        
        applyExpenses()
        domCache.dirtyFlags.text = true // Mark text as dirty (coins, income, etc.)
        updateUI()
        
    } catch (error) {
        console.error("Error in game update loop:", error)
        // Try to recover by resetting to safe state
        try {
            gameData.currentJob = gameData.taskData["Beggar"]
            gameData.currentSkill = gameData.taskData["Concentration"]
            gameData.currentProperty = gameData.itemData["Homeless"]
            gameData.currentMisc = []
        } catch (recoveryError) {
            console.error("Failed to recover from update error:", recoveryError)
        }
    }
}

function resetGameData() {
    localStorage.clear()
    location.reload()
}

function resetGameState() {
    // Reset to a clean initial state
    gameData.coins = 0
    gameData.days = 365 * 14
    gameData.evil = 0
    gameData.paused = false
    gameData.timeWarpingEnabled = true
    gameData.rebirthOneCount = 0
    gameData.rebirthTwoCount = 0
    
    // Reset current entities
    if (gameData.taskData["Beggar"]) {
        gameData.currentJob = gameData.taskData["Beggar"]
    }
    if (gameData.taskData["Concentration"]) {
        gameData.currentSkill = gameData.taskData["Concentration"]
    }
    if (gameData.itemData["Homeless"]) {
        gameData.currentProperty = gameData.itemData["Homeless"]
    }
    gameData.currentMisc = []
    
    // Reset all task levels
    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]
        task.level = 0
        task.xp = 0
    }
    
    // Reset requirements
    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        if (!permanentUnlocks.includes(key)) {
            requirement.completed = false
        }
    }
    
    logger.info("Game state reset to initial values")
}

function importGameData() {
    try {
        var importExportBox = document.getElementById("importExportBox")
        
        if (!importExportBox || !importExportBox.value) {
            alert("No data to import. Please paste your save data first.")
            return
        }
        
        // Validate input format
        var decodedData
        try {
            decodedData = window.atob(importExportBox.value)
        } catch (error) {
            alert("Invalid save data format. Please check your data and try again.")
            return
        }
        
        // Parse and validate JSON
        var data
        try {
            data = JSON.parse(decodedData)
        } catch (error) {
            alert("Invalid JSON data. Please check your save data and try again.")
            return
        }
        
        // Validate game data structure
        if (!isValidGameData(data)) {
            alert("Invalid game data structure. This save data may be corrupted or from a different version.")
            return
        }
        
        // Validate data ranges
        if (!validateGameDataRanges(data)) {
            alert("Game data contains invalid values. This save data may be corrupted.")
            return
        }
        
        // Confirm import
        if (!confirm("This will replace your current game data. Are you sure you want to continue?")) {
            return
        }
        
        gameData = data
        saveGameData()
        location.reload()
        
    } catch (error) {
        console.error("Error importing game data:", error)
        alert("An error occurred while importing the game data. Please try again.")
    }
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

gameData.currentJob = gameData.taskData["Beggar"]
gameData.currentSkill = gameData.taskData["Concentration"]
gameData.currentProperty = gameData.itemData["Homeless"]
gameData.currentMisc = []

gameData.requirements = {
    //Other
    "The Arcane Association": new TaskRequirement(getElementsByClass("The Arcane Association"), [{task: "Concentration", requirement: 200}, {task: "Meditation", requirement: 200}]),
    "Dark magic": new EvilRequirement(getElementsByClass("Dark magic"), [{requirement: 1}]),
    "Shop": new CoinRequirement([document.getElementById("shopTabButton")], [{requirement: gameData.itemData["Tent"].getExpense() * 50}]),
    "Rebirth tab": new AgeRequirement([document.getElementById("rebirthTabButton")], [{requirement: 25}]),
    "Rebirth note 1": new AgeRequirement([document.getElementById("rebirthNote1")], [{requirement: 45}]),
    "Rebirth note 2": new AgeRequirement([document.getElementById("rebirthNote2")], [{requirement: 65}]),
    "Rebirth note 3": new AgeRequirement([document.getElementById("rebirthNote3")], [{requirement: 200}]),
    "Evil info": new EvilRequirement([document.getElementById("evilInfo")], [{requirement: 1}]),
    "Time warping info": new TaskRequirement([document.getElementById("timeWarping")], [{task: "Mage", requirement: 10}]),
    "Automation": new AgeRequirement([document.getElementById("automation")], [{requirement: 20}]),
    "Quick task display": new AgeRequirement([document.getElementById("quickTaskDisplay")], [{requirement: 20}]),

    //Common work
    "Beggar": new TaskRequirement([getTaskElement("Beggar")], []),
    "Farmer": new TaskRequirement([getTaskElement("Farmer")], [{task: "Beggar", requirement: 10}]),
    "Fisherman": new TaskRequirement([getTaskElement("Fisherman")], [{task: "Farmer", requirement: 10}]),
    "Miner": new TaskRequirement([getTaskElement("Miner")], [{task: "Strength", requirement: 10}, {task: "Fisherman", requirement: 10}]),
    "Blacksmith": new TaskRequirement([getTaskElement("Blacksmith")], [{task: "Strength", requirement: 30}, {task: "Miner", requirement: 10}]),
    "Merchant": new TaskRequirement([getTaskElement("Merchant")], [{task: "Bargaining", requirement: 50}, {task: "Blacksmith", requirement: 10}]),

    //Military 
    "Squire": new TaskRequirement([getTaskElement("Squire")], [{task: "Strength", requirement: 5}]),
    "Footman": new TaskRequirement([getTaskElement("Footman")], [{task: "Strength", requirement: 20}, {task: "Squire", requirement: 10}]),
    "Veteran footman": new TaskRequirement([getTaskElement("Veteran footman")], [{task: "Battle tactics", requirement: 40}, {task: "Footman", requirement: 10}]),
    "Knight": new TaskRequirement([getTaskElement("Knight")], [{task: "Strength", requirement: 100}, {task: "Veteran footman", requirement: 10}]),
    "Veteran knight": new TaskRequirement([getTaskElement("Veteran knight")], [{task: "Battle tactics", requirement: 150}, {task: "Knight", requirement: 10}]),
    "Elite knight": new TaskRequirement([getTaskElement("Elite knight")], [{task: "Strength", requirement: 300}, {task: "Veteran knight", requirement: 10}]),
    "Holy knight": new TaskRequirement([getTaskElement("Holy knight")], [{task: "Mana control", requirement: 500}, {task: "Elite knight", requirement: 10}]),
    "Legendary knight": new TaskRequirement([getTaskElement("Legendary knight")], [{task: "Mana control", requirement: 1000}, {task: "Battle tactics", requirement: 1000}, {task: "Holy knight", requirement: 10}]),

    //The Arcane Association
    "Student": new TaskRequirement([getTaskElement("Student")], [{task: "Concentration", requirement: 200}, {task: "Meditation", requirement: 200}]),
    "Apprentice mage": new TaskRequirement([getTaskElement("Apprentice mage")], [{task: "Mana control", requirement: 400}, {task: "Student", requirement: 10}]),
    "Mage": new TaskRequirement([getTaskElement("Mage")], [{task: "Mana control", requirement: 700}, {task: "Apprentice mage", requirement: 10}]),
    "Wizard": new TaskRequirement([getTaskElement("Wizard")], [{task: "Mana control", requirement: 1000}, {task: "Mage", requirement: 10}]),
    "Master wizard": new TaskRequirement([getTaskElement("Master wizard")], [{task: "Mana control", requirement: 1500}, {task: "Wizard", requirement: 10}]),
    "Chairman": new TaskRequirement([getTaskElement("Chairman")], [{task: "Mana control", requirement: 2000}, {task: "Master wizard", requirement: 10}]),

    //Fundamentals
    "Concentration": new TaskRequirement([getTaskElement("Concentration")], []),
    "Productivity": new TaskRequirement([getTaskElement("Productivity")], [{task: "Concentration", requirement: 5}]),
    "Bargaining": new TaskRequirement([getTaskElement("Bargaining")], [{task: "Concentration", requirement: 20}]),
    "Meditation": new TaskRequirement([getTaskElement("Meditation")], [{task: "Concentration", requirement: 30}, {task: "Productivity", requirement: 20}]),

    //Combat
    "Strength": new TaskRequirement([getTaskElement("Strength")], []),
    "Battle tactics": new TaskRequirement([getTaskElement("Battle tactics")], [{task: "Concentration", requirement: 20}]),
    "Muscle memory": new TaskRequirement([getTaskElement("Muscle memory")], [{task: "Concentration", requirement: 30}, {task: "Strength", requirement: 30}]),

    //Magic
    "Mana control": new TaskRequirement([getTaskElement("Mana control")], [{task: "Concentration", requirement: 200}, {task: "Meditation", requirement: 200}]),
    "Immortality": new TaskRequirement([getTaskElement("Immortality")], [{task: "Apprentice mage", requirement: 10}]),
    "Time warping": new TaskRequirement([getTaskElement("Time warping")], [{task: "Mage", requirement: 10}]),
    "Super immortality": new TaskRequirement([getTaskElement("Super immortality")], [{task: "Chairman", requirement: 1000}]),

    //Dark magic
    "Dark influence": new EvilRequirement([getTaskElement("Dark influence")], [{requirement: 1}]),
    "Evil control": new EvilRequirement([getTaskElement("Evil control")], [{requirement: 1}]),
    "Intimidation": new EvilRequirement([getTaskElement("Intimidation")], [{requirement: 1}]),
    "Demon training": new EvilRequirement([getTaskElement("Demon training")], [{requirement: 25}]),
    "Blood meditation": new EvilRequirement([getTaskElement("Blood meditation")], [{requirement: 75}]),
    "Demon's wealth": new EvilRequirement([getTaskElement("Demon's wealth")], [{requirement: 500}]),

    //Properties
    "Homeless": new CoinRequirement([getItemElement("Homeless")], [{requirement: 0}]),
    "Tent": new CoinRequirement([getItemElement("Tent")], [{requirement: 0}]),
    "Wooden hut": new CoinRequirement([getItemElement("Wooden hut")], [{requirement: gameData.itemData["Wooden hut"].getExpense() * 100}]),
    "Cottage": new CoinRequirement([getItemElement("Cottage")], [{requirement: gameData.itemData["Cottage"].getExpense() * 100}]),
    "House": new CoinRequirement([getItemElement("House")], [{requirement: gameData.itemData["House"].getExpense() * 100}]),
    "Large house": new CoinRequirement([getItemElement("Large house")], [{requirement: gameData.itemData["Large house"].getExpense() * 100}]),
    "Small palace": new CoinRequirement([getItemElement("Small palace")], [{requirement: gameData.itemData["Small palace"].getExpense() * 100}]),
    "Grand palace": new CoinRequirement([getItemElement("Grand palace")], [{requirement: gameData.itemData["Grand palace"].getExpense() * 100}]),

    //Misc
    "Book": new CoinRequirement([getItemElement("Book")], [{requirement: 0}]),
    "Dumbbells": new CoinRequirement([getItemElement("Dumbbells")], [{requirement: gameData.itemData["Dumbbells"].getExpense() * 100}]),
    "Personal squire": new CoinRequirement([getItemElement("Personal squire")], [{requirement: gameData.itemData["Personal squire"].getExpense() * 100}]),
    "Steel longsword": new CoinRequirement([getItemElement("Steel longsword")], [{requirement: gameData.itemData["Steel longsword"].getExpense() * 100}]),
    "Butler": new CoinRequirement([getItemElement("Butler")], [{requirement: gameData.itemData["Butler"].getExpense() * 100}]),
    "Sapphire charm": new CoinRequirement([getItemElement("Sapphire charm")], [{requirement: gameData.itemData["Sapphire charm"].getExpense() * 100}]),
    "Study desk": new CoinRequirement([getItemElement("Study desk")], [{requirement: gameData.itemData["Study desk"].getExpense() * 100}]),
    "Library": new CoinRequirement([getItemElement("Library")], [{requirement: gameData.itemData["Library"].getExpense() * 100}]), 
}

tempData["requirements"] = {}
for (key in gameData.requirements) {
    var requirement = gameData.requirements[key]
    tempData["requirements"][key] = requirement
}

// Initialize game when DOM is ready
function initializeGame() {
    try {
        loadGameData()
        
        // Check if game state is corrupted and reset if necessary
        if (!gameData.currentJob || !gameData.currentSkill || !gameData.currentProperty) {
            logger.warn('Corrupted game state detected, resetting to initial values');
            resetGameState();
        }
        
        // Check if character is in an impossible state (dead but young)
        if (gameData.days >= getLifespan() && gameData.days < 365 * 20) {
            logger.warn('Character in impossible death state, resetting age');
            gameData.days = 365 * 14;
        }
        
        setCustomEffects()
        addMultipliers()
        
        // Initialize DOM caching for performance optimization
        cacheDOMElements()
        
        setTab(jobTabButton, "jobs")
        
        update()
        setInterval(update, 1000 / updateSpeed)
        setInterval(saveGameData, 3000)
        setInterval(setSkillWithLowestMaxXp, 1000)
        
        logger.info('Game initialized successfully');
    } catch (error) {
        logger.error('Error initializing game:', error);
        console.error('Game initialization failed:', error);
        // Try to reset and continue
        try {
            resetGameState();
            logger.info('Game state reset, continuing...');
        } catch (resetError) {
            logger.error('Failed to reset game state:', resetError);
        }
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}