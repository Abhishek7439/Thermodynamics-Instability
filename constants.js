/**
 * Shared presentation constants — severity THRESHOLDS live in parser.js (INDICES_CONFIG.evaluate).
 * These colors must stay aligned across table, charts, Excel, and reports.
 */
const SEVERITY_PRESENTATION = {
    stable: {
        cssClass: 'stable',
        label: 'Stable',
        icon: '●',
        chartHex: '#4ade80',
        excelHex: '90EE90',
        reportHex: '90EE90'
    },
    moderate: {
        cssClass: 'moderate',
        label: 'Moderate',
        icon: '▲',
        chartHex: '#fbbf24',
        excelHex: 'FFD580',
        reportHex: 'FFD580'
    },
    unstable: {
        cssClass: 'unstable',
        label: 'Unstable',
        icon: '■',
        chartHex: '#f87171',
        excelHex: 'FF9999',
        reportHex: 'FF9999'
    },
    nodata: {
        cssClass: 'nodata',
        label: 'Missing',
        icon: '—',
        chartHex: 'rgba(148, 163, 184, 0.5)',
        excelHex: null,
        reportHex: null
    },
    unverified: {
        cssClass: 'unverified',
        label: 'Unverified',
        icon: '?',
        chartHex: 'rgba(168, 85, 247, 0.6)',
        excelHex: 'E9D5FF',
        reportHex: 'E9D5FF'
    }
};

const SKEWT_COLORS = {
    tempTrace: '#ef4444',
    dewTrace: '#22c55e',
    parcelPath: '#d946ef',
    cape: 'rgba(245, 158, 11, 0.35)',
    cin: 'rgba(59, 130, 246, 0.35)',
    dryAdiabat: 'rgba(239, 68, 68, 0.12)',
    moistAdiabat: 'rgba(34, 197, 94, 0.14)',
    mixingRatio: 'rgba(139, 92, 246, 0.12)'
};

const WIND_BARB_BINS = [
    { max: 20, color: '#4ade80' },
    { max: 35, color: '#facc15' },
    { max: 50, color: '#fb923c' },
    { max: Infinity, color: '#f87171' }
];

const STATION_COLORS = [
    '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6',
    '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

const DATA_SOURCE_LABEL = 'University of Wyoming Upper Air Soundings';

function getSeverityPresentation(severity) {
    return SEVERITY_PRESENTATION[severity] || SEVERITY_PRESENTATION.nodata;
}

function getSeverityChartColor(severity) {
    return getSeverityPresentation(severity).chartHex;
}

function getSeverityExcelColor(severity) {
    return getSeverityPresentation(severity).excelHex;
}

function getSeverityReportColor(severity) {
    return getSeverityPresentation(severity).reportHex;
}

function formatSeverityCell(severity) {
    const p = getSeverityPresentation(severity);
    if (!severity || severity === 'nodata') return { text: '—', icon: p.icon, label: p.label };
    return { icon: p.icon, label: p.label };
}

Object.assign(window, {
    DATA_SOURCE_LABEL,
    SEVERITY_PRESENTATION,
    SKEWT_COLORS,
    WIND_BARB_BINS,
    STATION_COLORS,
    getSeverityPresentation,
    getSeverityChartColor,
    getSeverityExcelColor,
    getSeverityReportColor
});
