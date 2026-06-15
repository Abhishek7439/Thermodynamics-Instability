import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-2 border border-blue-700/40 text-xs shadow-xl bg-[#0a1e3d]/95">
      <p className="text-white font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-gray-300">{p.name}: <strong className="text-white">{p.value}{p.name.includes('Temp') ? '°C' : p.name.includes('Humidity') ? '%' : p.name.includes('Rainfall') ? ' mm' : ''}</strong></span>
        </div>
      ))}
    </div>
  );
};

export default function ObservationCharts({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(c => ({
    name: c.city,
    maxTemp: c.temperature?.max ?? 0,
    minTemp: c.temperature?.min ?? 0,
    humidityAm: c.humidity?.morning ?? 0,
    humidityPm: c.humidity?.evening ?? 0,
    rain24h: c.rainfall?.last24h ?? 0,
    rain9h: c.rainfall?.last9h ?? 0
  }));

  return (
    <div className="obs-charts-section mt-8 space-y-6">
      <h3 className="text-lg font-bold text-white mb-4 border-b border-blue-900/40 pb-2">Graphical Analysis (Official Data Only)</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="glass-card p-4 rounded-xl border border-blue-900/40 bg-[#0a1e3d]/60">
          <h4 className="text-sm font-semibold text-blue-300 mb-4">Temperature Comparison (Max & Min)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,196,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#60a5e0', fontSize: 10 }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fill: '#60a5e0', fontSize: 10 }} domain={[15, 50]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '40°C Alert', fill: '#ef4444', fontSize: 10 }} />
                <Bar dataKey="maxTemp" name="Max Temp" fill="#f97316" radius={[2, 2, 0, 0]} />
                <Bar dataKey="minTemp" name="Min Temp" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Chart */}
        <div className="glass-card p-4 rounded-xl border border-blue-900/40 bg-[#0a1e3d]/60">
          <h4 className="text-sm font-semibold text-blue-300 mb-4">Relative Humidity (0830 & 1730 IST)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,196,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#60a5e0', fontSize: 10 }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fill: '#60a5e0', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                <Bar dataKey="humidityAm" name="Morning RH" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                <Bar dataKey="humidityPm" name="Evening RH" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall Chart */}
        <div className="glass-card p-4 rounded-xl border border-blue-900/40 bg-[#0a1e3d]/60 lg:col-span-2">
          <h4 className="text-sm font-semibold text-blue-300 mb-4">Rainfall (Last 24h & 9h)</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,196,0.1)" />
                <XAxis dataKey="name" tick={{ fill: '#60a5e0', fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fill: '#60a5e0', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="rain24h" name="24h Rainfall" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rain9h" name="9h Rainfall" fill="#6366f1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
