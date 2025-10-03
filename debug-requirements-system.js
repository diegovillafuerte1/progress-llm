/**
 * Debug script to identify the specific issue with the requirements system
 */

console.log('🔍 Debugging Requirements System');
console.log('================================\n');

// Check if the requirements system is working
console.log('1. Checking requirements system...');

if (typeof gameData !== 'undefined' && gameData.requirements) {
    console.log('✅ Requirements object found');
    
    // Check each requirement
    for (const reqName in gameData.requirements) {
        const requirement = gameData.requirements[reqName];
        console.log(`\n   Requirement: ${reqName}`);
        console.log(`   Type: ${requirement.constructor.name}`);
        console.log(`   Completed: ${requirement.completed}`);
        
        if (requirement.isCompleted) {
            console.log(`   isCompleted(): ${requirement.isCompleted()}`);
        } else {
            console.log(`   ❌ isCompleted() method not found`);
        }
        
        if (requirement.elements) {
            console.log(`   Elements: ${requirement.elements.length}`);
            requirement.elements.forEach((element, index) => {
                if (element) {
                    console.log(`     Element ${index}: ${element.tagName} (${element.id || element.className})`);
                } else {
                    console.log(`     Element ${index}: NULL`);
                }
            });
        } else {
            console.log(`   ❌ Elements not found`);
        }
    }
} else {
    console.log('❌ Requirements not found');
}

// Check if hideEntities function exists and works
console.log('\n2. Checking hideEntities function...');
if (typeof hideEntities === 'function') {
    console.log('✅ hideEntities function found');
    
    // Try to call it
    try {
        hideEntities();
        console.log('✅ hideEntities() called successfully');
    } catch (error) {
        console.log('❌ hideEntities() failed:', error.message);
    }
} else {
    console.log('❌ hideEntities function not found');
}

// Check specific job visibility
console.log('\n3. Checking specific job visibility...');
const testJobs = ['Beggar', 'Farmer', 'Knight', 'Holy knight'];
testJobs.forEach(jobName => {
    const row = document.getElementById(`row ${jobName}`);
    if (row) {
        const isVisible = row.style.display !== 'none' && !row.classList.contains('hidden');
        console.log(`   ${jobName}: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
        
        // Check if it has the hidden class
        if (row.classList.contains('hidden')) {
            console.log(`     Has 'hidden' class: YES`);
        } else {
            console.log(`     Has 'hidden' class: NO`);
        }
        
        // Check display style
        if (row.style.display === 'none') {
            console.log(`     Display style: none`);
        } else {
            console.log(`     Display style: ${row.style.display || 'default'}`);
        }
    } else {
        console.log(`   ${jobName}: ROW NOT FOUND`);
    }
});

// Check if the issue is with the requirement completion logic
console.log('\n4. Checking requirement completion logic...');
if (typeof gameData !== 'undefined' && gameData.requirements) {
    // Check a specific requirement that should control job visibility
    const shopRequirement = gameData.requirements['Shop'];
    if (shopRequirement) {
        console.log('   Shop requirement:');
        console.log(`     Completed: ${shopRequirement.completed}`);
        console.log(`     isCompleted(): ${shopRequirement.isCompleted ? shopRequirement.isCompleted() : 'N/A'}`);
        console.log(`     Elements: ${shopRequirement.elements ? shopRequirement.elements.length : 'N/A'}`);
    }
    
    // Check time warping requirement
    const timeWarpingRequirement = gameData.requirements['Time warping info'];
    if (timeWarpingRequirement) {
        console.log('   Time warping requirement:');
        console.log(`     Completed: ${timeWarpingRequirement.completed}`);
        console.log(`     isCompleted(): ${timeWarpingRequirement.isCompleted ? timeWarpingRequirement.isCompleted() : 'N/A'}`);
        console.log(`     Elements: ${timeWarpingRequirement.elements ? timeWarpingRequirement.elements.length : 'N/A'}`);
    }
}

// Check if the issue is with the game state
console.log('\n5. Checking game state...');
if (typeof gameData !== 'undefined') {
    console.log(`   Days: ${gameData.days} (${Math.floor(gameData.days / 365)} years)`);
    console.log(`   Coins: ${gameData.coins}`);
    console.log(`   Evil: ${gameData.evil}`);
    console.log(`   Time warping enabled: ${gameData.timeWarpingEnabled}`);
    
    // Check if the issue is with the age calculation
    const ageInYears = Math.floor(gameData.days / 365);
    const lifespan = 70;
    console.log(`   Age: ${ageInYears} years`);
    console.log(`   Lifespan: ${lifespan} years`);
    console.log(`   Age >= Lifespan: ${ageInYears >= lifespan}`);
}

console.log('\n🎯 DIAGNOSIS:');
console.log('Based on the debug output above, the issue is likely:');
console.log('1. Requirements not properly initialized');
console.log('2. hideEntities() function not working correctly');
console.log('3. Game state corruption');
console.log('4. Missing requirement elements');

console.log('\n🔧 RECOMMENDED FIX:');
console.log('1. Reset all requirements to not completed');
console.log('2. Force call hideEntities()');
console.log('3. Reset game state to proper initial values');
console.log('4. Check for missing DOM elements');

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.debugRequirementsSystem = function() {
        console.log('🔍 Running requirements system debug...');
        // Re-run the debug logic
    };
}
