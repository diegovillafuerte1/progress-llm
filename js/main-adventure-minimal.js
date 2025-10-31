/**
 * Minimal Adventure System - Integrated with main.js philosophy
 * Simple functions following main.js patterns
 */

// Adventure data structure (following main.js gameData pattern)
var adventureData = {
    currentAdventure: null,
    currentChoices: [],
    storyTrees: JSON.parse(localStorage.getItem('storyTrees') || '{}'),
    apiKey: localStorage.getItem('mistralApiKey') || '',
    usedAdventures: JSON.parse(localStorage.getItem('usedAdventures') || '{}')
}

// Adventure configuration (following main.js const patterns)
const adventureMilestones = {
    age25: { age: 25, careerCategory: 'Common work' },
    age45: { age: 45, careerCategory: 'Military' },
    age65: { age: 65, careerCategory: 'The Arcane' },
    age200: { age: 200, careerCategory: 'The Void' }
}

const choiceTypes = {
    aggressive: { skill: 'Strength', baseProb: 0.0 },
    diplomatic: { skill: 'Bargaining', baseProb: 0.0 },
    cautious: { skill: 'Concentration', baseProb: 0.0 },
    creative: { skill: 'Concentration', baseProb: 0.0 }
}

const careerBonuses = {
    'Common work': { aggressive: 0.1, diplomatic: 0.0, cautious: 0.1, creative: 0.0 },
    'Military': { aggressive: 0.2, diplomatic: -0.1, cautious: 0.0, creative: -0.1 },
    'The Arcane': { aggressive: -0.1, diplomatic: 0.1, cautious: 0.2, creative: 0.2 },
    'The Void': { aggressive: 0.1, diplomatic: -0.2, cautious: 0.0, creative: 0.3 }
}

// Simple Mistral API (following main.js function patterns)
async function callMistralAPI(prompt) {
    if (!adventureData.apiKey) {
        throw new Error('No API key set');
    }
    
    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adventureData.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 2000,
                temperature: 0.8
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Mistral API Error:', error);
        throw error;
    }
}

// Calculate current age (following main.js helper patterns)
function getCurrentAge() {
    return Math.floor(gameData.days / 365);
}

// Calculate power level (simplified version)
// Enhanced Power Level System (restored from original)
function calculatePowerLevel() {
    const skills = gameData.taskData;
    let totalLevel = 0;
    let skillCount = 0;
    
    // Calculate average skill level
    for (const skillName in skills) {
        totalLevel += skills[skillName].level || 0;
        skillCount++;
    }
    const averageLevel = skillCount > 0 ? totalLevel / skillCount : 0;
    
    // Calculate effective power with scaling
    let effectivePower = averageLevel * 10;
    
    // Add combat multiplier for combat skills
    const combatSkills = ['Strength', 'Battle tactics', 'Muscle memory'];
    const combatLevel = combatSkills.reduce((sum, skill) => sum + (skills[skill]?.level || 0), 0);
    const combatMultiplier = Math.min(1 + (combatLevel / 100000), 2.0); // Cap at 2x
    effectivePower *= combatMultiplier;
    
    // Determine tier
    let tier = '10-C'; // Below Average Human
    let tierName = 'Below Average Human';
    
    if (effectivePower > 100) { tier = '9-B'; tierName = 'Average Human'; }
    if (effectivePower > 500) { tier = '8-A'; tierName = 'Above Average Human'; }
    if (effectivePower > 1000) { tier = '7-S'; tierName = 'Skilled Human'; }
    if (effectivePower > 5000) { tier = '6-SS'; tierName = 'Elite Human'; }
    if (effectivePower > 10000) { tier = '5-SSS'; tierName = 'Superhuman'; }
    if (effectivePower > 50000) { tier = '4-Legendary'; tierName = 'Legendary'; }
    if (effectivePower > 100000) { tier = '3-Mythical'; tierName = 'Mythical'; }
    if (effectivePower > 500000) { tier = '2-Divine'; tierName = 'Divine'; }
    if (effectivePower > 1000000) { tier = '1-Cosmic'; tierName = 'Cosmic'; }
    
    return {
        effectivePower: Math.round(effectivePower),
        tier: tier,
        tierName: tierName,
        averageLevel: Math.round(averageLevel),
        combatMultiplier: combatMultiplier
    };
}

// Enhanced character context generation
function generateCharacterContext() {
    const age = getCurrentAge();
    const job = gameData.currentJob || 'Unemployed';
    const powerLevelData = calculatePowerLevel();
    const evil = gameData.evil || 0;
    const coins = gameData.coins || 0;
    const rebirthCount = (gameData.rebirthOneCount || 0) + (gameData.rebirthTwoCount || 0);
    
    // Build skills context
    const skills = Object.entries(gameData.taskData)
        .filter(([name, data]) => data.level > 0)
        .map(([name, data]) => `${name} (Level ${data.level})`)
        .join(', ');
    
    return {
        age: age,
        job: job,
        powerLevel: powerLevelData.effectivePower,
        tier: powerLevelData.tier,
        tierName: powerLevelData.tierName,
        evil: evil,
        coins: coins,
        rebirthCount: rebirthCount,
        skills: skills,
        context: `Character: Age ${age}, Job: ${job}, Power Level: ${powerLevelData.effectivePower} (${powerLevelData.tierName}), Evil: ${evil}, Skills: ${skills}`
    };
}

// Start adventure (main function)
async function startAdventure(milestone) {
    try {
        const config = adventureMilestones[milestone];
        if (!config) {
            throw new Error(`Unknown milestone: ${milestone}`);
        }
        
        // Check if already used
        if (adventureData.usedAdventures[milestone]) {
            throw new Error('Adventure already used this life');
        }
        
        // Check age requirement
        if (getCurrentAge() < config.age) {
            throw new Error(`Must be age ${config.age} or older`);
        }
        
        // Check API key
        if (!adventureData.apiKey) {
            throw new Error('Mistral API key required');
        }
        
        // Generate story with enhanced context
        const characterContext = generateCharacterContext();
        const prompt = `You are a game master for a text-based incremental game.

CHARACTER STATE:
- Age: ${characterContext.age} years old
- Job: ${characterContext.job}
- Power Level: ${characterContext.powerLevel} (${characterContext.tierName})
- Evil Level: ${characterContext.evil}
- Wealth: ${characterContext.coins} coins
- Rebirth Count: ${characterContext.rebirthCount}
- Skills: ${characterContext.skills}

WORLD RULES:
- The world is a medieval fantasy setting
- Character actions should match their power level and skills
- Higher power level characters face more challenging scenarios
- Evil characters may encounter darker situations
- Reborn characters have wisdom from previous lives

Generate a detailed adventure story (300-500 words) appropriate for a ${characterContext.tierName} character.
Career category: ${config.careerCategory}.
Include exactly 4 choices with different approaches.
Format as JSON: {"story": "...", "choices": [{"text": "...", "type": "aggressive"}, {"text": "...", "type": "diplomatic"}, {"text": "...", "type": "cautious"}, {"text": "...", "type": "creative"}]}`;
        
        const response = await callMistralAPI(prompt);
        const adventure = JSON.parse(response);
        
        // Store current adventure
        adventureData.currentAdventure = {
            milestone: milestone,
            careerCategory: config.careerCategory,
            story: adventure.story,
            choices: adventure.choices
        };
        
        // Calculate success probabilities
        adventureData.currentChoices = adventure.choices.map(choice => ({
            ...choice,
            successProbability: calculateSuccessProbability(choice.type, config.careerCategory)
        }));
        
        // Display adventure
        displayAdventure();
        
    } catch (error) {
        console.error('Adventure Error:', error);
        alert(`Adventure Error: ${error.message}`);
    }
}

// Enhanced success probability calculation using power level system
function calculateSuccessProbability(choiceType, careerCategory) {
    const config = choiceTypes[choiceType];
    if (!config) {
        throw new Error(`Unknown choice type: ${choiceType}`);
    }
    
    const skill = gameData.taskData[config.skill];
    const skillLevel = skill ? skill.level : 0;
    const powerLevelData = calculatePowerLevel();
    
    const base = config.baseProb;
    const careerBonus = careerBonuses[careerCategory]?.[choiceType] || 0;
    
    // Use power level and skill level as combined factor
    const powerFactor = Math.min(powerLevelData.effectivePower / 10000, 0.3); // Max 30% from power
    const skillFactor = Math.min(skillLevel / 1000, 0.2); // Max 20% from skill
    const combinedBonus = powerFactor + skillFactor;
    
    const finalProb = base + careerBonus + combinedBonus;
    
    // Debug logging
    console.log(`ProbabilityCalc: ${choiceType} (${config.skill} L${skillLevel}) + ${careerCategory} + Power${powerLevelData.effectivePower} = ${Math.round(finalProb * 100)}%`);
    
    return Math.max(0.05, Math.min(0.95, finalProb));
}

// Display adventure (following main.js UI patterns)
function displayAdventure() {
    const adventure = adventureData.currentAdventure;
    if (!adventure) return;
    
    // Remove any existing adventure display first
    const existingAdventure = document.getElementById('adventureDisplay');
    if (existingAdventure) {
        existingAdventure.remove();
    }
    
    // Create adventure display
    const adventureHTML = `
        <div id="adventureDisplay" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
             z-index: 1000; margin: 20px; padding: 20px; border: 2px solid #4CAF50; border-radius: 8px; 
             background: rgba(20, 20, 20, 0.95); color: #e0e0e0; max-width: 80%; max-height: 80%; 
             overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <h3 style="color: #4CAF50;">🌟 Adventure</h3>
            <p style="margin: 15px 0; line-height: 1.6;">${adventure.story}</p>
            <div style="margin-top: 20px;">
                ${adventureData.currentChoices.map((choice, index) => `
                    <button class="w3-button button" onclick="makeAdventureChoice(${index})" 
                            style="display: block; width: 100%; margin: 10px 0; padding: 15px; text-align: left;">
                        ${choice.text} (${Math.round(choice.successProbability * 100)}% success)
                    </button>
                `).join('')}
            </div>
            <button class="w3-button button" onclick="closeAdventure()" style="margin-top: 15px;">
                Close Adventure
            </button>
        </div>
    `;
    
    // Insert into body as a modal overlay
    document.body.insertAdjacentHTML('beforeend', adventureHTML);
}

// Make choice (main function)
async function makeAdventureChoice(choiceIndex) {
    try {
        const choice = adventureData.currentChoices[choiceIndex];
        if (!choice) {
            throw new Error('Invalid choice');
        }
        
        // Calculate success
        const isSuccess = Math.random() < choice.successProbability;
        
        // Apply rewards
        const rewards = calculateRewards(choice, isSuccess);
        applyAdventureRewards(rewards);
        
        // Generate continuation with follow-up choices
        const continuationData = await generateStoryContinuation(choice, isSuccess);
        
        // Save to story tree
        saveToStoryTree(choice, isSuccess, continuationData);
        
        // Update UI with result and follow-up choices
        displayAdventureResult(continuationData, rewards);
        
        // Don't mark as used yet - allow follow-up choices
        // adventureData.usedAdventures[adventureData.currentAdventure.milestone] = true;
        // localStorage.setItem('usedAdventures', JSON.stringify(adventureData.usedAdventures));
        
        // Update adventure buttons
        updateAdventureButtons();
        
    } catch (error) {
        console.error('Choice Error:', error);
        alert(`Choice Error: ${error.message}`);
    }
}

// Calculate rewards (simplified)
function calculateRewards(choice, success) {
    const baseXP = 1000; // Base XP reward
    const multiplier = success ? 1.5 : 0.5;
    const timeBasedXP = baseXP * multiplier;
    
    return {
        skill: choiceTypes[choice.type].skill,
        xp: timeBasedXP,
        success: success
    };
}

// Apply rewards (following main.js patterns)
function applyAdventureRewards(rewards) {
    const skill = gameData.taskData[rewards.skill];
    if (skill) {
        skill.xp = (skill.xp || 0) + rewards.xp;
    }
    // Note: UI update handled by main game loop
}

// Generate story continuation with follow-up choices
async function generateStoryContinuation(choice, success) {
    const context = generateCharacterContext();
    const outcome = success ? 'successful' : 'failed';
    const prompt = `Continue this adventure story where the character ${outcome} with choice: "${choice.text}".
                   Context: ${context}. 
                   Provide a detailed continuation paragraph (200-300 words) and include exactly 3 follow-up choices.
                   Format as JSON: {"continuation": "...", "followUpChoices": [{"text": "...", "type": "aggressive"}, {"text": "...", "type": "diplomatic"}, {"text": "...", "type": "cautious"}]}`;
    
    const response = await callMistralAPI(prompt);
    return JSON.parse(response);
}

// Save to story tree (simplified)
function saveToStoryTree(choice, success, continuation) {
    const milestone = adventureData.currentAdventure.milestone;
    if (!adventureData.storyTrees[milestone]) {
        adventureData.storyTrees[milestone] = { choices: [] };
    }
    
    adventureData.storyTrees[milestone].choices.push({
        choice: choice.text,
        type: choice.type,
        success: success,
        continuation: continuation,
        timestamp: Date.now()
    });
    
    localStorage.setItem('storyTrees', JSON.stringify(adventureData.storyTrees));
}

// Display adventure result with follow-up choices
function displayAdventureResult(continuationData, rewards) {
    const resultHTML = `
        <div style="margin: 20px; padding: 20px; border: 2px solid ${rewards.success ? '#4CAF50' : '#f44336'}; border-radius: 8px; background: rgba(76, 175, 80, 0.1); color: #e0e0e0;">
            <h4 style="color: ${rewards.success ? '#4CAF50' : '#f44336'};">
                ${rewards.success ? '✅ Success!' : '❌ Failure!'}
            </h4>
            <p style="margin: 15px 0; line-height: 1.6;">${continuationData.continuation}</p>
            <p style="color: #4CAF50; font-weight: bold;">
                Gained ${Math.round(rewards.xp)} XP in ${rewards.skill}
            </p>
            ${continuationData.followUpChoices ? `
                <div style="margin-top: 20px;">
                    <h5 style="color: #2196F3; margin-bottom: 15px;">What do you do next?</h5>
                    ${continuationData.followUpChoices.map((choice, index) => `
                        <button class="w3-button button" onclick="makeFollowUpChoice(${index})" 
                                style="display: block; width: 100%; margin: 10px 0; padding: 15px; text-align: left;">
                            ${choice.text}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    const adventureDisplay = document.getElementById('adventureDisplay');
    if (adventureDisplay) {
        adventureDisplay.insertAdjacentHTML('beforeend', resultHTML);
    }
}

// Handle follow-up choices
async function makeFollowUpChoice(choiceIndex) {
    try {
        const adventureDisplay = document.getElementById('adventureDisplay');
        if (!adventureDisplay) return;
        
        // Get the follow-up choices from the last result
        const resultDivs = adventureDisplay.querySelectorAll('div[style*="border: 2px solid"]');
        const lastResult = resultDivs[resultDivs.length - 1];
        const followUpChoices = lastResult.querySelectorAll('button[onclick*="makeFollowUpChoice"]');
        
        if (choiceIndex >= followUpChoices.length) {
            throw new Error('Invalid follow-up choice');
        }
        
        const choiceText = followUpChoices[choiceIndex].textContent;
        
        // Generate final outcome
        const finalOutcome = await generateFinalOutcome(choiceText);
        
        // Mark adventure as used
        adventureData.usedAdventures[adventureData.currentAdventure.milestone] = true;
        localStorage.setItem('usedAdventures', JSON.stringify(adventureData.usedAdventures));
        
        // Display final outcome
        displayFinalOutcome(finalOutcome);
        
        // Update adventure buttons
        updateAdventureButtons();
        
    } catch (error) {
        console.error('Follow-up Choice Error:', error);
        alert(`Follow-up Choice Error: ${error.message}`);
    }
}

// Generate final outcome
async function generateFinalOutcome(choiceText) {
    const context = generateCharacterContext();
    const prompt = `Complete this adventure story with the final choice: "${choiceText}".
                   Context: ${context}. 
                   Provide a satisfying conclusion (150-200 words) that wraps up the adventure.
                   Format as JSON: {"conclusion": "..."}`;
    
    const response = await callMistralAPI(prompt);
    return JSON.parse(response);
}

// Display final outcome
function displayFinalOutcome(finalOutcome) {
    const finalHTML = `
        <div style="margin: 20px; padding: 20px; border: 2px solid #4CAF50; border-radius: 8px; background: rgba(76, 175, 80, 0.1); color: #e0e0e0;">
            <h4 style="color: #4CAF50;">🏁 Adventure Complete!</h4>
            <p style="margin: 15px 0; line-height: 1.6;">${finalOutcome.conclusion}</p>
            <button class="w3-button button" onclick="closeAdventure()" style="margin-top: 15px;">
                Close Adventure
            </button>
        </div>
    `;
    
    const adventureDisplay = document.getElementById('adventureDisplay');
    if (adventureDisplay) {
        adventureDisplay.insertAdjacentHTML('beforeend', finalHTML);
    }
}

// Close adventure
function closeAdventure() {
    const adventureDisplay = document.getElementById('adventureDisplay');
    if (adventureDisplay) {
        adventureDisplay.remove();
    }
    adventureData.currentAdventure = null;
    adventureData.currentChoices = [];
}

// Update adventure buttons (following main.js UI patterns)
function updateAdventureButtons() {
    const age = getCurrentAge();
    
    Object.keys(adventureMilestones).forEach(milestone => {
        const config = adventureMilestones[milestone];
        const ageNum = config.age;
        const container = document.getElementById(`adventureButton${ageNum}`);
        
        if (container) {
            const button = container.querySelector('button');
            
            if (button) {
                const ageMet = age >= config.age;
                const apiKeySet = !!adventureData.apiKey;
                const alreadyUsed = adventureData.usedAdventures[milestone];
                
                button.disabled = !ageMet || !apiKeySet || alreadyUsed;
                container.style.display = ageMet ? 'block' : 'none';
                container.style.setProperty('display', ageMet ? 'block' : 'none', 'important');
                
                // Set tooltip based on why button might be disabled
                if (!ageMet) {
                    button.title = `Available at age ${config.age}`;
                } else if (!apiKeySet) {
                    button.title = 'API key required';
                } else if (alreadyUsed) {
                    button.title = 'Already used this life';
                } else {
                    button.title = '';
                }
            }
        }
    });
}

// Save API key
function saveApiKey() {
    const input = document.getElementById('mistralApiKey');
    if (input && input.value) {
        adventureData.apiKey = input.value;
        localStorage.setItem('mistralApiKey', input.value);
        updateAdventureButtons();
        alert('API key saved!');
    }
}

// Initialize adventure system (call on page load)
function initializeAdventureSystem() {
    updateAdventureButtons();
    
    // Set up API key input handler
    const apiKeyInput = document.getElementById('mistralApiKey');
    if (apiKeyInput) {
        apiKeyInput.value = adventureData.apiKey;
        apiKeyInput.addEventListener('change', saveApiKey);
    }
}

// Export functions for global access
window.startAdventure = startAdventure;
window.makeAdventureChoice = makeAdventureChoice;
window.makeFollowUpChoice = makeFollowUpChoice;
window.closeAdventure = closeAdventure;
window.saveApiKey = saveApiKey;
window.updateAdventureButtons = updateAdventureButtons;
