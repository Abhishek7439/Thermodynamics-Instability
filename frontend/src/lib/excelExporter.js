// ============================================================
// EXCEL EXPORTER — RMC Nagpur FMS
// Generates a 6-sheet workbook via SheetJS (xlsx)
// ============================================================

import * as XLSX from 'xlsx';
import { WARN_DETAILS } from '../constants/imdData';

/**
 * Apply warning-level cell fill colour to a cell style object.
 */
function warnStyle(level) {
  const map = {
    'Warning':    { fgColor: { rgb: 'FEE2E2' } },
    'Alert':      { fgColor: { rgb: 'FFEDD5' } },
    'Watch':      { fgColor: { rgb: 'FEFCE8' } },
    'No Warning': { fgColor: { rgb: 'F8FAFC' } },
  };
  return map[level] || map['No Warning'];
}

const HEADER_STYLE = {
  font:      { bold: true, color: { rgb: 'FFFFFF' } },
  fill:      { patternType: 'solid', fgColor: { rgb: '002F6C' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top:    { style: 'thin', color: { rgb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
    left:   { style: 'thin', color: { rgb: 'CCCCCC' } },
    right:  { style: 'thin', color: { rgb: 'CCCCCC' } },
  },
};

/**
 * Export all bulletin data to a 6-sheet Excel workbook.
 *
 * @param {string} date             - Issue date string (DD/MM/YYYY)
 * @param {object} forecastState    - Zustand store snapshot
 */
export function exportToExcel(date, forecastState) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Observations ──────────────────────────────────
  const obsData = Object.entries(forecastState.observations || {}).map(([stn, obs]) => ({
    'Station':          stn,
    'Max Temp (°C)':    obs.maxTemp  ?? '',
    'Max Dep':          obs.maxDep   ?? '',
    'Min Temp (°C)':    obs.minTemp  ?? '',
    'Min Dep':          obs.minDep   ?? '',
    'RH 0830 (%)':      obs.rh0830   ?? '',
    'RH 1730 (%)':      obs.rh1730   ?? '',
    'RF 24h (mm)':      obs.rf24     ?? '',
    'RF 9h (mm)':       obs.rf9      ?? '',
  }));
  const wsObs = XLSX.utils.json_to_sheet(obsData);
  wsObs['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsObs, 'Observations');

  // ── Sheet 2: RDWR Warnings ─────────────────────────────────
  const warnData = (forecastState.warnRows || []).map((row, i) => ({
    'Day':              `Day ${i + 1}`,
    'Warning Level':    row.warnLevel,
    'Distribution':     row.distribution,
    'Wind Speed':       row.speed,
    'Weather Types':    (row.weatherTypes || []).join(', '),
    'Regions':          (row.regions || []).join(', '),
    'Statement (EN)':   row.statement,
  }));
  const wsWarn = XLSX.utils.json_to_sheet(warnData);
  XLSX.utils.book_append_sheet(wb, wsWarn, 'RDWR Warnings');

  // ── Sheet 3: 7-Day Forecast Grid ───────────────────────────
  const grid = forecastState.forecastGrid || {};
  const gridRows = Object.entries(grid).map(([subDiv, days]) => ({
    'Sub-Division': subDiv,
    'Day 1': days[0] || '', 'Day 2': days[1] || '', 'Day 3': days[2] || '',
    'Day 4': days[3] || '', 'Day 5': days[4] || '', 'Day 6': days[5] || '',
    'Day 7': days[6] || '',
  }));
  const wsGrid = XLSX.utils.json_to_sheet(gridRows);
  XLSX.utils.book_append_sheet(wb, wsGrid, '7-Day Grid');

  // ── Sheet 4: District Forecast ─────────────────────────────
  const dfRows = [];
  Object.entries(forecastState.districtForecasts || {}).forEach(([district, days]) => {
    (days || []).forEach((day, di) => {
      dfRows.push({
        'District':    district,
        'Day':         `Day ${di + 1}`,
        'Rainfall':    day.rainfall  ?? '',
        'Intensity':   day.intensity ?? '',
        'Probability': day.probability ?? '',
        'Warn Level':  day.warnLevel ?? '',
        'Warn Text EN':day.warnTextEn ?? '',
        'Warn Text HI':day.warnTextHi ?? '',
        'Warn Text MR':day.warnTextMr ?? '',
      });
    });
  });
  const wsDf = XLSX.utils.json_to_sheet(dfRows);
  XLSX.utils.book_append_sheet(wb, wsDf, 'District Forecast');

  // ── Sheet 5: City Forecast ─────────────────────────────────
  const cfRows = [];
  Object.entries(forecastState.cityForecasts || {}).forEach(([district, days]) => {
    (days || []).forEach((day, di) => {
      cfRows.push({
        'District':    district,
        'Day':         `Day ${di + 1}`,
        'Weather':     day.weatherDesc ?? '',
        'Max Temp':    day.maxTemp ?? '',
        'Min Temp':    day.minTemp ?? '',
      });
    });
  });
  const wsCf = XLSX.utils.json_to_sheet(cfRows);
  XLSX.utils.book_append_sheet(wb, wsCf, 'City Forecast');

  // ── Sheet 6: IBF Entries ───────────────────────────────────
  const ibfData = (forecastState.ibfEntries || []).map(entry => ({
    'Date':            entry.date,
    'Warning Level':   entry.warnLevel,
    'Warn Text EN':    entry.warnTextEn,
    'Warn Text MR':    entry.warnTextMr,
    'Districts':       (entry.districts || []).join(', '),
    'Advisory':        entry.advisory,
  }));
  const wsIbf = XLSX.utils.json_to_sheet(ibfData);
  XLSX.utils.book_append_sheet(wb, wsIbf, 'IBF');

  // Save
  const safeDate = date.replace(/\//g, '-');
  XLSX.writeFile(wb, `RMC_FMS_${safeDate}.xlsx`);
}
