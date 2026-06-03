const fs = require('fs');
const path = './frontend/src/data/weatherData.js';
let content = fs.readFileSync(path, 'utf8');

const newWeatherData = `export const weatherData = [
  // VIDARBHA REGION (Exact official data from screenshot)
  { id: 1, city: 'Akola', region: 'Vidarbha Region', maxTemp: 41.0, maxChange24h: -1.5, maxDeparture: -0.8, minTemp: 30.0, minChange24h: 5.8, minDeparture: 1.5, humidityMorning: 52, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 2, city: 'Amravati', region: 'Vidarbha Region', maxTemp: 38.8, maxChange24h: -2.4, maxDeparture: -1.5, minTemp: 24.4, minChange24h: 1.1, minDeparture: -0.8, humidityMorning: 51, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 3, city: 'Bhandara', region: 'Vidarbha Region', maxTemp: 41.0, maxChange24h: 0.2, maxDeparture: null, minTemp: 26.0, minChange24h: 0, minDeparture: null, humidityMorning: 58, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 4, city: 'Buldana', region: 'Vidarbha Region', maxTemp: 39.5, maxChange24h: -0.5, maxDeparture: 1.4, minTemp: 26.6, minChange24h: 1.6, minDeparture: 0.7, humidityMorning: 61, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 5, city: 'Brahmpuri', region: 'Vidarbha Region', maxTemp: 42.0, maxChange24h: -1.3, maxDeparture: -0.9, minTemp: 26.1, minChange24h: -0.4, minDeparture: -3.0, humidityMorning: 75, humidityEvening: null, rainfall24hr: 3.0, rainfall9hr: null },
  { id: 6, city: 'Chandrapur', region: 'Vidarbha Region', maxTemp: 41.2, maxChange24h: 0, maxDeparture: -2.1, minTemp: 25.6, minChange24h: -2.8, minDeparture: -3.9, humidityMorning: 48, humidityEvening: null, rainfall24hr: 6.0, rainfall9hr: null },
  { id: 7, city: 'Gadchiroli', region: 'Vidarbha Region', maxTemp: 39.8, maxChange24h: -0.8, maxDeparture: null, minTemp: 27.4, minChange24h: -0.6, minDeparture: null, humidityMorning: 49, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 8, city: 'Gondia', region: 'Vidarbha Region', maxTemp: 39.4, maxChange24h: -1.6, maxDeparture: -3.1, minTemp: 26.2, minChange24h: 1, minDeparture: -2.4, humidityMorning: 39, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 9, city: 'Nagpur', region: 'Vidarbha Region', maxTemp: 40.7, maxChange24h: -0.1, maxDeparture: -2.4, minTemp: 27.4, minChange24h: 1.6, minDeparture: -1.5, humidityMorning: 39, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 10, city: 'Wardha', region: 'Vidarbha Region', maxTemp: 42.0, maxChange24h: 0.1, maxDeparture: -0.7, minTemp: 29.0, minChange24h: 2.5, minDeparture: 1.5, humidityMorning: 97, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 11, city: 'Washim', region: 'Vidarbha Region', maxTemp: 38.6, maxChange24h: -1.8, maxDeparture: -2.8, minTemp: 22.4, minChange24h: 1.4, minDeparture: -4.0, humidityMorning: 61, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 12, city: 'Yavatmal', region: 'Vidarbha Region', maxTemp: 39.5, maxChange24h: -2.5, maxDeparture: -1.7, minTemp: 26.4, minChange24h: -0.5, minDeparture: -1.3, humidityMorning: 55, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },

  // MARATHWADA REGION
  { id: 13, city: 'Chhatrapati Sambhajinagar', region: 'Marathwada Region', maxTemp: 39.2, maxChange24h: -1.0, maxDeparture: -1.2, minTemp: 24.5, minChange24h: 0.5, minDeparture: -0.5, humidityMorning: 45, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 14, city: 'Nanded', region: 'Marathwada Region', maxTemp: 40.5, maxChange24h: 0.2, maxDeparture: 1.0, minTemp: 26.0, minChange24h: 1.2, minDeparture: 0.8, humidityMorning: 50, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 15, city: 'Latur', region: 'Marathwada Region', maxTemp: 38.5, maxChange24h: -0.5, maxDeparture: -2.0, minTemp: 23.5, minChange24h: -0.5, minDeparture: -1.0, humidityMorning: 55, humidityEvening: null, rainfall24hr: 2.0, rainfall9hr: null },

  // MADHYA MAHARASHTRA REGION
  { id: 16, city: 'Pune', region: 'Madhya Maharashtra Region', maxTemp: 37.0, maxChange24h: 1.5, maxDeparture: 2.0, minTemp: 22.0, minChange24h: 0.0, minDeparture: 1.0, humidityMorning: 60, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 17, city: 'Nashik', region: 'Madhya Maharashtra Region', maxTemp: 36.5, maxChange24h: 0.5, maxDeparture: 0.5, minTemp: 21.5, minChange24h: -1.0, minDeparture: -0.5, humidityMorning: 65, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },

  // MUMBAI & KONKAN REGION
  { id: 18, city: 'Mumbai (Colaba)', region: 'Mumbai & Konkan Region', maxTemp: 33.5, maxChange24h: -0.2, maxDeparture: 0.4, minTemp: 28.0, minChange24h: 0.2, minDeparture: 1.1, humidityMorning: 82, humidityEvening: 70, rainfall24hr: 5.0, rainfall9hr: null },
  { id: 19, city: 'Mumbai (Santacruz)', region: 'Mumbai & Konkan Region', maxTemp: 34.2, maxChange24h: 0.1, maxDeparture: 0.8, minTemp: 27.5, minChange24h: 0.5, minDeparture: 0.9, humidityMorning: 78, humidityEvening: 65, rainfall24hr: 12.0, rainfall9hr: null },

  // WEST MADHYA PRADESH
  { id: 20, city: 'Indore', region: 'West Madhya Pradesh', maxTemp: 40.0, maxChange24h: -1.0, maxDeparture: 1.0, minTemp: 25.0, minChange24h: -0.5, minDeparture: 0.5, humidityMorning: 40, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 21, city: 'Bhopal', region: 'West Madhya Pradesh', maxTemp: 41.5, maxChange24h: 0.5, maxDeparture: 2.0, minTemp: 26.5, minChange24h: 1.0, minDeparture: 1.5, humidityMorning: 35, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },

  // EAST MADHYA PRADESH
  { id: 22, city: 'Jabalpur', region: 'East Madhya Pradesh', maxTemp: 42.0, maxChange24h: -0.5, maxDeparture: 1.5, minTemp: 27.0, minChange24h: 0.0, minDeparture: 1.0, humidityMorning: 38, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 23, city: 'Rewa', region: 'East Madhya Pradesh', maxTemp: 43.0, maxChange24h: 1.0, maxDeparture: 3.0, minTemp: 28.5, minChange24h: 1.5, minDeparture: 2.0, humidityMorning: 30, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },

  // CHHATTISGARH
  { id: 24, city: 'Raipur', region: 'Chhattisgarh', maxTemp: 42.5, maxChange24h: -1.5, maxDeparture: -0.5, minTemp: 28.0, minChange24h: 2.0, minDeparture: 1.5, humidityMorning: 45, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null },
  { id: 25, city: 'Bilaspur', region: 'Chhattisgarh', maxTemp: 43.2, maxChange24h: -0.5, maxDeparture: 0.5, minTemp: 29.0, minChange24h: 1.0, minDeparture: 2.0, humidityMorning: 40, humidityEvening: null, rainfall24hr: 0.0, rainfall9hr: null }
];`;

content = content.replace(/export const weatherData = \[[\s\S]*?\];/m, newWeatherData);
fs.writeFileSync(path, content, 'utf8');
console.log('weatherData.js updated successfully.');
