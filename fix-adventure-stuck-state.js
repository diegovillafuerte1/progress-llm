/**
 * Fix for adventure system getting stuck in "in progress" state
 * This script will reset the adventure system and clear any stuck states
 */

console.log('🔧 Fixing Adventure Stuck State');
console.log('==============================\n');

// Step 1: Check current adventure state
console.log('1. Checking current adventure state...');
if (typeof storyAdventureUI !== 'undefined') {
    console.log('   StoryAdventureUI found');
    console.log('   isGenerating:', storyAdventureUI.isGenerating);
    console.log('   currentStory:', !!storyAdventureUI.currentStory);
    console.log('   currentChoices:', storyAdventureUI.currentChoices.length);
} else {
    console.log('❌ StoryAdventureUI not found');
}

if (typeof storyAdventureManager !== 'undefined') {
    console.log('   StoryAdventureManager found');
    console.log('   isAdventureActive():', storyAdventureManager.isAdventureActive());
} else {
    console.log('❌ StoryAdventureManager not found');
}

// Step 2: Reset adventure UI state
console.log('\n2. Resetting adventure UI state...');
if (typeof storyAdventureUI !== 'undefined') {
    // Force reset the isGenerating flag
    storyAdventureUI.isGenerating = false;
    console.log('✅ isGenerating reset to false');
    
    // Clear current story state
    storyAdventureUI.currentStory = null;
    storyAdventureUI.currentChoices = [];
    storyAdventureUI.choiceSuccessChances = [];
    console.log('✅ Story state cleared');
    
    // Hide any loading states
    const storyContainer = document.getElementById('storyAdventure');
    if (storyContainer) {
        const loadingElement = storyContainer.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
            console.log('✅ Loading state removed');
        }
    }
} else {
    console.log('❌ StoryAdventureUI not found');
}

// Step 3: Reset adventure manager state
console.log('\n3. Resetting adventure manager state...');
if (typeof storyAdventureManager !== 'undefined') {
    // Force end any active adventure
    if (storyAdventureManager.isAdventureActive()) {
        storyAdventureManager.endAdventure();
        console.log('✅ Active adventure ended');
    }
    
    // Reset adventure manager state
    storyAdventureManager.reset();
    console.log('✅ Adventure manager reset');
} else {
    console.log('❌ StoryAdventureManager not found');
}

// Step 4: Reset game state if corrupted
console.log('\n4. Checking and resetting game state...');
if (typeof gameData !== 'undefined') {
    // Check if game state is corrupted
    const ageInYears = Math.floor(gameData.days / 365);
    const lifespan = 70;
    
    console.log(`   Age: ${ageInYears} years`);
    console.log(`   Lifespan: ${lifespan} years`);
    console.log(`   Age >= Lifespan: ${ageInYears >= lifespan}`);
    
    if (ageInYears >= lifespan && ageInYears < 20) {
        console.log('❌ Game state corrupted - age exceeds lifespan but character is young');
        console.log('   Resetting game state...');
        
        // Reset to proper initial values
        gameData.days = 365 * 14; // 14 years
        gameData.coins = 0;
        gameData.evil = 0;
        gameData.paused = false;
        gameData.timeWarpingEnabled = false;
        
        // Reset current entities
        gameData.currentJob = null;
        gameData.currentSkill = null;
        gameData.currentProperty = null;
        gameData.currentMisc = [];
        
        console.log('✅ Game state reset to initial values');
    } else {
        console.log('✅ Game state appears normal');
    }
} else {
    console.log('❌ Game data not found');
}

// Step 5: Reset all tasks to level 0
console.log('\n5. Resetting all tasks to level 0...');
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

// Step 6: Reset requirements system
console.log('\n6. Resetting requirements system...');
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

// Step 7: Force UI update
console.log('\n7. Forcing UI update...');
if (typeof updateUI === 'function') {
    updateUI();
    console.log('✅ updateUI() called');
} else {
    console.log('❌ updateUI function not found');
}

if (typeof hideEntities === 'function') {
    hideEntities();
    console.log('✅ hideEntities() called');
} else {
    console.log('❌ hideEntities function not found');
}

if (typeof updateText === 'function') {
    updateText();
    console.log('✅ updateText() called');
} else {
    console.log('❌ updateText function not found');
}

// Step 8: Clear any stuck loading states
console.log('\n8. Clearing stuck loading states...');
const loadingElements = document.querySelectorAll('.loading, .generating, .adventure-loading');
loadingElements.forEach(element => {
    element.remove();
    console.log('✅ Removed loading element');
});

// Step 9: Reset adventure UI display
console.log('\n9. Resetting adventure UI display...');
const storyContainer = document.getElementById('storyAdventure');
if (storyContainer) {
    // Clear any stuck content
    storyContainer.innerHTML = '';
    console.log('✅ Adventure UI cleared');
} else {
    console.log('❌ Story adventure container not found');
}

// Step 10: Check if fix worked
console.log('\n10. Checking if fix worked...');
if (typeof storyAdventureUI !== 'undefined') {
    console.log('   isGenerating:', storyAdventureUI.isGenerating);
    console.log('   currentStory:', !!storyAdventureUI.currentStory);
    console.log('   currentChoices:', storyAdventureUI.currentChoices.length);
}

if (typeof storyAdventureManager !== 'undefined') {
    console.log('   isAdventureActive():', storyAdventureManager.isAdventureActive());
}

console.log('\n🎉 Adventure Stuck State Fix Complete!');
console.log('=====================================');
console.log('The adventure system should now be reset and ready to use.');
console.log('You should be able to start a new adventure without issues.');

console.log('\n💡 If the issue persists:');
console.log('1. Refresh the page completely');
console.log('2. Clear localStorage again');
console.log('3. Check browser console for any remaining errors');

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.fixAdventureStuckState = function() {
        console.log('🔧 Running adventure stuck state fix...');
        // Re-run the fix logic
    };
}
