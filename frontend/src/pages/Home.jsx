import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { fetchLiveWeather } from '../services/api';
import { useRegion } from '../context/RegionContext';

export default function Home() {
  const { selectedRegion } = useRegion();
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLiveWeather(selectedRegion).then(data => {
      setLiveData(data);
      setLoading(false);
    });
  }, [selectedRegion]);

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
      className="home-content"
    >
      {/* Row 1: Radar + Warnings Region Wise */}
      <div className="home-grid-2col">
        <div className="home-panel">
          <div className="home-panel-title">Nagpur Weather Radar - Live</div>
          <div className="home-panel-body home-panel-centered">
            <img
              src="/images/caz_ngp.gif"
              alt="Nagpur Weather Radar"
              className="home-radar-img"
            />
            <a
              href="https://mausam.imd.gov.in/responsive/radar_animation.php?id=Nagpur"
              target="_blank"
              rel="noopener noreferrer"
              className="home-panel-link"
            >
              Click To View Animation
            </a>
          </div>
        </div>

        <div className="home-panel">
          <div className="home-panel-title">NAGPUR RMC - Warnings Region Wise</div>
          <div className="home-panel-body home-panel-centered">
            <WarningMapRegion data={liveData} />
            <a href="#/forecast/warning" className="home-panel-link">
              Click here to view Five Days Warnings (Region Wise)
            </a>
          </div>
        </div>
      </div>

      {/* Row 2: Warnings District Wise + Local Weather Report */}
      <div className="home-grid-2col">
        <div className="home-panel">
          <div className="home-panel-title">NAGPUR RMC - Warnings District Wise</div>
          <div className="home-panel-body home-panel-centered">
            <WarningMapDistrict data={liveData} />
            <a href="#/forecast/districtwise" className="home-panel-link">
              Click here to view Five Days Warnings (District Wise)
            </a>
          </div>
        </div>

        <div className="home-panel">
          <div className="home-panel-title">NAGPUR RMC - Local Weather Report</div>
          <div className="home-panel-body">
            <LocalWeatherReport data={liveData} />
            <a href="#/forecast/local" className="home-panel-link">
              Click here to view District Wise Weather Report and Forecast
            </a>
          </div>
        </div>
      </div>

      {/* Row 3: Weather Forecast (full width) */}
      <div className="home-panel">
        <div className="home-panel-title">NAGPUR RMC - Weather Forecast</div>
        <div className="home-panel-body">
          <WeatherForecastPanel data={liveData} />
        </div>
      </div>

      {/* IMD Products And Services */}
      <div className="home-panel imd-products-section">
        <div className="imd-products-title">IMD Products And Services</div>
        <div className="imd-products-grid">
          {[
            { label: 'Satellite', img: '/images/saticon.jpg', url: 'https://mausam.imd.gov.in/imd_latest/contents/satellite.php' },
            { label: 'Radar', img: '/images/radaricon.gif', url: 'https://mausam.imd.gov.in/responsive/radar.php?id=Nagpur' },
            { label: 'Cyclone', img: '/images/rsmcicon.gif', url: 'https://mausam.imd.gov.in/imd_latest/contents/cyclone.php' },
            { label: 'Monsoon', img: '/images/monsoonicon.jpg', url: 'https://mausam.imd.gov.in/imd_latest/contents/monsoon.php' },
          ].map((product) => (
            <div key={product.label} className="imd-product-card">
              <div className="imd-product-label">{product.label}</div>
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <img src={product.img} alt={product.label} className="imd-product-img" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Warning Map Region Wise (SVG-based) ─── */
function WarningMapRegion({ data }) {
  const getAlertColor = (level) => {
    if (level === 'RED') return '#ff0000';
    if (level === 'ORANGE') return '#ff8c00';
    if (level === 'YELLOW') return '#ffd700';
    return '#00cc00';
  };

  const nagpur = data.find(c => c.city === 'Nagpur');
  const regionAlert = nagpur?.analysis?.alertLevel || 'GREEN';

  return (
    <div className="warning-map-container">
      <svg viewBox="0 0 400 320" className="warning-map-svg">
        {/* Vidarbha Region simplified map */}
        <rect x="20" y="20" width="360" height="260" rx="8" fill="rgba(10,42,94,0.3)" stroke="rgba(59,130,196,0.3)" />
        
        {/* District blocks */}
        {data.slice(0, 12).map((city, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 35 + col * 88;
          const y = 40 + row * 85;
          const alertColor = getAlertColor(city.analysis?.alertLevel || 'GREEN');
          return (
            <g key={city.id}>
              <rect
                x={x} y={y} width="78" height="68" rx="6"
                fill={alertColor + '25'}
                stroke={alertColor}
                strokeWidth="1.5"
                className="warning-map-district"
              />
              <text x={x + 39} y={y + 28} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">
                {city.city}
              </text>
              <text x={x + 39} y={y + 44} textAnchor="middle" fill={alertColor} fontSize="12" fontWeight="bold">
                {city.temperature?.max?.toFixed(1) || '--'}°C
              </text>
              <text x={x + 39} y={y + 58} textAnchor="middle" fill="#94a3b8" fontSize="8">
                {city.analysis?.alertLevel || 'GREEN'}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="warning-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#00cc00' }}></span>Green</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ffd700' }}></span>Yellow</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ff8c00' }}></span>Orange</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ff0000' }}></span>Red</span>
      </div>
    </div>
  );
}

/* ─── Warning Map District Wise ─── */
function WarningMapDistrict({ data }) {
  const getAlertColor = (level) => {
    if (level === 'RED') return '#ff0000';
    if (level === 'ORANGE') return '#ff8c00';
    if (level === 'YELLOW') return '#ffd700';
    return '#00cc00';
  };

  return (
    <div className="warning-map-container">
      <svg viewBox="0 0 400 320" className="warning-map-svg">
        <rect x="20" y="20" width="360" height="260" rx="8" fill="rgba(10,42,94,0.3)" stroke="rgba(59,130,196,0.3)" />
        {data.slice(0, 12).map((city, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 30 + col * 120;
          const y = 35 + row * 65;
          const alertColor = getAlertColor(city.analysis?.alertLevel || 'GREEN');
          return (
            <g key={city.id}>
              <rect
                x={x} y={y} width="108" height="52" rx="5"
                fill={alertColor + '20'}
                stroke={alertColor + '80'}
                strokeWidth="1"
                className="warning-map-district"
              />
              <text x={x + 54} y={y + 20} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="600">
                {city.city}
              </text>
              <text x={x + 30} y={y + 38} textAnchor="middle" fill={alertColor} fontSize="10" fontWeight="bold">
                {city.temperature?.max?.toFixed(1) || '--'}°C
              </text>
              <text x={x + 80} y={y + 38} textAnchor="middle" fill="#67e8f9" fontSize="9">
                {city.humidity?.morning || '--'}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="warning-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#00cc00' }}></span>No Warning</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ffd700' }}></span>Watch</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ff8c00' }}></span>Alert</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ff0000' }}></span>Warning</span>
      </div>
    </div>
  );
}

/* ─── Local Weather Report ─── */
function LocalWeatherReport({ data }) {
  const nagpur = data.find(c => c.city === 'Nagpur') || data[0];
  if (!nagpur) return null;

  return (
    <div className="local-weather-report">
      <div className="lwr-header">
        <span className="lwr-city">Nagpur</span>
        <span className="lwr-date">Observed On {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </div>
      <table className="lwr-table">
        <tbody>
          <tr>
            <td className="lwr-label">Maximum Temperature</td>
            <td className="lwr-value">{nagpur.temperature?.max?.toFixed(1) || '--'} °C</td>
          </tr>
          <tr>
            <td className="lwr-label">Minimum Temperature</td>
            <td className="lwr-value">{nagpur.temperature?.min?.toFixed(1) || '--'} °C</td>
          </tr>
          <tr>
            <td className="lwr-label">24 hrs Change (Max)</td>
            <td className="lwr-value">{nagpur.temperature?.maxChange?.toFixed(1) || '--'} °C</td>
          </tr>
          <tr>
            <td className="lwr-label">Departure (Max)</td>
            <td className="lwr-value">{nagpur.temperature?.maxDeparture?.toFixed(1) || '--'} °C</td>
          </tr>
          <tr>
            <td className="lwr-label">Humidity 0830 hrs IST</td>
            <td className="lwr-value">{nagpur.humidity?.morning || '--'} %</td>
          </tr>
          <tr>
            <td className="lwr-label">Humidity 1730 hrs IST</td>
            <td className="lwr-value">{nagpur.humidity?.evening || '--'} %</td>
          </tr>
          <tr>
            <td className="lwr-label">Rainfall (last 24 hrs)</td>
            <td className="lwr-value">{nagpur.rainfall?.last24h?.toFixed(1) || '0.0'} mm</td>
          </tr>
          <tr>
            <td className="lwr-label">Alert Level</td>
            <td className={`lwr-value lwr-alert-${(nagpur.analysis?.alertLevel || 'GREEN').toLowerCase()}`}>
              {nagpur.analysis?.alertLevel || 'GREEN'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── Weather Forecast Panel ─── */
function WeatherForecastPanel({ data }) {
  return (
    <div className="forecast-panel-home">
      <table className="forecast-table-home">
        <thead>
          <tr>
            <th>City</th>
            <th>Max Temp (°C)</th>
            <th>Min Temp (°C)</th>
            <th>Humidity AM (%)</th>
            <th>Humidity PM (%)</th>
            <th>Rainfall 24h (mm)</th>
            <th>Alert Level</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((city) => (
            <tr key={city.id}>
              <td className="forecast-city-name">{city.city}</td>
              <td className={`forecast-temp ${city.temperature?.max >= 45 ? 'temp-extreme' : city.temperature?.max >= 43 ? 'temp-high' : ''}`}>
                {city.temperature?.max?.toFixed(1) || '--'}
              </td>
              <td>{city.temperature?.min?.toFixed(1) || '--'}</td>
              <td>{city.humidity?.morning || '--'}</td>
              <td>{city.humidity?.evening || '--'}</td>
              <td>{city.rainfall?.last24h?.toFixed(1) || '0.0'}</td>
              <td>
                <span className={`alert-badge alert-${(city.analysis?.alertLevel || 'GREEN').toLowerCase()}`}>
                  {city.analysis?.alertLevel || 'GREEN'}
                </span>
              </td>
              <td>{city.analysis?.trend || '--'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
