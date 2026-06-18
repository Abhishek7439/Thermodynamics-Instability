const CACHE_PREFIX = 'rmc_sounding_v1_';
const CACHE_INDEX_KEY = 'rmc_sounding_v1_index';

function buildCacheKey(region, year, month, fromTime, toTime, stNumber) {
    return `${CACHE_PREFIX}${region}_${year}_${month}_${fromTime}_${toTime}_${stNumber}`;
}

function getCacheIndex() {
    try {
        const raw = localStorage.getItem(CACHE_INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCacheIndex(index) {
    try {
        localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index.slice(-500)));
    } catch (_) { /* quota */ }
}

function readCachedSounding(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function writeCachedSounding(key, payload) {
    try {
        localStorage.setItem(key, JSON.stringify(payload));
        const index = getCacheIndex();
        if (!index.includes(key)) {
            index.push(key);
            saveCacheIndex(index);
        }
        return true;
    } catch (e) {
        console.warn('Cache write failed:', e.message);
        return false;
    }
}

function clearAllCachedSoundings() {
    const index = getCacheIndex();
    index.forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
    });
    try { localStorage.removeItem(CACHE_INDEX_KEY); } catch (_) {}
}

function serializeSoundingForCache(record) {
    return {
        stationName: record.stationName,
        stationNum: record.stationNum,
        date: record.date,
        time: record.time,
        parsedData: record.parsedData,
        levelData: record.levelData,
        rawHtml: record.rawHtml,
        rawPreBlocks: record.rawPreBlocks,
        tephigram: record.tephigram || null,
        fetchedAt: record.fetchedAt,
        validation: record.validation,
        fetchError: record.fetchError || null
    };
}

Object.assign(window, {
    buildCacheKey,
    readCachedSounding,
    writeCachedSounding,
    clearAllCachedSoundings,
    serializeSoundingForCache
});
