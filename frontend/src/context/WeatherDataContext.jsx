import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchLiveWeather } from '../services/api';
import { weatherData } from '../data/weatherData';

const WeatherDataContext = createContext(null);

/**
 * Parses raw HTML from the RMC Nagpur observations page into structured data.
 * Extracted here so the parsing logic is shared and only runs once.
 */
function parseObservationsHtml(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Extract "Observed On" dates
  let observedDates = { maxDate: '', minDate: '' };
  const headerRows = doc.querySelectorAll('tr[bgcolor="#d9edf7"]');
  if (headerRows.length >= 3) {
    const dateRow = headerRows[2];
    const dateCells = dateRow.querySelectorAll('td');
    if (dateCells.length >= 2) {
      observedDates = {
        maxDate: dateCells[0]?.textContent.trim() || '',
        minDate: dateCells[1]?.textContent.trim() || ''
      };
    }
  }

  // Extract region title
  let regionTitle = 'Vidarbha Region (Maharashtra)';
  const regionFont = doc.querySelector('font[style*="color:#ee3333"]');
  if (regionFont) {
    regionTitle = regionFont.textContent.trim().replace(/:$/, '');
  }

  // Parse data rows
  const rows = doc.querySelectorAll('tr[bgcolor="#ffffee"]');
  const parsedData = Array.from(rows).map(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 10) return null;

    const cityName = cells[0].textContent.trim();
    const mockCity = weatherData.find(c => c.city.toLowerCase() === cityName.toLowerCase()) || weatherData[0];

    const parsedMaxTemp = parseFloat(cells[1]?.textContent.trim());
    const parsedMaxChange = parseFloat(cells[2]?.textContent.trim());
    const parsedMaxDep = parseFloat(cells[3]?.textContent.trim());
    const parsedMinTemp = parseFloat(cells[4]?.textContent.trim());
    const parsedMinChange = parseFloat(cells[5]?.textContent.trim());
    const parsedMinDep = parseFloat(cells[6]?.textContent.trim());

    const maxTemp = !isNaN(parsedMaxTemp) ? parsedMaxTemp : null;
    const isHeatwave = maxTemp >= 45.0;
    const alertLevel = isHeatwave ? 'RED' : (maxTemp >= 43.0 ? 'ORANGE' : (maxTemp >= 41.0 ? 'YELLOW' : 'GREEN'));
    let trend = 'Stable';
    if (parsedMaxChange > 1.5) trend = 'Rising';
    else if (parsedMaxChange < -1.5) trend = 'Falling';
    
    const rain24 = cells[9] ? parseFloat(cells[9].textContent.trim()) || 0 : 0;
    const rain9 = cells[10] ? parseFloat(cells[10].textContent.trim()) || 0 : 0;

    return {
      ...mockCity,
      id: cityName + Math.random(),
      city: cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase(),
      region: 'Vidarbha Region',

      // Dashboard expected format
      temperature: {
        max: maxTemp,
        maxChange: !isNaN(parsedMaxChange) ? parsedMaxChange : 0,
        maxDeparture: !isNaN(parsedMaxDep) ? parsedMaxDep : 0,
        min: !isNaN(parsedMinTemp) ? parsedMinTemp : null,
        minChange: !isNaN(parsedMinChange) ? parsedMinChange : 0,
        minDeparture: !isNaN(parsedMinDep) ? parsedMinDep : 0
      },
      humidity: {
        morning: cells[7] ? parseInt(cells[7].textContent.trim()) || 0 : 0,
        evening: cells[8] ? parseInt(cells[8].textContent.trim()) || 0 : 0
      },
      rainfall: {
        last24h: rain24,
        last9h: rain9
      },
      analysis: {
        heatwave: isHeatwave,
        alertLevel: alertLevel,
        trend: trend,
        forecastConfidence: '80%'
      },

      // Parsed numeric data for Cards (Legacy format if needed elsewhere)
      maxTemp: maxTemp,
      minTemp: !isNaN(parsedMinTemp) ? parsedMinTemp : null,
      maxDeparture: !isNaN(parsedMaxDep) ? parsedMaxDep : null,
      humidityMorning: cells[7] ? cells[7].textContent.trim() : '--',
      humidityEvening: cells[8] ? cells[8].textContent.trim() : '--',
      rainfall24hr: cells[9] ? cells[9].textContent.trim() : '0.0',
      trend: trend,

      // Raw string data for the exact Table layout
      rawMaxTemp: cells[1] ? cells[1].textContent.trim() : '',
      maxChange: cells[2] ? cells[2].textContent.trim() : '',
      rawMaxDeparture: cells[3] ? cells[3].textContent.trim() : '',
      rawMinTemp: cells[4] ? cells[4].textContent.trim() : '',
      minChange: cells[5] ? cells[5].textContent.trim() : '',
      rawMinDeparture: cells[6] ? cells[6].textContent.trim() : '',
      rh830: cells[7] ? cells[7].textContent.trim() : '',
      rh1730: cells[8] ? cells[8].textContent.trim() : '',
      rf24: cells[9] ? cells[9].textContent.trim() : '',
      rf9: cells[10] ? cells[10].textContent.trim() : ''
    };


  }).filter(Boolean);

  return { parsedData, observedDates, regionTitle };
}

export function WeatherDataProvider({ children }) {
  // Dashboard data (from /api/weather)
  const [liveData, setLiveData] = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // Observations data (scraped from RMC Nagpur)
  const [observationsData, setObservationsData] = useState([]);
  const [observedDates, setObservedDates] = useState({ maxDate: '', minDate: '' });
  const [regionTitle, setRegionTitle] = useState('Vidarbha Region (Maharashtra)');
  const [observationsLoading, setObservationsLoading] = useState(true);

  // Ref to ensure we only fetch once (handles StrictMode double-mount)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Fetch Observations (RMC scrape) data and use as realtime LiveData
    (async () => {
      try {
        const response = await fetch('/proxy-rmc/pages/observations.php');
        const htmlText = await response.text();
        const { parsedData, observedDates: dates, regionTitle: title } = parseObservationsHtml(htmlText);

        setObservationsData(parsedData);
        setObservedDates(dates);
        setRegionTitle(title);
        
        // Use realtime data for the dashboard
        setLiveData(parsedData);
      } catch (error) {
        console.error('Failed to fetch realtime observations data', error);
        setLiveData([]); // Ensure liveData is empty if fetch fails
      } finally {
        setObservationsLoading(false);
        setLiveLoading(false);
      }
    })();
  }, []);

  const value = {
    // Dashboard
    liveData,
    liveLoading,
    // Observations
    observationsData,
    observedDates,
    regionTitle,
    observationsLoading,
  };

  return (
    <WeatherDataContext.Provider value={value}>
      {children}
    </WeatherDataContext.Provider>
  );
}

export function useWeatherData() {
  const ctx = useContext(WeatherDataContext);
  if (!ctx) throw new Error('useWeatherData must be used within WeatherDataProvider');
  return ctx;
}
