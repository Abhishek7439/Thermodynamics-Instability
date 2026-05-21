import { useState, useRef, useCallback } from 'react';
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 10 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[9999] w-80 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        left: Math.min(position.x + 16, window.innerWidth - 340),
        top: Math.min(position.y - 20, window.innerHeight - 500),
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
            <div className="text-[10px] text-blue-400">Max Temp</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {[
          { label: 'Min Temp', value: `${city.minTemp ?? '--'}°C`, icon: Thermometer, color: '#60a5e0' },
          { label: 'Heat Index', value: `${city.heatIndex ?? '--'}°C`, icon: Thermometer, color: '#f97316' },
          { label: 'Humidity AM', value: `${city.humidityMorning ?? '--'}%`, icon: Droplets, color: '#06b6d4' },
          { label: 'Humidity PM', value: `${city.humidityEvening ?? '--'}%`, icon: Droplets, color: '#3b82c4' },
          { label: 'Wind Speed', value: `${city.windSpeed} km/h`, icon: Wind, color: '#a78bfa' },
          { label: 'Rainfall 24h', value: `${city.rainfall24hr} mm`, icon: CloudRain, color: '#38bdf8' },
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

      {/* Alert badge */}
      <div className={`mx-3 mb-3 px-3 py-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 ${alertColors[city.alertLevel]}`}>
        <AlertTriangle size={10} />
        {city.alert}
        <span className="ml-auto">{alertIcons[city.alert]}</span>
      </div>
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center bg-blue-900/20 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Droplets size={10} className="text-cyan-400" />
            </div>
            <div className="text-xs font-bold text-white">{city.humidityMorning ?? '--'}%</div>
            <div className="text-[9px] text-blue-500">AM RH</div>
          </div>
          <div className="text-center bg-blue-900/20 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <CloudRain size={10} className="text-blue-400" />
            </div>
            <div className="text-xs font-bold text-white">{city.rainfall24hr} mm</div>
            <div className="text-[9px] text-blue-500">Rainfall</div>
          </div>
          <div className="text-center bg-blue-900/20 rounded-lg p-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              {getTrendIcon(city.trend)}
            </div>
            <div className="text-xs font-bold text-white">{city.trend}</div>
            <div className="text-[9px] text-blue-500">Trend</div>
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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const handleHover = useCallback((city, pos) => {
    setHoveredCity(city);
    setHoverPos(pos);
  }, []);

  const filteredCities = weatherData.filter(c => c.region === selectedRegion);
  const allRegions = [...new Set(weatherData.map(c => c.region))];

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
            <h2 className="text-xl font-bold gradient-text mb-1">Weather Observations</h2>
            <p className="text-blue-400 text-sm">
              Live data from surface observatories across Central India •{' '}
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
          </div>
        </div>
      </div>

      {/* Region filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {allRegions.map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              selectedRegion === region
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'glass-light border-blue-800/40 text-blue-400 hover:border-blue-600/60 hover:text-white'
            }`}
          >
            {region}
          </button>
        ))}
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCities.map((city, i) => (
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
      ) : (
        <ObservationTable cities={filteredCities} onHover={handleHover} />
      )}

      {/* Hover popup */}
      <AnimatePresence>
        {hoveredCity && hoverPos && (
          <CityHoverPopup city={hoveredCity} position={hoverPos} />
        )}
      </AnimatePresence>

      {/* Info note */}
      <p className="text-[10px] text-blue-600 mt-6 text-center">
        *** Departures are based on Pentad Normals 1991-2020 *** | Source: Regional Meteorological Centre, Nagpur
      </p>
    </motion.div>
  );
}

function ObservationTable({ cities, onHover }) {
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-blue-900/40">
            <th className="text-left px-4 py-3 text-blue-400 font-semibold">City</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">Max °C</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">Min °C</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">Departure</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">RH AM%</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">RH PM%</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">RF 24h</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">Trend</th>
            <th className="text-center px-3 py-3 text-blue-400 font-semibold">Alert</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city, i) => (
            <tr
              key={city.id}
              className="border-b border-blue-900/20 hover:bg-blue-900/20 transition-colors cursor-pointer"
              onMouseMove={(e) => onHover(city, { x: e.clientX, y: e.clientY })}
              onMouseLeave={() => onHover(null, null)}
            >
              <td className="px-4 py-3 font-semibold text-white">{city.city}</td>
              <td className="px-3 py-3 text-center font-bold" style={{ color: getTempColor(city.maxTemp || 30) }}>
                {city.maxTemp ?? '—'}
              </td>
              <td className="px-3 py-3 text-center text-blue-300">{city.minTemp ?? '—'}</td>
              <td className={`px-3 py-3 text-center font-semibold ${
                city.maxDeparture > 0 ? 'text-orange-400' : 'text-blue-400'
              }`}>
                {city.maxDeparture != null ? `${city.maxDeparture > 0 ? '+' : ''}${city.maxDeparture}` : '—'}
              </td>
              <td className="px-3 py-3 text-center text-cyan-300">{city.humidityMorning ?? '—'}</td>
              <td className="px-3 py-3 text-center text-blue-300">{city.humidityEvening ?? '—'}</td>
              <td className="px-3 py-3 text-center text-blue-300">{city.rainfall24hr}</td>
              <td className="px-3 py-3 text-center flex items-center justify-center gap-1">
                {getTrendIcon(city.trend)}
                <span className="text-blue-300">{city.trend}</span>
              </td>
              <td className="px-3 py-3 text-center">
                <span className={`status-badge border ${alertColors[city.alertLevel]}`}>
                  {city.alertLevel === 'normal' ? 'Normal' : city.alertLevel === 'watch' ? 'Watch' : 'Warning'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
