# Progress Knight - LLM Enhanced

### Introduction
Progress Knight is a text-based incremental game, originally developed by Ihtasham42, now enhanced with AI-powered story adventures using Large Language Models (LLMs). This fork adds dynamic, contextual storytelling that adapts to your character's career path, power level, and choices.

### What is Progress Knight about?
Progress Knight is a life-sim incremental game set in a fantasy/medieval world, where you progress through career ladders and acquire skills to become the ultimate being. This enhanced version adds AI-generated story adventures that create unique narratives based on your character's development.

**Core Gameplay:**
- Start as a beggar and work your way up through various career paths
- Choose between Common Work (business/trade), Military (combat/tactical), or The Arcane (magic/spells)
- Manage skills, jobs, income, and living expenses
- Experience rebirth/prestige system with XP multipliers
- **NEW:** AI-powered story adventures at key life milestones (ages 25, 45, 65, 200)

**Enhanced Features:**
- **Dynamic Story Generation:** LLM creates contextual stories based on your career and power level
- **Story Tree Persistence:** Your choices are remembered across rebirths, creating a branching narrative history
- **Power Level System:** Character strength affects story difficulty and outcomes
- **Career-Specific Adventures:** Different story types for each career path
- **Choice-Based Rewards:** Earn XP based on your adventure performance

### Where can I play Progress Knight?
- **Original Game:** [Github Pages](https://ihtasham42.github.io/progress-knight/)  
- **Original Game:** [Armor Games](https://armorgames.com/progress-knight-game/19095)
- **Original Game:** [Crazy Games](https://www.crazygames.com/game/progress-knight)
- **This Enhanced Version:** Run locally with `python3 -m http.server 8001` and visit `http://localhost:8001`

### LLM Integration Features

#### Story Adventures
- **Milestone Adventures:** Unlock at ages 25, 45, 65, and 200
- **Career Context:** Stories adapt to your chosen career path (Common Work, Military, The Arcane)
- **Power Scaling:** Story difficulty scales with your character's power level (10-C to 5-C tiers)
- **Choice Types:** Four different approaches (aggressive, diplomatic, cautious, creative)
- **Success Rates:** Calculated based on your skills and character stats

#### Story Tree System
- **Persistent Choices:** Your adventure decisions are remembered across rebirths
- **Branching Narratives:** Make different choices to explore alternative story paths
- **Debug Interface:** View your complete story tree history with the debug UI
- **Choice Metadata:** Each choice stores power level, success status, and timestamps

#### Technical Implementation
- **Minimal Architecture:** Clean, efficient code following the original game's philosophy
- **Mistral API Integration:** Uses Mistral's language models for story generation
- **localStorage Persistence:** Story trees and game state saved locally
- **Comprehensive Testing:** 422 tests across 26 test suites ensuring reliability

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/progress-llm.git
   cd progress-llm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get a Mistral API key:**
   - Visit [console.mistral.ai](https://console.mistral.ai)
   - Create an account and get your free API key
   - Enter the key in the game's Mistral API Configuration section

4. **Run the game:**
   ```bash
   python3 -m http.server 8001
   ```
   Then visit `http://localhost:8001` in your browser

5. **Configure API key:**
   - Click the Amulet tab in-game
   - Enter your Mistral API key in the configuration section
   - Start playing and reach age 25 to unlock your first adventure!

### Game Architecture

#### Core Files
- `js/main.js` - Main game logic and UI updates
- `js/classes.js` - Game entity classes (Task, Job, Skill, etc.)
- `js/main-adventure-minimal.js` - LLM adventure system (refactored for minimalism)

#### LLM Integration
- **Story Generation:** Context-aware stories based on character state
- **Power Level Calculation:** 16-tier system based on VS Battles Wiki
- **Choice Processing:** Four choice types with success probability calculation
- **Reward System:** XP rewards based on adventure performance

#### Testing
- **Test Suite:** 422 tests across 26 test suites
- **Coverage:** Core functionality, LLM integration, regression tests
- **Run Tests:** `npm test`

### Recent Updates

#### Latest Version (October 2025)
- ✅ **Minimal Architecture Refactor:** Consolidated bloated LLM system into efficient, maintainable code
- ✅ **Story Tree Persistence:** Adventures and choices persist across rebirths
- ✅ **Power Level Integration:** Stories scale with character power level
- ✅ **Comprehensive Testing:** All 422 tests passing
- ✅ **Browser Verification:** Full end-to-end testing completed

#### Key Features
- **One Adventure Per Life:** Each milestone adventure can only be played once per life
- **Story Tree Debug UI:** View your complete adventure history
- **Career-Specific Stories:** Different narratives for each career path
- **Success Rate Calculation:** Based on character skills and power level
- **XP Rewards:** Earn skill XP based on adventure performance

### Development Status
- **Current Version:** Refactored minimal architecture
- **Test Status:** 422/422 tests passing ✅
- **Browser Status:** Fully functional ✅
- **API Integration:** Mistral API working ✅
- **Story Trees:** Persistent across rebirths ✅

### Contributing
This project follows the original game's philosophy of minimal, understandable code. All new features are thoroughly tested and documented.

### License
This project is based on the original Progress Knight by Ihtasham42, licensed under the Unlicense (Public Domain).
