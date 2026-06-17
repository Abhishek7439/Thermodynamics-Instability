function getSeverityColorHex(severity) {
    if (severity === 'stable') return '90EE90'; // Light Green
    if (severity === 'moderate') return 'FFD580'; // Light Orange
    if (severity === 'unstable') return 'FF9999'; // Light Red
    return null;
}

function exportToExcel(appData, startDateStr, endDateStr) {
    if (!appData || appData.length === 0) return;

    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    // Columns: Station Name, Station Number, Date, Time (UTC), + all 25 indices
    const summaryHeader = ['Station Name', 'Station Number', 'Date', 'Time (UTC)', ...INDICES_CONFIG.map(c => c.name)];
    
    const summaryData = [summaryHeader];

    appData.forEach(row => {
        const rowData = [
            row.stationName,
            row.stationNum,
            row.date,
            row.time,
            ...INDICES_CONFIG.map(c => {
                const val = row.parsedData[c.key];
                return (val !== null && val !== undefined && !isNaN(val)) ? val : '—';
            })
        ];
        summaryData.push(rowData);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);

    // Apply colors to summary sheet (starting from row index 1 to skip header, col index 4)
    appData.forEach((row, rIdx) => {
        INDICES_CONFIG.forEach((c, cIdx) => {
            const val = row.parsedData[c.key];
            const severity = getSeverityClass(c.key, val);
            const color = getSeverityColorHex(severity);

            if (color) {
                const cellAddress = XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx + 4 });
                if (!summaryWs[cellAddress]) return;
                summaryWs[cellAddress].s = {
                    fill: { fgColor: { rgb: color } }
                };
            }
        });
    });

    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // 2. Station Sheets
    // Group by station
    const stationDataMap = {};
    appData.forEach(row => {
        if (!stationDataMap[row.stationName]) stationDataMap[row.stationName] = [];
        stationDataMap[row.stationName].push(row);
    });

    Object.keys(stationDataMap).forEach(stationName => {
        const sData = stationDataMap[stationName];
        const sHeader = ['Date', 'Time (UTC)', ...INDICES_CONFIG.map(c => c.name)];
        const sRows = [sHeader];

        sData.forEach(row => {
            sRows.push([
                row.date,
                row.time,
                ...INDICES_CONFIG.map(c => {
                    const val = row.parsedData[c.key];
                    return (val !== null && val !== undefined && !isNaN(val)) ? val : '—';
                })
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sRows);

        sData.forEach((row, rIdx) => {
            INDICES_CONFIG.forEach((c, cIdx) => {
                const val = row.parsedData[c.key];
                const severity = getSeverityClass(c.key, val);
                const color = getSeverityColorHex(severity);

                if (color) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx + 2 });
                    if (!ws[cellAddress]) return;
                    ws[cellAddress].s = {
                        fill: { fgColor: { rgb: color } }
                    };
                }
            });
        });

        // Ensure valid sheet name
        let validSheetName = stationName.replace(/[\[\]\*\\\/\?]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, validSheetName);
    });

    // Write file
    const fileName = `ThermodynamicInstability_${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(wb, fileName);
}
