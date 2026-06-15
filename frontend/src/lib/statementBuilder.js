// ============================================================
// IMD WARNING STATEMENT BUILDER — RMC Nagpur FMS
// Produces exact IMD-format UPPERCASE warning statements
// based on inputs from officer dropdowns.
// ============================================================

import { DIST_PHRASES } from '../constants/imdData';

/**
 * Build an IMD-format warning statement.
 *
 * @param {object} params
 * @param {string} params.warnLevel       - 'Warning' | 'Alert' | 'Watch' | 'No Warning'
 * @param {string} params.distribution    - 'ISOL' | 'SCT' | 'FWS' | 'WS' | 'DRY'
 * @param {string} params.speed           - e.g. '40-50 kmph'
 * @param {string[]} params.districts     - array of district names (empty = all Vidarbha)
 * @param {string[]} params.weatherTypes  - array: ['Thunderstorm','Rain','Lightning','Gusty Wind','Hail',...]
 * @param {string[]} params.regions       - array: ['West MP', 'East MP', 'Vidarbha', 'Chhattisgarh']
 * @returns {string}  The assembled statement in UPPERCASE
 */
export function buildWarningStatement({ warnLevel, distribution, speed, districts = [], weatherTypes = [], regions = [] }) {
  if (warnLevel === 'No Warning') return 'NO WARNING';
  if (!distribution || distribution === 'DRY') return 'NO WARNING';

  const distPhrase = DIST_PHRASES[distribution] || 'at isolated places';
  const speedStr   = speed ? speed.trim() : '40-50 KMPH';
  const hasHail    = weatherTypes.includes('Hail');
  const hasHeavy   = weatherTypes.includes('Rain') && (weatherTypes.includes('Heavy') || weatherTypes.some(w => w.toLowerCase().includes('heavy')));

  // Build region/district string
  let locationStr = '';
  if (districts && districts.length > 0 && districts.length <= 5) {
    locationStr = `OVER ${districts.join(', ')} DISTRICTS OF VIDARBHA`;
  } else if (regions && regions.length > 0) {
    locationStr = `OVER ${regions.join(', ').toUpperCase()}`;
  } else {
    locationStr = 'OVER VIDARBHA';
  }

  // Parse wind speed to determine pattern
  const speedNums = speedStr.match(/\d+/g)?.map(Number) || [40];
  const maxSpeed  = Math.max(...speedNums);

  let statement = '';

  if (hasHail) {
    // Pattern E — Hailstorm
    statement = `THUNDERSTORM ASSOCIATED WITH HAILSTORM LIKELY ${distPhrase.toUpperCase()} ${locationStr}`;
  } else if (maxSpeed > 87) {
    // Pattern D — Very Severe
    statement = `VERY SEVERE THUNDERSTORM WITH LIGHTNING AND GUSTY WINDS (SPEED REACHING ${speedStr.toUpperCase()}) LIKELY ${distPhrase.toUpperCase()} ${locationStr}`;
  } else if (hasHeavy) {
    // Pattern C — Heavy Rainfall
    statement = `HEAVY RAINFALL WITH THUNDERSTORM, LIGHTNING & GUSTY WINDS (SPEED REACHING ${speedStr.toUpperCase()}) LIKELY ${distPhrase.toUpperCase()} ${locationStr}`;
  } else if (maxSpeed >= 50) {
    // Pattern B — 50-60 kmph, SCT
    statement = `THUNDERSTORM AND LIGHTNING ACCOMPANIED WITH GUSTY WINDS (SPEED REACHING ${speedStr.toUpperCase()}) LIKELY TO OCCUR ${distPhrase.toUpperCase()} ${locationStr}`;
  } else {
    // Pattern A — 40-50 kmph, ISOL/SCT
    statement = `THUNDERSTORM WITH LIGHTNING AND GUSTY WINDS (SPEED REACHING ${speedStr.toUpperCase()}) ${distPhrase.toUpperCase()} ${locationStr}`;
  }

  // Append warning level qualifier
  const levelMap = {
    'Warning': 'ACTION REQUIRED',
    'Alert':   'BE PREPARED',
    'Watch':   'BE UPDATED',
  };

  return statement.toUpperCase();
}

/**
 * Generate Marathi warning statement from English inputs
 * using the trilingual lookup table.
 */
export function buildMarathiStatement({ warnLevel, distribution, speed, districts = [] }) {
  if (warnLevel === 'No Warning') return 'चेतावणी नाही';
  if (!distribution || distribution === 'DRY') return 'चेतावणी नाही';

  const distMap = {
    ISOL: 'तुरळक ठिकाणी',
    SCT:  'काही ठिकाणी',
    FWS:  'बहुतांश ठिकाणी',
    WS:   'सर्वत्र',
  };

  const distPhraseMr = distMap[distribution] || 'तुरळक ठिकाणी';
  const speedStr = speed ? speed.trim() : '40-50 kmph';

  let locStr = '';
  if (districts.length > 0 && districts.length <= 5) {
    locStr = `विदर्भाच्या ${districts.join(', ')} जिल्ह्यांमध्ये`;
  } else {
    locStr = 'विदर्भात';
  }

  return `विजांच्या कडकडाटासह वादळ आणि सोसाट्याचा वारा (वेग ${speedStr}) ${distPhraseMr} ${locStr} होण्याची शक्यता आहे.`;
}

/**
 * Generate Hindi warning statement from English inputs.
 */
export function buildHindiStatement({ warnLevel, distribution, speed, districts = [] }) {
  if (warnLevel === 'No Warning') return 'कोई चेतावनी नहीं';
  if (!distribution || distribution === 'DRY') return 'कोई चेतावनी नहीं';

  const distMap = {
    ISOL: 'एक-दो स्थानों पर',
    SCT:  'कुछ स्थानों पर',
    FWS:  'बहुत स्थानों पर',
    WS:   'अधिकांश स्थानों पर',
  };

  const distPhraseHi = distMap[distribution] || 'एक-दो स्थानों पर';
  const speedStr = speed ? speed.trim() : '40-50 kmph';

  let locStr = '';
  if (districts.length > 0 && districts.length <= 5) {
    locStr = `विदर्भ के ${districts.join(', ')} जिलों में`;
  } else {
    locStr = 'विदर्भ में';
  }

  return `गरज-चमक के साथ तेज़ हवाओं (गति ${speedStr}) की संभावना ${distPhraseHi} ${locStr}.`;
}
