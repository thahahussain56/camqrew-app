import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface CityLocation {
  city: string;
  state: string;
  district?: string;
}

interface LocationState {
  selectedCity: CityLocation;
  isLoadingLocation: boolean;
  locationError: string | null;
  detectLocation: () => Promise<void>;
  setSelectedCity: (city: CityLocation) => Promise<void>;
  loadPersistedLocation: () => Promise<void>;
}

const DEFAULT_LOCATION: CityLocation = { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' };

export const useLocationStore = create<LocationState>((set, get) => ({
  selectedCity: DEFAULT_LOCATION,
  isLoadingLocation: false,
  locationError: null,

  loadPersistedLocation: async () => {
    try {
      const stored = (await AsyncStorage.getItem('@camqrew_location')) || (await AsyncStorage.getItem('@camcrew_location'));
      if (stored) {
        set({ selectedCity: JSON.parse(stored) });
      } else {
        // No stored location, attempt to detect
        get().detectLocation();
      }
    } catch (e) {
      console.error('Failed to load location', e);
      get().detectLocation();
    }
  },

  setSelectedCity: async (city: CityLocation) => {
    set({ selectedCity: city });
    await AsyncStorage.setItem('@camqrew_location', JSON.stringify(city));
  },

  detectLocation: async () => {
    set({ isLoadingLocation: true, locationError: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode.city) {
        const newCity = {
          city: geocode.city,
          state: geocode.region || geocode.subregion || 'Unknown',
        };
        set({ selectedCity: newCity });
        await AsyncStorage.setItem('@camqrew_location', JSON.stringify(newCity));
      }
    } catch (error: any) {
      set({ locationError: error.message });
      console.log('Location detection failed:', error.message);
    } finally {
      set({ isLoadingLocation: false });
    }
  },
}));
