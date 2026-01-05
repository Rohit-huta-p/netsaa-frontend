// src/services/authService.ts
import axios from 'axios';
import type { AuthResponse, User } from '../types';

import { useAuthStore } from '../stores/authStore';

import { Platform } from 'react-native';

const getBaseUrl = () => {
  // if (process.renv.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // Use localhost ONLY for web
  if (Platform.OS === 'web') return 'http://localhost:5001/api';
  // Use LAN IP for both iOS and Android (Physical devices & Emulators)
  // NOTE: Update this IP if you change networks or your local IP changes
  return 'http://10.197.171.107:5001/api';
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

// Request Interceptor: Attach Token
API.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
    }
    return Promise.reject(error);
  }
);

const authService = {
  register: async (payload: any): Promise<{ token?: string; user?: any }> => {
    // POST /auth/register/email
    console.log("Registering...")
    const res = await API.post('/auth/register/email', payload);
    return res.data;
  },

  login: async (creds: { email: string; password: string }): Promise<AuthResponse> => {
    // POST /auth/login/email
    console.log("AUTH SERVICE: Logging in...")
    const res = await API.post('/auth/login/email', creds);
    console.log("AUTH SERVICE: Logged in successfully")
    return res.data;
  },

  getMe: async (): Promise<User> => {
    // GET /auth/me
    console.log("AUTH SERVICE: Getting user...")
    const res = await API.get('/auth/me');
    console.log("AUTH SERVICE: Got user successfully")
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    console.log("AUTH SERVICE: Updating profile...", data);
    const res = await API.patch('/auth/me', data);
    console.log("AUTH SERVICE: Profile updated successfully");
    return res.data;
  },

  logout: async (payload: { token?: string | null }): Promise<void> => {
    // Example: POST /auth/logout
    try {
      console.log("Logging out (api)...")
      await API.post('/auth/logout', payload);
      console.log("Logged out (api)")
    } catch (e) {
      console.log("Failed to log out (api)")
      // ignore network errors on logout
    }
  },
};

export default authService;
