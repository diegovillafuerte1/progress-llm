/**
 * Debug script to check game state and identify the regression
 */

console.log('🔍 Debugging Game State Regression');
console.log('==================================\n');

// Check localStorage for corrupted data
console.log('1. Checking localStorage for saved game data...');
const savedData = localStorage.getItem('gameDataSave');
if (savedData) {
    try {
        const parsedData = JSON.parse(savedData);
        console.log('✅ Saved data found and parsed successfully');
        console.log('   Days (age):', parsedData.days);
        console.log('   Coins:', parsedData.coins);
        console.log('   Evil:', parsedData.evil);
        console.log('   Current job:', parsedData.currentJob?.name || 'null');
        console.log('   Current skill:', parsedData.currentSkill?.name || 'null');
        console.log('   Time warping enabled:', parsedData.timeWarpingEnabled);
        
        // Check for corrupted values
        if (parsedData.days < 0) {
            console.log('❌ CORRUPTED: Days is negative:', parsedData.days);
        }
        if (parsedData.days > 365 * 100) {
            console.log('❌ CORRUPTED: Days is too high:', parsedData.days);
        }
        if (parsedData.coins < 0) {
            console.log('❌ CORRUPTED: Coins is negative:', parsedData.coins);
        }
        
        // Check task data
        console.log('\n2. Checking task data...');
        let corruptedTasks = 0;
        for (const taskName in parsedData.taskData) {
            const task = parsedData.taskData[taskName];
            if (task.level < 0 || task.level > 1000) {
                console.log(`❌ CORRUPTED: Task ${taskName} has invalid level:`, task.level);
                corruptedTasks++;
            }
            if (task.xp < 0 || task.xp > 1000000) {
                console.log(`❌ CORRUPTED: Task ${taskName} has invalid XP:`, task.xp);
                corruptedTasks++;
            }
        }
        
        if (corruptedTasks === 0) {
            console.log('✅ All task data appears valid');
        } else {
            console.log(`❌ Found ${corruptedTasks} corrupted tasks`);
        }
        
    } catch (error) {
        console.log('❌ CORRUPTED: Failed to parse saved data:', error.message);
    }
} else {
    console.log('ℹ️ No saved data found - game should start fresh');
}

// Check if game is running
console.log('\n3. Checking if game is running...');
if (typeof gameData !== 'undefined') {
    console.log('✅ Game data object exists');
    console.log('   Current days:', gameData.days);
    console.log('   Current coins:', gameData.coins);
    console.log('   Current job:', gameData.currentJob?.name || 'null');
    console.log('   Current skill:', gameData.currentSkill?.name || 'null');
    console.log('   Time warping enabled:', gameData.timeWarpingEnabled);
    
    // Check for the specific issues mentioned
    const ageInYears = Math.floor(gameData.days / 365);
    const lifespan = 70;
    
    console.log('\n4. Checking specific regression issues...');
    
    if (ageInYears >= lifespan) {
        console.log('❌ REGRESSION: Age has exceeded lifespan');
        console.log(`   Age: ${ageInYears} years, Lifespan: ${lifespan} years`);
    } else {
        console.log('✅ Age is within normal range');
    }
    
    if (gameData.timeWarpingEnabled) {
        console.log('❌ REGRESSION: Time warping should be disabled initially');
    } else {
        console.log('✅ Time warping is properly disabled');
    }
    
    // Check job visibility
    console.log('\n5. Checking job visibility...');
    let visibleJobs = 0;
    let hiddenJobs = 0;
    
    for (const taskName in gameData.taskData) {
        const task = gameData.taskData[taskName];
        const row = document.getElementById(`row ${taskName}`);
        if (row) {
            const isVisible = row.style.display !== 'none';
            if (isVisible) {
                visibleJobs++;
                if (task.level > 0) {
                    console.log(`❌ REGRESSION: Job ${taskName} is visible with level ${task.level} (should be hidden)`);
                }
            } else {
                hiddenJobs++;
            }
        }
    }
    
    console.log(`   Visible jobs: ${visibleJobs}, Hidden jobs: ${hiddenJobs}`);
    
} else {
    console.log('❌ Game data object not found - game may not be initialized');
}

console.log('\n🎯 DIAGNOSIS:');
console.log('The regression is likely caused by:');
console.log('1. Corrupted saved data in localStorage');
console.log('2. Invalid game state values (negative days, invalid levels)');
console.log('3. Missing or broken requirement system');
console.log('4. UI not properly hiding unavailable jobs');

console.log('\n🔧 RECOMMENDED FIX:');
console.log('1. Clear localStorage to start fresh');
console.log('2. Check requirement system is working');
console.log('3. Verify UI hiding logic');
console.log('4. Add better validation for saved data');

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.debugGameState = function() {
        console.log('🔍 Running game state debug...');
        // Re-run the debug logic
    };
}
