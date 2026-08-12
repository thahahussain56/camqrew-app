import { useMemo } from 'react';
import { INDIA_LOCATIONS } from '../constants/locations';

export const useIndiaLocations = () => {
  const states = useMemo(() => Object.keys(INDIA_LOCATIONS).sort(), []);

  const getDistricts = (stateName: string): string[] => {
    if (!stateName || !INDIA_LOCATIONS[stateName]) return [];
    return Object.keys(INDIA_LOCATIONS[stateName]).sort();
  };

  const getCities = (stateName: string, districtName: string): string[] => {
    if (!stateName || !districtName || !INDIA_LOCATIONS[stateName]?.[districtName]) return [];
    return INDIA_LOCATIONS[stateName][districtName].sort();
  };

  return {
    states,
    getDistricts,
    getCities,
  };
};
