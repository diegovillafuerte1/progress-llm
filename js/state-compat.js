// State management compatibility layer
import { GameManager } from '../src/core/GameManager.js';
import log from 'loglevel';

// Set up logging
const logger = log.noConflict();
logger.setLevel('warn'); // Only show warnings and errors in production

// Global game manager instance
let gameManager = null;

// Initialize the new state management system
async function initializeNewStateManagement() {
    try {
        gameManager = new GameManager();
        await gameManager.initialize();
        
        // Export game manager to global scope for debugging
        window.gameManager = gameManager;
        
        logger.info('New state management system initialized');
        return gameManager;
    } catch (error) {
        logger.error('Error initializing new state management:', error);
        throw error;
    }
}

// Compatibility functions that bridge old and new systems
function setTask(taskName) {
    if (gameManager) {
        gameManager.setTask(taskName);
    }
}

function setProperty(propertyName) {
    if (gameManager) {
        gameManager.setProperty(propertyName);
    }
}

function setMisc(miscName) {
    if (gameManager) {
        gameManager.setMisc(miscName);
    }
}

function setPause() {
    if (gameManager && gameManager.gameLoop) {
        gameManager.gameLoop.togglePause();
    }
}

function setTimeWarping() {
    if (gameManager && gameManager.gameLoop) {
        gameManager.gameLoop.toggleTimeWarping();
    }
}

function setTab(element, selectedTab) {
    if (gameManager && gameManager.uiUpdater) {
        gameManager.uiUpdater.setTab(element, selectedTab);
    }
}

function rebirthOne() {
    if (gameManager) {
        gameManager.rebirthOne();
    }
}

function rebirthTwo() {
    if (gameManager) {
        gameManager.rebirthTwo();
    }
}

function setLightDarkMode() {
    if (gameManager) {
        gameManager.toggleLightDarkMode();
    }
}

function resetGameData() {
    if (gameManager) {
        gameManager.resetGameData();
    }
}

function importGameData() {
    if (gameManager) {
        gameManager.importGameData();
    }
}

function exportGameData() {
    if (gameManager) {
        gameManager.exportGameData();
    }
}

// Export compatibility functions to global scope
window.setTask = setTask;
window.setProperty = setProperty;
window.setMisc = setMisc;
window.setPause = setPause;
window.setTimeWarping = setTimeWarping;
window.setTab = setTab;
window.rebirthOne = rebirthOne;
window.rebirthTwo = rebirthTwo;
window.setLightDarkMode = setLightDarkMode;
window.resetGameData = resetGameData;
window.importGameData = importGameData;
window.exportGameData = exportGameData;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNewStateManagement);
} else {
    initializeNewStateManagement();
}
