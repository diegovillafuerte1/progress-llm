# UI Mapping Analysis - Progress Knight to Sci-Fi Analytics Dashboard

## Current UI Elements → New Component Mapping

### Main Value & Rate Display
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Main balance display | `#coinDisplay` | Big Counter | `gameData.coins` |
| Net income display | `#netDisplay` + `#signDisplay` | Rate Chip | `getNet()` + sign logic |
| Income per day | `#incomeDisplay` | Per-source rate | `getIncome()` |
| Expense per day | `#expenseDisplay` | Per-source rate | `getExpense()` |

### Time & Lifecycle
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Age display | `#ageDisplay` | Status indicator | `daysToYears(gameData.days)` |
| Day display | `#dayDisplay` | Status indicator | `getDay()` |
| Lifespan display | `#lifespanDisplay` | Status indicator | `daysToYears(getLifespan())` |
| Death warning | `#deathText` | Alert system | `isAlive()` |

### Automation & Controls
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Pause button | `#pauseButton` | Control panel | `gameData.paused` |
| Auto-promote checkbox | `#autoPromote` | Automation toggle | `autoPromoteElement.checked` |
| Auto-learn checkbox | `#autoLearn` | Automation toggle | `autoLearnElement.checked` |
| Time warping button | `#timeWarpingButton` | Control panel | `gameData.timeWarpingEnabled` |

### Current Activity
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Current job progress | `#quickTaskDisplay .job` | Activity tracker | `gameData.currentJob` |
| Current skill progress | `#quickTaskDisplay .skill` | Activity tracker | `gameData.currentSkill` |

### Stats & Multipliers
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Happiness display | `#happinessDisplay` | Stat panel | `getHappiness()` |
| Evil display | `#evilDisplay` | Stat panel | `gameData.evil` |
| Evil gain display | `#evilGainDisplay` | Stat panel | `getEvilGain()` |
| Time warping display | `#timeWarpingDisplay` | Stat panel | `timeWarping.getEffect()` |

### Upgrades & Items
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Jobs table | `#jobTable` | Upgrade Cards Grid | `gameData.taskData` (Job instances) |
| Skills table | `#skillTable` | Upgrade Cards Grid | `gameData.taskData` (Skill instances) |
| Shop table | `#itemTable` | Upgrade Cards Grid | `gameData.itemData` |

### Prestige System
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Rebirth tab | `#rebirthTabButton` | Prestige Card | Age requirements |
| Rebirth notes | `#rebirthNote1/2/3` | Prestige Modal | Age milestones |
| Rebirth buttons | `rebirthOne()`, `rebirthTwo()` | Prestige actions | `gameData.rebirthOneCount`, `gameData.rebirthTwoCount` |

### Settings & Utilities
| Current Element | ID/Selector | New Component | Data Source |
|----------------|-------------|---------------|-------------|
| Settings tab | Settings tab button | Settings panel | Various settings |
| Import/Export | `#importExportBox` | Data management | `importGameData()`, `exportGameData()` |
| Theme toggle | `setLightDarkMode()` | Theme switcher | `body.classList.contains("dark")` |

## Data Signals for UI Binding

### Real-time Updates (15-30 FPS)
- `gameData.coins` - Main counter value
- `getIncome()` - Rate chip value
- `getExpense()` - Rate chip value
- `getNet()` - Rate chip value
- `gameData.paused` - Control states

### Per-second Updates
- `gameData.days` - Time progression
- `gameData.currentJob.xp` - Progress bars
- `gameData.currentSkill.xp` - Progress bars
- `getHappiness()` - Stat values

### Event-driven Updates
- Level up events - Achievement triggers
- Rebirth events - Prestige modal
- Requirement unlocks - UI reveals
- Achievement unlocks - Toast notifications

## Component Architecture

### Big Counter Component
- **Data**: `gameData.coins`
- **Animation**: Smooth tweening between values
- **Feedback**: Floating "+delta" on increases
- **Formatting**: Compact notation with full precision tooltip

### Rate Chip Component  
- **Data**: `getIncome()`, `getExpense()`, `getNet()`
- **Animation**: Pulse on rate increases ≥5%
- **Tooltip**: Current rate, 1-min avg, 10-min avg

### Upgrade Cards Component
- **Data**: `gameData.taskData`, `gameData.itemData`
- **States**: Available, disabled, active
- **Interactions**: Click to activate, hover effects, long-press details

### Charts Component
- **Data**: Historical arrays (UI-managed)
- **Types**: Line chart (total over time), stacked bars (per-source)
- **Performance**: Throttled updates, DOM reuse

### Achievements Component
- **Data**: `gameData.requirements` completion status
- **States**: Locked, unlocked, newly unlocked
- **Animation**: Badge flip on unlock, toast notifications

## Implementation Notes

1. **No Game Logic Changes**: All data binding is read-only
2. **Preserve Selectors**: Keep existing IDs for compatibility
3. **Progressive Enhancement**: New UI layers on top of existing structure
4. **Performance**: Throttle updates, use requestAnimationFrame
5. **Accessibility**: Maintain keyboard navigation, add ARIA labels
6. **Responsive**: Mobile-first design with desktop enhancements

## File Structure
```
css/
  - sci-fi-theme.css (new design system)
  - components.css (new component styles)
js/
  - ui-components.js (new component classes)
  - data-binding.js (new binding system)
  - charts.js (new charting system)
```



