/**
 * Chart/reference-line boundaries — numeric values mirror INDICES_CONFIG.evaluate exactly.
 * Used only for visualization; classification always uses getSeverityClass().
 */
const SEVERITY_REFERENCE_LINES = {
    showalter:    [{ value: 0, tier: 'moderate' }, { value: 3, tier: 'stable' }],
    lifted:       [{ value: -3, tier: 'moderate' }, { value: 0, tier: 'stable' }],
    sweat:        [{ value: 150, tier: 'moderate' }, { value: 300, tier: 'moderate' }],
    k_index:      [{ value: 20, tier: 'moderate' }, { value: 30, tier: 'unstable' }],
    totals_totals:[{ value: 44, tier: 'moderate' }, { value: 50, tier: 'moderate' }],
    cape:         [{ value: 300, tier: 'moderate' }, { value: 2500, tier: 'moderate' }],
    cin:          [{ value: -200, tier: 'moderate' }, { value: -50, tier: 'stable' }],
    pw:           [{ value: 30, tier: 'moderate' }, { value: 50, tier: 'moderate' }]
};

/** Higher value = more unstable for ranking when evaluate exists */
const RANK_HIGHER_IS_UNSTABLE = {
    showalter: false,
    lifted: false,
    sweat: true,
    k_index: true,
    totals_totals: true,
    cape: true,
    cin: false,
    pw: true
};

function getReferenceLinesForIndex(key) {
    return SEVERITY_REFERENCE_LINES[key] || [];
}

function getRankSortDirection(key) {
    if (RANK_HIGHER_IS_UNSTABLE[key] === false) return 'asc';
    if (RANK_HIGHER_IS_UNSTABLE[key] === true) return 'desc';
    return null;
}

function indexHasRanking(key) {
    return getRankSortDirection(key) !== null;
}

Object.assign(window, {
    getReferenceLinesForIndex,
    getRankSortDirection,
    indexHasRanking
});
