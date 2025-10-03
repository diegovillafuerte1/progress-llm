/**
 * Demo script showing the hybrid state management integration
 * This demonstrates how the paper-based improvements work with the existing game
 */

import { GameManager } from './src/core/GameManager.js';
import { StoryManager } from './src/llm/StoryManager.js';

async function demonstrateHybridIntegration() {
    console.log('🚀 Starting Hybrid State Management Demo');
    console.log('=====================================\n');

    try {
        // Initialize the game with hybrid state management
        console.log('1. Initializing Game Manager with Hybrid State Management...');
        const gameManager = new GameManager();
        await gameManager.initialize();
        console.log('✅ Game Manager initialized with hybrid state management\n');

        // Initialize story manager with game manager reference
        console.log('2. Initializing Story Manager with Game Manager reference...');
        const storyManager = new StoryManager(gameManager);
        console.log('✅ Story Manager initialized with hybrid state management\n');

        // Demonstrate action-driven transitions
        console.log('3. Demonstrating Action-Driven Transitions...');
        const combatAction = {
            type: 'combat',
            action: 'attack',
            weapon: 'sword',
            skill: 'Strength',
            level: 15
        };

        const combatResult = await gameManager.processAction(combatAction);
        console.log('   Combat Action Result:', {
            success: combatResult.success,
            type: combatResult.classification.type,
            requiresLLM: combatResult.classification.requiresLLM
        });

        // Demonstrate environment-driven transitions
        console.log('\n4. Demonstrating Environment-Driven Transitions...');
        const timeAction = {
            type: 'time_passage',
            duration: 120,
            automatic: true
        };

        const timeResult = await gameManager.processAction(timeAction);
        console.log('   Time Passage Result:', {
            success: timeResult.success,
            type: timeResult.classification.type,
            requiresCode: timeResult.classification.requiresCode
        });

        // Demonstrate hybrid transitions
        console.log('\n5. Demonstrating Hybrid Transitions...');
        const skillAction = {
            type: 'skill_check',
            skill: 'Magic',
            difficulty: 15,
            playerChoice: 'cast_healing_spell'
        };

        const skillResult = await gameManager.processAction(skillAction);
        console.log('   Skill Check Result:', {
            success: skillResult.success,
            type: skillResult.classification.type,
            requiresLLM: skillResult.classification.requiresLLM,
            requiresCode: skillResult.classification.requiresCode
        });

        // Demonstrate story choice processing
        console.log('\n6. Demonstrating Story Choice Processing...');
        const characterState = {
            currentJob: 'Knight',
            skills: [
                { name: 'Strength', level: 15 },
                { name: 'Combat', level: 12 },
                { name: 'Charisma', level: 8 }
            ],
            coins: 5000,
            evil: 10,
            age: 30
        };

        const storyChoice = 'Charge into battle with your sword';
        const storyResult = await storyManager.processStoryChoice(storyChoice, characterState);
        console.log('   Story Choice Result:', {
            success: storyResult.success,
            hasStateChanges: !!storyResult.stateChanges,
            hasValidation: !!storyResult.validation
        });

        // Demonstrate state validation
        console.log('\n7. Demonstrating State Validation...');
        const validationReport = gameManager.validateCurrentState();
        console.log('   Validation Report:', {
            overall: validationReport.overall,
            issues: validationReport.issues.length
        });

        // Demonstrate LLM state formatting
        console.log('\n8. Demonstrating LLM State Formatting...');
        const llmState = gameManager.getStateForLLM();
        console.log('   LLM State Structure:', {
            hasCurrentState: !!llmState.currentState,
            hasSchema: !!llmState.schema,
            hasInstructions: !!llmState.instructions,
            playerName: llmState.currentState.player.name,
            playerLevel: llmState.currentState.player.level
        });

        // Demonstrate world rules
        console.log('\n9. Demonstrating World Rules...');
        const worldRules = gameManager.getWorldRulesForLLM();
        console.log('   World Rules Structure:', {
            hasSystemPrompt: !!worldRules.systemPrompt,
            hasRules: !!worldRules.rules,
            hasExamples: !!worldRules.examples,
            ruleCategories: Object.keys(worldRules.rules)
        });

        // Demonstrate system metrics
        console.log('\n10. Demonstrating System Metrics...');
        const metrics = gameManager.getSystemMetrics();
        console.log('   System Metrics:', {
            totalTransitions: metrics.totalTransitions,
            actionDriven: metrics.actionDriven,
            environmentDriven: metrics.environmentDriven,
            hybrid: metrics.hybrid,
            validationErrors: metrics.validationErrors
        });

        // Demonstrate comprehensive system report
        console.log('\n11. Demonstrating Comprehensive System Report...');
        const systemReport = gameManager.getSystemReport();
        console.log('   System Report Structure:', {
            hasMetrics: !!systemReport.metrics,
            hasValidationReport: !!systemReport.validationReport,
            hasStateDifferences: !!systemReport.stateDifferences,
            hasWorldRules: !!systemReport.worldRules,
            hasEnvironmentSimulation: !!systemReport.environmentSimulation
        });

        console.log('\n🎉 Demo completed successfully!');
        console.log('\nKey Benefits Demonstrated:');
        console.log('✅ Structured JSON state representation for LLM');
        console.log('✅ Efficient state difference tracking');
        console.log('✅ Action vs Environment transition classification');
        console.log('✅ Explicit world rules for LLM consistency');
        console.log('✅ State consistency validation');
        console.log('✅ Reliable environment simulation');
        console.log('✅ Hybrid state management integration');

        // Cleanup
        gameManager.destroy();

    } catch (error) {
        console.error('❌ Demo failed:', error);
        throw error;
    }
}

// Run the demo if this script is executed directly
if (typeof window === 'undefined') {
    demonstrateHybridIntegration()
        .then(() => {
            console.log('\n✨ Hybrid State Management Demo completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Demo failed:', error);
            process.exit(1);
        });
}

export { demonstrateHybridIntegration };
