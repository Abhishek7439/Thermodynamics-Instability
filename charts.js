let comparisonChartInstance = null;
let timeSeriesChartInstance = null;

function initCharts() {
    // Populate select dropdowns
    const compareSelect = document.getElementById('compareIndexSelect');
    const tsSelect = document.getElementById('timeSeriesIndexSelect');
    
    INDICES_CONFIG.forEach(c => {
        const opt1 = document.createElement('option');
        opt1.value = c.key;
        opt1.textContent = c.name;
        compareSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = c.key;
        opt2.textContent = c.name;
        tsSelect.appendChild(opt2);
    });

    // Event listeners to redraw when selection changes
    compareSelect.addEventListener('change', () => updateComparisonChart(window.appData));
    tsSelect.addEventListener('change', () => updateTimeSeriesChart(window.appData));
}

function updateComparisonChart(appData) {
    if (!appData || appData.length === 0) return;

    const selectedIndex = document.getElementById('compareIndexSelect').value;
    const indexConfig = INDICES_CONFIG.find(c => c.key === selectedIndex);

    const labels = [];
    const values = [];
    const bgColors = [];

    appData.forEach(record => {
        // Just take the first available data point per station for the comparison chart 
        // to avoid crowding. Or if we want all, we can label them "Station (Date Time)"
        const label = `${record.stationName} (${record.date} ${record.time})`;
        const val = record.parsedData[selectedIndex];
        
        labels.push(label);
        const validVal = val !== null && val !== undefined && !isNaN(val) ? val : null;
        values.push(validVal);

        const severity = getSeverityClass(selectedIndex, val);
        if (severity === 'stable') bgColors.push('#4ade80');
        else if (severity === 'moderate') bgColors.push('#fbbf24');
        else if (severity === 'unstable') bgColors.push('#f87171');
        else bgColors.push('rgba(148, 163, 184, 0.5)'); // no data or uncolored
    });

    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChartInstance) comparisonChartInstance.destroy();

    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
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
                legend: { display: false }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } },
                x: { grid: { display: false }, ticks: { color: '#cbd5e1' } }
            }
        }
    });
}

function updateTimeSeriesChart(appData) {
    if (!appData || appData.length === 0) return;

    const selectedIndex = document.getElementById('timeSeriesIndexSelect').value;
    const indexConfig = INDICES_CONFIG.find(c => c.key === selectedIndex);

    // Group data by station
    const stationData = {};
    const datesSet = new Set();

    appData.forEach(r => {
        if (!stationData[r.stationName]) {
            stationData[r.stationName] = [];
        }
        const timeLabel = `${r.date} ${r.time}`;
        datesSet.add(timeLabel);
        stationData[r.stationName].push({
            timeLabel: timeLabel,
            val: r.parsedData[selectedIndex]
        });
    });

    const sortedDates = Array.from(datesSet).sort();

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    let cIdx = 0;

    const datasets = Object.keys(stationData).map(station => {
        // Align values to sortedDates
        const dataMap = {};
        stationData[station].forEach(d => { dataMap[d.timeLabel] = d.val; });
        const dataArr = sortedDates.map(date => {
            const v = dataMap[date];
            return v !== undefined && v !== null && !isNaN(v) ? v : null;
        });

        const ds = {
            label: station,
            data: dataArr,
            borderColor: colors[cIdx % colors.length],
            backgroundColor: colors[cIdx % colors.length],
            tension: 0.1,
            fill: false
        };
        cIdx++;
        return ds;
    });

    const ctx = document.getElementById('timeSeriesChart').getContext('2d');

    if (timeSeriesChartInstance) timeSeriesChartInstance.destroy();

    timeSeriesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#cbd5e1' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } },
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#cbd5e1' } }
            }
        }
    });
}
