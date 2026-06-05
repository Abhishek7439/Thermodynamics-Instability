import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Thermometer, Droplets, Wind, Eye, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Cloud, CloudRain, Sun, Zap, MapPin
} from 'lucide-react';
import { weatherData, regions } from '../data/weatherData';

const alertColors = {
  normal: 'border-green-500/40 bg-green-500/10 text-green-400',
  watch: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  warning: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  danger: 'border-red-500/40 bg-red-500/10 text-red-400',
};

const alertIcons = {
  'Normal': '🟢',
  'Heatwave Watch': '🟡',
  'Heatwave Warning': '🔴',
};

function getTempColor(temp) {
  if (temp >= 42) return '#ef4444';
  if (temp >= 38) return '#f97316';
  if (temp >= 34) return '#f59e0b';
  if (temp >= 30) return '#eab308';
  return '#22c55e';
}

function getTrendIcon(trend) {
  if (trend === 'Rising') return <TrendingUp size={12} className="text-red-400" />;
  if (trend === 'Falling') return <TrendingDown size={12} className="text-blue-400" />;
  return <Minus size={12} className="text-gray-400" />;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-2 border border-blue-700/40 text-xs">
        <p className="text-blue-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-300">{p.name}: <strong className="text-white">{p.value}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function CityHoverPopup({ city, position }) {
  const timeData = city.history;
  
  // Smart positioning: show above if near bottom of screen
  const popupHeight = 420;
  const spaceBelow = window.innerHeight - position.y;
  const showAbove = spaceBelow < popupHeight + 40;
  
  const topPos = showAbove
    ? Math.max(10, position.y - popupHeight - 10)
    : Math.min(position.y - 20, window.innerHeight - popupHeight - 20);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: showAbove ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: showAbove ? -10 : 10 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[9999] w-80 rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
      style={{
        left: Math.min(position.x + 16, window.innerWidth - 340),
        top: topPos,
        background: 'linear-gradient(135deg, rgba(12,27,51,0.98) 0%, rgba(5,13,26,0.98) 100%)',
        border: '1px solid rgba(59,130,196,0.4)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-blue-900/40"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,168,0.3) 0%, rgba(6,182,212,0.15) 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-cyan-400" />
              <h3 className="text-white font-bold text-sm">{city.city}</h3>
            </div>
            <p className="text-blue-400 text-[10px]">{city.region}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: getTempColor(city.maxTemp || 30) }}>
              {city.maxTemp ?? '--'}°C
            </div>
            <div className="text-[10px] text-blue-400">Maximum Temp</div>
          </div>
        </div>
      </div>

      {/* Stats grid - Only official IMD parameters */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {[
          { label: 'Minimum Temp', value: `${city.minTemp ?? '--'}°C`, icon: Thermometer, color: '#60a5e0' },
          { label: 'Max Departure', value: `${city.rawMaxDeparture ?? city.maxDeparture ?? '--'}`, icon: TrendingUp, color: '#f97316' },
          { label: 'Humidity (0830 IST)', value: `${city.humidityMorning ?? '--'}%`, icon: Droplets, color: '#06b6d4' },
          { label: 'Humidity (1730 IST)', value: `${city.humidityEvening ?? '--'}%`, icon: Droplets, color: '#3b82c4' },
          { label: 'Rainfall 24h', value: `${city.rainfall24hr ?? city.rf24 ?? '0.0'} mm`, icon: CloudRain, color: '#38bdf8' },
          { label: '24 Hrs Change', value: `${city.maxChange ?? '--'}°C`, icon: TrendingDown, color: '#a78bfa' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-2 bg-blue-900/20 rounded-lg p-2">
            <stat.icon size={13} style={{ color: stat.color }} />
            <div>
              <div className="text-white text-xs font-semibold">{stat.value}</div>
              <div className="text-[9px] text-blue-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Temperature chart */}
      <div className="px-3 pb-1">
        <p className="text-[10px] text-blue-400 mb-1 font-medium">24-Hour Temperature Trend</p>
        <ResponsiveContainer width="100%" height={70}>
          <AreaChart data={timeData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id={`tempGrad-${city.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#4e7a9e' }} />
            <YAxis tick={{ fontSize: 8, fill: '#4e7a9e' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#f97316"
              strokeWidth={2}
              fill={`url(#tempGrad-${city.id})`}
              name="Temp (°C)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Humidity chart */}
      <div className="px-3 pb-3">
        <p className="text-[10px] text-blue-400 mb-1 font-medium">Humidity (%)</p>
        <ResponsiveContainer width="100%" height={50}>
          <BarChart data={timeData} margin={{ top: 0, right: 5, left: -30, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 7, fill: '#4e7a9e' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="humidity" fill="#06b6d4" radius={[2, 2, 0, 0]} name="Humidity (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 5-day mini forecast */}
      {city.forecastDays && city.forecastDays.length > 0 && (
        <div className="px-3 pb-3">
          <p className="text-[10px] text-blue-400 mb-1.5 font-medium">5-Day Forecast</p>
          <div className="flex gap-1.5">
            {city.forecastDays.slice(0, 5).map((day, i) => (
              <div key={i} className="flex-1 text-center bg-blue-900/20 rounded-lg py-1.5 px-1">
                <div className="text-[9px] text-blue-400">{day.day}</div>
                <div className="text-sm my-0.5">{day.icon}</div>
                <div className="text-[9px] text-white font-bold">{day.maxTemp}°</div>
                <div className="text-[8px] text-blue-500">{day.minTemp}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert badge */}
      {city.alertLevel && (
        <div className={`mx-3 mb-3 px-3 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 ${alertColors[city.alertLevel]}`}>
          <AlertTriangle size={10} />
          {city.alert}
          <span className="ml-auto">{alertIcons[city.alert]}</span>
        </div>
      )}
    </motion.div>
  );
}

function CityCard({ city, onHover }) {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    onHover(city, { x: e.clientX, y: e.clientY });
  }, [city, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null, null);
  }, [onHover]);

  const maxTempColor = getTempColor(city.maxTemp || 30);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 cursor-pointer group relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${maxTempColor}15 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* City name and region */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-cyan-400" />
              <h3 className="text-white font-bold text-sm">{city.city}</h3>
            </div>
            <p className="text-blue-400 text-[10px] mt-0.5">{city.region}</p>
          </div>
          <div className={`status-badge border ${alertColors[city.alertLevel]}`}>
            {city.alertLevel === 'normal' ? '✓ Normal' : city.alert}
          </div>
        </div>

        {/* Temperature display */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black" style={{ color: maxTempColor }}>
                {city.maxTemp ?? '--'}
              </span>
              <span className="text-sm text-gray-400">°C</span>
            </div>
            <p className="text-[10px] text-blue-400">Max</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-300">{city.minTemp ?? '--'}°C</div>
            <p className="text-[10px] text-blue-400">Min</p>
          </div>
        </div>

        {/* Stats row - Official IMD parameters only */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center bg-blue-900/20 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Droplets size={10} className="text-cyan-400" />
            </div>
            <div className="text-xs font-bold text-white">{city.humidityMorning ?? '--'}%</div>
            <div className="text-[9px] text-blue-500">RH (0830 IST)</div>
          </div>
          <div className="text-center bg-blue-900/20 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <CloudRain size={10} className="text-blue-400" />
            </div>
            <div className="text-xs font-bold text-white">{city.rainfall24hr ?? city.rf24 ?? '0.0'} mm</div>
            <div className="text-[9px] text-blue-500">Rainfall 24h</div>
          </div>
          <div className="text-center bg-blue-900/20 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Droplets size={10} className="text-blue-400" />
            </div>
            <div className="text-xs font-bold text-white">{city.humidityEvening ?? '--'}%</div>
            <div className="text-[9px] text-blue-500">RH (1730 IST)</div>
          </div>
        </div>

        {/* Departure */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-blue-400">Departure</span>
          <span className={`text-xs font-bold ${
            city.maxDeparture > 0 ? 'text-orange-400' : city.maxDeparture < 0 ? 'text-blue-400' : 'text-gray-400'
          }`}>
            {city.maxDeparture != null ? `${city.maxDeparture > 0 ? '+' : ''}${city.maxDeparture}°C` : '—'}
          </span>
        </div>

        {/* Hover hint */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-cyan-500 flex items-center gap-1">
          <Eye size={9} />
          <span>Hover for details</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Observations() {
  const [selectedRegion, setSelectedRegion] = useState('Vidarbha Region');
  const [hoveredCity, setHoveredCity] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [realTimeData, setRealTimeData] = useState([]);
  const [observedDates, setObservedDates] = useState({ maxDate: '', minDate: '' });
  const [regionTitle, setRegionTitle] = useState('Vidarbha Region (Maharashtra)');
  const [loading, setLoading] = useState(true);

  const handleHover = useCallback((city, pos) => {
    setHoveredCity(city);
    setHoverPos(pos);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetching real-time live data securely through Vite proxy
        // This avoids CORS issues and pulls directly from the official website!
        const response = await fetch('/proxy-rmc/pages/observations.php');
        const htmlText = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Find all rows with bgcolor="#ffffee" which are the data rows
        const rows = doc.querySelectorAll('tr[bgcolor="#ffffee"]');
        
        // Extract "Observed On" dates from the 3rd header row (official site has this)
        const headerRows = doc.querySelectorAll('tr[bgcolor="#d9edf7"]');
        if (headerRows.length >= 3) {
          const dateRow = headerRows[2];
          const dateCells = dateRow.querySelectorAll('td');
          if (dateCells.length >= 2) {
            setObservedDates({
              maxDate: dateCells[0]?.textContent.trim() || '',
              minDate: dateCells[1]?.textContent.trim() || ''
            });
          }
        }
        
        // Extract region title
        const regionFont = doc.querySelector('font[style*="color:#ee3333"]');
        if (regionFont) {
          setRegionTitle(regionFont.textContent.trim().replace(/:$/, ''));
        }
        
        const parsedData = Array.from(rows).map(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 10) return null;
          
          const cityName = cells[0].textContent.trim();
          const mockCity = weatherData.find(c => c.city.toLowerCase() === cityName.toLowerCase()) || weatherData[0];
          
          const parsedMaxTemp = parseFloat(cells[1]?.textContent.trim());
          const parsedMinTemp = parseFloat(cells[4]?.textContent.trim());
          const parsedMaxDep = parseFloat(cells[3]?.textContent.trim());
          const parsedMaxChange = parseFloat(cells[2]?.textContent.trim());
          
          let trend = 'Steady';
          if (parsedMaxChange > 0) trend = 'Rising';
          else if (parsedMaxChange < 0) trend = 'Falling';
          
          return {
            ...mockCity, // Base data for charts and history
            id: cityName + Math.random(),
            city: cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase(),
            region: 'Vidarbha Region',
            
            // Parsed numeric data for Cards
            maxTemp: !isNaN(parsedMaxTemp) ? parsedMaxTemp : null,
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

        setRealTimeData(parsedData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold gradient-text mb-1">Today's Observations</h2>
            <p className="text-blue-400 text-sm">
              Real-time live data from RMC Nagpur •{' '}
              <span className="text-cyan-400">Observed on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'glass-light text-blue-400'}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'glass-light text-blue-400'}`}
            >
              Table
            </button>
            <div className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white flex items-center gap-2 border border-blue-400 shadow-lg shadow-blue-900/50">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot"></div>
              Live Fetch
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20 glass-card rounded-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-300 font-semibold animate-pulse">Fetching real-time data from official server...</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <ObservationTable cities={realTimeData} onHover={handleHover} observedDates={observedDates} regionTitle={regionTitle} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {realTimeData.map((city, i) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CityCard city={city} onHover={handleHover} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Hover popup */}
      <AnimatePresence>
        {hoveredCity && hoverPos && (
          <CityHoverPopup city={hoveredCity} position={hoverPos} />
        )}
      </AnimatePresence>

      {/* Info note */}
      <p className="text-[10px] text-blue-600 mt-6 text-center">
        *** Departures are based on Pentad Normals 1991-2020 *** | Data strictly synced from Regional Meteorological Centre, Nagpur
      </p>
    </motion.div>
  );
}

function ObservationTable({ cities, onHover, observedDates, regionTitle }) {
  if (!cities || cities.length === 0) {
    return <div className="p-8 text-center text-blue-400 glass-card rounded-2xl">No observation data available at the moment.</div>;
  }

  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      {/* Region Title - same as official site */}
      <div className="px-4 py-3 border-b border-blue-900/40">
        <span className="text-red-400 font-bold text-sm">{regionTitle} :</span>
      </div>
      
      <table className="w-full text-xs">
        <thead>
          {/* Row 1: Main group headers */}
          <tr className="border-b border-blue-900/40 bg-blue-900/20">
            <th className="text-left px-4 py-3 text-blue-300 font-semibold border-r border-blue-900/40" rowSpan="3">City</th>
            <th className="text-center px-2 py-2 text-blue-300 font-semibold border-r border-blue-900/40" colSpan="6">Temperature (°C)</th>
            <th className="text-center px-2 py-2 text-blue-300 font-semibold border-r border-blue-900/40" colSpan="2">Relative Humidity (%)</th>
            <th className="text-center px-2 py-2 text-blue-300 font-semibold" colSpan="2">Rainfall (mm)</th>
          </tr>
          {/* Row 2: Sub-parameter headers */}
          <tr className="border-b border-blue-900/40 bg-blue-900/20 text-[10px]">
            <th className="text-center px-2 py-1 text-cyan-300 border-r border-blue-900/40">Maximum</th>
            <th className="text-center px-2 py-1 text-cyan-300 border-r border-blue-900/40">24 Hrs Change</th>
            <th className="text-center px-2 py-1 text-cyan-300 border-r border-blue-900/40">Departure</th>
            <th className="text-center px-2 py-1 text-blue-300 border-r border-blue-900/40">Minimum</th>
            <th className="text-center px-2 py-1 text-blue-300 border-r border-blue-900/40">24 Hrs Change</th>
            <th className="text-center px-2 py-1 text-blue-300 border-r border-blue-900/40">Departure</th>
            <th className="text-center px-2 py-1 text-amber-300 border-r border-blue-900/40">at 0830 hrs IST</th>
            <th className="text-center px-2 py-1 text-amber-300 border-r border-blue-900/40">at 1730 hrs IST</th>
            <th className="text-center px-2 py-1 text-emerald-300 border-r border-blue-900/40">last 24 hrs upto 0830 hrs IST</th>
            <th className="text-center px-2 py-1 text-emerald-300">last 9 hrs upto 1730 hrs IST</th>
          </tr>
          {/* Row 3: Observed On dates - exactly like official site */}
          <tr className="border-b border-blue-900/40 bg-blue-900/20 text-[9px]">
            <td className="text-center px-2 py-1 text-red-400 border-r border-blue-900/40" colSpan="3">
              {observedDates?.maxDate || ''}
            </td>
            <td className="text-center px-2 py-1 text-red-400" colSpan="8">
              {observedDates?.minDate || ''}
            </td>
          </tr>
        </thead>
        <tbody>
          {cities.map((city, i) => (
            <tr
              key={city.id + i}
              className="border-b border-blue-900/20 hover:bg-blue-900/20 transition-colors cursor-pointer"
              onMouseMove={(e) => onHover && onHover(city, { x: e.clientX, y: e.clientY })}
              onMouseLeave={() => onHover && onHover(null, null)}
            >
              <td className="px-4 py-2 font-semibold text-white border-r border-blue-900/20">{city.city}</td>
              <td className="px-2 py-2 text-center font-bold text-orange-400 border-r border-blue-900/20 bg-orange-500/5">{city.rawMaxTemp}</td>
              <td className="px-2 py-2 text-center text-cyan-200 border-r border-blue-900/20 bg-orange-500/5">{city.maxChange}</td>
              <td className="px-2 py-2 text-center text-cyan-200 border-r border-blue-900/20 bg-orange-500/5">{city.rawMaxDeparture}</td>
              <td className="px-2 py-2 text-center font-bold text-blue-300 border-r border-blue-900/20 bg-blue-500/5">{city.rawMinTemp}</td>
              <td className="px-2 py-2 text-center text-blue-200 border-r border-blue-900/20 bg-blue-500/5">{city.minChange}</td>
              <td className="px-2 py-2 text-center text-blue-200 border-r border-blue-900/20 bg-blue-500/5">{city.rawMinDeparture}</td>
              <td className="px-2 py-2 text-center text-amber-200 border-r border-blue-900/20 bg-amber-500/5">{city.rh830}</td>
              <td className="px-2 py-2 text-center text-amber-200 border-r border-blue-900/20 bg-amber-500/5">{city.rh1730}</td>
              <td className="px-2 py-2 text-center text-emerald-200 border-r border-blue-900/20 bg-emerald-500/5">{city.rf24}</td>
              <td className="px-2 py-2 text-center text-emerald-200 bg-emerald-500/5">{city.rf9}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
