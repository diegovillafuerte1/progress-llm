# Progress Knight - LLM Integration Roadmap

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


### Future Story ideas
- base "start your adventure" on the prompt from the amulet.
- allow adventures only upon new amulet prompts
- save adventure context for the future to change the story
- get offered different options dependent on the current career progression(e.g. common work, military, arcane etc. affect the offered options), with success probablities based on skill levels
- if you chose an option one time, that is locked as the "option" for that career category forever, creating a tree of locked options based on what you've chosen before.
- for example in adventure at level 25 amulet prompt, you might chose option 1 based on your military career. the next scenario you are presented with will be the same every time (given you choose option 1 and roll the same result)
- if you in a subsequent level 25 amulet adventure (in your next life) chose the option 2 then that scenario will also be stored. this will be true for every chosen option, allowing you to create a specific story that you relive.