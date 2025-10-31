// View-only UI enhancements for classic index.html
// Adds a sci-fi Big Counter as a sibling after #coinDisplay without modifying game logic DOM

(function () {
	function onReady(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	function ensureBigCounter() {
		var coinDisplay = document.getElementById('coinDisplay');
		if (!coinDisplay || !coinDisplay.parentElement) return null;

		var existing = document.getElementById('sci-fi-big-counter');
		if (existing) return existing;

		var container = document.createElement('div');
		container.className = 'big-counter';
		container.id = 'sci-fi-big-counter';
		container.innerHTML = '<div class="big-counter-value" id="sci-fi-counter-value">0</div><div class="big-counter-label">Credits</div>';
		coinDisplay.insertAdjacentElement('afterend', container);
		return container;
	}

	function ensureRateChip() {
		var anchor = document.getElementById('sci-fi-big-counter') || document.getElementById('coinDisplay');
		if (!anchor || !anchor.parentElement) return null;

		var existing = document.getElementById('sci-fi-rate-chip');
		if (existing) return existing;

		var chip = document.createElement('div');
		chip.className = 'rate-chip';
		chip.id = 'sci-fi-rate-chip';
		chip.innerHTML = '<div class="rate-chip-trend" id="sci-fi-rate-trend"></div><div class="rate-chip-value" id="sci-fi-rate-value">0</div><div class="rate-chip-label">/day</div>';
		anchor.insertAdjacentElement('afterend', chip);
		return chip;
	}

	function animateValue(el, from, to, duration) {
		var start = performance.now();
		function step(now) {
			var p = Math.min((now - start) / duration, 1);
			var eased = 1 - Math.pow(1 - p, 3);
			var val = Math.floor(from + (to - from) * eased);
			el.textContent = formatNumber(val);
			if (p < 1) requestAnimationFrame(step);
		}
		requestAnimationFrame(step);
	}

	function formatNumber(num) {
		if (num < 1000) return String(num);
		if (num < 1e6) return (num / 1e3).toFixed(1) + 'K';
		if (num < 1e9) return (num / 1e6).toFixed(1) + 'M';
		if (num < 1e12) return (num / 1e9).toFixed(1) + 'B';
		return (num / 1e12).toFixed(1) + 'T';
	}

	function startUpdater() {
		var container = ensureBigCounter();
		if (!container) return;
		var valueEl = document.getElementById('sci-fi-counter-value');
		if (!valueEl) return;

		var chip = ensureRateChip();
		var chipValue = document.getElementById('sci-fi-rate-value');
		var chipTrend = document.getElementById('sci-fi-rate-trend');

		// Charts (read-only, 1 FPS)
		var charts = ensureChartsContainer();
		var lineCanvas = charts && document.getElementById('sci-fi-line-chart-classic');
		var barCanvas = charts && document.getElementById('sci-fi-bar-chart-classic');
		var history = [];

		var last = 0;
		var lastTick = 0;
		var lastChart = 0;
		var toastHost = ensureToastContainer();

		function loop(now) {
			// throttle to ~30 FPS
			if (now - lastTick >= 33) {
				if (typeof window !== 'undefined' && window.gameData && typeof window.gameData.coins === 'number') {
					var current = window.gameData.coins;
					if (current !== last) {
						animateValue(valueEl, last, current, 300);
						last = current;
					}
				}
				// Update rate chip if helpers are available
				if (chip && chipValue && chipTrend && typeof window.getIncome === 'function' && typeof window.getExpense === 'function') {
					var rate = window.getIncome() - window.getExpense();
					chipValue.textContent = formatNumber(Math.abs(Math.floor(rate)));
					chipTrend.className = 'rate-chip-trend' + (rate < 0 ? ' negative' : '');
				}
				// Charts sample once per second
				if (charts && now - lastChart >= 1000 && window.gameData && typeof window.getIncome === 'function' && typeof window.getExpense === 'function') {
					lastChart = now;
					history.push({
						t: now,
						coins: window.gameData.coins,
						income: window.getIncome(),
						expense: window.getExpense()
					});
					if (history.length > 3600) history.shift();
					if (lineCanvas) drawLine(lineCanvas, history);
					if (barCanvas) drawBars(barCanvas, history);
				}
				// Achievement toast scan (UI-only, non-intrusive)
				if (toastHost && window.gameData && window.gameData.requirements) {
					for (var key in window.gameData.requirements) {
						var req = window.gameData.requirements[key];
						if (req && req.completed && !req.uiNotified) {
							showToast('Achievement', key + ' unlocked');
							req.uiNotified = true;
						}
					}
				}
                // Update inline meta rows (lightweight)
                updateInlineMeta();
				lastTick = now;
			}
			requestAnimationFrame(loop);
		}
		requestAnimationFrame(loop);
	}

	function ensureChartsContainer() {
		var mainPanel = document.querySelector('.panel.w3-margin-left.w3-margin-top.w3-padding');
		if (!mainPanel) return null;
		if (document.getElementById('sci-fi-charts-classic')) return document.getElementById('sci-fi-charts-classic');
		var wrapper = document.createElement('div');
		wrapper.className = 'charts-container';
		wrapper.id = 'sci-fi-charts-classic';
		wrapper.innerHTML = '' +
			'<div class="chart-panel"><div class="chart-title">Credits Over Time</div>' +
			'<canvas class="chart-canvas" id="sci-fi-line-chart-classic" width="400" height="200"></canvas></div>' +
			'<div class="chart-panel"><div class="chart-title">Income vs Expense (avg)</div>' +
			'<canvas class="chart-canvas" id="sci-fi-bar-chart-classic" width="400" height="200"></canvas></div>';
		mainPanel.insertAdjacentElement('afterend', wrapper);
		return wrapper;
	}

	function drawLine(canvas, data) {
		var ctx = canvas.getContext('2d');
		var w = canvas.width, h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		if (!data || data.length < 2) return;
    // gridlines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (var g = 1; g < 5; g++) {
        var gy = (g / 5) * h;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
    }
		var max = -Infinity, min = Infinity;
		for (var i = 0; i < data.length; i++) {
			if (data[i].coins > max) max = data[i].coins;
			if (data[i].coins < min) min = data[i].coins;
		}
		var range = Math.max(1, max - min);
		ctx.strokeStyle = '#00ff88';
		ctx.lineWidth = 2;
		ctx.beginPath();
		for (var j = 0; j < data.length; j++) {
			var x = (j / (data.length - 1)) * w;
			var y = h - ((data[j].coins - min) / range) * h;
			if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	function drawBars(canvas, data) {
		var ctx = canvas.getContext('2d');
		var w = canvas.width, h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		if (!data || data.length < 1) return;
		// average last 60 samples (~60s)
		var N = Math.min(60, data.length);
		var sumInc = 0, sumExp = 0;
		for (var i = data.length - N; i < data.length; i++) {
			sumInc += data[i].income;
			sumExp += data[i].expense;
		}
		var avgInc = sumInc / N;
		var avgExp = sumExp / N;
		var maxVal = Math.max(1, avgInc, avgExp);
		var incH = (avgInc / maxVal) * h * 0.8;
		var expH = (avgExp / maxVal) * h * 0.8;
		ctx.fillStyle = '#00ff88';
		ctx.fillRect(w * 0.15, h - incH, w * 0.25, incH);
		ctx.fillStyle = '#ff4444';
		ctx.fillRect(w * 0.60, h - expH, w * 0.25, expH);
	}

	function ensureToastContainer() {
		if (document.getElementById('sci-fi-toast-container')) return document.getElementById('sci-fi-toast-container');
		var host = document.createElement('div');
		host.className = 'toast-container';
		host.id = 'sci-fi-toast-container';
		document.body.appendChild(host);
		return host;
	}

	function showToast(title, message) {
		var host = ensureToastContainer();
		var toast = document.createElement('div');
		toast.className = 'toast success';
		toast.innerHTML = '<div class="toast-header"><div class="toast-title">' + title + '</div>' +
			'<button class="toast-close" aria-label="Close">×</button></div>' +
			'<div class="toast-message">' + message + '</div>';
		host.appendChild(toast);
		var close = toast.querySelector('.toast-close');
		if (close) close.addEventListener('click', function(){ toast.remove(); });
		setTimeout(function(){ if (toast.parentNode) toast.remove(); }, 3000);
	}

function injectPrestigePreview() {
    var rebirthTab = document.getElementById('rebirth');
    if (!rebirthTab) return;
    if (document.getElementById('sci-fi-prestige-preview-btn')) return;

    var btn = document.createElement('button');
    btn.className = 'control-button';
    btn.id = 'sci-fi-prestige-preview-btn';
    btn.textContent = 'Preview Prestige';
    btn.style.margin = '8px 0';
    rebirthTab.insertAdjacentElement('afterbegin', btn);

    var overlay = document.createElement('div');
    overlay.id = 'sci-fi-prestige-modal';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.zIndex = '1050';

    var card = document.createElement('div');
    card.className = 'prestige-card';
    card.style.maxWidth = '520px';
    card.style.margin = '10vh auto';
    card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
    card.innerHTML = '' +
        '<div class="prestige-card-title">Prestige Preview</div>' +
        '<div class="prestige-card-shards" id="sci-fi-preview-shards">0</div>' +
        '<div class="prestige-card-multiplier" id="sci-fi-preview-mult">x1.0 projected multiplier</div>' +
        '<div class="chart-title" style="margin-top:8px">Projected Growth (UI-only)</div>' +
        '<canvas class="chart-canvas" id="sci-fi-preview-chart" width="420" height="160"></canvas>' +
        '<div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">' +
            '<button class="control-button" id="sci-fi-preview-close">Close</button>' +
            '<button class="control-button" id="sci-fi-preview-focus">Focus Amulet Action</button>' +
        '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    btn.addEventListener('click', function () {
        updatePrestigePreview();
        overlay.style.display = 'block';
    });

    card.querySelector('#sci-fi-preview-close').addEventListener('click', function(){ overlay.style.display = 'none'; });
    card.querySelector('#sci-fi-preview-focus').addEventListener('click', function(){
        var touchBtn = document.querySelector('#rebirth button.w3-button.button');
        if (touchBtn && touchBtn.scrollIntoView) touchBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        overlay.style.display = 'none';
    });

    function updatePrestigePreview() {
        var shardsEl = document.getElementById('sci-fi-preview-shards');
        var multEl = document.getElementById('sci-fi-preview-mult');
        var currentShards = 0;
        var multiplier = 1.0;
        if (window.gameData) {
            var r1 = Number(window.gameData.rebirthOneCount || 0);
            var r2 = Number(window.gameData.rebirthTwoCount || 0);
            currentShards = Math.floor(r1 + r2);
            multiplier = 1 + currentShards / 10;
        }
        if (shardsEl) shardsEl.textContent = String(currentShards);
        if (multEl) multEl.textContent = 'x' + multiplier.toFixed(1) + ' projected multiplier';
        var canvas = document.getElementById('sci-fi-preview-chart');
        if (canvas) drawPreview(canvas, multiplier);
    }

    function drawPreview(canvas, mult) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        var base = [0, 1, 2, 3, 4, 5, 6];
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#8884ff';
        ctx.beginPath();
        for (var i = 0; i < base.length; i++) {
            var x = (i / (base.length - 1)) * w;
            var y = h - (base[i] / 6) * h;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeStyle = '#00ff88';
        ctx.beginPath();
        for (var j = 0; j < base.length; j++) {
            var x2 = (j / (base.length - 1)) * w;
            var y2 = h - (Math.min(6, base[j] * mult) / 6) * h;
            if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        ctx.stroke();
    }
}

onReady(function () {
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) {
        animateValue = function (el, _from, to) { el.textContent = formatNumber(Math.floor(to)); };
    }
    startUpdater();
    injectPrestigePreview();
    bindFloatingTooltips();
    // enhanceTablesClassic(); // DISABLED: causes column misalignment due to .upgrade-card class on table rows
    makeTopBarSticky();
    markRoundedTables();
    attachDetailDrawers();
});
})();

// Attach detail drawers to rows and item buttons (UI-only)
function attachDetailDrawers() {
    try {
        var overlay = document.createElement('div');
        overlay.className = 'sci-drawer-overlay';
        overlay.id = 'sci-drawer-overlay';
        var card = document.createElement('div');
        card.className = 'sci-drawer-card';
        card.innerHTML = '<div class="sci-drawer-title" id="sci-drawer-title">Details</div>'+
            '<div class="sci-drawer-row"><span>Level</span><span id="sci-drawer-level">-</span></div>'+
            '<div class="sci-drawer-row"><span>XP/day</span><span id="sci-drawer-xp">-</span></div>'+
            '<div class="sci-drawer-row"><span>Next XP</span><span id="sci-drawer-next">-</span></div>'+
            '<div class="sci-drawer-actions"><button class="control-button" id="sci-drawer-close">Close</button></div>';
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.style.display='none'; });
        card.querySelector('#sci-drawer-close').addEventListener('click', function(){ overlay.style.display='none'; });

        function openDrawerForTask(name) {
            var title = document.getElementById('sci-drawer-title');
            var l = document.getElementById('sci-drawer-level');
            var x = document.getElementById('sci-drawer-xp');
            var n = document.getElementById('sci-drawer-next');
            title.textContent = name;
            if (window.gameData && window.gameData.taskData && window.gameData.taskData[name]) {
                var t = window.gameData.taskData[name];
                l.textContent = String(t.level);
                x.textContent = String(t.getXpGain());
                n.textContent = String(t.getMaxXp());
            } else {
                l.textContent = x.textContent = n.textContent = '-';
            }
            overlay.style.display = 'block';
        }

        var rows = document.querySelectorAll('tr');
        rows.forEach(function(r){
            var bar = r.querySelector('.progress-bar');
            if (!bar) return;
            var nameEl = r.querySelector('.progress-text.name');
            var name = nameEl && nameEl.textContent ? nameEl.textContent.replace(/ lvl.*$/,'') : null;
            if (!name) return;
            var timer;
            bar.addEventListener('mousedown', function(){ timer = setTimeout(function(){ openDrawerForTask(name); }, 500); });
            bar.addEventListener('mouseup', function(){ clearTimeout(timer); });
            bar.addEventListener('mouseleave', function(){ clearTimeout(timer); });
            bar.addEventListener('touchstart', function(){ timer = setTimeout(function(){ openDrawerForTask(name); }, 600); }, {passive:true});
            bar.addEventListener('touchend', function(){ clearTimeout(timer); });
            bar.addEventListener('touchcancel', function(){ clearTimeout(timer); });
        });

        var itemBtns = document.querySelectorAll('.item-button');
        itemBtns.forEach(function(btn){
            btn.addEventListener('click', function(e){
                var nmEl = btn.querySelector('.name');
                var nm = nmEl ? nmEl.textContent : 'Item';
                var title = document.getElementById('sci-drawer-title');
                title.textContent = nm;
                document.getElementById('sci-drawer-level').textContent = '-';
                var exp = btn.closest('tr') && btn.closest('tr').querySelector('.expense');
                document.getElementById('sci-drawer-xp').textContent = exp ? exp.textContent.trim() : '-';
                document.getElementById('sci-drawer-next').textContent = '-';
                overlay.style.display = 'block';
                e.stopPropagation();
            });
        });
    } catch(e) { /* no-op */ }
}
// Floating tooltips (non-intrusive): reuse existing .tooltip .tooltipText content
(function(){
    var tip;
    function ensureTip(){
        if (tip) return tip;
        tip = document.createElement('div');
        tip.id = 'sci-fi-floating-tooltip';
        tip.style.position = 'fixed';
        tip.style.pointerEvents = 'none';
        tip.style.background = 'rgba(0,0,0,0.85)';
        tip.style.color = '#fff';
        tip.style.padding = '8px 10px';
        tip.style.borderRadius = '6px';
        tip.style.fontSize = '12px';
        tip.style.maxWidth = '260px';
        tip.style.zIndex = '1070';
        tip.style.transform = 'translate(-9999px, -9999px)';
        document.body.appendChild(tip);
        return tip;
    }

    function showTip(html, x, y){
        var el = ensureTip();
        el.innerHTML = html;
        positionTip(x, y);
    }

    function positionTip(x, y){
        var el = ensureTip();
        var offsetX = 14, offsetY = 14;
        var left = x + offsetX;
        var top = y + offsetY;
        var rect = { w: el.offsetWidth, h: el.offsetHeight };
        var vw = window.innerWidth, vh = window.innerHeight;
        if (left + rect.w > vw - 8) left = x - rect.w - offsetX;
        if (top + rect.h > vh - 8) top = y - rect.h - offsetY;
        el.style.transform = 'translate(' + left + 'px,' + top + 'px)';
    }

    function hideTip(){
        if (!tip) return;
        tip.style.transform = 'translate(-9999px, -9999px)';
    }

    function bindFloatingTooltips(){
        document.addEventListener('mousemove', function(e){
            // If a tooltip is visible, track pointer
            if (tip && tip.style.transform && tip.style.transform.indexOf('-9999px') === -1) {
                positionTip(e.clientX, e.clientY);
            }
        });
        document.addEventListener('mouseenter', function(e){
            var t = e.target;
            var container = t.closest && t.closest('.tooltip');
            if (!container) return;
            var textEl = container.querySelector('.tooltipText');
            if (textEl && textEl.textContent) {
                showTip(textEl.textContent, e.clientX, e.clientY);
            }
        }, true);
        document.addEventListener('mouseleave', function(e){
            var t = e.target;
            if (t.closest && t.closest('.tooltip')) hideTip();
        }, true);
    }

    window.bindFloatingTooltips = bindFloatingTooltips;
})();

function makeTopBarSticky() {
    // Add sticky + segmented styles to the tab bar panel without altering behavior
    try {
        // The classic tab bar is the first panel with .w3-margin-left and no padding height ~40
        var panels = document.querySelectorAll('.panel.w3-margin-left');
        if (panels && panels[0]) {
            panels[0].classList.add('sci-sticky-bar', 'sci-tabs');
        }
    } catch (e) { /* no-op */ }
}

// Visually enhance tables as cards without changing structure
function enhanceTablesClassic() {
    try {
        var tables = [document.getElementById('jobTable'), document.getElementById('skillTable'), document.getElementById('itemTable')];
        tables.forEach(function(table){
            if (!table) return;
            var rows = table.querySelectorAll('tr');
            rows.forEach(function(row){
                if (row.querySelector('.progress-bar') || row.querySelector('.button')) {
                    row.classList.add('upgrade-card');
                    row.addEventListener('mouseenter', function(){ row.style.transform = 'translateY(-2px)'; row.style.boxShadow = '0 0 20px rgba(0,255,136,0.25)'; });
                    row.addEventListener('mouseleave', function(){ row.style.transform = 'translateY(0)'; row.style.boxShadow = 'none'; });
                }
            });
        });
    } catch (e) { /* no-op */ }
}

// Add inline meta and category badges
function updateInlineMeta() {
    try {
        var jobTable = document.getElementById('jobTable');
        var skillTable = document.getElementById('skillTable');
        [jobTable, skillTable].forEach(function(table){
            if (!table) return;
            var rows = table.querySelectorAll('tr');
            var currentCategory = null;
            rows.forEach(function(r){
                if (r.classList.contains('headerRow')) {
                    var catCell = r.querySelector('.category');
                    currentCategory = catCell ? catCell.textContent.trim() : null;
                    return;
                }
                var bar = r.querySelector('.progress-bar');
                if (!bar) return;
                // Remove old category badges
                var oldBadge = r.querySelector('.sci-badge');
                if (oldBadge) oldBadge.remove();
                // meta
                if (!r.__metaEl) {
                    var meta = document.createElement('div');
                    meta.className = 'sci-meta';
                    r.__metaEl = meta;
                    var firstCell2 = r.cells && r.cells[0];
                    if (firstCell2) firstCell2.appendChild(meta);
                }
                var lvl = r.querySelector('.level') ? r.querySelector('.level').textContent.trim() : '-';
                var xpDay = r.querySelector('.xpGain') ? r.querySelector('.xpGain').textContent.trim() : '-';
                var nextXp = r.querySelector('.xpLeft') ? r.querySelector('.xpLeft').textContent.trim() : '-';
                r.__metaEl.innerHTML = '<strong>Lvl ' + lvl + '</strong> • Xp/day ' + xpDay + ' • Next ' + nextXp;
            });
        });
        // Items: active/equipped chip
        var itemTable = document.getElementById('itemTable');
        if (itemTable) {
            var irows = itemTable.querySelectorAll('tr');
            irows.forEach(function(r){
                var btn = r.querySelector('.item-button');
                if (!btn) return;
                var chip = r.__activeChip;
                if (!chip) {
                    chip = document.createElement('span');
                    chip.className = 'sci-chip';
                    chip.textContent = 'Equipped';
                    r.__activeChip = chip;
                    var firstCell = r.cells && r.cells[0];
                    if (firstCell) firstCell.appendChild(chip);
                }
                var dot = r.querySelector('.active');
                var isActive = dot && window.getComputedStyle(dot).backgroundColor !== 'rgb(255, 255, 255)';
                chip.style.display = isActive ? 'inline-flex' : 'none';
            });
        }
    } catch(e) { /* no-op */ }
}

// Add a non-intrusive class to tables that contain headerRow, for rounded styling via CSS
function markRoundedTables() {
    var headerRows = document.querySelectorAll('tr.headerRow');
    headerRows.forEach(function(hr){
        var table = hr.closest('table');
        if (table && !table.classList.contains('sci-rounded-table')) {
            table.classList.add('sci-rounded-table');
        }
    });
}


