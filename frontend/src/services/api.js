// Base URL dynamically points to the same host in production, or localhost:3001 in dev
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * Fetches live weather observations from the Node.js backend.
 * The backend proxies the request to the official IMD API using the configured API Key.
 * If the API Key is missing or the request fails, the backend returns fallback simulated data.
 */
export const fetchLiveWeather = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather`);
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
    return result.data || [];
  } catch (error) {
    console.error(`Error fetching forecast for ${city}:`, error);
    return [];
  }
};
