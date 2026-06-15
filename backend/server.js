const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// List of cities requested by the user
const cities = [
  'Nagpur', 'Akola', 'Amravati', 'Bhandara', 'Buldana', 
  'Brahmapuri', 'Chandrapur', 'Gadchiroli', 'Gondia', 
  'Wardha', 'Washim', 'Yavatmal'
];

// Helper to generate a random number between min and max (inclusive)
const random = (min, max, decimals = 1) => {
  const num = Math.random() * (max - min) + min;
  return Number(num.toFixed(decimals));
};

// Helper to get random array element
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate dynamic weather data based on realistic summer conditions in Vidarbha
const generateWeatherData = () => {
  return cities.map(city => {
    // Vidarbha summer temps are typically 40-47°C Max, 25-32°C Min
    const maxTemp = random(40.5, 47.5);
    const minTemp = random(26.0, 32.5);
    const maxChange = random(-2.5, 3.5);
    const minChange = random(-1.5, 2.5);
    const maxDeparture = random(-1.0, 5.0);
    const minDeparture = random(-1.0, 4.0);
    
    // Humidity is lower in summer (15-50%)
    const humidity830 = Math.floor(random(25, 60, 0));
    const humidity1730 = Math.floor(random(15, 40, 0));
    
    // Rainfall is mostly 0 during summer, but occasional pre-monsoon showers
    const rainChance = Math.random();
    const rain24 = rainChance > 0.85 ? random(0.5, 15.0) : 0.0;
    const rain9 = rainChance > 0.90 ? random(0.2, 5.0) : 0.0;
    
    // Derived values for analytics and UI
    const isHeatwave = maxTemp >= 45.0;
    const alertLevel = isHeatwave ? 'RED' : (maxTemp >= 43.0 ? 'ORANGE' : (maxTemp >= 41.0 ? 'YELLOW' : 'GREEN'));
    const trend = maxChange > 1.5 ? 'RISING' : (maxChange < -1.5 ? 'FALLING' : 'STABLE');

    return {
      id: city.toLowerCase(),
      city: city,
      region: 'Vidarbha',
      temperature: {
        max: maxTemp,
        maxChange: maxChange,
        maxDeparture: maxDeparture,
        min: minTemp,
        minChange: minChange,
        minDeparture: minDeparture
      },
      humidity: {
        morning: humidity830,
        evening: humidity1730
      },
      rainfall: {
        last24h: rain24,
        last9h: rain9
      },
      analysis: {
        heatwave: isHeatwave,
        alertLevel: alertLevel,
        trend: trend,
        forecastConfidence: Math.floor(random(75, 98, 0)) + '%'
      },
      lastUpdated: new Date().toISOString()
    };
  });
};

app.get('/api/weather', (req, res) => {
  res.json({
    success: true,
    data: generateWeatherData()
  });
});

app.get('/api/forecast', (req, res) => {
  // Simple 7 day forecast data for a specific city
  const city = req.query.city || 'Nagpur';
  
  const forecast = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    
    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      maxTemp: random(41.0, 47.0),
      minTemp: random(27.0, 31.0),
      condition: pick(['Sunny', 'Mostly Sunny', 'Partly Cloudy', 'Hot', 'Heatwave']),
      rainProbability: Math.floor(random(0, 30, 0))
    };
  });

  res.json({
    success: true,
    city: city,
    data: forecast
  });
});

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React routing, return all requests to React app
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`RMC WeatherDesk Backend running on port ${PORT}`);
});
