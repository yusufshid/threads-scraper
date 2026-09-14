// ==UserScript==
// @name         X/Twitter Full Post Scraper (DOM)
// @namespace    https://x.com/
// @version      1.0.0
// @description  Scrape semua post + replies user X/Twitter via DOM parsing. Filter Shopee affiliate, batas/rentang tanggal, pause/resume + auto-save progress. Zero setup, no ad blocker issues.
// @author       Yusuf Siddiq
// @match        https://twitter.com/*
// @match        https://x.com/*
// @icon         https://abs.twimg.com/favicons/twitter.3.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ==================== CONFIG ====================
    const CONFIG = {
        scrollDelay: 1800,
        maxNoNew: 12,
        version: '1.0.0',
    };

    // Keyword/domain yang menandakan link Shopee affiliate
    const SHOPEE_LINK_PATTERNS = [
        /s\.shopee\.co\.id/i,
        /s\.shopee\.com/i,
        /shp\.ee/i,
        /shope\.ee/i,
        /spf\.shopee\.co\.id/i,
        /spf\.shopee\.com/i,
        /shopeefood/i,
        /shopee\.co\.id\/[^\s"]*\?[^\s"]*(af_|utm_source=an_|smtt=|pid=)/i,
    ];

    // ==================== STYLES ====================
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        #ts-panel {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 99999;
            background: #000000;
            border: 1px solid #2a2a2a;
            border-radius: 12px;
            padding: 16px;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            font-size: 13px;
            min-width: 300px;
            max-width: 360px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            max-height: 90vh;
            overflow-y: auto;
        }

        #ts-panel::-webkit-scrollbar {
            width: 6px;
        }

        #ts-panel::-webkit-scrollbar-track {
            background: transparent;
        }

        #ts-panel::-webkit-scrollbar-thumb {
            background: #404040;
            border-radius: 3px;
        }

        #ts-panel .ts-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #2a2a2a;
        }

        #ts-panel .ts-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
        }

        #ts-panel .ts-badge {
            font-size: 10px;
            font-weight: 500;
            padding: 2px 6px;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            color: #808080;
        }

        #ts-panel .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: transparent;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #808080;
            cursor: pointer;
            transition: all 0.15s ease;
            font-size: 16px;
        }

        #ts-panel .close-btn:hover {
            background: #1a1a1a;
            color: #ffffff;
            border-color: #3a3a3a;
        }

        #ts-panel .ts-section {
            margin-bottom: 12px;
        }

        #ts-panel .ts-label {
            display: block;
            margin-bottom: 6px;
            color: #808080;
            font-size: 12px;
            font-weight: 500;
        }

        #ts-panel .ts-input {
            width: 100%;
            padding: 8px 12px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #ffffff;
            font-size: 13px;
            font-family: inherit;
            box-sizing: border-box;
            transition: border-color 0.15s ease;
            outline: none;
        }

        #ts-panel .ts-input:focus {
            border-color: #3a3a3a;
        }

        #ts-panel select.ts-input {
            cursor: pointer;
        }

        #ts-panel .ts-switch {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            margin-bottom: 12px;
            cursor: pointer;
            user-select: none;
            transition: border-color 0.15s ease;
        }

        #ts-panel .ts-switch:hover {
            border-color: #3a3a3a;
        }

        #ts-panel .ts-switch-label {
            font-size: 13px;
            color: #ffffff;
            font-weight: 500;
        }

        #ts-panel .ts-toggle {
            position: relative;
            width: 36px;
            height: 20px;
            background: #2a2a2a;
            border-radius: 10px;
            transition: background 0.2s ease;
            cursor: pointer;
        }

        #ts-panel .ts-toggle.active {
            background: #0a0a0a;
        }

        #ts-panel .ts-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: #808080;
            border-radius: 50%;
            transition: all 0.2s ease;
        }

        #ts-panel .ts-toggle.active::after {
            left: 18px;
            background: #ffffff;
        }

        #ts-panel .ts-actions {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
        }

        #ts-panel .ts-btn-wrap {
            position: relative;
            width: 100%;
        }

        #ts-panel .btn {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 10px 14px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.15s ease;
            outline: none;
        }

        #ts-panel .ts-info {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            margin-left: 4px;
            border-radius: 50%;
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            color: #808080;
            font-size: 9px;
            cursor: pointer;
            flex-shrink: 0;
            user-select: none;
            font-weight: 700;
        }

        #ts-panel .ts-info:hover {
            background: #3a3a3a;
            color: #ffffff;
        }

        #ts-tip {
            position: fixed;
            max-width: 240px;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            color: #e0e0e0;
            font-family: inherit;
            font-size: 11px;
            line-height: 1.5;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
            z-index: 2147483647;
            display: none;
            white-space: pre-line;
        }

        #ts-panel .btn:hover:not(:disabled) { transform: translateY(-1px); }
        #ts-panel .btn:active:not(:disabled) { transform: translateY(0); }
        #ts-panel .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        #ts-panel .btn-go { background: #ffffff; color: #000000; font-weight: 600; }
        #ts-panel .btn-go:hover:not(:disabled) { background: #e0e0e0; }

        #ts-panel .btn-stop { background: #f73535; color: #fff; }
        #ts-panel .btn-stop:hover:not(:disabled) { background: #d92e2e; }

        #ts-panel .btn-dl { background: #1a1a1a; color: #ffffff; border: 1px solid #2a2a2a; }
        #ts-panel .btn-dl:hover:not(:disabled) { background: #2a2a2a; border-color: #3a3a3a; }

        #ts-panel .btn-csv { background: #1a1a1a; color: #ffffff; border: 1px solid #2a2a2a; }
        #ts-panel .btn-csv:hover:not(:disabled) { background: #2a2a2a; border-color: #3a3a3a; }

        #ts-panel .btn-pause { background: #1a1a1a; color: #fbbf24; border: 1px solid #2a2a2a; }
        #ts-panel .btn-pause:hover:not(:disabled) { background: #2a2a2a; border-color: #3a3a3a; }

        #ts-panel .ts-status {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            color: #808080;
            margin-bottom: 12px;
            line-height: 1.4;
        }

        #ts-panel .ts-status.running { border-color: #3a3a3a; color: #ffffff; }
        #ts-panel .ts-status.paused { border-color: #3a3a3a; color: #fbbf24; }
        #ts-panel .ts-status.done { border-color: #2a5a2a; color: #4ade80; }
        #ts-panel .ts-status.stopped { border-color: #5a2a2a; color: #f87171; }

        #ts-panel .ts-fresh-link {
            display: block;
            width: 100%;
            text-align: center;
            background: transparent;
            border: none;
            color: #808080;
            font-size: 11px;
            text-decoration: underline;
            cursor: pointer;
            padding: 2px 0 4px;
            font-family: inherit;
        }

        #ts-panel .ts-fresh-link:hover { color: #ffffff; }

        #ts-panel .ts-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 12px;
        }

        #ts-panel .ts-stat {
            padding: 10px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            text-align: center;
        }

        #ts-panel .ts-stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
        }

        #ts-panel .ts-stat-label {
            font-size: 11px;
            color: #808080;
            margin-top: 2px;
        }

        #ts-panel .ts-log {
            padding: 10px;
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            font-size: 11px;
            line-height: 1.6;
            max-height: 120px;
            overflow-y: auto;
            color: #808080;
            font-family: 'SF Mono', Monaco, monospace;
        }

        #ts-panel .ts-log::-webkit-scrollbar { width: 4px; }
        #ts-panel .ts-log::-webkit-scrollbar-track { background: transparent; }
        #ts-panel .ts-log::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

        #ts-panel .ts-log .log-entry {
            padding: 2px 0;
            border-bottom: 1px solid #1a1a1a;
            word-break: break-word;
        }

        #ts-panel .ts-log .log-entry:last-child { border-bottom: none; }
        #ts-panel .ts-log .log-time { color: #505050; margin-right: 6px; }
    `);

    // ==================== STATE ====================
    let isRunning = false;
    let shouldStop = false;
    let isPaused = false;
    let collectedPosts = new Map();
    let checkedShopeeCodes = new Set();
    let wakeLockHandle = null;
    let currentUsername = '';
    let currentSettingsSignature = '';

    // ==================== PERSISTENCE ====================
    function getProfileUsername() {
        const m = window.location.pathname.match(/^\/([^/]+)/);
        if (!m) return '';
        const reserved = ['home', 'explore', 'notifications', 'messages', 'i', 'search', 'settings', 'compose'];
        const name = m[1];
        if (reserved.includes(name.toLowerCase())) return '';
        return name;
    }

    function getStorageKey(username) {
        return `ts_progress_${window.location.hostname}_${username}`;
    }

    function saveProgress(username, settingsSignature) {
        if (!username) return;
        try {
            const payload = {
                username,
                settingsSignature,
                posts: Array.from(collectedPosts.values()),
                savedAt: Date.now(),
            };
            GM_setValue(getStorageKey(username), JSON.stringify(payload));
        } catch (e) {
            console.error('[TS] Save progress error:', e);
        }
    }

    function loadProgress(username) {
        if (!username) return null;
        try {
            const raw = GM_getValue(getStorageKey(username), null);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function clearProgress(username) {
        if (!username) return;
        try { GM_deleteValue(getStorageKey(username)); } catch (e) {}
    }

    function checkResumableSession() {
        const username = getProfileUsername();
        if (!username) return;
        const saved = loadProgress(username);
        const goBtn = document.getElementById('ts-go');
        if (!goBtn) return;

        const existingFreshLink = document.querySelector('.ts-fresh-link');
        if (existingFreshLink) existingFreshLink.remove();

        if (!saved || !saved.posts || saved.posts.length === 0) {
            goBtn.dataset.resume = '';
            const label = goBtn.querySelector('.ts-go-label');
            if (label) label.textContent = 'Start Scraping';
            return;
        }

        const savedCount = saved.posts.length;
        const savedDate = new Date(saved.savedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        log(`📦 Progress tersimpan: ${savedCount} posts (${savedDate})`);

        goBtn.dataset.resume = '1';
        const label = goBtn.querySelector('.ts-go-label');
        if (label) label.textContent = `Lanjutkan (${savedCount})`;

        const freshBtn = document.createElement('button');
        freshBtn.type = 'button';
        freshBtn.className = 'ts-fresh-link';
        freshBtn.textContent = 'Mulai dari awal';
        freshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clearProgress(username);
            goBtn.dataset.resume = '';
            if (label) label.textContent = 'Start Scraping';
            freshBtn.remove();
            log('🗑️ Progress lama dihapus');
        });
        goBtn.parentElement.after(freshBtn);
    }

    // ==================== WAKE LOCK ====================
    async function acquireWakeLock() {
        if (!('wakeLock' in navigator)) return;
        try {
            wakeLockHandle = await navigator.wakeLock.request('screen');
            wakeLockHandle.addEventListener('release', () => { wakeLockHandle = null; });
        } catch (e) {}
    }

    function releaseWakeLock() {
        if (wakeLockHandle) {
            wakeLockHandle.release().catch(() => {});
            wakeLockHandle = null;
        }
    }

    // ==================== PAUSE HANDLING ====================
    async function waitWhilePausedOrHidden() {
        if (!isPaused) return;
        while (isPaused && !shouldStop) {
            await sleep(800);
        }
        if (!shouldStop && isRunning && !isPaused) {
            setStatus('🟢 Scraping...', 'running');
            await acquireWakeLock();
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (!isRunning || isPaused) return;
        if (document.hidden) {
            setStatus('⚡ Background (slower)', 'running');
        } else {
            setStatus('🟢 Scraping...', 'running');
            acquireWakeLock();
        }
    });

    // ==================== UI FUNCTIONS ====================
    function setStatus(text, variant = 'idle') {
        const el = document.getElementById('ts-status');
        if (!el) return;
        el.textContent = text;
        el.className = 'ts-status' + (variant ? ' ' + variant : '');
    }

    function setPauseLabel(paused) {
        const btn = document.getElementById('ts-pause');
        if (!btn) return;
        btn.innerHTML = paused
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Resume`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Pause`;
    }

    // ==================== DATE HANDLING ====================
    function getDateCutoff(months) {
        const d = new Date();
        d.setMonth(d.getMonth() - months);
        return d;
    }

    function getDateRangeSettings() {
        const preset = document.getElementById('ts-date-limit').value;

        if (preset === 'custom') {
            const fromVal = document.getElementById('ts-date-from').value;
            const toVal = document.getElementById('ts-date-to').value;
            const dateFrom = fromVal ? new Date(`${fromVal}T00:00:00`) : null;
            const dateTo = toVal ? new Date(`${toVal}T23:59:59`) : null;
            if (!dateFrom && !dateTo) return { dateFrom: null, dateTo: null, dateLabel: null };
            const fromLabel = fromVal ? new Date(fromVal).toLocaleDateString('id-ID') : 'start';
            const toLabel = toVal ? new Date(toVal).toLocaleDateString('id-ID') : 'now';
            return { dateFrom, dateTo, dateLabel: `${fromLabel} – ${toLabel}` };
        }

        const months = parseInt(preset) || 0;
        if (months > 0) {
            return { dateFrom: getDateCutoff(months), dateTo: null, dateLabel: `${months} bulan terakhir` };
        }
        return { dateFrom: null, dateTo: null, dateLabel: null };
    }

    // ==================== TOOLTIP ====================
    let tipEl = null;

    function getTipEl() {
        if (!tipEl) {
            tipEl = document.createElement('div');
            tipEl.id = 'ts-tip';
            document.body.appendChild(tipEl);
        }
        return tipEl;
    }

    function showTip(anchorEl, text) {
        const tip = getTipEl();
        tip.textContent = text;
        tip.style.display = 'block';
        tip.style.left = '0px';
        tip.style.top = '0px';
        const rect = anchorEl.getBoundingClientRect();
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;
        let left = rect.left + rect.width / 2 - tw / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
        let top = rect.top - th - 10;
        if (top < 8) top = rect.bottom + 10;
        tip.style.left = `${left}px`;
        tip.style.top = `${top}px`;
        tip._owner = anchorEl;
    }

    function hideTip() {
        if (tipEl) { tipEl.style.display = 'none'; tipEl._owner = null; }
    }

    function wireInfoIcon(labelEl, sourceEl, opts = {}) {
        if (!labelEl || !sourceEl) return;
        const text = sourceEl.getAttribute('title');
        if (!text) return;
        sourceEl.removeAttribute('title');

        const icon = document.createElement('span');
        icon.className = 'ts-info';
        icon.textContent = 'i';
        icon.setAttribute('role', 'button');
        icon.setAttribute('aria-label', 'info');
        labelEl.appendChild(icon);

        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (tipEl && tipEl.style.display === 'block' && tipEl._owner === icon) {
                hideTip();
            } else {
                showTip(icon, text);
            }
        });
        icon.addEventListener('mouseenter', () => showTip(icon, text));
        icon.addEventListener('mouseleave', hideTip);
    }

    document.addEventListener('click', (e) => {
        if (tipEl && tipEl.style.display === 'block' && !e.target.closest('.ts-info') && !e.target.closest('#ts-tip')) {
            hideTip();
        }
    });

    // ==================== UI CREATION ====================
    function createPanel() {
        if (document.getElementById('ts-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'ts-panel';
        panel.innerHTML = `
            <div class="ts-header">
                <div class="ts-title">
                    <span>X Scraper</span>
                    <span class="ts-badge">v${CONFIG.version}</span>
                </div>
                <button class="close-btn" id="ts-x" title="Close panel">✕</button>
            </div>

            <div class="ts-status" id="ts-status">⚪ Ready</div>

            <div class="ts-section">
                <label class="ts-label">Scroll delay (ms)</label>
                <input type="number" class="ts-input" id="ts-delay" value="${CONFIG.scrollDelay}" min="500" step="100" title="Delay antar scroll. Lebih besar = lebih stabil, lebih kecil = lebih cepat.">
            </div>

            <div class="ts-section">
                <label class="ts-label">Time limit</label>
                <select class="ts-input" id="ts-date-limit" title="Batasi seberapa jauh mundur ke belakang saat scraping.">
                    <option value="0">All time</option>
                    <option value="1">1 month</option>
                    <option value="3">3 months</option>
                    <option value="6" selected>6 months</option>
                    <option value="12">12 months</option>
                    <option value="custom">Custom range</option>
                </select>
            </div>

            <div class="ts-section" id="ts-custom-range" style="display:none;">
                <label class="ts-label">From date</label>
                <input type="date" class="ts-input" id="ts-date-from" title="Post lebih lama dari ini tidak disimpan.">
                <label class="ts-label" style="margin-top:8px;">To date</label>
                <input type="date" class="ts-input" id="ts-date-to" title="Post lebih baru dari ini di-skip sampai masuk rentang.">
            </div>

            <div class="ts-switch" id="ts-switch-replies" title="Include Posts & Replies (tab kedua di profil) — reply akun ini di thread orang lain.">
                <span class="ts-switch-label">Include replies</span>
                <div class="ts-toggle" id="ts-toggle-replies"></div>
            </div>

            <div class="ts-switch" id="ts-switch-shopee" title="Hanya simpan tweet yang ada link Shopee affiliate.">
                <span class="ts-switch-label">Shopee filter</span>
                <div class="ts-toggle" id="ts-toggle-shopee"></div>
            </div>

            <div class="ts-switch" id="ts-switch-media" title="Skip retweet (RT) murni tanpa komentar, hanya ambil tweet/quote asli akun ini.">
                <span class="ts-switch-label">Skip pure retweets</span>
                <div class="ts-toggle ts-toggle-active" id="ts-toggle-media"></div>
            </div>

            <div class="ts-stats" id="ts-stats" style="display:none;">
                <div class="ts-stat">
                    <div class="ts-stat-value" id="ts-count-posts">0</div>
                    <div class="ts-stat-label">Posts</div>
                </div>
                <div class="ts-stat">
                    <div class="ts-stat-value" id="ts-count-text">0</div>
                    <div class="ts-stat-label">With text</div>
                </div>
            </div>

            <div class="ts-actions">
                <div class="ts-btn-wrap">
                    <button class="btn btn-go" id="ts-go" title="Start scraping">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        <span class="ts-go-label">Start</span>
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-pause" id="ts-pause" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Pause
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-stop" id="ts-stop" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Stop
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-dl" id="ts-dl" disabled title="Download as JSON">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>JSON
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-csv" id="ts-csv" disabled title="Download as CSV">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>CSV
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-csv" id="ts-md" disabled title="Download as Markdown">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>Markdown
                    </button>
                </div>
            </div>

            <div class="ts-log" id="ts-log">
                <div class="log-entry"><span class="log-time">ready</span>Click Start</div>
            </div>
        `;
        document.body.appendChild(panel);

        wireInfoIcon(panel.querySelector('#ts-delay').previousElementSibling, panel.querySelector('#ts-delay'));
        wireInfoIcon(panel.querySelector('#ts-date-limit').previousElementSibling, panel.querySelector('#ts-date-limit'));

        document.getElementById('ts-x').onclick = () => panel.remove();
        document.getElementById('ts-go').onclick = startScraping;
        document.getElementById('ts-stop').onclick = () => { shouldStop = true; isPaused = false; };
        document.getElementById('ts-pause').onclick = () => {
            if (!isRunning) return;
            isPaused = !isPaused;
            setPauseLabel(isPaused);
            if (isPaused) {
                setStatus('⏸ Paused', 'paused');
                releaseWakeLock();
                saveProgress(currentUsername, currentSettingsSignature);
            } else {
                setStatus('🟢 Scraping...', 'running');
                acquireWakeLock();
            }
        };
        document.getElementById('ts-dl').onclick = downloadJSON;
        document.getElementById('ts-csv').onclick = downloadCSV;
        document.getElementById('ts-md').onclick = downloadMarkdown;

        document.getElementById('ts-date-limit').onchange = (e) => {
            document.getElementById('ts-custom-range').style.display = e.target.value === 'custom' ? 'block' : 'none';
        };

        const toggleReplies = document.getElementById('ts-toggle-replies');
        document.getElementById('ts-switch-replies').onclick = () => toggleReplies.classList.toggle('active');

        const toggleMedia = document.getElementById('ts-toggle-media');
        toggleMedia.classList.add('active');
        document.getElementById('ts-switch-media').onclick = () => toggleMedia.classList.toggle('active');

        const toggleShopee = document.getElementById('ts-toggle-shopee');
        document.getElementById('ts-switch-shopee').onclick = () => toggleShopee.classList.toggle('active');

        checkResumableSession();
    }

    function log(msg) {
        const el = document.getElementById('ts-log');
        if (el) {
            const t = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            el.innerHTML = `<div class="log-entry"><span class="log-time">${t}</span> ${msg}</div>` + el.innerHTML;
            if (el.children.length > 20) el.removeChild(el.lastChild);
        }
        const statsEl = document.getElementById('ts-stats');
        if (statsEl) statsEl.style.display = 'grid';
        const countEl = document.getElementById('ts-count-posts');
        if (countEl) countEl.textContent = collectedPosts.size;
        const textEl = document.getElementById('ts-count-text');
        if (textEl) textEl.textContent = Array.from(collectedPosts.values()).filter(p => p.text).length;
        console.log('[TS]', msg);
    }

    function setBtns(state) {
        const go = document.getElementById('ts-go');
        const pause = document.getElementById('ts-pause');
        const stop = document.getElementById('ts-stop');
        const dl = document.getElementById('ts-dl');
        const csv = document.getElementById('ts-csv');
        const md = document.getElementById('ts-md');
        if (state === 'run') {
            go.disabled = true; pause.disabled = false; stop.disabled = false;
            dl.disabled = true; csv.disabled = true; md.disabled = true;
        } else {
            go.disabled = false; pause.disabled = true; stop.disabled = true;
            setPauseLabel(false);
            dl.disabled = collectedPosts.size === 0;
            csv.disabled = collectedPosts.size === 0;
            md.disabled = collectedPosts.size === 0;
        }
    }

    // ==================== DOM EXTRACTION (X/Twitter) ====================
    function extractPostsFromDOM(profileUsername) {
        const posts = [];
        const articles = document.querySelectorAll('article[data-testid="tweet"]');

        for (const article of articles) {
            // === STATUS LINK / ID ===
            // Find the link that points to /<user>/status/<id> and holds the timestamp
            const timeEl = article.querySelector('time');
            let statusLink = null;
            if (timeEl) {
                statusLink = timeEl.closest('a[href*="/status/"]');
            }
            if (!statusLink) {
                const links = article.querySelectorAll('a[href*="/status/"]');
                for (const l of links) {
                    if (/\/status\/\d+$/.test(l.getAttribute('href') || '')) { statusLink = l; break; }
                }
            }
            if (!statusLink) continue;

            const href = statusLink.getAttribute('href') || '';
            const match = href.match(/^\/([^/]+)\/status\/(\d+)/);
            if (!match) continue;
            const tweetUsername = match[1];
            const code = match[2];
            if (!code) continue;

            // === RETWEET DETECTION ===
            let isPureRetweet = false;
            const socialContext = article.querySelector('[data-testid="socialContext"]');
            if (socialContext && /repost|retweet|reposted/i.test(socialContext.textContent || '')) {
                isPureRetweet = true;
            }

            // Only accept tweets authored by the profile owner (skip tweets from others in reply threads/quotes),
            // unless it's the profile itself being viewed for replies context.
            if (profileUsername && tweetUsername.toLowerCase() !== profileUsername.toLowerCase()) {
                continue;
            }

            // === TEXT ===
            let text = '';
            const textEl = article.querySelector('[data-testid="tweetText"]');
            if (textEl) {
                text = (textEl.innerText || textEl.textContent || '').trim();
            }

            // === TIME ===
            let timeText = '';
            if (timeEl) {
                timeText = timeEl.getAttribute('datetime') || timeEl.textContent || '';
            }

            // === METRICS ===
            function getMetric(testid) {
                const el = article.querySelector(`[data-testid="${testid}"]`);
                if (!el) return 0;
                const label = el.getAttribute('aria-label') || el.textContent || '';
                const m = label.match(/([\d.,]+)/);
                if (!m) return 0;
                let numStr = m[1].replace(/,/g, '');
                let mult = 1;
                if (/K$/i.test(label)) mult = 1000;
                if (/M$/i.test(label)) mult = 1000000;
                const num = parseFloat(numStr.replace(/[^\d.]/g, ''));
                return isNaN(num) ? 0 : Math.round(num * mult);
            }
            const likeCount = getMetric('like');
            const retweetCount = getMetric('retweet');
            const replyCount = getMetric('reply');

            // === IMAGES ===
            const images = [];
            const imgs = article.querySelectorAll('[data-testid="tweetPhoto"] img, div[aria-label="Image"] img');
            for (const img of imgs) {
                const src = img.src || img.currentSrc || '';
                if (src && src.includes('pbs.twimg.com')) images.push(src.split('?')[0] + '?format=jpg&name=large');
            }

            // === VIDEO ===
            const hasVideo = article.querySelector('[data-testid="videoPlayer"], video') !== null;

            // === QUOTE TWEET ===
            const hasQuote = article.querySelector('[role="link"][tabindex="0"] time') !== null &&
                article.querySelectorAll('time').length > 1;

            // === LINKS IN TWEET (for shopee filter) ===
            const linkEls = article.querySelectorAll('[data-testid="tweetText"] a, [data-testid="card.wrapper"] a');
            const links = Array.from(linkEls).map(a => a.href).filter(Boolean);

            posts.push({
                code,
                text,
                username: tweetUsername,
                time: timeText,
                like_count: likeCount,
                retweet_count: retweetCount,
                reply_count: replyCount,
                images: [...new Set(images)],
                has_video: hasVideo,
                has_quote: hasQuote,
                is_retweet: isPureRetweet,
                links,
                has_shopee_link: false,
                url: `https://x.com/${tweetUsername}/status/${code}`,
            });
        }

        return posts;
    }

    // ==================== SCROLL & WAIT ====================
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async function scrollAndWait(delay) {
        const prev = document.body.scrollHeight;
        window.scrollBy(0, window.innerHeight * 0.6);
        await sleep(delay);
        if (document.body.scrollHeight > prev) return true;
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(1500);
        return document.body.scrollHeight > prev;
    }

    // ==================== SHOPEE FILTER ====================
    function itemHasShopeeLink(item) {
        try {
            const str = JSON.stringify(item);
            return SHOPEE_LINK_PATTERNS.some(p => p.test(str));
        } catch (e) {
            return false;
        }
    }

    // ==================== MAIN SCRAPING ====================
    async function startScraping() {
        if (isRunning) return;
        isRunning = true;
        shouldStop = false;
        isPaused = false;
        setBtns('run');

        const goBtn = document.getElementById('ts-go');
        const isResume = goBtn.dataset.resume === '1';
        const username = getProfileUsername();
        currentUsername = username;

        if (!username) {
            log('⚠️ Buka halaman profil (x.com/username) dulu');
            isRunning = false;
            setBtns('idle');
            return;
        }

        const existingFreshLink = document.querySelector('.ts-fresh-link');
        if (existingFreshLink) existingFreshLink.remove();

        if (isResume) {
            const saved = loadProgress(username);
            collectedPosts = new Map();
            if (saved && saved.posts) {
                for (const p of saved.posts) collectedPosts.set(p.code, p);
            }
            goBtn.dataset.resume = '';
            log(`▶️ Resuming ${collectedPosts.size} posts`);
        } else {
            collectedPosts.clear();
        }
        checkedShopeeCodes = new Set();

        const delay = parseInt(document.getElementById('ts-delay').value) || CONFIG.scrollDelay;
        const includeReplies = document.getElementById('ts-toggle-replies').classList.contains('active');
        const skipRetweets = document.getElementById('ts-toggle-media').classList.contains('active');
        const shopeeOnly = document.getElementById('ts-toggle-shopee').classList.contains('active');
        const { dateFrom, dateTo, dateLabel } = getDateRangeSettings();
        currentSettingsSignature = `${shopeeOnly}|${dateFrom ? dateFrom.toISOString() : ''}|${dateTo ? dateTo.toISOString() : ''}|${includeReplies}`;

        log('🚀 Starting...');
        if (shopeeOnly) log('🛒 Shopee filter ON');
        if (dateLabel) log(`📅 ${dateLabel}`);

        setStatus('🟢 Scraping...', 'running');
        await acquireWakeLock();

        // Ensure on the main "Posts" tab first
        navigateToProfileTab(username, 'posts');
        await sleep(1500);
        window.scrollTo(0, 0);
        await sleep(1000);

        log('📝 Scraping posts...');
        let reason = await scrapeCurrentTab(delay, { username, shopeeOnly, skipRetweets, dateFrom, dateTo, settingsSignature: currentSettingsSignature });

        if (includeReplies && !shouldStop) {
            log('💬 Scraping replies...');
            navigateToProfileTab(username, 'with_replies');
            await sleep(1500);
            window.scrollTo(0, 0);
            await sleep(1000);
            const before = collectedPosts.size;
            reason = await scrapeCurrentTab(delay, { username, shopeeOnly, skipRetweets, dateFrom, dateTo, settingsSignature: currentSettingsSignature });
            log(`💬 +${collectedPosts.size - before}`);
        }

        releaseWakeLock();
        isRunning = false;
        isPaused = false;
        setBtns('done');

        const withText = Array.from(collectedPosts.values()).filter(p => p.text).length;
        log(`✅ Done: ${collectedPosts.size} posts (${withText} with text)`);

        if (shouldStop) {
            log('⏹ Stopped');
            saveProgress(username, currentSettingsSignature);
            setStatus(`⏹ Stopped – ${collectedPosts.size} posts saved`, 'stopped');
        } else {
            setStatus('✅ Complete', 'done');
            clearProgress(username);
        }

        checkResumableSession();
    }

    function navigateToProfileTab(username, tab) {
        const base = `https://x.com/${username}`;
        const target = tab === 'posts' ? base : `${base}/${tab}`;
        const current = window.location.pathname.replace(/\/$/, '');
        const targetPath = new URL(target).pathname.replace(/\/$/, '');
        if (current !== targetPath) {
            window.location.href = target;
        }
    }

    async function scrapeCurrentTab(delay, opts = {}) {
        const { username, shopeeOnly = false, skipRetweets = true, dateFrom = null, dateTo = null, settingsSignature = '' } = opts;
        let noNewCount = 0;
        let scrollCount = 0;
        const oldSeenCodes = new Set();
        let reason = 'complete';

        while (!shouldStop) {
            await waitWhilePausedOrHidden();
            if (shouldStop) { reason = 'stopped'; break; }

            scrollCount++;
            const prevCount = collectedPosts.size;
            const posts = extractPostsFromDOM(username);

            for (const p of posts) {
                if (!p.code) continue;
                if (skipRetweets && p.is_retweet) continue;

                let postDate = null;
                if (p.time) {
                    const t = new Date(p.time);
                    if (!isNaN(t.getTime())) postDate = t;
                }

                if (dateTo && postDate && postDate > dateTo) continue;
                if (dateFrom && postDate && postDate < dateFrom) {
                    oldSeenCodes.add(p.code);
                    continue;
                }

                if (shopeeOnly) {
                    if (!checkedShopeeCodes.has(p.code)) {
                        checkedShopeeCodes.add(p.code);
                        if (!itemHasShopeeLink(p)) continue;
                        p.has_shopee_link = true;
                    } else if (!p.has_shopee_link) {
                        continue;
                    }
                }

                const existing = collectedPosts.get(p.code);
                if (!existing) {
                    collectedPosts.set(p.code, p);
                } else {
                    if (p.text && (!existing.text || p.text.length > existing.text.length)) existing.text = p.text;
                    if (p.like_count && !existing.like_count) existing.like_count = p.like_count;
                    if (p.retweet_count && !existing.retweet_count) existing.retweet_count = p.retweet_count;
                    if (p.reply_count && !existing.reply_count) existing.reply_count = p.reply_count;
                    if (p.time && !existing.time) existing.time = p.time;
                    if (p.images.length && !existing.images.length) existing.images = p.images;
                    if (p.has_video && !existing.has_video) existing.has_video = p.has_video;
                }
            }

            const newCount = collectedPosts.size - prevCount;
            if (scrollCount % 3 === 0 || newCount > 0) {
                log(`#${scrollCount} +${newCount} → ${collectedPosts.size}`);
            }
            if (newCount > 0) saveProgress(currentUsername, settingsSignature);

            if (dateFrom && oldSeenCodes.size >= 3) {
                log('📅 Date limit reached');
                reason = 'date_limit';
                break;
            }

            const grew = await scrollAndWait(delay);

            if (newCount === 0) {
                noNewCount++;
                if (noNewCount >= CONFIG.maxNoNew) {
                    log('🏁 End of feed');
                    reason = 'end_of_feed';
                    break;
                }
            } else {
                noNewCount = 0;
            }

            if (!grew && noNewCount >= 5) {
                log('🏁 No more posts');
                reason = 'end_of_feed';
                break;
            }
        }

        return reason;
    }

    // ==================== DOWNLOADS ====================
    function downloadJSON() {
        const posts = Array.from(collectedPosts.values());
        const username = getProfileUsername();

        const result = {
            username,
            url: window.location.href,
            total: posts.length,
            total_with_text: posts.filter(p => p.text).length,
            scraped_at: new Date().toISOString(),
            posts,
        };

        const json = JSON.stringify(result, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_x_posts_${new Date().toISOString().slice(0, 10)}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`💾 ${filename}`);
    }

    function downloadCSV() {
        const posts = Array.from(collectedPosts.values());
        const username = getProfileUsername();

        const headers = ['code', 'username', 'text', 'time', 'like_count', 'retweet_count', 'reply_count', 'has_video', 'images', 'url'];
        const rows = posts.map(p => [
            p.code,
            p.username,
            `"${(p.text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            p.time,
            p.like_count,
            p.retweet_count,
            p.reply_count,
            p.has_video,
            p.images.length,
            p.url,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_x_posts_${new Date().toISOString().slice(0, 10)}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`📊 ${filename}`);
    }

    function downloadMarkdown() {
        const posts = Array.from(collectedPosts.values());
        const username = getProfileUsername();

        let md = `# @${username}\n\n`;
        md += `> Scraped: ${new Date().toLocaleDateString('id-ID')}\n`;
        md += `> Total: ${posts.length} posts\n\n---\n\n`;

        for (const post of posts) {
            const date = post.time ? new Date(post.time).toLocaleDateString('id-ID') : '';
            md += `## ${date}\n\n`;
            md += `${post.text || '*(no text)*'}\n\n`;
            if (post.images.length > 0) md += `📷 ${post.images.length}\n\n`;
            if (post.has_video) md += `🎬 Video\n\n`;
            if (post.like_count > 0) md += `❤️ ${post.like_count}  🔁 ${post.retweet_count}  💬 ${post.reply_count}\n\n`;
            md += `[Open](${post.url})\n\n---\n\n`;
        }

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_x_posts_${new Date().toISOString().slice(0, 10)}.md`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`📝 ${filename}`);
    }

    // ==================== INIT ====================
    function init() {
        createPanel();
    }

    setTimeout(init, 2000);

    // Re-check resume state / re-attach panel across SPA navigations
    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            if (!document.getElementById('ts-panel')) createPanel();
            else checkResumableSession();
        }
    }, 1500);
})();
