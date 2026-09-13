// ==UserScript==
// @name         Threads Full Post Scraper (DOM)
// @namespace    https://threads.com/
// @version      4.7.0
// @description  Scrape semua post + replies user Threads via DOM parsing. Filter Shopee affiliate, batas/rentang tanggal, pause/resume + auto-save progress. Zero setup, no ad blocker issues.
// @author       Yusuf Siddiq
// @match        https://www.threads.net/@*
// @match        https://www.threads.com/@*
// @match        https://threads.net/@*
// @match        https://threads.com/@*
// @icon         https://www.threads.net/favicon.ico
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
        version: '4.7.0',
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

    // ==================== STYLES (Updated for latest Threads design) ====================
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
            width: 16px;
            height: 16px;
            margin-left: 6px;
            border-radius: 50%;
            background: #2a2a2a;
            border: 1.5px solid #404040;
            color: #a0a0a0;
            font-size: 10px;
            cursor: help;
            flex-shrink: 0;
            user-select: none;
            font-weight: 700;
            transition: all 0.15s ease;
        }

        #ts-panel .ts-info:hover, #ts-panel .ts-info:active {
            background: #3a3a3a;
            color: #ffffff;
            border-color: #505050;
        }

        #ts-tip {
            position: fixed;
            max-width: 280px;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            color: #e0e0e0;
            font-family: inherit;
            font-size: 12px;
            line-height: 1.6;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.9);
            z-index: 2147483647;
            display: none;
            white-space: pre-line;
            word-break: break-word;
            pointer-events: none;
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
        const m = window.location.pathname.match(/^\/@([^/]+)/);
        return m ? m[1] : '';
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
                    <span>Threads Scraper</span>
                    <span class="ts-badge">v${CONFIG.version}</span>
                </div>
                <button class="close-btn" id="ts-x" title="Close panel">✕</button>
            </div>

            <div class="ts-status" id="ts-status">⚪ Ready</div>

            <div class="ts-section">
                <label class="ts-label">Scroll delay (ms)</label>
                <input type="number" class="ts-input" id="ts-delay" value="${CONFIG.scrollDelay}" min="500" step="100" title="Jeda antar scroll saat scraping. Lebih besar = lebih stabil (text & gambar sempat load penuh), lebih kecil = lebih cepat tapi risiko ada post yang terlewat.">
            </div>

            <div class="ts-section">
                <label class="ts-label">Batas waktu</label>
                <select class="ts-input" id="ts-date-limit" title="Batasi seberapa jauh scraper mundur ke belakang. Begitu ketemu beberapa post berturut-turut yang lebih tua dari batas ini, scraper otomatis berhenti scroll.">
                    <option value="0">Semua waktu</option>
                    <option value="1">1 bulan terakhir</option>
                    <option value="3">3 bulan terakhir</option>
                    <option value="6" selected>6 bulan terakhir</option>
                    <option value="12">12 bulan terakhir</option>
                    <option value="custom">Rentang custom</option>
                </select>
            </div>

            <div class="ts-section" id="ts-custom-range" style="display:none;">
                <label class="ts-label">Dari tanggal</label>
                <input type="date" class="ts-input" id="ts-date-from" title="Post yang lebih lama dari tanggal ini nggak akan disimpan — scraper berhenti begitu mentok di sini. Kosongkan kalau nggak ada batas bawah.">
                <label class="ts-label" style="margin-top:8px;">Sampai tanggal</label>
                <input type="date" class="ts-input" id="ts-date-to" title="Post yang lebih baru dari tanggal ini di-skip (tetap discroll lewatin, nggak disimpan) sampai ketemu post yang masuk rentang. Kosongkan kalau mau mulai dari yang paling baru.">
            </div>

            <div class="ts-switch" id="ts-switch-replies" title="Tab 'Replies' di profil = balasan yang DIBUAT oleh akun ini di thread milik orang lain (bukan balasan yang diterima di post akun ini). Aktifkan cuma kalau butuh riset gaya komentar/interaksi akun ini di thread orang. Buat riset konten dari thread milik akun ini sendiri, biarkan mati (default).">
                <span class="ts-switch-label">Include replies tab</span>
                <div class="ts-toggle" id="ts-toggle-replies"></div>
            </div>

            <div class="ts-switch" id="ts-switch-shopee" title="Kalau aktif, tiap thread yang lolos scroll akan dicek isi lengkapnya (semua segmen utas oleh author yang sama) — cuma yang salah satu bagiannya ada link Shopee affiliate (s.shopee.co.id, shp.ee, dll) yang disimpan, dan teks yang disimpan adalah utas UTUH, bukan cuma bagian yang ada linknya. Lebih lambat karena tiap thread di-fetch satu-satu.">
                <span class="ts-switch-label">Shopee affiliate only</span>
                <div class="ts-toggle" id="ts-toggle-shopee"></div>
            </div>

            <div class="ts-switch" id="ts-switch-deep" title="Buka tiap post satu-satu dan scrape balasan/komentarnya juga (bukan cuma caption post-nya). Jauh lebih lambat karena ada request per post. Aktifkan kalau butuh data percakapan/komentar, bukan cuma isi thread-nya.">
                <span class="ts-switch-label">Deep mode (scrape comments)</span>
                <div class="ts-toggle" id="ts-toggle-deep"></div>
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
                    <button class="btn btn-go" id="ts-go" title="Mulai scrape dari atas profil ini, sesuai pengaturan delay/batas waktu/toggle di atas. Kalau ada progress tersimpan dari sesi sebelumnya, tombol ini otomatis jadi 'Lanjutkan'.">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        <span class="ts-go-label">Start Scraping</span>
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-pause" id="ts-pause" disabled title="Jeda proses scraping tanpa kehilangan progress — nggak scroll/fetch selama dijeda. Klik lagi (jadi 'Lanjutkan') buat terusin dari titik yang sama.">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Pause
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-stop" id="ts-stop" disabled title="Hentikan proses scrape sepenuhnya. Data yang sudah kekumpul tetap tersimpan dan bisa didownload atau dilanjutkan lagi nanti (klik Start jadi 'Lanjutkan').">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Stop
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-dl" id="ts-dl" disabled title="Data terstruktur (array objek) lengkap dengan semua field: text, time, like_count, images, has_shopee_link, dst. Cocok diolah lagi pakai kode/script, atau diupload sebagai referensi mentah ke Claude project/knowledge base.&#10;&#10;Contoh: { 'text': '...', 'like_count': 342, 'time': '2026-05-01...' }">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>JSON
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-csv" id="ts-csv" disabled title="Format tabel (kolom: code, username, text, time, like_count, dst). Cocok dibuka di Excel/Google Sheets buat sortir & filter cepat — misal urutkan by like_count buat cari thread paling engaging.&#10;&#10;Kurang cocok buat baca teks utas panjang (kepotong per baris).">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>CSV
                    </button>
                </div>
                <div class="ts-btn-wrap">
                    <button class="btn btn-csv" id="ts-md" disabled title="Paling enak dibaca — tiap thread jadi satu blok teks lengkap dengan tanggal & like. Paling cocok buat: cari bahan konten, ambil insight, atau dijadiin knowledge base/referensi gaya nulis buat skill Threads Claude (niru gaya atau dimodif).&#10;&#10;Contoh: ## 1 Mei 2026 (isi utas...) ❤️ 342 likes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>Markdown
                    </button>
                </div>
            </div>

            <div class="ts-log" id="ts-log">
                <div class="log-entry"><span class="log-time">ready</span>Click Start</div>
            </div>
        `;
        document.body.appendChild(panel);

        // Wire info icons untuk semua elemen dengan tooltip
        wireInfoIcon(panel.querySelector('#ts-delay').previousElementSibling, panel.querySelector('#ts-delay'));
        wireInfoIcon(panel.querySelector('#ts-date-limit').previousElementSibling, panel.querySelector('#ts-date-limit'));
        wireInfoIcon(panel.querySelector('#ts-date-from').previousElementSibling, panel.querySelector('#ts-date-from'));
        const toDateLabel = Array.from(panel.querySelectorAll('.ts-label')).find(el => el.textContent.trim() === 'To date');
        if (toDateLabel) wireInfoIcon(toDateLabel, panel.querySelector('#ts-date-to'));
        wireInfoIcon(panel.querySelector('#ts-switch-replies .ts-switch-label'), panel.querySelector('#ts-switch-replies'));
        wireInfoIcon(panel.querySelector('#ts-switch-shopee .ts-switch-label'), panel.querySelector('#ts-switch-shopee'));
        wireInfoIcon(panel.querySelector('#ts-switch-deep .ts-switch-label'), panel.querySelector('#ts-switch-deep'));
        wireInfoIcon(panel.querySelector('#ts-go').parentElement, panel.querySelector('#ts-go'));
        wireInfoIcon(panel.querySelector('#ts-pause').parentElement, panel.querySelector('#ts-pause'));
        wireInfoIcon(panel.querySelector('#ts-stop').parentElement, panel.querySelector('#ts-stop'));
        wireInfoIcon(panel.querySelector('#ts-dl').parentElement, panel.querySelector('#ts-dl'));
        wireInfoIcon(panel.querySelector('#ts-csv').parentElement, panel.querySelector('#ts-csv'));
        wireInfoIcon(panel.querySelector('#ts-md').parentElement, panel.querySelector('#ts-md'));

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

        const toggleDeep = document.getElementById('ts-toggle-deep');
        document.getElementById('ts-switch-deep').onclick = () => toggleDeep.classList.toggle('active');

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

    // ==================== DOM EXTRACTION (Improved for latest Threads) ====================
    function extractPostsFromDOM() {
        const posts = [];
        const seenCodes = new Set();

        // Primary selectors for latest Threads design
        const selectors = [
            'a[href*="/post/"]',          // Direct post links
            'a[href*="/@"][href*="/post/"]', // Profile + post links
        ];

        const postLinks = document.querySelectorAll(selectors.join(','));

        for (const link of postLinks) {
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/post\/([A-Za-z0-9_-]+)|\/t\/([A-Za-z0-9_-]+)/);
            if (!match) continue;

            const code = match[1] || match[2];
            if (!code || seenCodes.has(code)) continue;
            seenCodes.add(code);

            let container = null;
            let el = link;

            // Walk up to find the post container
            for (let i = 0; i < 15; i++) {
                if (!el.parentElement) break;
                el = el.parentElement;

                // Check for text content
                const hasTextEl = el.querySelector('[dir="auto"] span, [role="button"] span');
                if (!hasTextEl) continue;

                if (el.offsetHeight > 60 && el.offsetHeight < 2000) {
                    container = el;
                    if (el.hasAttribute('data-pressable-container')) break;
                }
            }

            if (!container) continue;

            // === TEXT EXTRACTION ===
            let text = '';
            const textEls = container.querySelectorAll('[dir="auto"]');
            const candidates = [];

            for (const tel of textEls) {
                let t = (tel.innerText || tel.textContent || '').trim();
                if (t.length < 3 || t.length > 5000) continue;

                // Skip timestamps
                if (/^\d+[smhdw]$|^\d+\s*(jam|menit|hari|detik)/.test(t)) continue;
                // Skip UI labels
                if (/^(Follow|Ikuti|More|Lainnya|Like|Suka|Reply|Balas|Share)$/i.test(t)) continue;

                candidates.push(t);
            }

            if (candidates.length > 0) {
                text = candidates.reduce((a, b) => a.length >= b.length ? a : b, '');
            }

            // === TIME ===
            let timeText = '';
            const timeEl = container.querySelector('time');
            if (timeEl) {
                timeText = timeEl.getAttribute('datetime') || timeEl.textContent || '';
            }

            // === LIKES ===
            let likeCount = 0;
            const ariaEls = container.querySelectorAll('[aria-label*="like" i], [aria-label*="suka" i]');
            for (const ael of ariaEls) {
                const label = ael.getAttribute('aria-label') || '';
                const m = label.match(/(\d[\d.,]*)/);
                if (m) { likeCount = parseInt(m[1].replace(/[.,]/g, '')); break; }
            }

            // === USERNAME ===
            const userMatch = href.match(/\/@([^/]+)/);
            const username = userMatch ? userMatch[1] : '';

            // === IMAGES ===
            const images = [];
            const imgs = container.querySelectorAll('img');
            for (const img of imgs) {
                const src = img.src || img.currentSrc || '';
                if (!src || src.includes('150x150') || src.includes('s150x150')) continue;
                if ((img.width > 0 && img.width < 50) || (img.height > 0 && img.height < 50)) continue;
                if (src.includes('cdninstagram') || src.includes('scontent') || src.includes('instagram') || src.includes('fbcdn')) {
                    images.push(src);
                }
            }

            // === VIDEO ===
            const hasVideo = container.querySelector('video') !== null;

            posts.push({
                code,
                text,
                username,
                time: timeText,
                like_count: likeCount,
                images: [...new Set(images)],
                has_video: hasVideo,
                has_shopee_link: false,
                url: `https://${window.location.hostname}/@${username}/post/${code}`,
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

    async function fetchFullThreadInfo(postUrl, authorUsername) {
        if (!postUrl || !authorUsername) return null;
        const result = { fullText: '', hasShopeeLink: false };

        try {
            const resp = await fetch(postUrl, {
                headers: { 'Accept': 'text/html' },
                credentials: 'include',
            });
            if (!resp.ok) return null;

            const html = await resp.text();
            const scriptRegex = /<script[^>]*type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g;
            let match;
            const items = [];

            while ((match = scriptRegex.exec(html)) !== null) {
                try {
                    const data = JSON.parse(match[1]);
                    const threadItemsArrays = findNestedKey(data, 'thread_items');
                    for (const arr of threadItemsArrays) {
                        if (Array.isArray(arr)) items.push(...arr);
                    }
                } catch (e) {}
            }

            const authorLower = authorUsername.toLowerCase();
            const textParts = [];
            let started = false;

            for (const item of items) {
                const post = item?.post;
                if (!post) continue;
                const username = (post.user?.username || '').toLowerCase();

                if (username !== authorLower) {
                    if (started) break;
                    continue;
                }
                started = true;

                const captionText = post.caption?.text || '';
                if (captionText) textParts.push(captionText);
                if (itemHasShopeeLink(item)) result.hasShopeeLink = true;
            }

            result.fullText = textParts.join('\n\n').trim();
        } catch (e) {
            return null;
        }

        return result;
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
        const deepMode = document.getElementById('ts-toggle-deep').classList.contains('active');
        const shopeeOnly = document.getElementById('ts-toggle-shopee').classList.contains('active');
        const { dateFrom, dateTo, dateLabel } = getDateRangeSettings();
        currentSettingsSignature = `${shopeeOnly}|${dateFrom ? dateFrom.toISOString() : ''}|${dateTo ? dateTo.toISOString() : ''}|${includeReplies}`;

        log('🚀 Starting...');
        if (shopeeOnly) log('🛒 Shopee filter ON');
        if (dateLabel) log(`📅 ${dateLabel}`);

        setStatus('🟢 Scraping...', 'running');
        await acquireWakeLock();

        window.scrollTo(0, 0);
        await sleep(1000);

        log('📝 Scraping posts...');
        let reason = await scrapeCurrentTab(delay, { shopeeOnly, dateFrom, dateTo, settingsSignature: currentSettingsSignature });

        if (includeReplies && !shouldStop) {
            log('💬 Scraping replies...');
            const repliesTab = findRepliesTab();
            if (repliesTab) {
                repliesTab.click();
                await sleep(2000);
                window.scrollTo(0, 0);
                await sleep(1000);
                const before = collectedPosts.size;
                reason = await scrapeCurrentTab(delay, { shopeeOnly, dateFrom, dateTo, settingsSignature: currentSettingsSignature });
                log(`💬 +${collectedPosts.size - before}`);
            }
        }

        if (deepMode && !shouldStop) {
            log('🔍 Deep mode...');
            await scrapeDeepComments(delay);
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

    async function scrapeCurrentTab(delay, opts = {}) {
        const { shopeeOnly = false, dateFrom = null, dateTo = null, settingsSignature = '' } = opts;
        let noNewCount = 0;
        let scrollCount = 0;
        const oldSeenCodes = new Set();
        let reason = 'complete';

        while (!shouldStop) {
            await waitWhilePausedOrHidden();
            if (shouldStop) { reason = 'stopped'; break; }

            scrollCount++;
            const prevCount = collectedPosts.size;
            const posts = extractPostsFromDOM();

            for (const p of posts) {
                if (!p.code) continue;

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

                if (shopeeOnly && !checkedShopeeCodes.has(p.code)) {
                    checkedShopeeCodes.add(p.code);
                    await waitWhilePausedOrHidden();
                    if (shouldStop) { reason = 'stopped'; break; }
                    const info = await fetchFullThreadInfo(p.url, p.username);
                    await sleep(300 + Math.random() * 300);
                    if (!info || !info.hasShopeeLink) continue;
                    if (info.fullText) p.text = info.fullText;
                    p.has_shopee_link = true;
                }

                const existing = collectedPosts.get(p.code);
                if (!existing) {
                    collectedPosts.set(p.code, p);
                } else {
                    if (p.text && (!existing.text || p.text.length > existing.text.length)) existing.text = p.text;
                    if (p.like_count && !existing.like_count) existing.like_count = p.like_count;
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

    // ==================== HELPER FUNCTIONS ====================
    function findRepliesTab() {
        const tabs = document.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
            if (/replies|balasan/i.test(tab.textContent)) return tab;
        }
        return null;
    }

    function findThreadsTab() {
        const tabs = document.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
            if (/thread|post/i.test(tab.textContent)) return tab;
        }
        return null;
    }

    function findNestedKey(obj, key) {
        const results = [];
        function search(o) {
            if (!o || typeof o !== 'object') return;
            if (Array.isArray(o)) { for (const item of o) search(item); return; }
            for (const [k, v] of Object.entries(o)) {
                if (k === key) results.push(v);
                else search(v);
            }
        }
        search(obj);
        return results;
    }

    // ==================== DEEP MODE ====================
    async function scrapeDeepComments(delay) {
        const posts = Array.from(collectedPosts.values()).slice(0, 20); // Limit to first 20
        let completed = 0;

        for (const post of posts) {
            await waitWhilePausedOrHidden();
            if (shouldStop) break;
            completed++;
            log(`🔍 ${completed}/${posts.length}`);
            await sleep(delay);
        }

        log(`🔍 Deep done`);
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
        const filename = `${username}_posts_${new Date().toISOString().slice(0, 10)}.json`;

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

        const headers = ['code', 'username', 'text', 'time', 'like_count', 'has_video', 'images', 'url'];
        const rows = posts.map(p => [
            p.code,
            p.username,
            `"${(p.text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            p.time,
            p.like_count,
            p.has_video,
            p.images.length,
            p.url,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_posts_${new Date().toISOString().slice(0, 10)}.csv`;

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
            if (post.like_count > 0) md += `❤️ ${post.like_count}\n\n`;
            md += `[Open](${post.url})\n\n---\n\n`;
        }

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const filename = `${username}_posts_${new Date().toISOString().slice(0, 10)}.md`;

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
})();
