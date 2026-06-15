import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, LayoutGrid, List } from 'lucide-react';
import { useRegion, regionsList } from '../context/RegionContext';
import { useWeatherData } from '../context/WeatherDataContext';
import ObservationCharts from '../components/ObservationCharts';
import { PremiumCards, PremiumTable } from '../components/PremiumViews';

export default function Observations() {
  const { selectedRegion, setSelectedRegion } = useRegion();
  const [viewMode, setViewMode] = useState('cards');

  const {
    observationsData: liveData,
    observedDates,
    observationsLoading: loading,
  } = useWeatherData();

  const filteredCities = liveData; // backend now returns just the cities for this region or we can filter it if needed
  
  // Try to use observedDates from context or fallback to today
  const observedDate = observedDates?.maxDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="obs-page"
    >
      {/* Title & Subtitle */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#60a5fa] mb-1">
          Weather Observations
        </h2>
        <p className="text-xs text-[#60a5fa] font-medium">
          Live data from surface observatories across Central India • Observed on {observedDate}
        </p>
      </div>

      {/* Header section with Tabs and Toggle */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
        {/* Region Tabs */}
        <div className="flex flex-wrap gap-2">
          {regionsList.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-5 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 ${
                selectedRegion === region 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                  : 'bg-[#0a1e3d]/80 text-blue-200 border-cyan-500/30 hover:border-cyan-400'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-[#0a1e3d]/80 rounded-full border border-blue-900/50 p-1 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center justify-center px-4 py-1 rounded-full text-[10px] font-bold transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center justify-center px-4 py-1 rounded-full text-[10px] font-bold transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-blue-300 hover:text-white'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Dynamic View Render */}
      {viewMode === 'cards' ? (
        <PremiumCards data={filteredCities} region={selectedRegion} />
      ) : (
        <PremiumTable data={filteredCities} />
      )}

      {/* Note */}
      <p className="obs-note">
        *** Departures are based on Pentad Normals 1991-2020 *** | Source: Regional Meteorological Centre, Nagpur
      </p>

      {/* Official Parameter Charts */}
      <ObservationCharts data={filteredCities} />
    </motion.div>
  );
}
