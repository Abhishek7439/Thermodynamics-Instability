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
    let forecastData = result.success ? result.data : [];

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
    console.error('API Error:', error);
    return [];
  }
};
