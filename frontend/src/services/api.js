export const fetchLiveWeather = async () => {
  try {
    const response = await fetch('/api/weather');
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error('Failed to fetch weather data');
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};

export const fetchForecast = async (city) => {
  try {
    const response = await fetch(`/api/forecast?city=${encodeURIComponent(city)}`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error('Failed to fetch forecast data');
  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
};
