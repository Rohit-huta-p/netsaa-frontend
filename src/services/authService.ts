// src/services/authService.ts
import axios from 'axios';
import type { AuthResponse, User, VerifyOtpResponse } from '../types';

import { useAuthStore } from '../stores/authStore';

import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Always prefer env var, fallback to production
  return process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com';
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

  sendOtp: async (payload: { phone: string }): Promise<any> => {
    console.log("AUTH SERVICE: Sending OTP to phone...")
    const res = await API.post('/auth/send-otp', payload);
    return res.data;
  },

  checkEmail: async (payload: { email: string }): Promise<{ exists: boolean }> => {
    const res = await API.post('/auth/check-email', payload);
    return res.data;
  },

  checkPhone: async (payload: { phone: string }): Promise<{ exists: boolean }> => {
    const res = await API.post('/auth/check-phone', payload);
    return res.data;
  },

  verifyOtp: async (payload: { phone: string; otp: string }): Promise<VerifyOtpResponse> => {
    console.log("AUTH SERVICE: Verifying OTP...");
    try {
      const res = await API.post('/auth/verify-otp', payload);
      console.log("AUTH SERVICE: OTP Verified successfully");
      return res.data;
    } catch (error: any) {
      // Intercept 404 (user not found) and return it as a successful response
      // so the component can show the new-user modal instead of an error alert.
      if (error.response?.status === 404 && error.response?.data?.data?.userExists === false) {
        console.log("AUTH SERVICE: OTP valid but user not found — returning register flow hint");
        return error.response.data as VerifyOtpResponse;
      }
      throw error;
    }
  },

  getMe: async (): Promise<User> => {
    // GET /auth/me
    console.log("AUTH SERVICE: Getting user...")
    const res = await API.get('/auth/me');
    console.log("AUTH SERVICE: Got user successfully")
    return res.data;
  },

  getUserById: async (id: string): Promise<User> => {
    // GET /users/:id
    console.log(`AUTH SERVICE: Getting user ${id}...`)
    // Fallback URL if standard one fails, leveraging existing backend structure assumption
    const res = await API.get(`/users/${id}`);
    console.log("USER details fetched: ", res.data)
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    console.log("AUTH SERVICE: Updating profile...", data);
    const res = await API.patch('/auth/me', data);
    console.log("AUTH SERVICE: Profile updated successfully");
    return res.data;
  },

  updateOrganizer: async (data: any): Promise<any> => {
    console.log("AUTH SERVICE: Updating organizer...", data);
    const res = await API.patch('/organizers/me', data);
    console.log("AUTH SERVICE: Organizer updated successfully");
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

  forgotPassword: async (payload: { email: string }): Promise<{ msg: string }> => {
    console.log("AUTH SERVICE: Requesting password reset...");
    const res = await API.post('/auth/forgot-password', payload);
    return res.data;
  },

  resetPassword: async (payload: { email: string; code: string; newPassword: string }): Promise<{ msg: string }> => {
    console.log("AUTH SERVICE: Resetting password...");
    const res = await API.post('/auth/reset-password', payload);
    return res.data;
  },
};

export default authService;
