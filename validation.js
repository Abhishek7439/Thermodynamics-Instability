/**
 * Post-parse plausibility checks — flags parser regressions; does NOT alter values.
 * Bounds are generous meteorological limits, not severity thresholds.
 */
const INDEX_PLAUSIBILITY_BOUNDS = {
    showalter:    { min: -20, max: 20 },
    lifted:       { min: -20, max: 10 },
    lift_vt:      { min: -20, max: 10 },
    sweat:        { min: 0, max: 1000 },
    k_index:      { min: -10, max: 45 },
    cross_totals: { min: 0, max: 60 },
    vert_totals:  { min: 0, max: 100 },
    totals_totals:{ min: 30, max: 70 },
    cape:         { min: 0, max: 8000 },
    cape_vt:      { min: 0, max: 8000 },
    cin:          { min: -500, max: 0 },
    cins_vt:      { min: -500, max: 0 },
    eq_level:     { min: 100, max: 500 },
    eq_level_vt:  { min: 100, max: 500 },
    lfc:          { min: 100, max: 900 },
    lfct_vt:      { min: 100, max: 900 },
    brn:          { min: 0, max: 200 },
    brn_capv:     { min: 0, max: 200 },
    lcl_temp:     { min: 250, max: 330 },
    lcl_pres:     { min: 700, max: 1050 },
    lcl_theta_e:  { min: 300, max: 400 },
    ml_theta:     { min: 250, max: 330 },
    ml_mixr:      { min: 0, max: 30 },
    thickness:    { min: 5000, max: 6000 },
    pw:           { min: 0, max: 100 },
    latitude:     { min: -90, max: 90 },
    longitude:    { min: -180, max: 180 },
    elevation:    { min: -500, max: 9000 },
    station_num:  { min: 0, max: 99999 }
};

function isMissingIndexValue(val) {
    return val === null || val === undefined || val === 'M' || (typeof val === 'number' && isNaN(val));
}

function validateParsedData(parsedData, rawIndicesText) {
    const flags = {};
    if (!parsedData) return flags;

    const missingFromRaw = detectMissingFromRaw(rawIndicesText || '');

    INDICES_CONFIG.forEach(c => {
        const val = parsedData[c.key];
        if (isMissingIndexValue(val)) {
            flags[c.key] = missingFromRaw[c.key] ? 'missing' : 'missing';
            return;
        }
        const bounds = INDEX_PLAUSIBILITY_BOUNDS[c.key];
        if (bounds && (val < bounds.min || val > bounds.max)) {
            flags[c.key] = 'out_of_range';
        } else {
            flags[c.key] = 'ok';
        }
    });

    return flags;
}

/** Detect Wyoming "M" markers in raw indices block for explicit missing tracking */
function detectMissingFromRaw(indicesText) {
    const missing = {};
    if (!indicesText) return missing;

    INDICES_CONFIG.forEach(c => {
        const escapedLabel = c.name.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        const regex = new RegExp(escapedLabel + ':\\s*(M|\\-?\\d+(?:\\.\\d+)?)', 'i');
        const m = indicesText.match(regex);
        if (m && m[1].toUpperCase() === 'M') {
            missing[c.key] = true;
        }
    });
    return missing;
}

function countValidationIssues(validation) {
    if (!validation) return 0;
    return Object.values(validation).filter(v => v === 'out_of_range').length;
}

Object.assign(window, {
    isMissingIndexValue,
    validateParsedData,
    countValidationIssues
});
