/**
 * Test script to demonstrate the hybrid state management improvements
 * This shows the differences between old and new systems
 */

import { GameManager } from './src/core/GameManager.js';
import { StoryManager } from './src/llm/StoryManager.js';

async function demonstrateImprovements() {
    console.log('🔍 Demonstrating Hybrid State Management Improvements');
    console.log('====================================================\n');

    try {
        // Initialize the game
        const gameManager = new GameManager();
        await gameManager.initialize();
        const storyManager = new StoryManager(gameManager);

        console.log('1. 📊 System Metrics (Before any actions):');
        let metrics = gameManager.getSystemMetrics();
        console.log(`   - Total transitions: ${metrics.totalTransitions}`);
        console.log(`   - Validation errors: ${metrics.validationErrors}`);
        console.log(`   - LLM calls: ${metrics.llmCalls}\n`);

        // Simulate some story choices that would show the improvements
        console.log('2. 🎭 Testing Story Choice Processing:');
        
        const characterState = {
            currentJob: 'Knight',
            skills: [
                { name: 'Strength', level: 15 },
                { name: 'Combat', level: 12 },
                { name: 'Magic', level: 5 }
            ],
            coins: 1000,
            evil: 20,
            age: 30
        };

        // Test different types of choices
        const testChoices = [
            'Attack the dragon with your sword',
            'Cast a healing spell on your wounds',
            'Sneak past the guards quietly',
            'Negotiate with the merchant for better prices'
        ];

        for (let i = 0; i < testChoices.length; i++) {
            const choice = testChoices[i];
            console.log(`\n   Choice ${i + 1}: "${choice}"`);
            
            try {
                const result = await storyManager.processStoryChoice(choice, characterState);
                console.log(`   ✅ Success: ${result.success}`);
                console.log(`   📈 State changes tracked: ${!!result.stateChanges}`);
                console.log(`   🔍 Validation passed: ${result.validation?.overall || 'N/A'}`);
                
                if (result.metrics) {
                    console.log(`   📊 Metrics: ${JSON.stringify(result.metrics, null, 2)}`);
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
            }
        }

        console.log('\n3. 🔧 Testing State Validation:');
        
        // Test state validation
        const validationReport = gameManager.validateCurrentState();
        console.log(`   Overall state valid: ${validationReport.overall}`);
        if (validationReport.issues && validationReport.issues.length > 0) {
            console.log(`   Issues found: ${validationReport.issues.join(', ')}`);
        } else {
            console.log('   ✅ No state issues detected');
        }

        console.log('\n4. 📈 Final System Metrics:');
        metrics = gameManager.getSystemMetrics();
        console.log(`   - Total transitions: ${metrics.totalTransitions}`);
        console.log(`   - Action-driven: ${metrics.actionDriven}`);
        console.log(`   - Environment-driven: ${metrics.environmentDriven}`);
        console.log(`   - Hybrid: ${metrics.hybrid}`);
        console.log(`   - Validation errors: ${metrics.validationErrors}`);
        console.log(`   - LLM calls: ${metrics.llmCalls}`);

        console.log('\n5. 🎯 LLM State Formatting:');
        const llmState = gameManager.getStateForLLM();
        console.log(`   Player name: ${llmState.currentState.player.name}`);
        console.log(`   Player level: ${llmState.currentState.player.level}`);
        console.log(`   Player coins: ${llmState.currentState.player.coins}`);
        console.log(`   World location: ${llmState.currentState.world.location}`);
        console.log(`   Skills available: ${Object.keys(llmState.currentState.skills).length}`);

        console.log('\n6. 📋 World Rules:');
        const worldRules = gameManager.getWorldRulesForLLM();
        console.log(`   Combat rules: ${!!worldRules.rules.combat}`);
        console.log(`   Magic rules: ${!!worldRules.rules.magic}`);
        console.log(`   Time rules: ${!!worldRules.rules.time}`);
        console.log(`   Rule categories: ${Object.keys(worldRules.rules).length}`);

        console.log('\n7. 🔄 State Differences:');
        const stateDiff = gameManager.getStateDifferences();
        if (stateDiff) {
            console.log(`   Changes detected: ${Object.keys(stateDiff.changes).length}`);
            console.log(`   Additions: ${Object.keys(stateDiff.additions).length}`);
            console.log(`   Modifications: ${Object.keys(stateDiff.modifications).length}`);
        } else {
            console.log('   No state differences since last action');
        }

        console.log('\n✨ Key Improvements Demonstrated:');
        console.log('✅ Structured state representation for better LLM understanding');
        console.log('✅ Efficient state difference tracking (only what changed)');
        console.log('✅ Action classification (combat, magic, dialogue, etc.)');
        console.log('✅ World rules validation (prevents impossible actions)');
        console.log('✅ State consistency checking (no contradictions)');
        console.log('✅ Performance metrics tracking');

        // Cleanup
        gameManager.destroy();

    } catch (error) {
        console.error('❌ Demo failed:', error);
        throw error;
    }
}

// Run the demo
if (typeof window === 'undefined') {
    demonstrateImprovements()
        .then(() => {
            console.log('\n🎉 Hybrid improvements demonstration completed!');
            console.log('\n💡 To see these improvements in your actual game:');
            console.log('   1. Start a story adventure');
            console.log('   2. Make choices in the story');
            console.log('   3. Notice better narrative consistency');
            console.log('   4. Check for fewer contradictions');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Demo failed:', error);
            process.exit(1);
        });
}

export { demonstrateImprovements };
