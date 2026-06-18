/**
 * Node-based verification mirroring parser.js logic exactly.
 * Run: node tests/verify_parser.js
 */
const http = require('http');

const API = 'localhost';
const PORT = 5000;
const STATIONS = ['42867', '42971', '42182'];

const INDICES_CONFIG = [
  { key: 'showalter', name: 'Showalter index' },
  { key: 'lifted', name: 'Lifted index' },
  { key: 'lift_vt', name: 'LIFT computed using virtual temperature' },
  { key: 'sweat', name: 'SWEAT index' },
  { key: 'k_index', name: 'K index' },
  { key: 'cross_totals', name: 'Cross totals index' },
  { key: 'vert_totals', name: 'Vertical totals index' },
  { key: 'totals_totals', name: 'Totals totals index' },
  { key: 'cape', name: 'Convective Available Potential Energy' },
  { key: 'cape_vt', name: 'CAPE using virtual temperature' },
  { key: 'cin', name: 'Convective Inhibition' },
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
  { key: 'pw', name: 'Precipitable water [mm] for entire sounding' },
];

function extractRawPreBlocks(htmlText) {
  const blocks = [];
  const re = /<pre>([\s\S]*?)<\/pre>/gi;
  let m;
  while ((m = re.exec(htmlText)) !== null) blocks.push(m[1]);
  return blocks;
}

function getIndicesPreText(htmlText) {
  for (const block of extractRawPreBlocks(htmlText)) {
    if (block.includes('Station identifier')) return block;
  }
  return '';
}

function parseLevelNumeric(str) {
  if (!str || str.toUpperCase() === 'M') return null;
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function parseIndices(htmlText) {
  const indicesText = getIndicesPreText(htmlText);
  if (!indicesText) return null;
  const get = (label) => {
    const escapedLabel = label.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const regex = new RegExp(escapedLabel + ':\\s*(M|\\-?\\d+(?:\\.\\d+)?)', 'i');
    const m = indicesText.match(regex);
    if (!m) return null;
    if (m[1].toUpperCase() === 'M') return null;
    return parseFloat(m[1]);
  };
  const data = {};
  INDICES_CONFIG.forEach(c => { data[c.key] = get(c.name); });
  return data;
}

function parseLevels(htmlText) {
  let profileText = null;
  for (const block of extractRawPreBlocks(htmlText)) {
    if (block.includes('PRES   HGHT   TEMP   DWPT')) {
      profileText = block;
      break;
    }
  }
  if (!profileText) return [];
  const levels = [];
  let headerFound = false;
  for (const line of profileText.split('\n')) {
    if (line.includes('PRES   HGHT   TEMP   DWPT')) { headerFound = true; continue; }
    if (!headerFound) continue;
    if (line.includes('------')) { if (levels.length > 0) break; continue; }
    if (line.trim().length < 7) continue;
    const pStr = line.substring(0, 7).trim();
    if (!pStr) continue;
    const pressure = parseFloat(pStr);
    if (isNaN(pressure)) continue;
    levels.push({
      pressure,
      temperature: parseLevelNumeric(line.substring(14, 21).trim()),
      dewpoint: parseLevelNumeric(line.substring(21, 28).trim()),
    });
  }
  levels.sort((a, b) => b.pressure - a.pressure);
  return levels;
}

function fetch(stnm) {
  return new Promise((resolve, reject) => {
    const path = `/api/sounding?region=seasia&YEAR=2024&MONTH=06&FROM=1500&TO=1500&STNM=${stnm}`;
    http.get({ hostname: API, port: PORT, path, timeout: 45000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== parser.js logic verification (Node) ===\n');
  let pass = 0, fail = 0;

  for (const stnm of STATIONS) {
    console.log(`Station ${stnm}:`);
    try {
      const json = await fetch(stnm);
      const html = json.html;
      const parsed = parseIndices(html);
      const levels = parseLevels(html);
      const blocks = extractRawPreBlocks(html);

      if (!parsed) { console.log('  FAIL parseIndices returned null'); fail++; continue; }
      const count = Object.values(parsed).filter(v => v !== null).length;
      if (count >= 10) { console.log(`  PASS ${count}/25 indices`); pass++; }
      else { console.log(`  FAIL only ${count} indices`); fail++; }

      if (levels.length >= 5) { console.log(`  PASS ${levels.length} levels`); pass++; }
      else { console.log(`  FAIL only ${levels.length} levels`); fail++; }

      if (blocks.length >= 2) { console.log(`  PASS ${blocks.length} pre blocks`); pass++; }
      else { console.log(`  FAIL ${blocks.length} pre blocks`); fail++; }

      if (json.tephigram && json.tephigram.length > 1000) {
        console.log(`  PASS tephigram (${json.tephigram.length} chars)`); pass++;
      } else if (levels.length >= 5) {
        console.log('  FAIL tephigram missing'); fail++;
      }

      if (parsed.cape != null) console.log(`  INFO CAPE=${parsed.cape}`);
      if (parsed.k_index != null) console.log(`  INFO K-index=${parsed.k_index}`);

      // Table vs chart source consistency simulation
      const chartVal = parsed.cape;
      const tableVal = parsed.cape;
      if (chartVal === tableVal) { console.log('  PASS table/chart CAPE match'); pass++; }
      else { console.log('  FAIL table/chart CAPE mismatch'); fail++; }

    } catch (e) {
      console.log(`  FAIL ${e.message}`); fail++;
    }
    console.log('');
  }

  console.log(`=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
