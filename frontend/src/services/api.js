// List of cities requested by the user
const cities = [
  'Nagpur', 'Akola', 'Amravati', 'Bhandara', 'Buldana', 
  'Brahmapuri', 'Chandrapur', 'Gadchiroli', 'Gondia', 
  'Wardha', 'Washim', 'Yavatmal'
];

const random = (min, max, decimals = 1) => {
  const num = Math.random() * (max - min) + min;
  return Number(num.toFixed(decimals));
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate dynamic weather data based on realistic summer conditions in Vidarbha
export const fetchLiveWeather = async () => {
  return new Promise((resolve) => {
    const data = cities.map(city => {
      const maxTemp = random(40.5, 47.5);
      const minTemp = random(26.0, 32.5);
      const maxChange = random(-2.5, 3.5);
      const minChange = random(-1.5, 2.5);
      const maxDeparture = random(-1.0, 5.0);
      const minDeparture = random(-1.0, 4.0);
      
      const humidity830 = Math.floor(random(25, 60, 0));
      const humidity1730 = Math.floor(random(15, 40, 0));
      
      const rainChance = Math.random();
      const rain24 = rainChance > 0.85 ? random(0.5, 15.0) : 0.0;
      const rain9 = rainChance > 0.90 ? random(0.2, 5.0) : 0.0;
      
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
        humidity: { morning: humidity830, evening: humidity1730 },
        rainfall: { last24h: rain24, last9h: rain9 },
        analysis: {
          heatwave: isHeatwave,
          alertLevel: alertLevel,
          trend: trend,
          forecastConfidence: Math.floor(random(75, 98, 0)) + '%'
        },
        lastUpdated: new Date().toISOString()
      };
    });
    
    // Simulate network delay
    setTimeout(() => resolve(data), 500);
  });
};

export const fetchForecast = async (city) => {
  return new Promise((resolve) => {
    const data = Array.from({ length: 7 }).map((_, i) => {
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
    
    setTimeout(() => resolve(data), 300);
  });
};
