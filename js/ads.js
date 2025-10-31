// Ad System for Progress Knight
// Phase 1: Native Ad Implementation

// Ad Performance Tracking
const adPerformance = {
    clicks: 0,
    impressions: 0,
    revenue: 0,
    rewardsGiven: 0,
    daily: {},
    weekly: {},
    monthly: {}
};

// Ad Templates
const adTemplates = [
    {
        id: 'galactic-trading',
        title: 'Galactic Trading Co.',
        description: 'Trade resources across the galaxy. Get 50% bonus credits on your first trade!',
        reward: { type: 'xp', value: 100 },
        logo: 'G',
        revenue: 0.20
    },
    {
        id: 'stellar-defense',
        title: 'Stellar Defense',
        description: 'Protect your space station with advanced defense systems. Limited time offer!',
        reward: { type: 'coins', value: 50 },
        logo: 'S',
        revenue: 0.20
    },
    {
        id: 'astro-research',
        title: 'Astro Research Lab',
        description: 'Unlock new technologies and advance your space program. Research points +100%!',
        reward: { type: 'speed', value: 2 },
        logo: 'A',
        revenue: 0.20
    },
    {
        id: 'cosmic-mining',
        title: 'Cosmic Mining Corp',
        description: 'Extract rare minerals from asteroid fields. Double your mining efficiency!',
        reward: { type: 'xp', value: 150 },
        logo: 'C',
        revenue: 0.25
    },
    {
        id: 'stellar-fleet',
        title: 'Stellar Fleet Command',
        description: 'Command a fleet of starships. Unlock new space exploration missions!',
        reward: { type: 'coins', value: 75 },
        logo: 'F',
        revenue: 0.25
    }
];

// Ad Cooldowns
const adCooldowns = {};

// Initialize Ad System
function initAdSystem() {
    console.log('🎯 Ad System Initialized');
    
    // Track impressions
    trackAdImpressions();
    
    // Start ad rotation
    startAdRotation();
    
    // Initialize analytics
    initAdAnalytics();
}

// Track Ad Impressions
function trackAdImpressions() {
    const nativeAds = document.querySelectorAll('.native-ad');
    nativeAds.forEach(ad => {
        adPerformance.impressions++;
        const adId = ad.dataset.adId;
        console.log(`📊 Ad impression: ${adId}`);
    });
}

// Native Ad Click Handler
function clickRewardedAd(adId) {
    console.log(`🎯 Ad clicked: ${adId}`);
    
    // Check cooldown
    if (!canClickAd(adId)) {
        showCooldownMessage();
        return;
    }
    
    // Find ad template
    const adTemplate = adTemplates.find(ad => ad.id === adId);
    if (!adTemplate) {
        console.error(`❌ Ad template not found: ${adId}`);
        return;
    }
    
    // Track click
    trackAdClick(adId, adTemplate.revenue);
    
    // Give reward
    giveGameReward(adTemplate);
    
    // Show success message
    showRewardMessage(adTemplate);
    
    // Set cooldown
    setAdCooldown(adId);
    
    // Add success animation
    addSuccessAnimation(adId);
}

// Check if ad can be clicked
function canClickAd(adId) {
    const lastClick = adCooldowns[adId];
    const cooldownTime = 30000; // 30 seconds
    
    if (!lastClick || Date.now() - lastClick > cooldownTime) {
        return true;
    }
    return false;
}

// Set ad cooldown
function setAdCooldown(adId) {
    adCooldowns[adId] = Date.now();
}

// Track ad click
function trackAdClick(adId, revenue) {
    adPerformance.clicks++;
    adPerformance.revenue += revenue;
    adPerformance.rewardsGiven++;
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!adPerformance.daily[today]) {
        adPerformance.daily[today] = { clicks: 0, revenue: 0, rewards: 0 };
    }
    adPerformance.daily[today].clicks++;
    adPerformance.daily[today].revenue += revenue;
    adPerformance.daily[today].rewards++;
    
    console.log(`💰 Revenue: +$${revenue.toFixed(2)} | Total: $${adPerformance.revenue.toFixed(2)}`);
    
    // Send to analytics (if available)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'ad_click', {
            ad_id: adId,
            revenue: revenue,
            currency: 'USD'
        });
    }
}

// Give game reward
function giveGameReward(adTemplate) {
    const reward = adTemplate.reward;
    
    switch (reward.type) {
        case 'xp':
            // Add XP to the game
            if (typeof gameData !== 'undefined' && gameData.skills) {
                // Find the highest level skill and add XP
                let maxSkill = null;
                let maxLevel = 0;
                for (const skill in gameData.skills) {
                    if (gameData.skills[skill].level > maxLevel) {
                        maxLevel = gameData.skills[skill].level;
                        maxSkill = skill;
                    }
                }
                if (maxSkill) {
                    gameData.skills[maxSkill].xp += reward.value;
                    console.log(`🎁 Added ${reward.value} XP to ${maxSkill}`);
                }
            }
            break;
            
        case 'coins':
            // Add coins to the game
            if (typeof gameData !== 'undefined') {
                gameData.coins += reward.value;
                console.log(`🎁 Added ${reward.value} coins`);
            }
            break;
            
        case 'speed':
            // Add speed boost (temporary)
            if (typeof gameData !== 'undefined') {
                const boostTime = reward.value * 3600000; // Convert hours to milliseconds
                const boostEnd = Date.now() + boostTime;
                
                if (!gameData.speedBoosts) {
                    gameData.speedBoosts = [];
                }
                gameData.speedBoosts.push({
                    multiplier: 2,
                    endTime: boostEnd
                });
                console.log(`🎁 Added ${reward.value}h speed boost`);
            }
            break;
    }
    
    // Update UI if possible
    if (typeof updateDisplay === 'function') {
        updateDisplay();
    }
}

// Show reward message
function showRewardMessage(adTemplate) {
    const message = `🎁 Reward claimed! +${adTemplate.reward.value} ${adTemplate.reward.type.toUpperCase()} + $${adTemplate.revenue.toFixed(2)} revenue`;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(145deg, #00ff88, #00d4ff);
            color: #0a0a0f;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
            animation: slideIn 0.5s ease;
        ">
            ${message}
        </div>
    `;
    
    // Add CSS animation
    if (!document.querySelector('#reward-animation-css')) {
        const style = document.createElement('style');
        style.id = 'reward-animation-css';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Show cooldown message
function showCooldownMessage() {
    const message = '⏰ Please wait 30 seconds before clicking another ad';
    
    const notification = document.createElement('div');
    notification.className = 'cooldown-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff8c42;
            color: #0a0a0f;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(255, 140, 66, 0.3);
            animation: slideIn 0.5s ease;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 2000);
}

// Add success animation
function addSuccessAnimation(adId) {
    const adElement = document.querySelector(`[data-ad-id="${adId}"]`);
    if (adElement) {
        adElement.classList.add('success-animation');
        setTimeout(() => {
            adElement.classList.remove('success-animation');
        }, 600);
    }
}

// Start ad rotation
function startAdRotation() {
    // Rotate ads every 30 seconds
    setInterval(() => {
        rotateAds();
    }, 30000);
}

// Rotate ads
function rotateAds() {
    const nativeAds = document.querySelectorAll('.native-ad');
    nativeAds.forEach(ad => {
        const randomTemplate = adTemplates[Math.floor(Math.random() * adTemplates.length)];
        updateNativeAd(ad, randomTemplate);
    });
}

// Update native ad
function updateNativeAd(adElement, template) {
    const header = adElement.querySelector('.native-ad-header');
    const title = adElement.querySelector('.native-ad-title');
    const description = adElement.querySelector('.native-ad-description');
    const rewardTitle = adElement.querySelector('.native-ad-reward-title');
    const cta = adElement.querySelector('.native-ad-cta');
    
    if (header) {
        const logo = header.querySelector('.native-ad-logo');
        if (logo) logo.textContent = template.logo;
    }
    
    if (title) title.textContent = template.title;
    if (description) description.textContent = template.description;
    if (rewardTitle) rewardTitle.textContent = `🎁 Reward: +${template.reward.value} ${template.reward.type.toUpperCase()}`;
    if (cta) {
        cta.textContent = `${template.title.split(' ')[0]} + Get Reward`;
        cta.onclick = () => clickRewardedAd(template.id);
    }
    
    adElement.dataset.adId = template.id;
}

// Initialize analytics
function initAdAnalytics() {
    console.log('📊 Ad Analytics Initialized');
    
    // Log current performance
    console.log(`📈 Ad Performance: ${adPerformance.clicks} clicks, $${adPerformance.revenue.toFixed(2)} revenue`);
}

// Get ad performance stats
function getAdPerformance() {
    return {
        ...adPerformance,
        clickThroughRate: adPerformance.impressions > 0 ? (adPerformance.clicks / adPerformance.impressions * 100).toFixed(2) + '%' : '0%',
        revenuePerClick: adPerformance.clicks > 0 ? (adPerformance.revenue / adPerformance.clicks).toFixed(2) : '0.00'
    };
}

// Export functions for global access
window.clickRewardedAd = clickRewardedAd;
window.initAdSystem = initAdSystem;
window.getAdPerformance = getAdPerformance;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdSystem);
} else {
    initAdSystem();
}




