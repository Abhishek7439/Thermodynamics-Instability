window.appData = [];

// Dynamic API base: use Flask for local dev, same-origin for Vercel/production
const API_BASE = (() => {
    if (typeof window !== 'undefined' && window.__ELECTRON_API_BASE__) {
        return window.__ELECTRON_API_BASE__;  // Electron desktop app
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        // Check if running on a Vercel dev server (port 3000) or plain HTTP server
        const port = window.location.port;
        if (port === '3000') return '';  // Vercel dev
        return 'http://localhost:5000';  // Flask dev
    }
    return '';  // Production: same-origin (Vercel)
})();

// ── Global Error Handling ──────────────────────────────────────────────────────
window.addEventListener('error', (e) => {
    console.error('[Global Error]', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('[Unhandled Promise Rejection]', e.reason);
});

// ── Network Status Indicator ───────────────────────────────────────────────────
function updateOnlineStatus() {
    const indicator = document.getElementById('networkStatus');
    if (!indicator) return;
    if (navigator.onLine) {
        indicator.classList.remove('offline');
        indicator.innerHTML = '<i class="fa-solid fa-wifi"></i> Online';
    } else {
        indicator.classList.add('offline');
        indicator.innerHTML = '<i class="fa-solid fa-wifi-slash"></i> Offline';
    }
}

// ── Service Worker Registration ────────────────────────────────────────────────
function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('[SW] Registered:', reg.scope);
        }).catch(err => {
            console.warn('[SW] Registration failed:', err);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initControls();
    initTabs();
    if (typeof initCharts === 'function') initCharts();
    if (typeof initRankingPanel === 'function') initRankingPanel();

    document.getElementById('fetchBtn').addEventListener('click', () => startFetch(false));
    document.getElementById('exportBtn').addEventListener('click', handleExcelExport);

    document.getElementById('clearCacheBtn')?.addEventListener('click', () => {
        clearAllCachedSoundings();
        alert('All cached sounding data cleared.');
    });



    renderSeverityLegend();
    registerServiceWorker();
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

function initControls() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1973; y--) {
        yearSelect.add(new Option(y, y));
    }

    const fromSelect = document.getElementById('fromSelect');
    const toSelect = document.getElementById('toSelect');
    for (let d = 1; d <= 31; d++) {
        const dayStr = d.toString().padStart(2, '0');
        ['00', '12'].forEach(hour => {
            const val = `${dayStr}${hour}`;
            const text = `${dayStr}/${hour}Z`;
            fromSelect.add(new Option(text, val));
            toSelect.add(new Option(text, val));
        });
    }

    const todayStr = new Date().getDate().toString().padStart(2, '0');
    fromSelect.value = `${todayStr}00`;
    toSelect.value = `${todayStr}00`;
    document.getElementById('monthSelect').value = (new Date().getMonth() + 1).toString().padStart(2, '0');

    const regionSelect = document.getElementById('regionSelect');
    if (regionSelect) regionSelect.value = 'seasia';

    const stationSelect = document.getElementById('stationInput');
    const stationsList = window.targetStations || (typeof targetStations !== 'undefined' ? targetStations : null);
    if (stationsList && Array.isArray(stationsList)) {
        stationsList.forEach(s => {
            stationSelect.add(new Option(`${s.name} (${s.number})`, s.number));
        });
    }

    document.querySelectorAll('map[name="raob"] area').forEach(area => {
        area.addEventListener('click', (e) => {
            e.preventDefault();
            const stnm = area.getAttribute('data-stnm');
            if (!stnm) return;
            ensureStationInSelect(stnm, area.getAttribute('title') || `Station ${stnm}`);
            selectOnlyStation(stnm);
            startFetch(false);
        });
    });

    document.getElementById('addStationBtn')?.addEventListener('click', addStationFromInput);
    document.getElementById('customStationInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addStationFromInput();
        }
    });
}

function ensureStationInSelect(stNumber, label) {
    const stationSelect = document.getElementById('stationInput');
    let opt = Array.from(stationSelect.options).find(o => o.value === stNumber);
    if (!opt) {
        if (typeof addCustomStation === 'function') addCustomStation(stNumber, label.replace(/\s*\(.*\)$/, '').trim());
        opt = new Option(label.includes('(') ? label : `${label} (${stNumber})`, stNumber);
        stationSelect.add(opt);
    }
    return opt;
}

function selectOnlyStation(stNumber) {
    const stationSelect = document.getElementById('stationInput');
    Array.from(stationSelect.options).forEach(opt => { opt.selected = opt.value === stNumber; });
}

function addStationFromInput() {
    const input = document.getElementById('customStationInput');
    const num = input.value.trim();
    if (!/^\d{4,5}$/.test(num)) {
        alert('Enter a valid WMO station number (4–5 digits, e.g. 42867).');
        input.focus();
        return;
    }
    ensureStationInSelect(num, `Station ${num}`);
    selectOnlyStation(num);
    input.value = '';
    input.focus();
}

function refreshSoundingDiagram() {
    if (typeof initSkewTView === 'function') {
        initSkewTView(window.appData);
    }
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');

            if (btn.dataset.target === 'chartView') {
                updateComparisonChart(window.appData);
                updateTimeSeriesChart(window.appData);
                renderStationRanking(window.appData);
                assertDataConsistency(window.appData);
            }
            if (btn.dataset.target === 'diagramView') {
                refreshSoundingDiagram();
            }
            if (btn.dataset.target === 'rawData') {
                renderRawDataViewer();
            }
        });
    });
}

function getTimesInRange(fromStr, toStr) {
    const startDay = parseInt(fromStr.substring(0, 2), 10);
    const startHour = fromStr.substring(2, 4);
    const endDay = parseInt(toStr.substring(0, 2), 10);
    const endHour = toStr.substring(2, 4);
    const times = [];
    for (let d = startDay; d <= endDay; d++) {
        const ds = d.toString().padStart(2, '0');
        ['00', '12'].forEach(h => {
            if (d === startDay && h < startHour) return;
            if (d === endDay && h > endHour) return;
            times.push(`${ds}${h}`);
        });
    }
    return times;
}

async function startFetch(forceRefresh) {
    const region = document.getElementById('regionSelect').value;
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    const fromTime = document.getElementById('fromSelect').value;
    const toTime = document.getElementById('toSelect').value;
    const selectedOptions = Array.from(document.getElementById('stationInput').selectedOptions);

    if (selectedOptions.length === 0) {
        alert('Please select at least one station from the list or click on the map.');
        return;
    }

    const fetchBtn = document.getElementById('fetchBtn');
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
    setToolsEnabled(false);

    window.appData = [];
    document.getElementById('tableBody').innerHTML = '';
    document.getElementById('tephigramGrid').innerHTML = '';
    document.getElementById('rawDataContainer').innerHTML = '<p class="empty-state">Fetching data…</p>';
    document.getElementById('statusSection').innerHTML = '';
    document.getElementById('rankingList').innerHTML = '<li class="ranking-empty">Loading…</li>';

    const timeList = getTimesInRange(fromTime, toTime);
    const tasks = [];
    for (const opt of selectedOptions) {
        for (const t of timeList) {
            tasks.push(fetchSingleSounding({
                region, year, month, fromTime: t, toTime: t,
                stNumber: opt.value, stName: opt.text, forceRefresh
            }));
        }
    }

    await Promise.allSettled(tasks);

    renderTable();
    renderRawDataViewer();
    renderAllTephigrams();
    updateProvenanceBanner(window.appData);
    updateComparisonChart(window.appData);
    updateTimeSeriesChart(window.appData);
    renderStationRanking(window.appData);
    assertDataConsistency(window.appData);
    refreshSoundingDiagram();

    fetchBtn.disabled = false;
    fetchBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Fetch Data';
    setToolsEnabled(window.appData.some(r => Object.keys(r.parsedData || {}).length > 0));
}

async function fetchSingleSounding(opts) {
    const { region, year, month, fromTime, toTime, stNumber, stName, forceRefresh, _reuseCard } = opts;
    const cacheKey = buildCacheKey(region, year, month, fromTime, toTime, stNumber);

    const card = _reuseCard || createStatusCard(stName, fromTime);
    if (!_reuseCard) document.getElementById('statusSection').appendChild(card);

    if (!forceRefresh) {
        const cached = readCachedSounding(cacheKey);
        if (cached) {
            const record = buildSoundingRecord({
                stationName: stName,
                stationNum: stNumber,
                year, month, fromTime,
                parsedData: cached.parsedData,
                levelData: cached.levelData,
                rawHtml: cached.rawHtml,
                rawPreBlocks: cached.rawPreBlocks,
                tephigram: cached.tephigram,
                fetchedAt: cached.fetchedAt,
                validation: cached.validation,
                fromCache: true
            });
            window.appData.push(record);
            updateStatusCard(card, record, null);
            addRefreshHandler(card, opts);
            return;
        }
    }

    if (forceRefresh) {
        removeRecordForSlot(stNumber, year, month, fromTime);
    }

    const url = `${API_BASE}/api/sounding?region=${region}&YEAR=${year}&MONTH=${month}&FROM=${fromTime}&TO=${toTime}&STNM=${stNumber}`;

    // Retry with exponential backoff (max 2 retries)
    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
            card.querySelector('.status-text').textContent = `Retry ${attempt}/${MAX_RETRIES}…`;
            await new Promise(r => setTimeout(r, delay));
        }

        try {
            const resp = await fetch(url);

        let json = null;
        try { json = await resp.json(); } catch (_) {}

        if (!resp.ok) {
            const msg = json?.error || (resp.status === 404 ? 'No data available on Wyoming server' : `HTTP ${resp.status}`);
            throw new Error(msg);
        }

        const htmlText = json.html;
        if (!htmlText || htmlText.includes('Sorry, we are unable to process your request')) {
            throw new Error('Wyoming returned no usable sounding data');
        }

        const rawPreBlocks = extractRawPreBlocks(htmlText);
        const indicesText = getIndicesPreText(htmlText);
        const parsed = parseIndices(htmlText);
        const levelData = parseLevels(htmlText);
        const validation = validateParsedData(parsed, indicesText);
        const fetchedAt = new Date().toISOString();

        if (!parsed) {
            throw new Error('Parser could not extract indices from Wyoming response');
        }

        const record = buildSoundingRecord({
            stationName: stName,
            stationNum: stNumber,
            year, month, fromTime,
            parsedData: parsed,
            levelData,
            rawHtml: htmlText,
            rawPreBlocks,
            tephigram: json.tephigram || null,
            fetchedAt,
            fromCache: false,
            fetchError: null,
            validation
        });

        const cacheOk = writeCachedSounding(cacheKey, serializeSoundingForCache(record));
        if (!cacheOk) {
            showCacheWarning('Storage quota reached — live data shown but not cached.');
        }

        window.appData.push(record);
        updateStatusCard(card, record, null);
        return;  // Success — exit retry loop

    } catch (e) {
        lastError = e;
        // Non-retryable errors: 404, parse errors
        const nonRetryable = e.message.includes('No data') ||
                             e.message.includes('No sounding') ||
                             e.message.includes('Parser could not') ||
                             e.message.includes('no usable');
        if (nonRetryable) break;
        // Otherwise continue to next retry attempt
        }
    }

    // All retries exhausted or non-retryable error hit
    const errorMsg = lastError?.message || 'Unknown fetch error';
    const record = buildSoundingRecord({
        stationName: stName,
        stationNum: stNumber,
        year, month, fromTime,
        parsedData: {},
        levelData: [],
        rawHtml: '',
        rawPreBlocks: [],
        fetchError: errorMsg,
        fetchedAt: new Date().toISOString()
    });
    window.appData.push(record);
    updateStatusCard(card, record, errorMsg);
    console.error('Fetch error (after retries):', lastError);
}

function createStatusCard(stName, fromTime) {
    const card = document.createElement('div');
    card.className = 'glass-panel status-card loading';
    card.innerHTML = `
        <h3>${escapeHtml(stName)}</h3>
        <p><span>${fromTime.substring(0,2)}/${fromTime.substring(2,4)}Z</span>
           <span class="status-text">Fetching…</span></p>
        <p class="status-detail"></p>
    `;
    return card;
}

function updateStatusCard(card, record, errorMsg) {
    card.classList.remove('loading');
    card.querySelector('.cache-refresh-btn')?.remove();
    const statusText = card.querySelector('.status-text');
    const detail = card.querySelector('.status-detail');

    if (errorMsg || record.fetchError) {
        card.classList.add('error');
        statusText.textContent = 'Error';
        detail.textContent = errorMsg || record.fetchError;
        detail.className = 'status-detail status-error';
        return;
    }

    if (!record.parsedData || !record.parsedData.station_id) {
        card.classList.add('error');
        statusText.textContent = 'No Data';
        detail.textContent = 'Indices block not found in Wyoming response';
        return;
    }

    card.classList.add('success');
    statusText.textContent = record.fromCache ? 'Cached' : 'Success';
    detail.innerHTML = record.fromCache
        ? `<span class="cache-badge"><i class="fa-solid fa-box-archive"></i> From cache · fetched ${new Date(record.fetchedAt).toLocaleString()}</span>`
        : `<span>Fetched ${new Date(record.fetchedAt).toLocaleString()} · ${record.levelData.length} levels</span>`;
}

function removeRecordForSlot(stNumber, year, month, fromTime) {
    const date = `${year}-${month}-${fromTime.substring(0, 2)}`;
    const time = fromTime.substring(2, 4);
    window.appData = window.appData.filter(r =>
        !(r.stationNum === stNumber && r.date === date && r.time === time)
    );
}

function addRefreshHandler(card, opts) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary btn-xs cache-refresh-btn';
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh live';
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        card.classList.add('loading');
        card.classList.remove('success', 'error');
        card.querySelector('.status-text').textContent = 'Refreshing…';
        card.querySelector('.status-detail').textContent = '';
        removeRecordForSlot(opts.stNumber, opts.year, opts.month, opts.fromTime);
        await fetchSingleSounding({ ...opts, forceRefresh: true, _reuseCard: card });
        renderTable();
        renderRawDataViewer();
        renderAllTephigrams();
        updateProvenanceBanner(window.appData);
        updateComparisonChart(window.appData);
        updateTimeSeriesChart(window.appData);
        renderStationRanking(window.appData);
        refreshSoundingDiagram();
    });
    card.appendChild(btn);
}

function showCacheWarning(msg) {
    const el = document.getElementById('cacheWarning');
    if (el) {
        el.hidden = false;
        el.textContent = msg;
    }
}

function setToolsEnabled(enabled) {
    document.getElementById('exportBtn').disabled = !enabled;
}

function renderTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    tableHeader.innerHTML = '<th>Index</th>';

    window.appData.forEach(r => {
        const th = document.createElement('th');
        const cacheTag = r.fromCache ? ' 📦' : '';
        th.textContent = `${r.stationName} (${r.date} ${r.time}Z)${cacheTag}`;
        tableHeader.appendChild(th);
    });

    tableBody.innerHTML = '';
    INDICES_CONFIG.forEach(c => {
        const tr = document.createElement('tr');
        tr.appendChild(Object.assign(document.createElement('td'), { textContent: c.name }));

        window.appData.forEach(r => {
            const td = document.createElement('td');
            const val = r.parsedData[c.key];

            if (isMissingIndexValue(val)) {
                td.textContent = '—';
                td.className = 'val-nodata';
            } else {
                td.textContent = val;
                const severity = getSeverityClass(c.key, val);
                if (severity) td.classList.add('val-' + severity);
            }
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    renderSeverityLegend();
}

function renderSeverityLegend() {
    const el = document.getElementById('severityLegend');
    if (!el) return;

    el.innerHTML = `
        <h4 class="severity-legend-title">Color key</h4>
        <div class="severity-legend-colors">
            <span class="legend-item"><span class="legend-swatch val-stable"></span> <strong>Stable</strong> — low instability</span>
            <span class="legend-item"><span class="legend-swatch val-moderate"></span> <strong>Moderate</strong> — watch for development</span>
            <span class="legend-item"><span class="legend-swatch val-unstable"></span> <strong>Unstable</strong> — elevated convective potential</span>
            <span class="legend-item"><span class="legend-swatch val-nodata"></span> <strong>Missing</strong> — not reported (M)</span>
        </div>
        <details class="severity-legend-thresholds">
            <summary>Threshold values by index</summary>
            <ul class="threshold-list">
                <li><strong>Showalter index:</strong> Stable &gt; 3 · Moderate 0 to 3 · Unstable &lt; 0</li>
                <li><strong>Lifted index:</strong> Stable &gt; 0 · Moderate −3 to 0 · Unstable &lt; −3</li>
                <li><strong>SWEAT index:</strong> Stable &lt; 150 · Moderate 150–300 · Unstable &gt; 300</li>
                <li><strong>K index:</strong> Stable &lt; 20 · Moderate 20–29 · Unstable ≥ 30</li>
                <li><strong>Totals totals:</strong> Stable &lt; 44 · Moderate 44–50 · Unstable &gt; 50</li>
                <li><strong>CAPE:</strong> Stable &lt; 300 J/kg · Moderate 300–2500 · Unstable &gt; 2500</li>
                <li><strong>CIN:</strong> Stable &gt; −50 J/kg · Moderate −200 to −50 · Unstable &lt; −200</li>
                <li><strong>Precipitable water:</strong> Stable &lt; 30 mm · Moderate 30–50 · Unstable &gt; 50</li>
            </ul>
            <p class="legend-note">Only indices with defined thresholds are color-coded. Other indices are shown as plain values.</p>
        </details>
    `;
}

function renderRawDataViewer() {
    const container = document.getElementById('rawDataContainer');
    if (!container) return;

    if (!window.appData.length) {
        container.innerHTML = '<p class="empty-state">Fetch data to view raw Wyoming sounding text.</p>';
        return;
    }

    container.innerHTML = '';
    window.appData.forEach((r, idx) => {
        const section = document.createElement('div');
        section.className = 'raw-sounding-block';

        const header = document.createElement('div');
        header.className = 'raw-sounding-header';
        header.innerHTML = `
            <h4>${escapeHtml(r.stationName)} · ${r.date} ${r.time}Z</h4>
            <span class="raw-meta">Fetched: ${new Date(r.fetchedAt).toLocaleString()} · ${r.fromCache ? 'Cache' : 'Live'}</span>
        `;
        section.appendChild(header);

        if (r.fetchError) {
            section.appendChild(Object.assign(document.createElement('p'), {
                className: 'status-error',
                textContent: r.fetchError
            }));
        } else if (r.rawPreBlocks && r.rawPreBlocks.length) {
            r.rawPreBlocks.forEach((block, bi) => {
                const label = document.createElement('div');
                label.className = 'raw-block-label';
                label.textContent = bi === 0 ? 'Profile data (<pre> block 1)' : 'Indices & metadata (<pre> block 2)';
                section.appendChild(label);
                const pre = document.createElement('pre');
                pre.className = 'raw-pre-content';
                pre.textContent = block;
                section.appendChild(pre);
            });
        } else {
            section.appendChild(Object.assign(document.createElement('p'), {
                className: 'empty-state',
                textContent: 'No raw pre blocks stored for this sounding.'
            }));
        }
        container.appendChild(section);
    });
}

function renderAllTephigrams() {
    const grid = document.getElementById('tephigramGrid');
    if (!grid) return;
    grid.innerHTML = '';

    window.appData.forEach(r => {
        if (!r.tephigram || !r.parsedData?.station_id) return;
        const tCard = document.createElement('div');
        tCard.className = 'tephigram-card';
        tCard.innerHTML = `
            <div class="tephigram-card-header">${escapeHtml(r.stationName)} (${r.date} ${r.time}Z)</div>
            <div class="tephigram-img-container">
                <img src="data:image/png;base64,${r.tephigram}" alt="Tephigram ${r.stationNum}">
            </div>
            <p class="tephigram-meta">${r.levelData.length} parsed levels · same Wyoming fetch as table data</p>
            <textarea class="forecaster-notes" placeholder="Forecaster notes for ${escapeHtml(r.stationName)}…"></textarea>
        `;
        grid.appendChild(tCard);
    });

    if (!grid.children.length) {
        grid.innerHTML = '<p class="empty-state">No tephigrams available — backend must be running and sounding must contain profile data.</p>';
    }
}

function handleExcelExport() {
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    const fromDay = document.getElementById('fromSelect').value.substring(0, 2);
    const toDay = document.getElementById('toSelect').value.substring(0, 2);
    const startDate = `${year}-${month}-${fromDay}`;
    const endDate = `${year}-${month}-${toDay}`;
    if (typeof exportToExcel === 'function') exportToExcel(window.appData, startDate, endDate);
}

async function runReport(format) {
    if (!window.exportOperationalReport) {
        alert('Report generator still loading — try again in a moment.');
        return;
    }
    try {
        await window.exportOperationalReport(format);
    } catch (e) {
        alert(e.message);
    }
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
