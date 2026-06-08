import { createContext, useContext, useState } from 'react';

/**
 * Global region selection context.
 * Regions match the official IMD subdivision list served by the backend.
 */
export const regionsList = [
  'Vidarbha Region',
  'Marathwada Region',
  'Madhya Maharashtra Region',
  'Mumbai & Konkan Region',
  'West Madhya Pradesh',
  'East Madhya Pradesh',
  'Chhattisgarh',
];

const RegionContext = createContext(null);

export function RegionProvider({ children }) {
  const [selectedRegion, setSelectedRegion] = useState('Vidarbha Region');

  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion, regionsList }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within a RegionProvider');
  return ctx;
}
