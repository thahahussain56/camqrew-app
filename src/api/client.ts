import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://camcrew-in.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 12000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@camcrew_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.Cookie = `session=${token}; cc_session=${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
