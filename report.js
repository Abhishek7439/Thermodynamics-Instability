/**
 * Client-side Word (.docx) and PDF report generation.
 * Loaded as ES module — uses window globals from classic scripts.
 */
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, ShadingType, HeadingLevel, AlignmentType, ImageRun,
    Footer, PageNumber
} from 'https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm';

const {
    INDICES_CONFIG,
    getIndexValue,
    getSeverityClass,
    getSeverityPresentation,
    getSeverityReportColor,
    verifyReportPayloadMatchesAppData,
    buildAutomatedAnalysis,
    buildRankingForReport,
    getRecordLabel,
    formatDisplayValue,
    utcToIstLabel,
    assertDataConsistency,
    updateComparisonChart,
    updateTimeSeriesChart,
    DATA_SOURCE_LABEL
} = window;

const REPORT_TITLE = 'Upper-Air Thermodynamic Instability Report';
const REPORT_DISCLAIMER =
    'Decision-support aid only. Not an official forecast product. ' +
    'Automated analysis uses the same threshold rules as the dashboard color coding. ' +
    `Data source: ${DATA_SOURCE_LABEL}.`;

function buildReportPayload(appData, chartImages) {
    return {
        generatedAt: new Date().toISOString(),
        records: appData.map(r => ({
            stationName: r.stationName,
            stationNum: r.stationNum,
            date: r.date,
            time: r.time,
            metadata: {
                latitude: r.parsedData.latitude,
                longitude: r.parsedData.longitude,
                elevation: r.parsedData.elevation,
                obs_time: r.parsedData.obs_time
            },
            indices: Object.fromEntries(
                INDICES_CONFIG.map(c => [c.key, getIndexValue(r, c.key)])
            ),
            validation: r.validation || {},
            analysis: buildAutomatedAnalysis(r)
        })),
        rankingCape: buildRankingForReport(appData, 'cape'),
        chartImages: chartImages || {}
    };
}

function severityFill(severity) {
    const hex = getSeverityReportColor(severity);
    return hex ? hex : undefined;
}

function buildIndexTableRows(records) {
    const header = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph('Index')] }),
            ...records.map(r => new TableCell({
                children: [new Paragraph(`${r.stationName}\n${r.date} ${r.time}Z`)]
            }))
        ]
    });

    const rows = [header];
    INDICES_CONFIG.forEach(c => {
        rows.push(new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(c.name)] }),
                ...records.map(r => {
                    const val = getIndexValue(r, c.key);
                    const severity = getSeverityClass(c.key, val);
                    const text = val === null ? '—' : String(val);
                    return new TableCell({
                        shading: severityFill(severity) ? {
                            fill: severityFill(severity),
                            type: ShadingType.CLEAR
                        } : undefined,
                        children: [new Paragraph(text)]
                    });
                })
            ]
        }));
    });
    return rows;
}

async function generateWordReport(appData, chartImages) {
    const payload = buildReportPayload(appData, chartImages);
    const mismatches = verifyReportPayloadMatchesAppData(payload, appData);
    if (mismatches.length) {
        throw new Error('Report data mismatch — export blocked:\n' + mismatches.slice(0, 5).join('\n'));
    }

    const children = [
        new Paragraph({ text: REPORT_TITLE, heading: HeadingLevel.TITLE }),
        new Paragraph(`Generated: ${new Date(payload.generatedAt).toLocaleString()}`),
        new Paragraph(`Observations covered: ${appData.map(r => `${r.date} ${r.time}Z`).join(', ')}`),
        new Paragraph(`Data source: ${DATA_SOURCE_LABEL}`),
        new Paragraph({ text: 'Station Metadata', heading: HeadingLevel.HEADING_2 })
    ];

    const metaRows = [
        new TableRow({
            children: ['Station', 'WMO', 'Lat', 'Lon', 'Elev (m)', 'Obs (Z)', 'Obs (IST)'].map(h =>
                new TableCell({ children: [new Paragraph({ text: h, bold: true })] })
            )
        }),
        ...appData.map(r => new TableRow({
            children: [
                r.stationName,
                r.stationNum,
                formatDisplayValue(r.parsedData.latitude),
                formatDisplayValue(r.parsedData.longitude),
                formatDisplayValue(r.parsedData.elevation),
                `${r.date} ${r.time}Z`,
                utcToIstLabel(r.time)
            ].map(t => new TableCell({ children: [new Paragraph(String(t))] }))
        }))
    ];
    children.push(new Table({ rows: metaRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

    children.push(new Paragraph({ text: 'Thermodynamic Indices', heading: HeadingLevel.HEADING_2 }));
    children.push(new Table({
        rows: buildIndexTableRows(appData),
        width: { size: 100, type: WidthType.PERCENTAGE }
    }));

    if (appData.length > 1) {
        children.push(new Paragraph({ text: 'Multi-Station CAPE Ranking', heading: HeadingLevel.HEADING_2 }));
        payload.rankingCape.forEach((item, i) => {
            children.push(new Paragraph(
                `#${i + 1} ${item.stationName} (${item.date} ${item.time}Z): ${item.value} J/kg — ${getSeverityPresentation(item.severity).label}`
            ));
        });
    }

    appData.forEach(r => {
        children.push(new Paragraph({ text: `Automated Analysis — ${r.stationName}`, heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph(buildAutomatedAnalysis(r)));
    });

    if (chartImages.comparison) {
        children.push(new Paragraph({ text: 'Station Comparison Chart', heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph({
            children: [new ImageRun({ data: chartImages.comparison, transformation: { width: 500, height: 280 } })]
        }));
    }
    if (chartImages.timeSeries) {
        children.push(new Paragraph({ text: 'Time Series Chart', heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph({
            children: [new ImageRun({ data: chartImages.timeSeries, transformation: { width: 500, height: 280 } })]
        }));
    }

    children.push(new Paragraph({ text: REPORT_DISCLAIMER, italics: true }));

    const doc = new Document({
        sections: [{
            properties: {},
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun(REPORT_DISCLAIMER + ' · Page '),
                            new TextRun({ children: [PageNumber.CURRENT] })
                        ]
                    })]
                })
            },
            children
        }]
    });

    const blob = await Packer.toBlob(doc);
    const name = `InstabilityReport_${new Date().toISOString().slice(0, 10)}.docx`;
    downloadBlob(blob, name);
}

function generatePdfReport(appData, chartImages) {
    if (typeof pdfMake === 'undefined') {
        throw new Error('PDF library not loaded');
    }

    const payload = buildReportPayload(appData, chartImages);
    const mismatches = verifyReportPayloadMatchesAppData(payload, appData);
    if (mismatches.length) {
        throw new Error('Report data mismatch — export blocked:\n' + mismatches.slice(0, 5).join('\n'));
    }

    const indexHeader = [{ text: 'Index', style: 'tableHeader' }];
    appData.forEach(r => {
        indexHeader.push({ text: `${r.stationName}\n${r.date} ${r.time}Z`, style: 'tableHeader' });
    });

    const indexBody = [indexHeader];
    INDICES_CONFIG.forEach(c => {
        const row = [{ text: c.name }];
        appData.forEach(r => {
            const val = getIndexValue(r, c.key);
            const severity = getSeverityClass(c.key, val);
            const fill = getSeverityReportColor(severity);
            row.push({
                text: val === null ? '—' : String(val),
                fillColor: fill || '#f1f5f9'
            });
        });
        indexBody.push(row);
    });

    const content = [
        { text: REPORT_TITLE, style: 'header' },
        { text: `Generated: ${new Date(payload.generatedAt).toLocaleString()}`, margin: [0, 0, 0, 8] },
        { text: `Data source: ${DATA_SOURCE_LABEL}`, margin: [0, 0, 0, 12] },
        { text: 'Thermodynamic Indices', style: 'subheader' },
        {
            table: { headerRows: 1, widths: ['*', ...appData.map(() => '*')], body: indexBody },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16]
        }
    ];

    if (appData.length > 1 && payload.rankingCape.length) {
        content.push({ text: 'Multi-Station CAPE Ranking', style: 'subheader' });
        payload.rankingCape.forEach((item, i) => {
            content.push({
                text: `#${i + 1} ${item.stationName}: ${item.value} J/kg (${getSeverityPresentation(item.severity).label})`,
                margin: [0, 2, 0, 2]
            });
        });
    }

    appData.forEach(r => {
        content.push({ text: `Analysis — ${r.stationName}`, style: 'subheader' });
        content.push({ text: buildAutomatedAnalysis(r), margin: [0, 0, 0, 10] });
    });

    if (chartImages.comparison) {
        content.push({ text: 'Station Comparison', style: 'subheader' });
        content.push({ image: chartImages.comparison, width: 480, margin: [0, 0, 0, 12] });
    }
    if (chartImages.timeSeries) {
        content.push({ text: 'Time Series', style: 'subheader' });
        content.push({ image: chartImages.timeSeries, width: 480, margin: [0, 0, 0, 12] });
    }

    content.push({ text: REPORT_DISCLAIMER, style: 'disclaimer', margin: [0, 20, 0, 0] });

    const docDef = {
        pageMargins: [40, 50, 40, 50],
        footer: (currentPage, pageCount) => ({
            text: `${REPORT_DISCLAIMER} · Page ${currentPage} of ${pageCount}`,
            alignment: 'center',
            fontSize: 8,
            margin: [40, 0]
        }),
        content,
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
            subheader: { fontSize: 13, bold: true, margin: [0, 10, 0, 6] },
            tableHeader: { bold: true, fillColor: '#e2e8f0' },
            disclaimer: { fontSize: 9, italics: true, color: '#475569' }
        }
    };

    pdfMake.createPdf(docDef).download(`InstabilityReport_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

function captureChartImages() {
    const { comparison, timeSeries } = window.getChartInstances?.() || {};
    const images = {};
    if (comparison) images.comparison = comparison.toBase64Image('image/png', 1);
    if (timeSeries) images.timeSeries = timeSeries.toBase64Image('image/png', 1);
    return images;
}

function base64ToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function exportOperationalReport(format) {
    if (!window.appData || window.appData.length === 0) {
        alert('Fetch data before generating a report.');
        return;
    }

    window.updateComparisonChart(window.appData);
    window.updateTimeSeriesChart(window.appData);

    const { comparison, timeSeries } = window.getChartInstances();
    const chartImages = {};
    if (comparison) {
        chartImages.comparison = base64ToUint8Array(comparison.toBase64Image('image/png', 1));
    }
    if (timeSeries) {
        chartImages.timeSeries = base64ToUint8Array(timeSeries.toBase64Image('image/png', 1));
    }

    window.assertDataConsistency(window.appData);

    if (format === 'word') {
        await generateWordReport(window.appData, chartImages);
    } else if (format === 'pdf') {
        const pdfImages = {};
        if (comparison) pdfImages.comparison = comparison.toBase64Image('image/png', 1);
        if (timeSeries) pdfImages.timeSeries = timeSeries.toBase64Image('image/png', 1);
        generatePdfReport(window.appData, pdfImages);
    }
}

window.exportOperationalReport = exportOperationalReport;
window.reportGeneratorReady = true;
document.dispatchEvent(new CustomEvent('reportGeneratorReady'));
