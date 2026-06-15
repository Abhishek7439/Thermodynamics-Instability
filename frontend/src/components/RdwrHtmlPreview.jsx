import React from 'react';

export default function RdwrHtmlPreview({ liveData }) {
  if (!liveData || liveData.length === 0) {
    return <div className="text-center p-8 text-blue-400">Loading data...</div>;
  }

  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white text-black p-8 rounded shadow-lg overflow-x-auto print:p-0 print:shadow-none" style={{ minWidth: '800px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header Section */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wider mb-1">Government of India</h2>
        <h3 className="text-lg font-bold uppercase tracking-wider mb-1">Ministry of Earth Sciences</h3>
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2">India Meteorological Department</h2>
        <h3 className="text-lg font-bold uppercase mb-4">Regional Meteorological Centre, Nagpur</h3>
        
        <div className="border-t-2 border-b-2 border-black py-2 mb-4">
          <h1 className="text-2xl font-bold uppercase">Regional Daily Weather Report</h1>
          <p className="text-sm mt-1 font-semibold">Issued at {time} IST on {date}</p>
        </div>
      </div>

      {/* Observations Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold underline mb-3 text-left">Weather Observation Summary (Vidarbha Region):</h3>
        <table className="w-full text-xs border-collapse border border-black text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1" rowSpan="2">Station</th>
              <th className="border border-black p-1" colSpan="3">Temperature (°C)</th>
              <th className="border border-black p-1" colSpan="2">Relative Humidity (%)</th>
              <th className="border border-black p-1" colSpan="2">Rainfall (mm)</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-black p-1">Max</th>
              <th className="border border-black p-1">Min</th>
              <th className="border border-black p-1">Departure</th>
              <th className="border border-black p-1">0830 IST</th>
              <th className="border border-black p-1">1730 IST</th>
              <th className="border border-black p-1">Past 24h</th>
              <th className="border border-black p-1">Since 0830</th>
            </tr>
          </thead>
          <tbody>
            {liveData.map((city, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-black p-1 text-left font-semibold">{city.city}</td>
                <td className="border border-black p-1">{city.rawMaxTemp || city.temperature?.max || '---'}</td>
                <td className="border border-black p-1">{city.rawMinTemp || city.temperature?.min || '---'}</td>
                <td className="border border-black p-1">{city.rawMaxDeparture || city.temperature?.maxDeparture || '---'}</td>
                <td className="border border-black p-1">{city.rh830 || city.humidity?.morning || '---'}</td>
                <td className="border border-black p-1">{city.rh1730 || city.humidity?.evening || '---'}</td>
                <td className="border border-black p-1">{city.rf24 || city.rainfall?.last24h || '0.0'}</td>
                <td className="border border-black p-1">{city.rf9 || '0.0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alerts Section */}
      <div className="mb-6 text-left">
        <h3 className="text-lg font-bold underline mb-2">Weather Alerts & Warnings:</h3>
        <ul className="list-disc pl-5 text-sm font-semibold">
          {liveData.filter(c => c.analysis?.alertLevel !== 'GREEN' && c.analysis?.alertLevel !== 'normal' && c.analysis?.alertLevel).length > 0 ? (
             liveData.filter(c => c.analysis?.alertLevel !== 'GREEN' && c.analysis?.alertLevel !== 'normal' && c.analysis?.alertLevel).map((c, i) => (
               <li key={i} className="mb-1 text-red-700">
                 {c.city}: {c.analysis?.heatwave ? 'Heatwave Warning' : c.alert || 'High Temperature Alert'} (Max Temp: {c.rawMaxTemp || c.temperature?.max}°C)
               </li>
             ))
          ) : (
             <li className="text-green-700">No active severe weather warnings for the region.</li>
          )}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-12 flex justify-between text-sm font-bold text-left">
        <div>
          <p>Duty Officer</p>
          <p>Regional Meteorological Centre</p>
          <p>Nagpur</p>
        </div>
        <div className="text-right">
          <p>Email: rmc.nagpur@imd.gov.in</p>
          <p>Website: https://imdnagpur.gov.in</p>
        </div>
      </div>
    </div>
  );
}
