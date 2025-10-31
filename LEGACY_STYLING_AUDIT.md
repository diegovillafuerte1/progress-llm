# Legacy Styling Audit Report

## Overview
This document identifies all legacy styling that doesn't match the modern dark theme with purple accents and rounded corners seen in the UI.

---

## 🔴 CRITICAL: Core CSS Files Need Updates

### 1. `css/styles.css` - Heavy Legacy Styling
**File contains old light theme colors that override the modern theme:**

#### Background Colors (Lines 1-3, 148)
- `body { background-color: rgb(243, 243, 243); }` - Light gray (should use `var(--space-bg)`)
- `.panel { background-color: white; }` - White panels (should use `var(--space-panel)`)

#### Progress Bars (Lines 27-37)
- `.progress-bar { background-color: rgb(12, 101, 173); }` - Old blue
- `.progress-fill { background-color: rgb(46, 148, 231); }` - Old light blue
- **Should use:** `var(--space-border)` and `var(--accent-primary)`

#### Current State Highlight (Line 15-17)
- `.current { background-color: orange !important; }` - Orange highlight
- **Should use:** `var(--accent-warning)` or `var(--neon-orange)`

#### Buttons (Lines 47-49, 51-62)
- `.button { border: 1px solid black !important; }` - Black border
- `.item-button { background-color: white; }` - White buttons
- `.item-button:hover { background-color: rgb(192, 192, 192); }` - Gray hover
- **Should use:** Design system colors with rounded corners

#### Sliders (Lines 109-141)
- `.slider { background: #d3d3d3; }` - Light gray slider track
- `.slider::-webkit-slider-thumb { background: #4CAF50; }` - Old green
- **Should use:** `var(--space-border)` and `var(--neon-green)`

#### Tooltip (Lines 72-99)
- `background-color: black;` - Black tooltip
- **Should use:** `var(--space-panel)` with theme colors

---

### 2. `css/dark.css` - Minimal & Doesn't Use Design System
**File is too basic and doesn't leverage CSS variables:**

#### Current Implementation (Lines 1-23)
- Hardcoded `rgb(32, 32, 32)` for background
- Hardcoded `rgb(46, 46, 46)` for panels
- Hardcoded `rgb(31, 31, 31)` for buttons
- **Should be:** Refactored to use CSS variables from `sci-fi-theme.css`

---

## 🟡 MEDIUM: Inline Styles in HTML

### 3. `index.html` - 36+ Inline Style Issues

#### Hardcoded Text Colors
- `color: red` - Line 21 ("Signal Lost")
  - **Should use:** `var(--text-danger)` or `var(--neon-orange)`
- `color: gray` - Multiple instances (lines 22, 26, 48, 76, 82, 86, 90, 96, 107)
  - **Should use:** `var(--text-secondary)`
- `color: green` - Line 57 (Income/day)
  - **Should use:** `var(--text-success)` or `var(--neon-green)`
- `color: rgb(9, 160, 230)` - Line 51 (Net/day) - Old blue
  - **Should use:** `var(--neon-cyan)` or `var(--accent-primary)`
- `color: rgb(15, 105, 207)` - Line 85 (Efficiency) - Old blue
  - **Should use:** `var(--accent-primary)`
- `color: rgb(200, 0, 0)` - Lines 89, 206, 277, 298 (Corruption/Evil)
  - **Should use:** `var(--text-danger)` or `var(--neon-orange)`

#### Hardcoded Progress Bar Colors
- `background-color:rgb(225, 165, 0)` - Lines 73, 79 (Progress fill - orange)
  - **Should use:** `var(--accent-primary)` or `var(--neon-orange)`

#### Hardcoded Section Colors
- `border: 2px solid #2196F3` - Line 310 (Mistral API section) - Old Material blue
  - **Should use:** `var(--accent-primary)` or `var(--neon-cyan)`
- `color: #2196F3` - Line 311 - Old Material blue
- `border: 2px solid #4CAF50` - Line 321 (Story Adventure section) - Old Material green
  - **Should use:** `var(--neon-green)` or `var(--accent-secondary)`
- `color: #4CAF50` - Lines 239, 254, 271, 295, 322 - Old Material green
  - **Should use:** `var(--neon-green)`
- `background-color: rgba(33, 150, 243, 0.1)` - Line 310 - Old blue tint
  - **Should use:** `rgba(0, 212, 255, 0.1)` or CSS variable
- `background-color: rgba(76, 175, 80, 0.1)` - Line 321 - Old green tint
  - **Should use:** `rgba(0, 255, 136, 0.1)` or CSS variable

---

## 🟠 MINOR: JavaScript-Generated Styles

### 4. Progress Bar Colors Set in JavaScript
**Location:** `js/main.js` likely sets progress bar colors dynamically
- Check where `.progress-fill` background colors are set
- Should use CSS variables or theme-aware color functions

---

## 📋 Summary of Recommended Changes

### Priority 1: Core CSS Files
1. **Update `css/styles.css`:**
   - Replace all hardcoded colors with CSS variables
   - Update progress bars to use theme colors
   - Update buttons to use theme system
   - Update sliders to use theme colors
   - Make `.panel` use `var(--space-panel)`

2. **Refactor `css/dark.css`:**
   - Use CSS variables instead of hardcoded RGB values
   - Or merge into `sci-fi-theme.css` if redundant

### Priority 2: HTML Inline Styles
3. **Update `index.html`:**
   - Replace all `color: gray` with `var(--text-secondary)`
   - Replace all `color: red` with `var(--text-danger)`
   - Replace all `color: green` with `var(--neon-green)`
   - Replace RGB colors with CSS variables
   - Replace hex colors (#2196F3, #4CAF50) with CSS variables
   - Update progress bar inline styles to use CSS variables

### Priority 3: Consistency
4. **Ensure all colors use the design system:**
   - No hardcoded RGB values
   - No generic color names (red, green, gray)
   - All colors reference CSS variables
   - Progress bars use theme-aware colors

---

## 🎨 Design System Reference

Use these CSS variables (from `sci-fi-theme.css`):
- **Text:** `var(--text-primary)`, `var(--text-secondary)`, `var(--text-danger)`, `var(--text-success)`
- **Accents:** `var(--accent-primary)` (cyan), `var(--neon-green)`, `var(--neon-orange)`
- **Backgrounds:** `var(--space-bg)`, `var(--space-panel)`, `var(--space-panel-elevated)`
- **Borders:** `var(--space-border)`

---

## ✅ Files That Are Already Modern
- `css/sci-fi-theme.css` - ✅ Uses CSS variables correctly
- `css/components.css` - ✅ Uses CSS variables correctly
- New ad styles in `css/styles.css` (lines 171-333) - ✅ Uses CSS variables

---

**Total Issues Found:**
- **CSS File Issues:** ~15 hardcoded color values
- **HTML Inline Styles:** ~36 instances
- **Estimated Lines to Update:** ~50-60 lines across files

