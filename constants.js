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
    getSeverityPresentation,
    getSeverityChartColor,
    getSeverityExcelColor,
    getSeverityReportColor
});
