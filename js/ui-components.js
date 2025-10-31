/**
 * Sci-Fi Analytics Dashboard UI Components
 * Non-intrusive UI layer that binds to existing game logic
 */

class SciFiUI {
  constructor() {
    this.components = new Map();
    this.updateQueue = [];
    this.isUpdating = false;
    this.lastUpdateTime = 0;
    this.updateInterval = 1000 / 30; // 30 FPS max
    
    // Initialize components
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupComponents());
    } else {
      this.setupComponents();
    }
  }

  setupComponents() {
    this.createBigCounter();
    this.createRateChip();
    this.createUpgradeCards();
    this.createPrestigeCard();
    this.createCharts();
    this.createAchievements();
    this.createNavigation();
    this.createToastSystem();
    
    // Start update loop
    this.startUpdateLoop();
  }

  // Big Counter Component
  createBigCounter() {
    // Prefer a pre-rendered sci-fi counter if present (index-sci-fi.html)
    let counterElement = document.getElementById('sciFiBigCounter');
    let valueElement = document.getElementById('sciFiBigCounterValue');

    if (!counterElement || !valueElement) {
      const coinDisplay = document.getElementById('coinDisplay');
      if (!coinDisplay || !coinDisplay.parentElement) return;

      const counterHTML = `
        <div class="big-counter" id="sci-fi-big-counter">
          <div class="big-counter-value" id="sci-fi-counter-value">0</div>
          <div class="big-counter-label">Data Points</div>
        </div>
      `;
      // Insert AFTER the original coinDisplay to avoid breaking its expected children
      coinDisplay.insertAdjacentHTML('afterend', counterHTML);
      counterElement = document.getElementById('sci-fi-big-counter');
      valueElement = document.getElementById('sci-fi-counter-value');
    }

    this.components.set('bigCounter', {
      element: counterElement,
      valueElement: valueElement,
      lastValue: 0,
      animationQueue: []
    });
  }

  updateBigCounter() {
    const component = this.components.get('bigCounter');
    if (!component) return;

    const currentValue = gameData.coins;
    const valueElement = component.valueElement;
    
    if (currentValue !== component.lastValue) {
      // Animate value change
      this.animateValue(valueElement, component.lastValue, currentValue, (value) => {
        valueElement.textContent = this.formatNumber(value);
      });

      // Show delta feedback
      if (currentValue > component.lastValue) {
        this.showDeltaFeedback(component.element, currentValue - component.lastValue);
      }

      component.lastValue = currentValue;
    }
  }

  animateValue(element, from, to, callback) {
    const duration = 300;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = from + (to - from) * easeOut;
      
      callback(Math.floor(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  showDeltaFeedback(container, delta) {
    const deltaElement = document.createElement('div');
    deltaElement.className = 'big-counter-delta';
    deltaElement.textContent = `+${this.formatNumber(delta)}`;
    container.appendChild(deltaElement);

    // Remove after animation
    setTimeout(() => {
      if (deltaElement.parentNode) {
        deltaElement.parentNode.removeChild(deltaElement);
      }
    }, 1000);
  }

  // Rate Chip Component
  createRateChip() {
    const netDisplay = document.getElementById('netDisplay');
    const signDisplay = document.getElementById('signDisplay');
    if (!netDisplay || !signDisplay) return;

    const rateChipHTML = `
      <div class="rate-chip" id="sci-fi-rate-chip">
        <div class="rate-chip-trend" id="sci-fi-rate-trend"></div>
        <div class="rate-chip-value" id="sci-fi-rate-value">0</div>
        <div class="rate-chip-label">/day</div>
      </div>
    `;

    // Insert after the existing displays
    netDisplay.parentNode.insertAdjacentHTML('afterend', rateChipHTML);
    
    this.components.set('rateChip', {
      element: document.getElementById('sci-fi-rate-chip'),
      valueElement: document.getElementById('sci-fi-rate-value'),
      trendElement: document.getElementById('sci-fi-rate-trend'),
      lastRate: 0,
      rateHistory: [],
      lastPulseTime: 0
    });
  }

  updateRateChip() {
    const component = this.components.get('rateChip');
    if (!component) return;

    if (typeof getIncome !== 'function' || typeof getExpense !== 'function') return;
    const currentRate = getIncome() - getExpense();
    const currentTime = performance.now();
    
    // Update rate history for trend calculation
    component.rateHistory.push({
      rate: currentRate,
      time: currentTime
    });
    
    // Keep only last 10 seconds of history
    const tenSecondsAgo = currentTime - 10000;
    component.rateHistory = component.rateHistory.filter(entry => entry.time > tenSecondsAgo);
    
    // Update display
    component.valueElement.textContent = this.formatNumber(Math.abs(currentRate));
    
    // Update trend indicator
    const trendElement = component.trendElement;
    if (currentRate > 0) {
      trendElement.className = 'rate-chip-trend';
    } else if (currentRate < 0) {
      trendElement.className = 'rate-chip-trend negative';
    } else {
      trendElement.className = 'rate-chip-trend';
    }
    
    // Check for rate increase pulse
    if (component.rateHistory.length >= 2) {
      const avgRate = component.rateHistory.reduce((sum, entry) => sum + entry.rate, 0) / component.rateHistory.length;
      const rateIncrease = (currentRate - avgRate) / avgRate;
      
      if (rateIncrease >= 0.05 && currentTime - component.lastPulseTime > 2000) {
        component.element.classList.add('pulsing');
        component.lastPulseTime = currentTime;
        
        setTimeout(() => {
          component.element.classList.remove('pulsing');
        }, 600);
      }
    }
    
    component.lastRate = currentRate;
  }

  // Upgrade Cards Component
  createUpgradeCards() {
    // This will be called when we create the new layout
    // For now, we'll enhance existing tables
    this.enhanceExistingTables();
  }

  enhanceExistingTables() {
    const jobTable = document.getElementById('jobTable');
    const skillTable = document.getElementById('skillTable');
    const itemTable = document.getElementById('itemTable');
    
    [jobTable, skillTable, itemTable].forEach(table => {
      if (table) {
        table.classList.add('upgrade-grid');
        this.addCardInteractions(table);
      }
    });
  }

  addCardInteractions(table) {
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      if (row.querySelector('.progress-bar') || row.querySelector('.button')) {
        row.classList.add('upgrade-card');
        
        // Add hover effects
        row.addEventListener('mouseenter', () => {
          row.style.transform = 'translateY(-2px)';
          row.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        });
        
        row.addEventListener('mouseleave', () => {
          row.style.transform = 'translateY(0)';
          row.style.boxShadow = 'none';
        });
      }
    });
  }

  // Prestige Card Component
  createPrestigeCard() {
    const rebirthTab = document.getElementById('rebirth');
    if (!rebirthTab) return;

    const prestigeCardHTML = `
      <div class="prestige-card" id="sci-fi-prestige-card">
        <div class="prestige-card-title">Prestige System</div>
        <div class="prestige-card-shards" id="sci-fi-prestige-shards">0</div>
        <div class="prestige-card-multiplier" id="sci-fi-prestige-multiplier">x1.0</div>
        <button class="prestige-card-button" id="sci-fi-prestige-button" onclick="showPrestigeModal()">
          Prestige Now
        </button>
      </div>
    `;

    rebirthTab.insertAdjacentHTML('afterbegin', prestigeCardHTML);
    
    this.components.set('prestigeCard', {
      element: document.getElementById('sci-fi-prestige-card'),
      shardsElement: document.getElementById('sci-fi-prestige-shards'),
      multiplierElement: document.getElementById('sci-fi-prestige-multiplier'),
      buttonElement: document.getElementById('sci-fi-prestige-button')
    });
  }

  updatePrestigeCard() {
    const component = this.components.get('prestigeCard');
    if (!component) return;

    // Calculate prestige shards (simplified)
    const shards = Math.floor(gameData.rebirthOneCount + gameData.rebirthTwoCount);
    const multiplier = 1 + shards / 10;
    
    component.shardsElement.textContent = shards;
    component.multiplierElement.textContent = `x${multiplier.toFixed(1)}`;
    
    // Update button state
    const canPrestige = daysToYears(gameData.days) >= 65;
    component.buttonElement.disabled = !canPrestige;
  }

  // Charts Component
  createCharts() {
    const mainContent = document.querySelector('.dashboard-main') || document.querySelector('.panel');
    if (!mainContent) return;

    const chartsHTML = `
      <div class="charts-container" id="sci-fi-charts">
        <div class="chart-panel">
          <div class="chart-title">Data Points Over Time</div>
          <canvas class="chart-canvas" id="sci-fi-line-chart" width="400" height="200"></canvas>
        </div>
        <div class="chart-panel">
          <div class="chart-title">Income Sources (Last 60s)</div>
          <canvas class="chart-canvas" id="sci-fi-bar-chart" width="400" height="200"></canvas>
        </div>
      </div>
    `;

    mainContent.insertAdjacentHTML('beforeend', chartsHTML);
    
    this.components.set('charts', {
      lineChart: document.getElementById('sci-fi-line-chart'),
      barChart: document.getElementById('sci-fi-bar-chart'),
      dataHistory: [],
      lastChartUpdate: 0
    });
  }

  updateCharts() {
    const component = this.components.get('charts');
    if (!component) return;
    if (typeof window === 'undefined' || typeof gameData === 'undefined' || !gameData.currentJob) return;

    const currentTime = performance.now();
    
    // Only update charts once per second
    if (currentTime - component.lastChartUpdate < 1000) return;
    
    // Add current data point
    component.dataHistory.push({
      time: currentTime,
      coins: gameData.coins,
      income: getIncome(),
      expense: getExpense()
    });
    
    // Keep only last hour of data
    const oneHourAgo = currentTime - 3600000;
    component.dataHistory = component.dataHistory.filter(entry => entry.time > oneHourAgo);
    
    // Update charts (simplified - would use Chart.js in real implementation)
    this.drawSimpleChart(component.lineChart, component.dataHistory);
    this.drawBarChart(component.barChart);
    
    component.lastChartUpdate = currentTime;
  }

  drawSimpleChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    if (data.length > 1) {
      const maxValue = Math.max(...data.map(d => d.coins));
      const minValue = Math.min(...data.map(d => d.coins));
      const range = maxValue - minValue || 1;
      
      data.forEach((point, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((point.coins - minValue) / range) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
    }
    
    ctx.stroke();
  }

  drawBarChart(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Simple bar chart showing income vs expense
    const income = getIncome();
    const expense = getExpense();
    const maxValue = Math.max(income, expense) || 1;
    
    // Income bar
    ctx.fillStyle = '#00ff88';
    const incomeHeight = (income / maxValue) * height * 0.4;
    ctx.fillRect(width * 0.1, height - incomeHeight, width * 0.3, incomeHeight);
    
    // Expense bar
    ctx.fillStyle = '#ff4444';
    const expenseHeight = (expense / maxValue) * height * 0.4;
    ctx.fillRect(width * 0.6, height - expenseHeight, width * 0.3, expenseHeight);
  }

  // Achievements Component
  createAchievements() {
    // This would create the achievements grid
    // For now, we'll enhance existing requirement system
    this.enhanceAchievements();
  }

  enhanceAchievements() {
    // Guard until gameData/requirements are initialized
    if (typeof window === 'undefined' || typeof gameData === 'undefined' || !gameData.requirements) return;
    Object.keys(gameData.requirements).forEach(key => {
      const requirement = gameData.requirements[key];
      if (requirement && requirement.completed && !requirement.uiNotified) {
        this.showAchievementToast(key);
        requirement.uiNotified = true;
      }
    });
  }

  // Navigation Component
  createNavigation() {
    const tabButtons = document.querySelectorAll('.tabButton');
    if (tabButtons.length === 0) return;

    const navHTML = `
      <div class="nav-tabs" id="sci-fi-nav-tabs">
        <button class="nav-tab active" data-tab="jobs">Production</button>
        <button class="nav-tab" data-tab="skills">Skills</button>
        <button class="nav-tab" data-tab="shop">Upgrades</button>
        <button class="nav-tab" data-tab="rebirth">Prestige</button>
        <button class="nav-tab" data-tab="settings">Settings</button>
      </div>
    `;

    // Insert navigation
    const mainPanel = document.querySelector('.panel.w3-margin-left');
    if (mainPanel) {
      mainPanel.insertAdjacentHTML('afterbegin', navHTML);
    }

    // Add click handlers
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Hide all tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.style.display = 'none';
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
      selectedTab.style.display = 'block';
    }
  }

  // Toast System
  createToastSystem() {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'sci-fi-toast-container';
    document.body.appendChild(toastContainer);
  }

  showToast(title, message, type = 'success') {
    const container = document.getElementById('sci-fi-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">${title}</div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  showAchievementToast(achievementName) {
    this.showToast('Achievement Unlocked!', achievementName, 'success');
  }

  // Utility Methods
  formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
  }

  // Update Loop
  startUpdateLoop() {
    const update = () => {
      const currentTime = performance.now();
      
      if (currentTime - this.lastUpdateTime >= this.updateInterval) {
        this.updateAll();
        this.lastUpdateTime = currentTime;
      }
      
      requestAnimationFrame(update);
    };
    
    requestAnimationFrame(update);
  }

  updateAll() {
    this.updateBigCounter();
    this.updateRateChip();
    this.updatePrestigeCard();
    this.updateCharts();
    this.enhanceAchievements();
  }
}

// Initialize the UI when the script loads
let sciFiUI;
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    sciFiUI = new SciFiUI();
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SciFiUI;
}


