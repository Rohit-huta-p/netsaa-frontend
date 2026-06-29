// src/services/api/eventNotifPrefsApi.ts
//
// API client for event-notification preference read/write and
// organizer announcement dispatch.
//
// Prefs endpoint lives on the users-service:
//   GET  /v1/users/me/notifications/preferences
//   PATCH /v1/users/me/notifications/preferences
//
// Announcement endpoint lives on the events-service:
//   POST /v1/events/:id/notifications
//
// Both use the shared EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_EVENT_URL
// env vars (with production fallbacks) and attach Bearer token.

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const USER_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com';

const EVENT_BASE =
  process.env.EXPO_PUBLIC_API_EVENT_URL ||
  'https://netsaa-events-service.onrender.com';

function makeClient(baseURL: string) {
  const instance = axios.create({ baseURL, timeout: 15000 });
  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
}

const userClient = makeClient(USER_BASE);
const eventClient = makeClient(EVENT_BASE);

// ------------------------------------------------------------------ types

export interface NotifPrefs {
  reminders: { push: boolean; email: boolean; sms: boolean };
  announcements: { push: boolean; email: boolean; sms: boolean };
  reviews: { push: boolean; email: boolean; sms: boolean };
}

export type NotifPrefsCategory = keyof NotifPrefs;
export type NotifPrefsChannel = 'push' | 'email' | 'sms';

export type NotifPrefsPatch = Partial<
  Record<NotifPrefsCategory, Partial<Record<NotifPrefsChannel, boolean>>>
>;

export interface AnnouncementPayload {
  body: string;
  channels: ('push' | 'email' | 'sms')[];
  audience: 'all' | 'confirmed' | 'waitlisted' | 'vip';
  subject?: string;
}

// ------------------------------------------------------------------ API

export const eventNotifPrefsApi = {
  /** GET /v1/users/me/notifications/preferences → NotifPrefs */
  getPrefs: async (): Promise<NotifPrefs> => {
    const r = await userClient.get('/v1/users/me/notifications/preferences');
    return r.data.data;
  },

  /** PATCH /v1/users/me/notifications/preferences → updated NotifPrefs */
  updatePrefs: async (patch: NotifPrefsPatch): Promise<NotifPrefs> => {
    const r = await userClient.patch(
      '/v1/users/me/notifications/preferences',
      patch,
    );
    return r.data.data;
  },

  /**
   * POST /v1/events/:id/notifications
   * Returns { notificationId }. Throws on 429 (5/day quota).
   */
  sendAnnouncement: async (
    eventId: string,
    payload: AnnouncementPayload,
  ): Promise<{ notificationId: string }> => {
    const r = await eventClient.post(
      `/v1/events/${eventId}/notifications`,
      payload,
    );
    return r.data.data;
  },
};

export default eventNotifPrefsApi;
