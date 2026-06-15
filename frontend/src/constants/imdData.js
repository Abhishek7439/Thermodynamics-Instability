// ============================================================
// IMD MASTER DATA CONSTANTS — RMC Nagpur FMS
// All values are official IMD terminology — do NOT modify
// ============================================================

// 11 Vidarbha Districts
export const DISTRICTS_11 = [
  'Nagpur', 'Wardha', 'Bhandara', 'Gondia', 'Chandrapur',
  'Gadchiroli', 'Amravati', 'Akola', 'Yavatmal', 'Buldhana', 'Washim',
];

// 12 Met Observation Stations (Press Bulletin)
export const STATIONS_12 = [
  'Akola', 'Amravati', 'Bhandara', 'Buldhana', 'Bramhapuri',
  'Chandrapur', 'Gadchiroli', 'Gondia', 'Nagpur', 'Wardha', 'Washim', 'Yavatmal',
];

// 4 Regional Met Sub-Divisions
export const SUB_DIVISIONS_4 = [
  'West Madhya Pradesh',
  'East Madhya Pradesh',
  'Vidarbha',
  'Chhattisgarh',
];

// Rainfall Distribution Codes
export const DIST_CODES = ['DRY', 'ISOL', 'SCT', 'FWS', 'WS'];

export const DIST_DETAILS = {
  DRY:  { label: 'DRY',  meaning: 'No Rain',                       pct: '—',       bg: '#e2e8f0', text: '#475569', border: '#cbd5e1' },
  ISOL: { label: 'ISOL', meaning: 'Isolated / One or two places',  pct: '1–25%',   bg: '#bae6fd', text: '#0c4a6e', border: '#7dd3fc' },
  SCT:  { label: 'SCT',  meaning: 'Scattered / A few places',      pct: '26–50%',  bg: '#bbf7d0', text: '#14532d', border: '#86efac' },
  FWS:  { label: 'FWS',  meaning: 'Fairly Widespread / Many places',pct: '51–75%', bg: '#4ade80', text: '#14532d', border: '#22c55e' },
  WS:   { label: 'WS',   meaning: 'Widespread / Most places',      pct: '76–100%', bg: '#166534', text: '#ffffff', border: '#15803d' },
};

// Distribution Phrases (for statement builder)
export const DIST_PHRASES = {
  ISOL: 'at one or two places',
  SCT:  'at a few places',
  FWS:  'at many places',
  WS:   'at most places',
  DRY:  '',
};

// Rainfall Intensity Thresholds
export const RAINFALL_INTENSITY = [
  { label: 'Very Light',          range: '0.1 – 2.4 mm'   },
  { label: 'Light',               range: '2.5 – 15.5 mm'  },
  { label: 'Moderate',            range: '15.6 – 64.4 mm' },
  { label: 'Heavy',               range: '64.5 – 115.5 mm'},
  { label: 'Very Heavy',          range: '115.6 – 204.4 mm'},
  { label: 'Extremely Heavy',     range: '≥ 204.5 mm'     },
  { label: 'Exceptionally Heavy', range: '>120 mm'         },
];

export const INTENSITY_LABELS = [
  'Very Light', 'Light', 'Moderate', 'Heavy', 'Very Heavy', 'Extremely Heavy',
];

// Warning Levels
export const WARN_LEVELS = ['Warning', 'Alert', 'Watch', 'No Warning'];

export const WARN_DETAILS = {
  'Warning':    { action: 'TAKE ACTION',  bg: '#fee2e2', border: '#dc2626', text: '#7f1d1d', icon: '🔴' },
  'Alert':      { action: 'BE PREPARED', bg: '#ffedd5', border: '#ea580c', text: '#7c2d12', icon: '🟠' },
  'Watch':      { action: 'BE UPDATED',  bg: '#fefce8', border: '#ca8a04', text: '#713f12', icon: '🟡' },
  'No Warning': { action: 'NO ACTION',   bg: '#f8fafc', border: '#cbd5e1', text: '#475569', icon: '🟢' },
};

// Probability of Occurrence
export const PROBABILITY_LABELS = ['Unlikely', 'Likely', 'Very Likely', 'Most Likely'];

export const PROBABILITY_DETAILS = {
  'Unlikely':    { range: '< 25%'   },
  'Likely':      { range: '25–50%'  },
  'Very Likely': { range: '50–75%'  },
  'Most Likely': { range: '> 75%'   },
};

// Temperature Departure Labels
export const DEPARTURE_LABELS = [
  'Appreciable Below Normal',
  'Below Normal',
  'Normal',
  'Above Normal',
  'Appreciable Above Normal',
];

// Weather Types (multi-select pills for RDWR Warnings)
export const WEATHER_TYPES = [
  'Thunderstorm', 'Rain', 'Lightning', 'Gusty Wind', 'Hail',
  'Fog', 'Cold Wave', 'Heatwave', 'Dust Storm',
];

// Regions (multi-select pills for RDWR Warnings)
export const REGIONS_4 = ['West MP', 'East MP', 'Vidarbha', 'Chhattisgarh'];

// Officer Designations
export const DESIGNATIONS = [
  "Meteorologist 'A'",
  "Meteorologist 'B'",
  'Scientist C',
  'Scientist D',
  'Director',
];

// Weather Description Options (City Forecast / Press Bulletin)
export const WEATHER_DESC_OPTIONS = [
  'Thunderstorm with rain',
  'Thunderstorm',
  'Partly cloudy sky',
  'Mainly clear sky',
  'Generally cloudy sky',
  'Heavy rain',
  'Light rain',
  'Fog',
  'Haze',
  'Cloudy sky',
  'Hot and humid',
  'Hot and dry',
  'Warm and humid',
  'Clear sky',
  'Mostly clear sky',
  'Light to moderate rain',
  'Moderate rain',
  'Very heavy rain',
];

// Weather Emoji Map
export const WEATHER_ICONS = {
  'Thunderstorm with rain':    '⛈️',
  'Thunderstorm':              '🌩️',
  'Partly cloudy sky':         '⛅',
  'Mainly clear sky':          '☀️',
  'Generally cloudy sky':      '☁️',
  'Heavy rain':                '🌧️',
  'Light rain':                '🌦️',
  'Fog':                       '🌫️',
  'Haze':                      '🌁',
  'Cloudy sky':                '☁️',
  'Hot and humid':             '🌡️',
  'Hot and dry':               '🌡️',
  'Warm and humid':            '🌤️',
  'Clear sky':                 '☀️',
  'Mostly clear sky':          '🌤️',
  'Light to moderate rain':    '🌦️',
  'Moderate rain':             '🌧️',
  'Very heavy rain':           '⛈️',
};

// Thunderstorm Damage Categories (IBF)
export const THUNDERSTORM_CATEGORIES = [
  { category: 'Light',        speed: '< 41 kmph',   action: 'None'                                   },
  { category: 'Moderate',     speed: '41–61 kmph',  action: 'Watch weather'                          },
  { category: 'Severe',       speed: '62–87 kmph',  action: 'Seek pukka shelter, stop farming'       },
  { category: 'Very Severe',  speed: '> 87 kmph',   action: 'Stay indoors, avoid water bodies'       },
  { category: 'With Hailstorm', speed: 'Any',       action: 'Seek pukka shelter'                     },
];

// Standard IBF Advisory Text (pre-loaded, editable)
export const STANDARD_IBF_ADVISORY = `• Wear protective clothing and seek indoor shelter.
• Stay away from windows and doors during heavy rain and strong winds.
• Avoid roadway underpasses, drainage ditches, low-lying areas and areas where water collects – they can unexpectedly flood or overflow.
• Avoid driving in heavy rain due to poor visibility. If possible, park and wait until rain has slowed or stopped to continue your journey.
• Do not try to drive across a flooded road. Water may be deeper and stronger than it appears and may contain debris, sharp or dangerous objects, pot holes or electrical wires.
• Stay away from power lines or electrical wires.
• Monitor alerts and weather reports for flash flood warnings and updates.`;

// =====================================================
// TRILINGUAL LOOKUP TABLE (EN → HI → MR)
// =====================================================
export const TRILINGUAL = {
  distribution: {
    'ISOL': { en: 'at one or two places',    hi: 'एक-दो स्थान पर',       mr: 'तुरळक' },
    'SCT':  { en: 'at a few places',         hi: 'कुछ स्थानों पर',       mr: 'विरळ'  },
    'FWS':  { en: 'at many places',          hi: 'बहुत स्थानों पर',      mr: 'बहुदा सर्वत्र' },
    'WS':   { en: 'at most places',          hi: 'अधिकांश स्थानों पर',   mr: 'सर्वत्र' },
    'DRY':  { en: 'Dry',                     hi: 'शुष्क',               mr: 'कोरडे'  },
  },
  intensity: {
    'Light':                { en: 'Light',          hi: 'हल्की',           mr: 'हलका'           },
    'Light to Moderate':    { en: 'Light to Moderate', hi: 'हल्की से मध्यम', mr: 'हल्का ते मध्यम' },
    'Moderate':             { en: 'Moderate',       hi: 'मध्यम',           mr: 'मध्यम'          },
    'Heavy':                { en: 'Heavy',          hi: 'भारी',            mr: 'जोरदार'         },
    'Very Heavy':           { en: 'Very Heavy',     hi: 'बहुत भारी',       mr: 'खूप जोरदार'     },
  },
  warnLevel: {
    'No Warning': { en: 'No Warning',  hi: 'कोई चेतावनी नहीं',   mr: 'चेतावणी नाही' },
    'Warning':    { en: 'Warning',     hi: 'चेतावनी',            mr: 'चेतावणी'      },
    'Alert':      { en: 'Alert',       hi: 'सतर्क रहें',         mr: 'सतर्क राहा'   },
    'Watch':      { en: 'Watch',       hi: 'निगरानी रखें',       mr: 'निगराणी ठेवा' },
  },
  weather: {
    'Thunderstorm with lightning': { en: 'Thunderstorm with lightning', hi: 'गरज-चमक', mr: 'विजांच्या कडकडाटासह वादळ' },
    'Gusty winds':                 { en: 'Gusty winds',                 hi: 'तेज़ हवाओं', mr: 'सोसाट्याचा वारा' },
  },
};

// =====================================================
// PDF / REPORT METADATA
// =====================================================
export const REPORT_TYPES = [
  { value: 'RDWR',        label: 'Regional Daily Weather Report',                       color: '#0057b7', bg: '#dbeafe' },
  { value: 'DWF',         label: 'Districtwise Forecast & Warning',                     color: '#0057b7', bg: '#dbeafe' },
  { value: 'Press',       label: 'Press Bulletin',                                       color: '#1e293b', bg: '#f1f5f9' },
  { value: 'IBF',         label: 'Impact Based Forecast',                               color: '#7f1d1d', bg: '#fee2e2' },
  { value: 'CWF',         label: 'City Weather Forecast',                               color: '#0057b7', bg: '#dbeafe' },
];

// Standard Outlook Text (editable)
export const STANDARD_OUTLOOK = 'LIGHT TO MODERATE RAINFALL WITH THUNDERSTORM AND LIGHTNING AND GUSTY WINDS PREVAILS OVER THE REGION.';

// RMC Nagpur Contact Info
export const RMC_INFO = {
  nameEn: 'Regional Meteorological Centre, Nagpur',
  nameHi: 'प्रादेशिक मौसम केंद्र, नागपुर',
  deptEn: 'India Meteorological Department',
  deptHi: 'भारत मौसम विज्ञान विभाग',
  moesEn: 'Ministry of Earth Sciences',
  moesHi: 'पृथ्वी विज्ञान मंत्रालय',
  goiEn:  'Government of India',
  goiHi:  'भारत सरकार',
  address: 'DBAI Airport, Nagpur-440005 (MH)',
  tel: '+91-712-2282157, 2295857 (AMO) | 2288544 (RWFC)',
  email: 'rwfc.nagpur@imd.gov.in',
};
