// Game configuration constants
export const GAME_CONFIG = {
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
};

// DOM element IDs
export const DOM_IDS = {
    // Tabs
    JOB_TAB_BUTTON: "jobTabButton",
    SHOP_TAB_BUTTON: "shopTabButton", 
    REBIRTH_TAB_BUTTON: "rebirthTabButton",
    
    // Displays
    AGE_DISPLAY: "ageDisplay",
    DAY_DISPLAY: "dayDisplay",
    LIFESPAN_DISPLAY: "lifespanDisplay",
    COIN_DISPLAY: "coinDisplay",
    NET_DISPLAY: "netDisplay",
    INCOME_DISPLAY: "incomeDisplay",
    EXPENSE_DISPLAY: "expenseDisplay",
    HAPPINESS_DISPLAY: "happinessDisplay",
    EVIL_DISPLAY: "evilDisplay",
    EVIL_GAIN_DISPLAY: "evilGainDisplay",
    TIME_WARPING_DISPLAY: "timeWarpingDisplay",
    QUICK_TASK_DISPLAY: "quickTaskDisplay",
    
    // Buttons
    PAUSE_BUTTON: "pauseButton",
    TIME_WARPING_BUTTON: "timeWarpingButton",
    
    // Tables
    JOB_TABLE: "jobTable",
    SKILL_TABLE: "skillTable",
    ITEM_TABLE: "itemTable",
    
    // Other
    BODY: "body",
    DEATH_TEXT: "deathText",
    IMPORT_EXPORT_BOX: "importExportBox",
    AUTOMATION: "automation",
    TIME_WARPING: "timeWarping",
    EVIL_INFO: "evilInfo",
    REBIRTH_NOTE_1: "rebirthNote1",
    REBIRTH_NOTE_2: "rebirthNote2", 
    REBIRTH_NOTE_3: "rebirthNote3",
};

// CSS classes
export const CSS_CLASSES = {
    TAB: "tab",
    TAB_BUTTON: "tabButton",
    REQUIRED_ROW: "requiredRow",
    HEADER_ROW: "headerRow",
    HIDDEN_TASK: "hiddenTask",
    HIDDEN: "hidden",
    DARK: "dark",
    CURRENT: "current",
    W3_BLUE_GRAY: "w3-blue-gray",
    
    // Templates
    HEADER_ROW_TASK_TEMPLATE: "headerRowTaskTemplate",
    HEADER_ROW_ITEM_TEMPLATE: "headerRowItemTemplate",
    ROW_TASK_TEMPLATE: "rowTaskTemplate",
    ROW_ITEM_TEMPLATE: "rowItemTemplate",
    REQUIRED_ROW_TEMPLATE: "requiredRowTemplate",
};

// Local storage keys
export const STORAGE_KEYS = {
    GAME_DATA_SAVE: "gameDataSave",
};
