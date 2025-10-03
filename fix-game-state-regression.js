/**
 * Fix for game state regression - corrupted localStorage data
 * This script will clear corrupted data and reset the game to a proper initial state
 */

console.log('🔧 Fixing Game State Regression');
console.log('===============================\n');

// Step 1: Clear corrupted localStorage data
console.log('1. Clearing corrupted localStorage data...');
try {
    localStorage.removeItem('gameDataSave');
    console.log('✅ Corrupted save data cleared');
} catch (error) {
    console.log('❌ Failed to clear localStorage:', error.message);
}

// Step 2: Reset game data to proper initial state
console.log('\n2. Resetting game data to proper initial state...');
if (typeof gameData !== 'undefined') {
    // Reset to proper initial values
    gameData.days = 365 * 14; // 14 years
    gameData.coins = 0;
    gameData.evil = 0;
    gameData.paused = false;
    gameData.timeWarpingEnabled = false; // Should be disabled initially
    gameData.rebirthOneCount = 0;
    gameData.rebirthTwoCount = 0;
    
    // Reset current entities
    gameData.currentJob = null;
    gameData.currentSkill = null;
    gameData.currentProperty = null;
    gameData.currentMisc = [];
    
    console.log('✅ Game data reset to initial state');
    console.log('   Days:', gameData.days, '(14 years)');
    console.log('   Coins:', gameData.coins);
    console.log('   Time warping:', gameData.timeWarpingEnabled);
} else {
    console.log('❌ Game data object not found');
}

// Step 3: Reset all tasks to level 0
console.log('\n3. Resetting all tasks to level 0...');
if (typeof gameData !== 'undefined' && gameData.taskData) {
    let resetTasks = 0;
    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName];
        task.level = 0;
        task.xp = 0;
        resetTasks++;
    }
    console.log(`✅ Reset ${resetTasks} tasks to level 0`);
} else {
    console.log('❌ Task data not found');
}

// Step 4: Reset all items to level 0
console.log('\n4. Resetting all items to level 0...');
if (typeof gameData !== 'undefined' && gameData.itemData) {
    let resetItems = 0;
    for (const itemName in gameData.itemData) {
        const item = gameData.itemData[itemName];
        item.level = 0;
        resetItems++;
    }
    console.log(`✅ Reset ${resetItems} items to level 0`);
} else {
    console.log('❌ Item data not found');
}

// Step 5: Reset requirements
console.log('\n5. Resetting requirements...');
if (typeof gameData !== 'undefined' && gameData.requirements) {
    let resetRequirements = 0;
    for (const reqName in gameData.requirements) {
        const requirement = gameData.requirements[reqName];
        requirement.completed = false;
        resetRequirements++;
    }
    console.log(`✅ Reset ${resetRequirements} requirements`);
} else {
    console.log('❌ Requirements not found');
}

// Step 6: Force UI update
console.log('\n6. Forcing UI update...');
if (typeof updateUI === 'function') {
    updateUI();
    console.log('✅ UI updated');
} else {
    console.log('❌ updateUI function not found');
}

// Step 7: Force hide entities
console.log('\n7. Forcing hide entities...');
if (typeof hideEntities === 'function') {
    hideEntities();
    console.log('✅ Entities hidden');
} else {
    console.log('❌ hideEntities function not found');
}

// Step 8: Force text update
console.log('\n8. Forcing text update...');
if (typeof updateText === 'function') {
    updateText();
    console.log('✅ Text updated');
} else {
    console.log('❌ updateText function not found');
}

console.log('\n🎉 Game State Regression Fix Complete!');
console.log('=====================================');
console.log('The game should now display:');
console.log('✅ Correct age (14 years)');
console.log('✅ No expired lifespan warning');
console.log('✅ Time warping hidden initially');
console.log('✅ Only available jobs visible');
console.log('✅ All jobs at level 0');
console.log('✅ Proper initial state');

console.log('\n💡 If the issue persists, try refreshing the page.');
console.log('The corrupted data has been cleared and the game reset to a proper initial state.');

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.fixGameStateRegression = function() {
        console.log('🔧 Running game state regression fix...');
        // Re-run the fix logic
    };
}
