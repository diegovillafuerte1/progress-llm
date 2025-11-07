# Drone Command - LLM Integration Roadmap

## Phase 1: Story-Game Integration ✅ (Current Focus)

### Goal
Make the narrative system affect game state by pausing the game during adventures and rewarding players based on performance.

### Features
- [ ] Auto-pause game when adventure starts
- [ ] Prevent unpause during active adventure
- [ ] Track success/failure count for each choice
- [ ] Track choice types (aggressive, diplomatic, cautious, creative)
- [ ] End adventure conditions:
  - 3 failures (automatic)
  - Manual end by player
- [ ] Calculate and apply rewards:
  - Skill XP based on choice types used
  - Bonus multiplier for high success rates (>75% with 5+ successes)
  - Time advancement for long adventures (10+ turns)
  - Special unlocks for exceptional performance (15+ successes)
- [ ] Visual feedback for rewards earned
- [ ] Adventure statistics display

### Architecture
```
StoryAdventureManager (new module)
├─ Manages adventure lifecycle
├─ Tracks success/failure and choice types
├─ Calculates rewards based on performance
├─ Interfaces with GameState for pause/unpause
└─ Applies rewards to game progression
```

---

## Phase 2: Paper Insights - Enhanced State Management 📚

Based on "Can Language Models Serve as Text-Based World Simulators?" (arXiv:2406.06485)

### Key Findings
- LLMs achieve only 35-60% accuracy for dynamic state transitions
- Structured JSON representation improves LLM accuracy
- State difference prediction is more efficient than full state regeneration
- LLMs perform better with explicit world rules
- Action-driven transitions (65% accuracy) > Environment-driven transitions (35% accuracy)
- State consistency validation is critical

### Planned Improvements

#### 1. Structured State Representation
**Goal:** Expose game state as structured JSON to LLM for better narrative coherence

**Implementation:**
- Create `StateEncoder.js` module
- Convert game state to/from JSON schema
- Include structured state in LLM prompts
- Track object properties (location, NPCs, inventory, world conditions)

**Benefits:**
- LLM can reference specific state properties accurately
- Better narrative consistency
- Enables programmatic state validation

**Files to create:**
- `src/llm/StateEncoder.js`
- `tests/state-encoder.test.js`

---

#### 2. State Difference Tracking
**Goal:** Track only what changes between turns for efficiency

**Implementation:**
- Implement state diff calculation
- Ask LLM to predict/describe state changes rather than full state
- Merge state diffs back into authoritative game state
- Reduce token usage in API calls

**Benefits:**
- More efficient API usage (fewer tokens)
- Easier to validate changes
- Better performance tracking

**Files to create:**
- `src/llm/StateDiff.js`
- `tests/state-diff.test.js`

---

#### 3. Action vs Environment Transitions
**Goal:** Separate player-driven changes from world-driven changes

**Implementation:**
- Classify transitions as:
  - **Action-driven**: Direct player choice consequences (LLM-assisted)
  - **Environment-driven**: World reactions and cascading effects (rule-based)
- Use code for reliable environment transitions
- Use LLM for creative action interpretations

**Example:**
```javascript
// Action-driven (LLM narrates)
player attacks dragon → combat outcome

// Environment-driven (code enforces)
player in rain → clothes get wet
time passes → shops close
low health → movement penalties
```

**Benefits:**
- More reliable world simulation
- LLM focuses on creative narrative
- Deterministic game mechanics

**Files to create:**
- `src/llm/TransitionClassifier.js`
- `src/core/EnvironmentSimulator.js`
- `tests/transition-classifier.test.js`

---

#### 4. Explicit World Rules
**Goal:** Provide LLM with explicit game rules to improve consistency

**Implementation:**
- Define world rules in structured format
- Include rules in system prompts
- Validate LLM outputs against rules
- Support both human-written and LLM-generated rules

**Example Rules:**
```javascript
const worldRules = {
  combat: {
    requiresWeapon: true,
    skillRequired: 'Strength',
    minimumLevel: 5
  },
  magic: {
    requiresMana: true,
    skillRequired: 'Magic',
    minimumLevel: 10
  },
  time: {
    shopsCloseAtNight: true,
    guardsPatrolAtNight: true,
    fastTravelRequiresDay: true
  },
  reputation: {
    highEvilAffectsNPC: true,
    guardsAttackAbove: 70,
    shopsRefuseServiceAbove: 90
  }
};
```

**Benefits:**
- LLM generates more consistent narratives
- Easier to validate outputs
- Players understand cause and effect
- Paper showed 10-15% accuracy improvement

**Files to create:**
- `src/llm/WorldRules.js`
- `tests/world-rules.test.js`

---

#### 5. State Consistency Validation
**Goal:** Ensure LLM narrative doesn't contradict known game state

**Implementation:**
- Validate LLM outputs against current game state
- Check for logical contradictions
- Flag inconsistencies for correction or regeneration
- Track validation metrics

**Validation Checks:**
```javascript
- Inventory consistency (can't use item you don't have)
- Location consistency (can't be in two places)
- Skill consistency (can't cast spells without magic skill)
- Time consistency (shops closed at night)
- Reputation consistency (guards hostile if evil > 70)
- Resource consistency (can't spend more coins than you have)
```

**Benefits:**
- Prevents immersion-breaking contradictions
- Builds player trust in narrative
- Identifies when to regenerate story segments
- Paper found 40%+ consistency error rate without validation

**Files to create:**
- `src/llm/StateValidator.js`
- `tests/state-validator.test.js`

---

#### 6. Hybrid State Management (Architectural Pattern)
**Goal:** LLM for narrative, code for game-critical state

**Division of Responsibility:**

| System | Manages | Why |
|--------|---------|-----|
| **Code** | Stats, inventory, combat outcomes, economy, age/death | Deterministic, fair, exploitproof |
| **LLM** | Story text, NPC dialogue, world descriptions, quest flavor | Creative, immersive, varied |
| **Hybrid** | Choice consequences, skill checks, reputation changes | Code determines success, LLM narrates outcome |

**Implementation:**
```javascript
// Code determines outcome
const combatSuccess = rollCombatCheck(playerSkills, enemyDifficulty);

// LLM narrates with outcome constraint
const narrative = await llm.generateCombatNarrative({
  outcome: combatSuccess ? 'victory' : 'defeat',
  playerSkills: playerSkills,
  enemyType: 'dragon'
});

// Code applies mechanical changes
if (combatSuccess) {
  applyRewards(player);
} else {
  applyPenalties(player);
}
```

**Benefits:**
- Best of both worlds: reliable mechanics + creative narrative
- Non-exploitable gameplay
- Consistent progression
- Rich storytelling

---

## Phase 3: Polish & Advanced Features 🎨

### Potential Features
- [ ] Adventure history/journal
- [ ] Replay system
- [ ] Difficulty settings
- [ ] Story branching paths
- [ ] Character-specific story arcs
- [ ] Multiplayer story sharing
- [ ] Custom adventure creation
- [ ] Achievement system expansion

---

## Testing Strategy

### Phase 1 Tests
- Adventure lifecycle (start, track, end)
- Pause/unpause integration
- Reward calculation
- Failure conditions
- Manual end scenarios

### Phase 2 Tests
- State encoding/decoding accuracy
- State diff calculation
- Transition classification
- Rule validation
- Consistency checking
- Integration tests with mock LLM

### Phase 3 Tests
- End-to-end user flows
- Performance benchmarks
- Token usage optimization
- Edge case handling

---

## Success Metrics

### Phase 1
- ✅ Players can start/end adventures
- ✅ Game pauses during adventures
- ✅ Rewards feel fair and meaningful
- ✅ Adventure failure is not punishing

### Phase 2
- ✅ Narrative consistency improves measurably
- ✅ Fewer contradictions in story
- ✅ Token usage reduced by 20-30%
- ✅ LLM responses validate against rules 90%+ of time

### Phase 3
- ✅ Players engage with adventure mode regularly
- ✅ Story mode enhances main game loop
- ✅ Positive player feedback on narrative quality

---

## Technical Debt & Considerations

### API Costs
- Monitor token usage per adventure
- Consider caching common narratives
- Implement rate limiting if needed

### State Complexity
- Keep JSON state manageable (<2KB per turn)
- Prune conversation history aggressively
- Balance context vs. token costs

### LLM Reliability
- Always have fallback content
- Graceful degradation if API fails
- Don't block core gameplay on LLM

### Performance
- Async/await for all LLM calls
- Loading states for UX
- Timeout handling (10s max)

---

## References

- "Can Language Models Serve as Text-Based World Simulators?" - Wang et al. (2024)
  - URL: https://arxiv.org/pdf/2406.06485
  - Key insight: LLMs unreliable as authoritative simulators (35-60% accuracy)
  - Recommendation: Hybrid approach with structured state and explicit rules

---

## Notes

### Why Hybrid > Pure LLM Simulation
The paper demonstrates that even GPT-4 achieves only 35-60% accuracy when predicting state transitions. This is unacceptable for game mechanics where fairness and consistency are critical. Our hybrid approach (code for mechanics, LLM for narrative) is architecturally superior.

### When to Use Each Component
- **Use Code**: When correctness matters (combat, economy, progression)
- **Use LLM**: When creativity matters (descriptions, dialogue, atmosphere)
- **Use Both**: When narrative and mechanics intersect (choice outcomes)

### Future Research Directions
- Fine-tuned model on game-specific scenarios
- Reinforcement learning for better consistency
- Custom JSON schema for game state
- Automated rule generation from game code


## Phase 4: Persistent Career-Based Story Trees 🌳

### Goal
Create a persistent, branching story system where player career progression determines available adventure options, and choices create permanent story paths that persist across multiple lives.

### Core Concept
The amulet system becomes a persistent story engine where:
- **Career Categories** determine available adventure options (Common Work, Military, Arcane Association)
- **Career Weight** (based on highest job levels ever achieved) determines option quality and success probabilities
- **Story Trees** persist across deaths/rebirths, creating personalized narrative paths
- **Choice Locking** means once you choose a path, it becomes permanently available for future lives

### Feature Details

#### Career-Based Adventure Options
- **Career Weight Calculation**: Sum of highest job levels in each category
  - Common Work: Beggar(1) → Farmer(10) → Fisherman(100) → Miner(1000) → Blacksmith(10000) → Merchant(100000)
  - Military: Squire(1) → Footman(10) → Veteran Footman(100) → Knight(1000) → Veteran Knight(10000) → Elite Knight(100000) → Holy Knight(1000000) → Legendary Knight(10000000)
  - Arcane Association: Student(1) → Apprentice Mage(10) → Mage(100) → Wizard(1000) → Master Wizard(10000) → Chairman(100000)
- **Option Availability**: Higher career weight = better options
- **Success Probabilities**: Based on max ever skill levels (never regress)

#### Persistent Story Trees
- **Tree Structure**: Each amulet prompt (age 25, 45, 65, 200) has independent story trees
- **Career-Specific Branches**: Separate trees for each career category
- **Choice Locking**: Once a choice is made, that path becomes permanently available
- **Infinite Depth**: Trees can grow infinitely deep, with success probability decreasing with depth
- **Cross-Life Persistence**: Story trees survive death/rebirth cycles

#### Story Tree Mechanics
Example tree of someone on life 4, who just finished choosing the Arcane option with no levels/weight in it
With Max Job Levels 
Beggar 10, Farmer 2
Squire 20, Footman 4
Student 0
would evaluate to career weights of:
CW total level 30
M total level 60
A total level 0
CWA stands for Common Work Option A
MB stands for Military Option B
MAF1 stands for Military Option A Failure 1
No subsequent leaves implies the adventure was ended 

```
Age 25 Amulet Prompt
└─ Tree 
  ├─ Option CWA: "Beg from merchants" (chosen in life #2)
  │  ├─ Success Path: "Merchants agree to give money"
  │  │  └─ Option CWA1: "Spend money on education" (chosen in life #2)
  │  └─ Failure Path: "Merchants refuse"
  |     └─ Option MAF1: "Ask if they need a squire to help them" (chosen in life #1)
  ├─ Option MB: "Look for a knight to serve" (chosen in life #3)
  └─ Option AC: "Look for some books" (chosen in life #4)
```

#### Implementation Architecture
```
PersistentStorySystem
├─ CareerAnalyzer
│  ├─ Calculate career weights from job history
│  ├─ Determine dominant career category
│  └─ Get available options based on weight
├─ StoryTreeManager
│  ├─ Load/save story trees from localStorage
│  ├─ Track choice history across lives
│  ├─ Generate new story branches when needed
│  └─ Lock in choices permanently
├─ CareerBasedPromptGenerator
│  ├─ Generate career-specific adventure prompts
│  ├─ Calculate success probabilities
│  └─ Create option descriptions
└─ StoryPersistenceManager
    ├─ Save story state across sessions
    ├─ Handle cross-life persistence
    └─ Manage story tree storage
```

### Implementation Plan

#### Phase 4A: Minimal Viable Implementation (2-3 weeks)
**Goal**: Basic career-based filtering with simple persistence

**Week 1: Career Analysis System**
- Create `CareerAnalyzer.js` - Calculate career weights and dominant category
- Create `CareerWeights.js` - Define job weight mappings
- Integrate with existing `StoryAdventureManager`

**Week 2: Basic Story Trees**
- Create `StoryTreeManager.js` - Handle localStorage persistence
- Create `StoryTreeData.js` - Define tree data structures
- Implement choice locking mechanism

**Week 3: Career-Based Prompts** ✅ COMPLETED
- Create `CareerBasedPromptGenerator.js` - Generate career-specific options ✅
- Modify existing prompt generation to use career data ✅
- Test integration with existing adventure system ✅

**Files to Create:**
- `src/llm/CareerAnalyzer.js`
- `src/llm/CareerWeights.js`
- `src/llm/StoryTreeManager.js`
- `src/llm/StoryTreeData.js`
- `src/llm/CareerBasedPromptGenerator.js`
- `tests/career-analyzer.test.js`
- `tests/story-tree-manager.test.js`

#### Phase 4B: Enhanced Story System (3-4 weeks)
**Goal**: Advanced tree mechanics with depth-based probabilities

**Week 4-5: Advanced Tree Features**
- Implement infinite depth tree growth
- Add success probability calculation based on depth
- Create story branch generation system
- Add tree visualization for debugging

**Week 6-7: Cross-Life Persistence**
- Enhance persistence to survive rebirths
- Add story tree merging for multiple lives
- Implement story tree pruning/optimization
- Add story tree statistics and analytics

**Files to Create:**
- `src/llm/StoryTreeBuilder.js`
- `src/llm/ProbabilityCalculator.js`
- `src/llm/StoryPersistenceManager.js`
- `src/llm/StoryTreeVisualizer.js`
- `tests/story-tree-builder.test.js`

#### Phase 4C: Advanced Features (2-3 weeks)
**Goal**: Polish and advanced story mechanics

**Week 8-9: Story Enhancement**
- Add story tree branching visualization
- Implement story tree sharing between players
- Add story tree export/import functionality
- Create story tree analytics dashboard

**Week 10: Integration & Polish**
- Full integration testing
- Performance optimization
- UI/UX improvements
- Documentation and user guides

### Success Metrics

#### Phase 4A (Minimal Viable)
- ✅ Career weights correctly calculated from job history
- ✅ Career-specific options appear in adventures
- ✅ Basic story trees persist across sessions
- ✅ Choice locking works for simple scenarios

#### Phase 4B (Enhanced)
- ✅ Story trees grow infinitely deep
- ✅ Success probabilities decrease with depth
- ✅ Story trees persist across multiple lives
- ✅ New branches generate when needed

#### Phase 4C (Advanced)
- ✅ Players can visualize their story trees
- ✅ Story trees enhance replayability
- ✅ Cross-life story continuity works seamlessly
- ✅ Positive player feedback on story depth

### Technical Considerations

#### Data Storage
- **localStorage**: Primary storage for story trees
- **Data Structure**: JSON-based tree representation
- **Size Limits**: Monitor localStorage usage (5-10MB limit)
- **Backup**: Export/import functionality for story trees

#### Performance
- **Tree Traversal**: Efficient tree search algorithms
- **Memory Usage**: Lazy loading for large story trees
- **Caching**: Cache frequently accessed story branches
- **Cleanup**: Prune unused story branches

#### Integration Points
- **Existing Adventure System**: Extend `StoryAdventureManager`
- **Job System**: Integrate with existing job categories
- **LLM Integration**: Use existing Mistral API for story generation
- **UI System**: Extend existing adventure UI

### Future Enhancements

#### Story Tree Analytics
- Track most popular story paths
- Analyze player choice patterns
- Generate story tree statistics
- Create story tree recommendations

#### Advanced Story Mechanics
- **Story Tree Merging**: Combine story trees from different lives
- **Story Tree Pruning**: Remove unused branches
- **Story Tree Sharing**: Share interesting story paths with other players
- **Story Tree Challenges**: Special rewards for completing story trees

#### Integration with Other Systems
- **Achievement System**: Unlock achievements for story tree completion
- **Item System**: Special items for story tree milestones
- **Skill System**: Bonus XP for story tree exploration
- **Rebirth System**: Story tree bonuses for new lives

## Next Steps Beyond Minimal Viable Implementation

### Phase 4B: Enhanced Story System (Weeks 4-7)
**Goal**: Transform basic story trees into a sophisticated narrative engine

#### Advanced Tree Mechanics
- **Infinite Depth Growth**: Trees grow organically as players explore
- **Success Probability Scaling**: Deeper choices become riskier but more rewarding
- **Dynamic Branch Generation**: New story paths emerge based on player behavior
- **Cross-Tree Connections**: Subtle connections between different amulet prompts

#### Cross-Life Story Continuity
- **Story Tree Merging**: Combine story trees from multiple lives
- **Legacy Choices**: Previous life choices influence new life options
- **Story Tree Inheritance**: Pass down story progress to new lives
- **Narrative Coherence**: Maintain story consistency across rebirths

#### Advanced Features
- **Story Tree Visualization**: Visual representation of player's story paths
- **Story Analytics**: Track player choice patterns and preferences
- **Story Tree Sharing**: Share interesting story paths with other players
- **Story Tree Challenges**: Special rewards for completing story trees

### Phase 4C: Advanced Story Mechanics (Weeks 8-10)
**Goal**: Create a comprehensive story ecosystem that enhances the entire game

#### Story Tree Intelligence
- **AI-Generated Branches**: Use LLM to create new story branches dynamically
- **Player Behavior Analysis**: Adapt story options based on player preferences
- **Story Tree Optimization**: Automatically prune unused branches
- **Narrative Coherence Engine**: Ensure story consistency across all choices

#### Integration with Core Systems
- **Achievement Integration**: Unlock achievements for story tree milestones
- **Item System Integration**: Special items for story tree completion
- **Skill System Integration**: Bonus XP for story tree exploration
- **Rebirth System Integration**: Story tree bonuses for new lives

#### Advanced Persistence
- **Cloud Storage**: Sync story trees across devices
- **Story Tree Backup**: Export/import story trees
- **Story Tree Versioning**: Track story tree evolution over time
- **Story Tree Analytics**: Detailed statistics on player story choices

### Phase 5: Story Ecosystem (Future Vision)
**Goal**: Create a living, breathing story system that evolves with the player

#### Community Features
- **Story Tree Sharing**: Share story trees with other players
- **Story Tree Challenges**: Community challenges for story completion
- **Story Tree Leaderboards**: Rank players by story tree depth/completion
- **Story Tree Collaboration**: Multiple players contribute to story trees

#### Advanced AI Integration
- **Dynamic Story Generation**: AI creates new story branches based on player behavior
- **Narrative Adaptation**: Story adjusts to player's play style
- **Story Tree Evolution**: Stories evolve based on community choices
- **Predictive Storytelling**: AI predicts and prepares story branches

#### Meta-Game Features
- **Story Tree Mastery**: Special rewards for mastering story trees
- **Story Tree Legacy**: Pass story trees to other players
- **Story Tree Competitions**: Competitive story tree challenges
- **Story Tree Economy**: Trade story tree progress with other players

### Future Story ideas
- base "start your adventure" on the prompt from the amulet.
- allow adventures only upon new amulet prompts
- save adventure context for the future to change the story
- get offered different options dependent on the current career progression(e.g. common work, military, arcane etc. affect the offered options), with success probablities based on skill levels
- if you chose an option one time, that is locked as the "option" for that career category forever, creating a tree of locked options based on what you've chosen before.
- for example in adventure at level 25 amulet prompt, you might chose option 1 based on your military career. the next scenario you are presented with will be the same every time (given you choose option 1 and roll the same result)
- if you in a subsequent level 25 amulet adventure (in your next life) chose the option 2 then that scenario will also be stored. this will be true for every chosen option, allowing you to create a specific story that you relive.
- i think this should look like a data structure representing each "amulet prompt" and it should have basically a tree inside of it with stored decision paths. if a player then finds that no leaves exist after they make a choice then a new one will be created for the subsequent playthrough