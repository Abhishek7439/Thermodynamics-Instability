// Base URL dynamically points to the same host in production, or localhost:3001 in dev
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * Fetches live weather observations from the Node.js backend.
 * The backend proxies the request to the official IMD API using the configured API Key.
 * If the API Key is missing or the request fails, the backend returns fallback simulated data.
 */
export const fetchLiveWeather = async (region = '') => {
  try {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    const response = await fetch(`${API_BASE_URL}/weather${query}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching live weather from backend:", error);
    // Return empty array if totally broken so UI doesn't crash completely
    return [];
  }
};

/**
 * Fetches 7-day forecast data for a specific city from the Node.js backend.
 */
export const fetchForecast = async (city) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forecast?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    let forecastData = result.data || [];

    // Attempt to fetch real-time rainfall data to augment the forecast
    try {
      const rainResponse = await fetch('/proxy-rmc/pages/rainfall_drms.php');
      const htmlText = await rainResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      let actualRainfall = 0;
      const rows = doc.querySelectorAll('tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const rowCity = cells[0].textContent.trim().toLowerCase();
          const rowCity2 = cells[1] ? cells[1].textContent.trim().toLowerCase() : '';
          if (rowCity.includes(city.toLowerCase()) || rowCity2.includes(city.toLowerCase())) {
            // Find the first valid number that could be rainfall (usually 2nd or 3rd column)
            for (let i = 1; i < cells.length; i++) {
              const val = parseFloat(cells[i].textContent.trim());
              if (!isNaN(val) && val >= 0) {
                actualRainfall = val;
                break;
              }
            }
            if (actualRainfall > 0) break;
          }
        }
      }

      // Inject actual rainfall into the forecast data
      if (forecastData.length > 0) {
        // Assume first element is today, update it with real rainfall
        forecastData[0].actualRainfall = actualRainfall;
        // Optionally propagate some trend to the rest of the week if needed
        forecastData = forecastData.map(day => ({
          ...day,
          rainProbability: day.actualRainfall !== undefined ? day.actualRainfall * 10 : day.rainProbability,
          displayRainfall: day.actualRainfall !== undefined ? day.actualRainfall : Math.max(0, (day.rainProbability / 10).toFixed(1))
        }));
      }
    } catch (rainErr) {
      console.warn('Failed to fetch rainfall_drms.php', rainErr);
    }

    return forecastData;
  } catch (error) {
    console.error(`Error fetching forecast for ${city}:`, error);
    return [];
  }
};
