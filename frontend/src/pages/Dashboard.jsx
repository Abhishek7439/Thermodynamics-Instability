import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  ComposedChart
} from 'recharts';
import {
  Thermometer, CloudRain, Droplets, Wind, AlertTriangle,
  TrendingUp, MapPin, Activity, Zap, BarChart3, Loader2
} from 'lucide-react';
import { useWeatherData } from '../context/WeatherDataContext';
import { useRegion } from '../context/RegionContext';
import CityCard from '../components/CityCard';

const alertColors = {
  normal: 'border-green-500/40 bg-green-500/10 text-green-400',
  watch: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  warning: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  danger: 'border-red-500/40 bg-red-500/10 text-red-400',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 border border-blue-700/40 text-xs shadow-2xl">
        <p className="text-cyan-300 font-semibold mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-gray-300">{p.name}:</span>
            <strong className="text-white ml-auto">{p.value}{p.name.includes('Temp') ? '°C' : p.name.includes('Humidity') ? '%' : p.name.includes('Rainfall') ? ' mm' : '%'}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ icon: Icon, title, value, unit, subtitle, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-4 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
      style={{ background: color, transform: 'translate(30%, -30%)' }} />
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${color}25` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-blue-400 text-xs">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-sm text-gray-400">{unit}</span>
      </div>
      <p className="text-[10px] text-blue-500 mt-1">{subtitle}</p>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { liveData, liveLoading: loading } = useWeatherData();
  const { selectedRegion } = useRegion();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  if (!liveData || liveData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20 text-white">
        <AlertTriangle className="mr-2 text-yellow-500" /> No weather data available.
      </div>
    );
  }

  const nagpur = liveData.find(c => c.city === 'Nagpur') || liveData[0];
  const maxTempAvg = (liveData.reduce((acc, curr) => acc + (curr.temperature?.max || 0), 0) / liveData.length).toFixed(1);
  const rainTotal = liveData.reduce((acc, curr) => acc + (curr.rainfall?.last24h || 0), 0).toFixed(1);
  const activeAlerts = liveData.filter(c => c.analysis?.alertLevel !== 'GREEN').length;

  const heatmapData = liveData.map(c => ({
    name: c.city,
    temp: c.temperature?.max || 0,
    rainfall: c.rainfall?.last24h || 0,
    humidity: c.humidity?.morning || 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 space-y-6 pb-24"
    >
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black gradient-text">Weather Intelligence Dashboard</h2>
          <p className="text-blue-400 text-sm mt-0.5">
            {selectedRegion} Overview •{' '}
            <span className="text-cyan-400">Live Data Sync</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 glass-light px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot"></div>
            <span className="text-green-400 text-xs font-semibold">Live Mock API Connected</span>
          </div>
          <div className="glass-light px-3 py-1.5 rounded-lg text-xs text-blue-300">
            {liveData.length} Stations Active
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Thermometer} title="Avg Max Temp" value={maxTempAvg} unit="°C" subtitle="Vidarbha Region" color="#ef4444" delay={0} />
        <StatCard icon={CloudRain} title="Total Rainfall (24h)" value={rainTotal} unit="mm" subtitle="Across 12 stations" color="#3b82f6" delay={0.05} />
        <StatCard icon={Droplets} title="Avg Humidity" value={nagpur?.humidity.morning || '45'} unit="%" subtitle="Nagpur Morning RH" color="#06b6d4" delay={0.1} />
        <StatCard icon={AlertTriangle} title="Active Heat Alerts" value={activeAlerts} unit="" subtitle="Districts > 41°C" color="#f97316" delay={0.15} />
      </div>

      {/* Hover-Based Analytics City Grid (MAIN FEATURE) */}
      <div>
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-cyan-400" />
          Interactive City Analytics (Hover for detailed forecast)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {liveData.map((cityData) => (
            <CityCard key={cityData.id} data={cityData} />
          ))}
        </div>
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District temperature comparison */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-sm">Vidarbha Temperature Comparison</h3>
              <p className="text-blue-400 text-xs">Live Max/Min across districts</p>
            </div>
            <BarChart3 size={18} className="text-amber-400" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={heatmapData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,196,0.1)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4e7a9e' }} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10, fill: '#4e7a9e' }} domain={[20, 50]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#60a5e0' }} />
              <Bar dataKey="temp" fill="#f97316" radius={[3, 3, 0, 0]} name="Max Temp" />
              <Bar dataKey="humidity" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Humidity %" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        
        {/* Alert summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Zap size={16} className="text-red-400" />
            Active Weather Alerts
          </h3>
          <div className="space-y-3 h-[260px] overflow-y-auto pr-2 custom-scrollbar">
            {liveData.filter(c => c.analysis?.alertLevel && c.analysis.alertLevel !== 'GREEN').map((alert, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-xl border ${
                alert.analysis?.alertLevel === 'RED' ? alertColors.danger :
                alert.analysis?.alertLevel === 'ORANGE' ? alertColors.warning : alertColors.watch
              }`} style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className="text-base flex-shrink-0">
                  {alert.analysis?.alertLevel === 'RED' ? '🔴' : alert.analysis?.alertLevel === 'ORANGE' ? '🟠' : '🟡'}
                </span>
                <div>
                  <p className="font-bold text-xs mb-0.5">{alert.analysis?.heatwave ? 'Heatwave Warning' : 'High Temperature Alert'}</p>
                  <p className="text-[10px] opacity-80 font-semibold">{alert.city}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">Max temp recorded: {alert.temperature?.max}°C</p>
                </div>
              </div>
            ))}
            {activeAlerts === 0 && (
              <div className="flex gap-3 p-3 rounded-xl border border-green-500/40 bg-green-500/10 text-green-400">
                <span className="text-base flex-shrink-0">🟢</span>
                <div>
                  <p className="font-bold text-xs mb-0.5">No Active Alerts</p>
                  <p className="text-[10px] opacity-80">All districts reporting normal temperatures.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
