window.appData = []; // Store fetched data globally for charts/export

document.addEventListener('DOMContentLoaded', () => {
    // Populate Year Dropdown
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1973; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    // Populate From and To Dropdowns
    const fromSelect = document.getElementById('fromSelect');
    const toSelect = document.getElementById('toSelect');
    for (let d = 1; d <= 31; d++) {
        const dayStr = d.toString().padStart(2, '0');
        ['00', '12'].forEach(hour => {
            const val = `${dayStr}${hour}`;
            const text = `${dayStr}/${hour}Z`;
            fromSelect.add(new Option(text, val));
            toSelect.add(new Option(text, val));
        });
    }

    // Set default To and From to today's date at 00Z
    const todayStr = new Date().getDate().toString().padStart(2, '0');
    fromSelect.value = `${todayStr}00`;
    toSelect.value = `${todayStr}00`;
    
    // Set default month to current
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    document.getElementById('monthSelect').value = currentMonth;

    // Populate Stations Dropdown
    const stationSelect = document.getElementById('stationInput');
    if (typeof targetStations !== 'undefined') {
        targetStations.forEach(s => {
            stationSelect.add(new Option(`${s.name} (${s.number})`, s.number));
        });
    }

    // Map Click Listener
    document.querySelectorAll('map[name="raob"] area').forEach(area => {
        area.addEventListener('click', (e) => {
            e.preventDefault();
            const stnm = area.getAttribute('data-stnm');
            if(stnm) {
                let exists = Array.from(stationSelect.options).some(opt => opt.value === stnm);
                if (!exists) {
                    const title = area.getAttribute('title') || `Station ${stnm}`;
                    stationSelect.add(new Option(title, stnm));
                }
                // When clicking map, we usually want to just fetch this station
                Array.from(stationSelect.options).forEach(opt => opt.selected = false);
                Array.from(stationSelect.options).find(o => o.value === stnm).selected = true;
                startFetch();
            }
        });
    });

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            
            // Re-render charts to fix canvas resize issues
            if (btn.dataset.target === 'chartView') {
                updateComparisonChart(window.appData);
                updateTimeSeriesChart(window.appData);
            }

            // Render Skew-T diagram when its tab is selected
            if (btn.dataset.target === 'diagramView' && typeof initSkewTView === 'function') {
                initSkewTView(window.appData);
            }
        });
    });

    // Initialize Charts Dropdowns
    if(typeof initCharts === 'function') initCharts();

    // Fetch Data
    document.getElementById('fetchBtn').addEventListener('click', startFetch);

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
        const fromDate = document.getElementById('yearSelect').value + '-' + document.getElementById('monthSelect').value + '-' + document.getElementById('fromSelect').value.substring(0,2);
        if(typeof exportToExcel === 'function') exportToExcel(window.appData, fromDate, fromDate);
    });

    // Report
    const reportBtn = document.getElementById('reportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            window.print();
        });
    }
});

function updateSelectedText() {
    const checked = document.querySelectorAll('#stationList input:checked').length;
    document.getElementById('selectedStationsText').textContent = `${checked} Selected`;
}

function getDatesInRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

function getTimesInRange(fromStr, toStr) {
    const startDay = parseInt(fromStr.substring(0,2), 10);
    const startHour = fromStr.substring(2,4);
    const endDay = parseInt(toStr.substring(0,2), 10);
    const endHour = toStr.substring(2,4);
    
    const times = [];
    for(let d = startDay; d <= endDay; d++) {
        const ds = d.toString().padStart(2, '0');
        ['00', '12'].forEach(h => {
            if (d === startDay && h < startHour) return;
            if (d === endDay && h > endHour) return;
            times.push(`${ds}${h}`);
        });
    }
    return times;
}

async function startFetch() {
    const region = document.getElementById('regionSelect').value;
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    const fromTime = document.getElementById('fromSelect').value;
    const toTime = document.getElementById('toSelect').value;
    
    const stationSelect = document.getElementById('stationInput');
    const selectedOptions = Array.from(stationSelect.selectedOptions);
    
    if (selectedOptions.length === 0) {
        alert("Please select at least one Station from the list or click on the map.");
        return;
    }

    const fetchBtn = document.getElementById('fetchBtn');
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
    document.getElementById('exportBtn').disabled = true;

    window.appData = [];
    
    // Clear and prepare UI
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    const tephigramGrid = document.getElementById('tephigramGrid');
    if (tephigramGrid) tephigramGrid.innerHTML = '';
    const rawDataContainer = document.getElementById('rawDataContainer');
    if (rawDataContainer) rawDataContainer.innerHTML = '<p style="color: var(--text-secondary);">Fetching data...</p>';
    
    const statusSection = document.getElementById('statusSection');
    statusSection.innerHTML = '';

    const timeList = getTimesInRange(fromTime, toTime);
    const promises = [];

    for (let opt of selectedOptions) {
        const stNumber = opt.value;
        const stName = opt.text; // contains Name (Number)
        
        for (let t of timeList) {
            promises.push(fetchSingleSounding(region, year, month, t, t, stNumber, stName));
        }
    }

    await Promise.allSettled(promises);

    renderTable();
    if(typeof updateComparisonChart === 'function') updateComparisonChart(window.appData);
    if(typeof updateTimeSeriesChart === 'function') updateTimeSeriesChart(window.appData);

    fetchBtn.disabled = false;
    fetchBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Fetch Data';
    document.getElementById('exportBtn').disabled = false;
    if (document.getElementById('reportBtn')) document.getElementById('reportBtn').disabled = false;
}

async function fetchSingleSounding(region, year, month, fromTime, toTime, stNumber, stName) {
    const card = document.createElement('div');
    card.className = 'glass-panel status-card loading';
    card.innerHTML = `
        <h3>${stName}</h3>
        <p><span>Time: ${fromTime}Z</span> <span class="status-text" style="color: var(--text-secondary)">Fetching...</span></p>
    `;
    document.getElementById('statusSection').appendChild(card);

    const url = `http://localhost:5000/api/sounding?region=${region}&YEAR=${year}&MONTH=${month}&FROM=${fromTime}&TO=${toTime}&STNM=${stNumber}`;

    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(resp.status === 404 ? "No data available" : "HTTP error " + resp.status);
        }
        const json = await resp.json();
        const htmlText = json.html;
        
        const parsed = parseIndices(htmlText);
        const levelData = parseLevels(htmlText);

        const rawDataContainer = document.getElementById('rawDataContainer');
        if (rawDataContainer) {
            const div = document.createElement('div');
            div.innerHTML = `<h4>${stName} at ${fromTime}Z</h4>` + htmlText + '<hr>';
            if (rawDataContainer.querySelector('p')) rawDataContainer.innerHTML = ''; // clear initial fetching text
            rawDataContainer.appendChild(div);
        }

        window.appData.push({
            stationName: stName,
            stationNum: stNumber,
            date: `${year}-${month}-${fromTime.substring(0,2)}`,
            time: fromTime.substring(2,4),
            parsedData: parsed || {},
            levelData: levelData
        });

        card.className = parsed ? 'glass-panel status-card success' : 'glass-panel status-card error';
        card.querySelector('.status-text').textContent = parsed ? 'Success' : 'No Data';

        if (parsed && json.tephigram) {
            const tephigramGrid = document.getElementById('tephigramGrid');
            const tCard = document.createElement('div');
            tCard.className = 'tephigram-card';
            tCard.innerHTML = `
                <div class="tephigram-card-header">${stName} (${fromTime}Z)</div>
                <div class="tephigram-img-container">
                    <img src="data:image/png;base64,${json.tephigram}" alt="Tephigram ${stNumber}">
                </div>
                <textarea class="forecaster-notes" placeholder="Forecaster Notes / Inferences for ${stName}..."></textarea>
            `;
            if (tephigramGrid) tephigramGrid.appendChild(tCard);
        }

    } catch (e) {
        window.appData.push({
            stationName: stName,
            stationNum: stNumber,
            date: `${year}-${month}-${fromTime.substring(0,2)}`,
            time: fromTime.substring(2,4),
            parsedData: {},
            levelData: []
        });
        card.className = 'glass-panel status-card error';
        card.querySelector('.status-text').textContent = 'No Data / Error';
        console.error("Fetch error", e);
    }
}

function renderTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    // Headers
    tableHeader.innerHTML = '<th>Index</th>';
    window.appData.forEach(r => {
        const th = document.createElement('th');
        th.textContent = `${r.stationName} (${r.date} ${r.time}Z)`;
        tableHeader.appendChild(th);
    });

    // Rows
    tableBody.innerHTML = '';
    INDICES_CONFIG.forEach(c => {
        const tr = document.createElement('tr');
        
        const tdLabel = document.createElement('td');
        tdLabel.textContent = c.name;
        tr.appendChild(tdLabel);

        window.appData.forEach(r => {
            const td = document.createElement('td');
            const val = r.parsedData[c.key];
            if (val === null || val === undefined || isNaN(val)) {
                td.textContent = '—';
                td.className = 'val-nodata';
            } else {
                td.textContent = val;
                const severity = getSeverityClass(c.key, val);
                if (severity) td.classList.add('val-' + severity);
            }
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}
