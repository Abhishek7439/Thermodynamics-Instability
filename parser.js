const INDICES_CONFIG = [
  { key: 'showalter', name: 'Showalter index', evaluate: v => v > 3 ? 'stable' : (v >= 0 ? 'moderate' : 'unstable') },
  { key: 'lifted', name: 'Lifted index', evaluate: v => v > 0 ? 'stable' : (v >= -3 ? 'moderate' : 'unstable') },
  { key: 'lift_vt', name: 'LIFT computed using virtual temperature' },
  { key: 'sweat', name: 'SWEAT index', evaluate: v => v < 150 ? 'stable' : (v <= 300 ? 'moderate' : 'unstable') },
  { key: 'k_index', name: 'K index', evaluate: v => v < 20 ? 'stable' : (v < 30 ? 'moderate' : 'unstable') },
  { key: 'cross_totals', name: 'Cross totals index' },
  { key: 'vert_totals', name: 'Vertical totals index' },
  { key: 'totals_totals', name: 'Totals totals index', evaluate: v => v < 44 ? 'stable' : (v <= 50 ? 'moderate' : 'unstable') },
  { key: 'cape', name: 'Convective Available Potential Energy', evaluate: v => v < 300 ? 'stable' : (v <= 2500 ? 'moderate' : 'unstable') },
  { key: 'cape_vt', name: 'CAPE using virtual temperature' },
  { key: 'cin', name: 'Convective Inhibition', evaluate: v => v > -50 ? 'stable' : (v >= -200 ? 'moderate' : 'unstable') },
  { key: 'cins_vt', name: 'CINS using virtual temperature' },
  { key: 'eq_level', name: 'Equilibrum Level' },
  { key: 'eq_level_vt', name: 'Equilibrum Level using virtual temperature' },
  { key: 'lfc', name: 'Level of Free Convection' },
  { key: 'lfct_vt', name: 'LFCT using virtual temperature' },
  { key: 'brn', name: 'Bulk Richardson Number' },
  { key: 'brn_capv', name: 'Bulk Richardson Number using CAPV' },
  { key: 'lcl_temp', name: 'Temp [K] of the Lifted Condensation Level' },
  { key: 'lcl_pres', name: 'Pres [hPa] of the Lifted Condensation Level' },
  { key: 'lcl_theta_e', name: 'Equivalent potential temp [K] of the LCL' },
  { key: 'ml_theta', name: 'Mean mixed layer potential temperature' },
  { key: 'ml_mixr', name: 'Mean mixed layer mixing ratio' },
  { key: 'thickness', name: '1000 hPa to 500 hPa thickness' },
  { key: 'pw', name: 'Precipitable water [mm] for entire sounding', evaluate: v => v < 30 ? 'stable' : (v <= 50 ? 'moderate' : 'unstable') }
];

function getSeverityClass(key, value) {
    if (value === null || value === undefined || isNaN(value)) return 'nodata';
    const config = INDICES_CONFIG.find(c => c.key === key);
    if (config && config.evaluate) {
        return config.evaluate(value);
    }
    return ''; // default if no eval rules
}

function parseIndices(htmlText) {
  const preMatch = htmlText.match(/<pre>([\s\S]*?)<\/pre>/gi);
  let indicesText = '';
  for (const block of preMatch || []) {
    if (block.includes('Station identifier')) {
      indicesText = block;
      break;
    }
  }

  if (!indicesText) return null; // Parse failed or no data

  const get = (label) => {
    // Escape brackets for regex
    const escapedLabel = label.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const regex = new RegExp(escapedLabel + ':\\s*([\\-\\d\\.]+)', 'i');
    const m = indicesText.match(regex);
    return m ? parseFloat(m[1]) : null;
  };

  const data = {
    station_id:     (indicesText.match(/Station identifier:\s*(\S+)/i) || [])[1] || 'N/A',
    station_num:    get('Station number'),
    obs_time:       (indicesText.match(/Observation time:\s*([^\n]+)/i) || [])[1] || 'N/A',
    latitude:       get('Station latitude'),
    longitude:      get('Station longitude'),
    elevation:      get('Station elevation'),
  };

  INDICES_CONFIG.forEach(c => {
      data[c.key] = get(c.name);
  });

  return data;
}

/**
 * Parse per-level atmospheric profile data from Wyoming sounding HTML.
 *
 * The Wyoming TEXT:LIST output contains two <pre> blocks:
 *   1. The first block has the columnar data table with headers:
 *      PRES  HGHT  TEMP  DWPT  RELH  MIXR  DRCT  SKNT  THTA  THTE  THTV
 *   2. The second block has "Station identifier:" and the 25 indices.
 *
 * Column positions (fixed-width, matching backend server.py parse_profile):
 *   PRES: 0–7,  HGHT: 7–14,  TEMP: 14–21,  DWPT: 21–28,
 *   RELH: 28–35, MIXR: 35–42, DRCT: 42–49, SKNT: 49–56
 *
 * Returns an array of level objects sorted by descending pressure (surface first).
 * Missing values are stored as null so the diagram can skip them gracefully.
 */
function parseLevels(htmlText) {
    // Grab all <pre> blocks
    const preBlocks = htmlText.match(/<pre>([\s\S]*?)<\/pre>/gi);
    if (!preBlocks || preBlocks.length === 0) return [];

    // Find the block that contains the columnar profile header
    let profileText = null;
    for (const block of preBlocks) {
        if (block.includes('PRES   HGHT   TEMP   DWPT')) {
            // Strip the <pre> tags
            profileText = block.replace(/<\/?pre>/gi, '');
            break;
        }
    }
    if (!profileText) return [];

    const lines = profileText.split('\n');
    const levels = [];
    let headerFound = false;

    for (const line of lines) {
        // Detect the header row to start parsing after it
        if (line.includes('PRES   HGHT   TEMP   DWPT')) {
            headerFound = true;
            continue;
        }

        if (!headerFound) continue;

        // Skip dashes separator line
        if (line.includes('------')) {
            // If we already have data, a second separator means end of data
            if (levels.length > 0) break;
            continue;
        }

        // Skip blank or very short lines
        if (line.trim().length < 7) continue;

        // Fixed-width column extraction (same offsets as backend parse_profile)
        const pStr    = line.substring(0, 7).trim();
        const hStr    = line.substring(7, 14).trim();
        const tStr    = line.substring(14, 21).trim();
        const tdStr   = line.substring(21, 28).trim();
        // RELH and MIXR at 28–42 are skipped for now
        const drctStr = line.substring(42, 49).trim();
        const skntStr = line.substring(49, 56).trim();

        // Pressure is required — skip lines without it
        if (!pStr) continue;
        const pressure = parseFloat(pStr);
        if (isNaN(pressure)) continue;

        levels.push({
            pressure:      pressure,
            height:        hStr  ? parseFloat(hStr)    : null,
            temperature:   tStr  ? parseFloat(tStr)    : null,
            dewpoint:      tdStr ? parseFloat(tdStr)   : null,
            windDirection: drctStr ? parseFloat(drctStr) : null,
            windSpeed:     skntStr ? parseFloat(skntStr) : null
        });

        // Replace any NaN that slipped through parseFloat on garbage strings
        const lvl = levels[levels.length - 1];
        for (const k of ['height', 'temperature', 'dewpoint', 'windDirection', 'windSpeed']) {
            if (lvl[k] !== null && isNaN(lvl[k])) lvl[k] = null;
        }
    }

    // Sort by descending pressure (surface / highest pressure first)
    levels.sort((a, b) => b.pressure - a.pressure);
    return levels;
}
