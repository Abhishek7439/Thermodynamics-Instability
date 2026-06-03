import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { fetchLiveWeather } from '../services/api';

const regionsList = ['Vidarbha Region', 'Marathwada', 'Madhya Maharashtra'];

export default function Observations() {
  const [selectedRegion, setSelectedRegion] = useState('Vidarbha Region');
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveWeather().then(data => {
      setLiveData(data);
      setLoading(false);
    });
  }, []);

  const filteredCities = liveData.filter(c => c.region === selectedRegion);
  const observedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
      {/* Title */}
      <h2 className="obs-title">Weather Observations</h2>
      <hr className="obs-title-line" />

      {/* Region Tabs */}
      <div className="obs-region-tabs">
        {regionsList.map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`obs-region-tab ${selectedRegion === region ? 'active' : ''}`}
          >
            {region}
          </button>
        ))}
      </div>

      {/* Region Label */}
      <p className="obs-region-label">
        {selectedRegion} :
      </p>

      {/* Observations Table — Exact official format */}
      <div className="obs-table-wrapper">
        <table className="obs-table">
          <thead>
            {/* Group Header Row */}
            <tr>
              <th rowSpan="2" className="obs-group-header" style={{ minWidth: '100px' }}>City</th>
              <th colSpan="3" className="obs-group-header">Temperature (°C)</th>
              <th colSpan="3" className="obs-group-header">Temperature (°C)</th>
              <th colSpan="2" className="obs-group-header">Relative Humidity (%)</th>
              <th colSpan="2" className="obs-group-header">Rainfall (mm)</th>
            </tr>
            {/* Sub Header Row */}
            <tr>
              <th>Maximum</th>
              <th>24 hrs Change</th>
              <th>Departure</th>
              <th>Minimum</th>
              <th>24 hrs Change</th>
              <th>Departure</th>
              <th>at 0830 hrs IST</th>
              <th>at 1730 hrs IST</th>
              <th>last 24 hrs upto 0830 hrs IST</th>
              <th>last 9 hrs upto 1730 hrs IST</th>
            </tr>
          </thead>
          <tbody>
            {/* Observed Date Row */}
            <tr className="obs-date-row">
              <td colSpan="4" style={{ textAlign: 'center' }}>
                Observed On {observedDate}
              </td>
              <td colSpan="3"></td>
              <td colSpan="2" style={{ textAlign: 'center' }}>
                Observed On {observedDate}
              </td>
              <td colSpan="2"></td>
            </tr>

            {/* Data Rows */}
            {filteredCities.map((city) => (
              <tr key={city.id}>
                <td className="obs-city">{city.city}</td>
                {/* Maximum Temp */}
                <td className={city.temperature?.max >= 40 ? 'obs-temp-high' : ''}>
                  {city.temperature?.max ?? '---'}
                </td>
                {/* 24 hrs Change (Max) */}
                <td className={
                  city.temperature?.maxChange > 0 ? 'obs-temp-change-pos' :
                  city.temperature?.maxChange < 0 ? 'obs-temp-change-neg' : ''
                }>
                  {city.temperature?.maxChange != null ? city.temperature.maxChange.toFixed(1) : '---'}
                </td>
                {/* Departure (Max) */}
                <td className={
                  city.temperature?.maxDeparture > 0 ? 'obs-departure-pos' :
                  city.temperature?.maxDeparture < 0 ? 'obs-departure-neg' : ''
                }>
                  {city.temperature?.maxDeparture != null ? city.temperature.maxDeparture.toFixed(1) : '---'}
                </td>
                {/* Minimum Temp */}
                <td>{city.temperature?.min ?? '---'}</td>
                {/* 24 hrs Change (Min) */}
                <td className={
                  city.temperature?.minChange > 0 ? 'obs-temp-change-pos' :
                  city.temperature?.minChange < 0 ? 'obs-temp-change-neg' : ''
                }>
                  {city.temperature?.minChange != null ? city.temperature.minChange.toFixed(1) : '---'}
                </td>
                {/* Departure (Min) */}
                <td className={
                  city.temperature?.minDeparture > 0 ? 'obs-departure-pos' :
                  city.temperature?.minDeparture < 0 ? 'obs-departure-neg' : ''
                }>
                  {city.temperature?.minDeparture != null ? city.temperature.minDeparture.toFixed(1) : '---'}
                </td>
                {/* Humidity AM */}
                <td>{city.humidity?.morning ?? '---'}</td>
                {/* Humidity PM */}
                <td>{city.humidity?.evening ?? '---'}</td>
                {/* Rainfall 24h */}
                <td>{city.rainfall?.last24h?.toFixed(1) ?? '0.0'}</td>
                {/* Rainfall 9h */}
                <td>{city.rainfall?.last9h?.toFixed(1) ?? '0.0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <p className="obs-note">
        *** Departures are based on Pentad Normals 1991-2020 *** | Source: Regional Meteorological Centre, Nagpur
      </p>
    </motion.div>
  );
}
