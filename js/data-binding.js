/**
 * Data Binding System for Sci-Fi Analytics Dashboard
 * Non-intrusive binding layer that connects UI components to existing game logic
 */

class DataBindingSystem {
  constructor() {
    this.bindings = new Map();
    this.updateQueue = [];
    this.isUpdating = false;
    this.lastUpdateTime = 0;
    this.updateInterval = 1000 / 30; // 30 FPS max for smooth animations
    
    // Data history for charts and analytics
    this.dataHistory = {
      coins: [],
      income: [],
      expense: [],
      happiness: [],
      evil: [],
      time: []
    };
    
    // Rate tracking for pulse animations
    this.rateHistory = {
      income: [],
      expense: [],
      net: []
    };
    
    this.init();
  }

  init() {
    // Wait for game data to be available
    if (typeof gameData === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }
    
    this.setupBindings();
    this.startUpdateLoop();
  }

  setupBindings() {
    // Bind main counter (coins)
    this.addBinding('bigCounter', () => gameData.coins, (value) => {
      this.updateBigCounter(value);
    });

    // Bind rate chip (net income)
    this.addBinding('rateChip', () => {
      const income = getIncome();
      const expense = getExpense();
      return { net: income - expense, income, expense };
    }, (data) => {
      this.updateRateChip(data);
    });

    // Bind prestige card
    this.addBinding('prestigeCard', () => {
      const shards = gameData.rebirthOneCount + gameData.rebirthTwoCount;
      const multiplier = 1 + shards / 10;
      const canPrestige = daysToYears(gameData.days) >= 65;
      return { shards, multiplier, canPrestige };
    }, (data) => {
      this.updatePrestigeCard(data);
    });

    // Bind status indicators
    this.addBinding('statusIndicators', () => ({
      age: daysToYears(gameData.days),
      day: getDay(),
      lifespan: daysToYears(getLifespan()),
      happiness: getHappiness(),
      evil: gameData.evil,
      timeWarping: gameData.taskData["Time warping"]?.getEffect() || 1
    }), (data) => {
      this.updateStatusIndicators(data);
    });

    // Bind progress bars
    this.addBinding('progressBars', () => ({
      currentJob: gameData.currentJob,
      currentSkill: gameData.currentSkill
    }), (data) => {
      this.updateProgressBars(data);
    });

    // Bind charts data
    this.addBinding('charts', () => {
      const currentTime = performance.now();
      return {
        time: currentTime,
        coins: gameData.coins,
        income: getIncome(),
        expense: getExpense(),
        happiness: getHappiness(),
        evil: gameData.evil
      };
    }, (data) => {
      this.updateCharts(data);
    });

    // Bind achievements
    this.addBinding('achievements', () => {
      const achievements = [];
      Object.keys(gameData.requirements).forEach(key => {
        const requirement = gameData.requirements[key];
        if (requirement.completed && !requirement.uiNotified) {
          achievements.push({ name: key, newlyUnlocked: true });
          requirement.uiNotified = true;
        }
      });
      return achievements;
    }, (achievements) => {
      this.updateAchievements(achievements);
    });
  }

  addBinding(name, getter, updater) {
    this.bindings.set(name, { getter, updater, lastValue: null });
  }

  updateBigCounter(value) {
    const counterElement = document.querySelector('.big-counter-value');
    if (!counterElement) return;

    const lastValue = this.dataHistory.coins[this.dataHistory.coins.length - 1] || 0;
    
    // Animate value change
    this.animateValue(counterElement, lastValue, value, (currentValue) => {
      counterElement.textContent = this.formatNumber(currentValue);
    });

    // Show delta feedback
    if (value > lastValue) {
      this.showDeltaFeedback(value - lastValue);
    }

    // Update data history
    this.dataHistory.coins.push(value);
    this.trimHistory(this.dataHistory.coins);
  }

  updateRateChip(data) {
    const { net, income, expense } = data;
    const currentTime = performance.now();
    
    // Update rate history
    this.rateHistory.net.push({ value: net, time: currentTime });
    this.rateHistory.income.push({ value: income, time: currentTime });
    this.rateHistory.expense.push({ value: expense, time: currentTime });
    
    // Keep only last 10 seconds
    const tenSecondsAgo = currentTime - 10000;
    Object.keys(this.rateHistory).forEach(key => {
      this.rateHistory[key] = this.rateHistory[key].filter(entry => entry.time > tenSecondsAgo);
    });

    // Update UI elements
    const valueElement = document.querySelector('.rate-chip-value');
    const trendElement = document.querySelector('.rate-chip-trend');
    const chipElement = document.querySelector('.rate-chip');
    
    if (valueElement) {
      valueElement.textContent = this.formatNumber(Math.abs(net));
    }
    
    if (trendElement) {
      trendElement.className = 'rate-chip-trend';
      if (net > 0) {
        trendElement.classList.add('positive');
      } else if (net < 0) {
        trendElement.classList.add('negative');
      }
    }
    
    // Check for rate increase pulse
    if (this.rateHistory.net.length >= 2) {
      const avgRate = this.rateHistory.net.reduce((sum, entry) => sum + entry.value, 0) / this.rateHistory.net.length;
      const rateIncrease = (net - avgRate) / Math.abs(avgRate);
      
      if (rateIncrease >= 0.05 && chipElement) {
        chipElement.classList.add('pulsing');
        setTimeout(() => {
          chipElement.classList.remove('pulsing');
        }, 600);
      }
    }
  }

  updatePrestigeCard(data) {
    const { shards, multiplier, canPrestige } = data;
    
    const shardsElement = document.getElementById('prestige-shards');
    const multiplierElement = document.getElementById('prestige-multiplier');
    const buttonElement = document.querySelector('.prestige-card-button');
    
    if (shardsElement) {
      shardsElement.textContent = shards;
    }
    
    if (multiplierElement) {
      multiplierElement.textContent = `x${multiplier.toFixed(1)}`;
    }
    
    if (buttonElement) {
      buttonElement.disabled = !canPrestige;
      if (canPrestige) {
        buttonElement.classList.remove('disabled');
      } else {
        buttonElement.classList.add('disabled');
      }
    }
  }

  updateStatusIndicators(data) {
    const { age, day, lifespan, happiness, evil, timeWarping } = data;
    
    // Update age display
    const ageDisplay = document.getElementById('ageDisplay');
    const dayDisplay = document.getElementById('dayDisplay');
    const lifespanDisplay = document.getElementById('lifespanDisplay');
    const happinessDisplay = document.getElementById('happinessDisplay');
    const evilDisplay = document.getElementById('evilDisplay');
    const timeWarpingDisplay = document.getElementById('timeWarpingDisplay');
    
    if (ageDisplay) ageDisplay.textContent = age;
    if (dayDisplay) dayDisplay.textContent = day;
    if (lifespanDisplay) lifespanDisplay.textContent = lifespan;
    if (happinessDisplay) happinessDisplay.textContent = happiness.toFixed(1);
    if (evilDisplay) evilDisplay.textContent = evil.toFixed(1);
    if (timeWarpingDisplay) timeWarpingDisplay.textContent = `x${timeWarping.toFixed(2)}`;
  }

  updateProgressBars(data) {
    const { currentJob, currentSkill } = data;
    
    // Update job progress
    if (currentJob) {
      const jobProgressBar = document.querySelector('.job .progress-fill');
      const jobProgressText = document.querySelector('.job .progress-text');
      
      if (jobProgressBar && jobProgressText) {
        const progress = (currentJob.xp / currentJob.getMaxXp()) * 100;
        jobProgressBar.style.width = `${progress}%`;
        jobProgressText.textContent = `${currentJob.name} lvl ${currentJob.level}`;
      }
    }
    
    // Update skill progress
    if (currentSkill) {
      const skillProgressBar = document.querySelector('.skill .progress-fill');
      const skillProgressText = document.querySelector('.skill .progress-text');
      
      if (skillProgressBar && skillProgressText) {
        const progress = (currentSkill.xp / currentSkill.getMaxXp()) * 100;
        skillProgressBar.style.width = `${progress}%`;
        skillProgressText.textContent = `${currentSkill.name} lvl ${currentSkill.level}`;
      }
    }
  }

  updateCharts(data) {
    const { time, coins, income, expense, happiness, evil } = data;
    
    // Add to data history
    this.dataHistory.time.push(time);
    this.dataHistory.coins.push(coins);
    this.dataHistory.income.push(income);
    this.dataHistory.expense.push(expense);
    this.dataHistory.happiness.push(happiness);
    this.dataHistory.evil.push(evil);
    
    // Keep only last hour of data
    const oneHourAgo = time - 3600000;
    Object.keys(this.dataHistory).forEach(key => {
      this.dataHistory[key] = this.dataHistory[key].filter((value, index) => {
        return this.dataHistory.time[index] > oneHourAgo;
      });
    });
    
    // Update charts (simplified implementation)
    this.drawLineChart();
    this.drawBarChart();
  }

  updateAchievements(achievements) {
    achievements.forEach(achievement => {
      if (achievement.newlyUnlocked) {
        this.showAchievementToast(achievement.name);
      }
    });
  }

  // Chart drawing methods
  drawLineChart() {
    const canvas = document.getElementById('line-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (this.dataHistory.coins.length < 2) return;
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const maxValue = Math.max(...this.dataHistory.coins);
    const minValue = Math.min(...this.dataHistory.coins);
    const range = maxValue - minValue || 1;
    
    this.dataHistory.coins.forEach((value, index) => {
      const x = (index / (this.dataHistory.coins.length - 1)) * width;
      const y = height - ((value - minValue) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }

  drawBarChart() {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Get recent data (last 60 seconds)
    const recentData = this.getRecentData(60000);
    if (recentData.length === 0) return;
    
    const avgIncome = recentData.reduce((sum, d) => sum + d.income, 0) / recentData.length;
    const avgExpense = recentData.reduce((sum, d) => sum + d.expense, 0) / recentData.length;
    const maxValue = Math.max(avgIncome, avgExpense) || 1;
    
    // Draw income bar
    ctx.fillStyle = '#00ff88';
    const incomeHeight = (avgIncome / maxValue) * height * 0.4;
    ctx.fillRect(width * 0.1, height - incomeHeight, width * 0.3, incomeHeight);
    
    // Draw expense bar
    ctx.fillStyle = '#ff4444';
    const expenseHeight = (avgExpense / maxValue) * height * 0.4;
    ctx.fillRect(width * 0.6, height - expenseHeight, width * 0.3, expenseHeight);
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('Income', width * 0.1, height - 5);
    ctx.fillText('Expense', width * 0.6, height - 5);
  }

  getRecentData(timeWindow) {
    const currentTime = performance.now();
    const cutoffTime = currentTime - timeWindow;
    
    return this.dataHistory.time.map((time, index) => ({
      time,
      coins: this.dataHistory.coins[index],
      income: this.dataHistory.income[index],
      expense: this.dataHistory.expense[index],
      happiness: this.dataHistory.happiness[index],
      evil: this.dataHistory.evil[index]
    })).filter(entry => entry.time > cutoffTime);
  }

  // Animation and feedback methods
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

  showDeltaFeedback(delta) {
    const counterElement = document.querySelector('.big-counter');
    if (!counterElement) return;

    const deltaElement = document.createElement('div');
    deltaElement.className = 'big-counter-delta';
    deltaElement.textContent = `+${this.formatNumber(delta)}`;
    counterElement.appendChild(deltaElement);

    // Remove after animation
    setTimeout(() => {
      if (deltaElement.parentNode) {
        deltaElement.parentNode.removeChild(deltaElement);
      }
    }, 1000);
  }

  showAchievementToast(achievementName) {
    // Create toast if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">Achievement Unlocked!</div>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="toast-message">${achievementName}</div>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  // Utility methods
  formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
  }

  trimHistory(array) {
    const maxLength = 3600; // 1 hour at 1 update per second
    if (array.length > maxLength) {
      array.splice(0, array.length - maxLength);
    }
  }

  // Update loop
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
    this.bindings.forEach((binding, name) => {
      try {
        const newValue = binding.getter();
        
        // Only update if value has changed
        if (JSON.stringify(newValue) !== JSON.stringify(binding.lastValue)) {
          binding.updater(newValue);
          binding.lastValue = newValue;
        }
      } catch (error) {
        console.warn(`Error updating binding ${name}:`, error);
      }
    });
  }
}

// Initialize the data binding system
let dataBindingSystem;
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    dataBindingSystem = new DataBindingSystem();
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataBindingSystem;
}



