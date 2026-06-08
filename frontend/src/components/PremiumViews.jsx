import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, ThermometerSun } from 'lucide-react';

// Helpers
const getTrend = (change) => {
  if (change == null) return { label: 'Unknown', icon: Minus, color: 'text-gray-400' };
  if (change >= 0.5) return { label: 'Rising', icon: TrendingUp, color: 'text-red-400' };
  if (change <= -0.5) return { label: 'Falling', icon: TrendingDown, color: 'text-blue-400' };
  return { label: 'Stable', icon: Minus, color: 'text-gray-400' };
};

const getAlertStatus = (maxTemp, departure) => {
  if (maxTemp >= 45 || departure >= 4.5) return { label: 'WARNING', bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/50', icon: AlertTriangle };
  if (maxTemp >= 42 || departure >= 2.5) return { label: 'WATCH', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50', icon: ThermometerSun };
  return { label: 'NORMAL', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: ShieldCheck };
};

export function PremiumCards({ data, region }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-center py-10">No data available.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
      {data.map((city, idx) => {
        const trend = getTrend(city.temperature?.maxChange);
        const alert = getAlertStatus(city.temperature?.max, city.temperature?.maxDeparture);

        return (
          <motion.div 
            key={city.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 relative overflow-hidden flex flex-col justify-between rounded-xl border border-[#1e3a8a]/50 bg-[#0d1b2a] shadow-lg"
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${city.temperature?.max >= 40 ? 'bg-red-500' : 'bg-cyan-400'}`}></span>
                  <h3 className="text-[13px] font-bold text-white tracking-wide">{city.city}</h3>
                </div>
                <p className="text-[9px] text-blue-400 ml-3">{region}</p>
              </div>
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${alert.bg} ${alert.text} ${alert.border}`}>
                <alert.icon className="w-2.5 h-2.5" />
                {alert.label}
              </div>
            </div>

            {/* Main Temps */}
            <div className="flex justify-between items-center mb-3 px-1">
              <div className="flex flex-col">
                <div className="flex items-start gap-0.5">
                  <span className={`text-[28px] leading-none font-bold ${city.temperature?.max >= 40 ? 'text-red-500' : 'text-orange-400'}`}>
                    {city.temperature?.max ?? '--'}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">°C</span>
                </div>
                <p className="text-[9px] text-blue-500 font-medium">Max</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-start gap-0.5">
                  <span className="text-[20px] leading-none font-bold text-white">
                    {city.temperature?.min ?? '--'}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">°C</span>
                </div>
                <p className="text-[9px] text-blue-500 font-medium">Min</p>
              </div>
            </div>

            {/* Bottom section: Departure on sides, 3-stat box in middle */}
            <div className="flex justify-between items-end">
              <div className="text-[9px] text-blue-500 font-medium pb-1 w-12">Departure</div>
              
              <div className="flex bg-[#112240] rounded-lg px-2 py-1.5 flex-1 mx-1 justify-between items-center">
                 <div className="flex flex-col items-center justify-center w-1/3">
                    <span className="text-white font-bold text-[10px]">{city.humidity?.morning ?? '--'}%</span>
                    <span className="text-blue-400 text-[8px] mt-0.5">AM RH</span>
                 </div>
                 <div className="flex flex-col items-center justify-center w-1/3 border-l border-[#1e3a8a]/50">
                    <span className="text-white font-bold text-[10px]">{city.rainfall?.last24h ?? '0'} mm</span>
                    <span className="text-blue-400 text-[8px] mt-0.5">Rainfall</span>
                 </div>
                 <div className="flex flex-col items-center justify-center w-1/3 border-l border-[#1e3a8a]/50">
                    <span className="text-white font-bold text-[10px]">{trend.label}</span>
                    <span className="text-blue-400 text-[8px] mt-0.5">Trend</span>
                 </div>
              </div>

              <div className={`text-[10px] font-bold pb-1 w-12 text-right ${city.temperature?.maxDeparture > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                {city.temperature?.maxDeparture > 0 ? '+' : ''}{city.temperature?.maxDeparture ?? '-'}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function PremiumTable({ data }) {
  if (!data || data.length === 0) return <p className="text-gray-400 text-center py-10">No data available.</p>;

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-gradient-to-br from-[#0c234a]/80 to-[#071530]/80 shadow-lg backdrop-blur-xl">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-black/20 text-cyan-500/80 text-[10px] uppercase tracking-[0.2em] border-b border-white/10">
            <th className="py-4 px-6 font-semibold">City</th>
            <th className="py-4 px-4 font-semibold text-center">Max °C</th>
            <th className="py-4 px-4 font-semibold text-center">Min °C</th>
            <th className="py-4 px-4 font-semibold text-center">Departure</th>
            <th className="py-4 px-4 font-semibold text-center">RH AM%</th>
            <th className="py-4 px-4 font-semibold text-center">RH PM%</th>
            <th className="py-4 px-4 font-semibold text-center">RF 24h</th>
            <th className="py-4 px-4 font-semibold text-center">Trend</th>
            <th className="py-4 px-6 font-semibold text-right">Alert</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((city, idx) => {
            const trend = getTrend(city.temperature?.maxChange);
            const alert = getAlertStatus(city.temperature?.max, city.temperature?.maxDeparture);
            
            return (
              <tr key={city.id || idx} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-6 font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors">{city.city}</td>
                <td className={`py-4 px-4 text-center font-black ${city.temperature?.max >= 40 ? 'text-red-500' : 'text-orange-400'}`}>
                  {city.temperature?.max ?? '--'}
                </td>
                <td className="py-4 px-4 text-center font-bold text-blue-200">
                  {city.temperature?.min ?? '--'}
                </td>
                <td className={`py-4 px-4 text-center font-bold ${city.temperature?.maxDeparture > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                  {city.temperature?.maxDeparture > 0 ? '+' : ''}{city.temperature?.maxDeparture ?? '-'}
                </td>
                <td className="py-4 px-4 text-center font-semibold text-cyan-300">{city.humidity?.morning ?? '--'}</td>
                <td className="py-4 px-4 text-center font-semibold text-cyan-500">{city.humidity?.evening ?? '--'}</td>
                <td className="py-4 px-4 text-center font-semibold text-blue-300">{city.rainfall?.last24h ?? '0'}</td>
                <td className="py-4 px-4 text-center">
                  <div className={`flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${trend.color}`}>
                    <trend.icon className="w-3.5 h-3.5" />
                    {trend.label}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] uppercase tracking-wider font-bold border ${alert.bg} ${alert.text} ${alert.border}`}>
                    {alert.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
