let comparisonChartInstance = null;
let timeSeriesChartInstance = null;

function initCharts() {
    const ann = window['chartjs-plugin-annotation'];
    if (typeof Chart !== 'undefined' && ann && !Chart.registry.plugins.get('annotation')) {
        Chart.register(ann);
    }

    const compareSelect = document.getElementById('compareIndexSelect');
    const tsSelect = document.getElementById('timeSeriesIndexSelect');
    if (!compareSelect || !tsSelect) return;

    INDICES_CONFIG.forEach(c => {
        compareSelect.add(new Option(c.name, c.key));
        tsSelect.add(new Option(c.name, c.key));
    });

    compareSelect.addEventListener('change', () => {
        updateComparisonChart(window.appData);
        assertDataConsistency(window.appData);
    });
    tsSelect.addEventListener('change', () => {
        updateTimeSeriesChart(window.appData);
        assertDataConsistency(window.appData);
    });
}

function buildComparisonAnnotations(selectedIndex) {
    const lines = getReferenceLinesForIndex(selectedIndex);
    if (!lines.length || typeof Chart === 'undefined') return {};

    const annotations = {};
    lines.forEach((line, i) => {
        annotations[`line${i}`] = {
            type: 'line',
            yMin: line.value,
            yMax: line.value,
            borderColor: getSeverityChartColor(line.tier === 'stable' ? 'stable' : line.tier === 'unstable' ? 'unstable' : 'moderate'),
            borderWidth: 2,
            borderDash: [6, 4],
            label: {
                display: true,
                content: `${line.value}`,
                position: 'start',
                backgroundColor: 'rgba(15,23,42,0.8)',
                color: '#cbd5e1',
                font: { size: 10 }
            }
        };
    });
    return annotations;
}

function updateComparisonChart(appData) {
    if (!appData || appData.length === 0) return;

    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;

    const selectedIndex = document.getElementById('compareIndexSelect').value;
    const indexConfig = INDICES_CONFIG.find(c => c.key === selectedIndex);

    const labels = [];
    const values = [];
    const bgColors = [];

    appData.forEach(record => {
        const label = getRecordLabel(record);
        const val = getIndexValue(record, selectedIndex);
        labels.push(label);
        values.push(val);
        const severity = getSeverityClass(selectedIndex, val);
        bgColors.push(getSeverityChartColor(severity || 'nodata'));
    });

    const ctx = canvas.getContext('2d');
    if (comparisonChartInstance) comparisonChartInstance.destroy();

    const plugins = {};
    const annotations = buildComparisonAnnotations(selectedIndex);
    if (Object.keys(annotations).length && typeof Chart !== 'undefined') {
        plugins.annotation = { annotations };
    }

    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: indexConfig.name,
                data: values,
                backgroundColor: bgColors,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                ...plugins
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } },
                x: { grid: { display: false }, ticks: { color: '#cbd5e1', maxRotation: 45 } }
            }
        }
    });
}

function updateTimeSeriesChart(appData) {
    if (!appData || appData.length === 0) return;

    const canvas = document.getElementById('timeSeriesChart');
    if (!canvas) return;

    const selectedIndex = document.getElementById('timeSeriesIndexSelect').value;
    const stationData = {};
    const datesSet = new Set();

    appData.forEach(r => {
        if (!stationData[r.stationName]) stationData[r.stationName] = [];
        const timeLabel = `${r.date} ${r.time}`;
        datesSet.add(timeLabel);
        stationData[r.stationName].push({
            timeLabel,
            val: getIndexValue(r, selectedIndex)
        });
    });

    const sortedDates = Array.from(datesSet).sort();
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    let cIdx = 0;

    const datasets = Object.keys(stationData).map(station => {
        const dataMap = {};
        stationData[station].forEach(d => { dataMap[d.timeLabel] = d.val; });
        const dataArr = sortedDates.map(date => dataMap[date] ?? null);
        const ds = {
            label: station,
            data: dataArr,
            borderColor: colors[cIdx % colors.length],
            backgroundColor: colors[cIdx % colors.length],
            tension: 0.1,
            fill: false,
            spanGaps: false
        };
        cIdx++;
        return ds;
    });

    const ctx = canvas.getContext('2d');
    if (timeSeriesChartInstance) timeSeriesChartInstance.destroy();

    timeSeriesChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: sortedDates, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#cbd5e1' } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } },
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } }
            }
        }
    });
}

Object.assign(window, {
    initCharts,
    updateComparisonChart,
    updateTimeSeriesChart,
    getChartInstances: () => ({ comparison: comparisonChartInstance, timeSeries: timeSeriesChartInstance })
});
