function buildSoundingRecord(params) {
    const {
        stationName, stationNum, year, month, fromTime,
        parsedData, levelData, rawHtml, rawPreBlocks,
        tephigram, fetchedAt, fromCache, fetchError, validation
    } = params;

    return {
        stationName,
        stationNum,
        date: `${year}-${month}-${fromTime.substring(0, 2)}`,
        time: fromTime.substring(2, 4),
        parsedData: parsedData || {},
        levelData: levelData || [],
        rawHtml: rawHtml || '',
        rawPreBlocks: rawPreBlocks || [],
        tephigram: tephigram || null,
        fetchedAt: fetchedAt || new Date().toISOString(),
        fromCache: !!fromCache,
        fetchError: fetchError || null,
        validation: validation || {}
    };
}

function getIndexValue(record, key) {
    if (!record || !record.parsedData) return null;
    const val = record.parsedData[key];
    if (isMissingIndexValue(val)) return null;
    return val;
}

function formatDisplayValue(val) {
    if (isMissingIndexValue(val)) return '—';
    return val;
}

function utcToIstLabel(timeZ) {
    const hour = parseInt(timeZ, 10);
    if (isNaN(hour)) return '';
    const istHour = (hour + 5) % 24;
    const istMin = 30;
    return `${String(istHour).padStart(2, '0')}:${String(istMin).padStart(2, '0')} IST`;
}

function getRecordLabel(record) {
    return `${record.stationName} (${record.date} ${record.time}Z)`;
}

function updateProvenanceBanner(records) {
    const el = document.getElementById('provenanceBanner');
    if (!el) return;
    if (!records || records.length === 0) {
        el.hidden = true;
        return;
    }
    const latest = records.reduce((a, b) => (a.fetchedAt > b.fetchedAt ? a : b));
    const cacheNote = records.some(r => r.fromCache)
        ? ' · Some data served from cache — use Refresh on status cards to re-fetch live'
        : '';
    el.hidden = false;
    el.innerHTML = `<i class="fa-solid fa-database"></i> Data as of <strong>${new Date(latest.fetchedAt).toLocaleString()}</strong> · Source: <strong>${DATA_SOURCE_LABEL}</strong>${cacheNote}`;
}

/** Verify table, charts, and export would read identical values */
function assertDataConsistency(appData) {
    const errors = [];
    if (!appData || appData.length === 0) return errors;

    appData.forEach((record, ri) => {
        INDICES_CONFIG.forEach(c => {
            const direct = getIndexValue(record, c.key);
            const viaParsed = record.parsedData[c.key];
            const missingDirect = isMissingIndexValue(direct);
            const missingVia = isMissingIndexValue(viaParsed);
            if (missingDirect !== missingVia || (!missingDirect && direct !== viaParsed)) {
                errors.push(`Record ${ri} index ${c.key}: inconsistent (${direct} vs ${viaParsed})`);
            }
        });
    });

    if (typeof window.getChartInstances === 'function') {
        const key = document.getElementById('compareIndexSelect')?.value;
        const { comparison } = window.getChartInstances();
        if (comparison && key) {
            comparison.data.datasets[0].data.forEach((v, i) => {
                const expected = getIndexValue(appData[i], key);
                const chartVal = v;
                const bothMissing = expected === null && (chartVal === null || chartVal === undefined);
                if (!bothMissing && expected !== chartVal) {
                    errors.push(`Bar chart point ${i} for ${key}: chart=${chartVal} table=${expected}`);
                }
            });
        }
    }

    if (errors.length) console.warn('[Data consistency check]', errors);
    return errors;
}

function verifyReportPayloadMatchesAppData(payload, appData) {
    const mismatches = [];
    payload.records.forEach((pr, i) => {
        const live = appData[i];
        if (!live) {
            mismatches.push(`Missing live record at index ${i}`);
            return;
        }
        INDICES_CONFIG.forEach(c => {
            const a = getIndexValue(live, c.key);
            const b = pr.indices[c.key];
            const missA = a === null;
            const missB = b === null || b === undefined;
            if (missA !== missB || (!missA && a !== b)) {
                mismatches.push(`${getRecordLabel(live)} · ${c.name}: live=${a} report=${b}`);
            }
        });
    });
    return mismatches;
}

Object.assign(window, {
    buildSoundingRecord,
    getIndexValue,
    formatDisplayValue,
    utcToIstLabel,
    getRecordLabel,
    updateProvenanceBanner,
    assertDataConsistency,
    verifyReportPayloadMatchesAppData
});
