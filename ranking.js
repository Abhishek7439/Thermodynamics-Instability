function renderStationRanking(appData) {
    const panel = document.getElementById('rankingPanel');
    const select = document.getElementById('rankingIndexSelect');
    const list = document.getElementById('rankingList');
    if (!panel || !select || !list) return;

    if (!appData || appData.length === 0) {
        list.innerHTML = '<li class="ranking-empty">Fetch data to see station rankings.</li>';
        return;
    }

    const key = select.value;
    const config = INDICES_CONFIG.find(c => c.key === key);
    const sortDir = getRankSortDirection(key);

    if (!sortDir || !config) {
        list.innerHTML = '<li class="ranking-empty">No severity ranking defined for this index.</li>';
        return;
    }

    const ranked = appData
        .map(r => ({
            record: r,
            value: getIndexValue(r, key),
            label: getRecordLabel(r)
        }))
        .filter(x => x.value !== null)
        .sort((a, b) => sortDir === 'desc' ? b.value - a.value : a.value - b.value);

    if (ranked.length === 0) {
        list.innerHTML = '<li class="ranking-empty">No valid values for this index in current dataset.</li>';
        return;
    }

    list.innerHTML = '';
    ranked.forEach((item, idx) => {
        const severity = getSeverityClass(key, item.value);
        const li = document.createElement('li');
        li.className = `ranking-item val-${severity || 'nodata'}`;
        li.innerHTML = `
            <span class="ranking-rank">#${idx + 1}</span>
            <span class="ranking-station">${item.label}</span>
            <span class="ranking-value">${item.value}</span>
        `;
        list.appendChild(li);
    });
}

function initRankingPanel() {
    const select = document.getElementById('rankingIndexSelect');
    if (!select || select.options.length > 0) return;

    INDICES_CONFIG.filter(c => indexHasRanking(c.key)).forEach(c => {
        select.add(new Option(c.name, c.key));
    });
    if (!select.value && select.options.length) select.value = 'cape';

    select.addEventListener('change', () => renderStationRanking(window.appData));
}

function buildRankingForReport(appData, key) {
    const sortDir = getRankSortDirection(key);
    if (!sortDir) return [];

    return appData
        .map(r => ({
            stationName: r.stationName,
            stationNum: r.stationNum,
            date: r.date,
            time: r.time,
            value: getIndexValue(r, key),
            severity: getSeverityClass(key, getIndexValue(r, key))
        }))
        .filter(x => x.value !== null)
        .sort((a, b) => sortDir === 'desc' ? b.value - a.value : a.value - b.value);
}

function buildAutomatedAnalysis(record) {
    const lines = [];
    const pd = record.parsedData || {};
    const cape = getIndexValue(record, 'cape');
    const k = getIndexValue(record, 'k_index');
    const lifted = getIndexValue(record, 'lifted');
    const cin = getIndexValue(record, 'cin');
    const pw = getIndexValue(record, 'pw');

    lines.push('Automated threshold-derived summary (not an official forecast):');

    if (cape !== null) {
        const s = getSeverityClass('cape', cape);
        lines.push(`CAPE of ${cape} J/kg → ${getSeverityPresentation(s).label} per dashboard thresholds (<300 / 300–2500 / >2500 J/kg).`);
    }
    if (k !== null) {
        const s = getSeverityClass('k_index', k);
        lines.push(`K-index of ${k} → ${getSeverityPresentation(s).label} per dashboard thresholds (<20 / 20–29 / ≥30).`);
    }
    if (lifted !== null) {
        const s = getSeverityClass('lifted', lifted);
        lines.push(`Lifted index of ${lifted} °C → ${getSeverityPresentation(s).label} per dashboard thresholds (>0 / −3 to 0 / <−3).`);
    }
    if (cin !== null) {
        const s = getSeverityClass('cin', cin);
        lines.push(`CIN of ${cin} J/kg → ${getSeverityPresentation(s).label} per dashboard thresholds (>−50 / −200 to −50 / <−200).`);
    }
    if (pw !== null) {
        const s = getSeverityClass('pw', pw);
        lines.push(`Precipitable water of ${pw} mm → ${getSeverityPresentation(s).label} per dashboard thresholds (<30 / 30–50 / >50 mm).`);
    }

    if (lines.length === 1) {
        lines.push('Insufficient parsed indices for automated narrative.');
    }
    return lines.join('\n');
}

Object.assign(window, {
    renderStationRanking,
    initRankingPanel,
    buildRankingForReport,
    buildAutomatedAnalysis
});
