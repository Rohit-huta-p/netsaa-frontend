// src/services/api/notificationsApi.ts
import axios from 'axios';
import { Notification } from '@/stores/notificationsStore';
import { useAuthStore } from '@/stores/authStore';
import { Platform } from 'react-native';

/**
 * Notifications API Service
 * Handles all notification-related API calls to the backend
 */

// Use env var or production fallback
const getBaseUrl = () => {
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

interface GetNotificationsParams {
    page?: number;
    limit?: number;
}

interface GetNotificationsResponse {
    data: Notification[];
    hasMore: boolean;
    total: number;
    page: number;
    limit: number;
}

/**
 * Map raw backend notification to frontend Notification type
 * Backend uses: body (string), readAt (Date|null)
 * Frontend uses: message (string), isRead (boolean)
 */
function mapNotification(raw: any): Notification {
    return {
        ...raw,
        message: raw.message || raw.body || '',
        isRead: raw.isRead ?? !!raw.readAt,
    };
}

const notificationsApi = {
    /**
     * Fetch notifications with pagination
     */
    getNotifications: async (params: GetNotificationsParams = {}): Promise<GetNotificationsResponse> => {
        const { page = 1, limit = 20 } = params;
        console.log("NOTIFICATIONS API: Fetching notifications...");
        // Backend reads `pageSize` (controller), so send that; keep `limit` too for
        // any consumer/environment that expects the older name.
        const res = await API.get(`/notifications?page=${page}&limit=${limit}&pageSize=${limit}`);
        const raw = res.data;
        const notifications = (raw.data || raw.notifications || []).map(mapNotification);
        const pagination = raw.pagination || {};
        console.log(`NOTIFICATIONS API: Fetched ${notifications.length} notifications`);
        return {
            data: notifications,
            hasMore: pagination.hasMore ?? (notifications.length >= limit),
            total: pagination.total ?? notifications.length,
            page: pagination.page ?? page,
            limit: pagination.limit ?? limit,
        };
    },

    /**
     * Mark a single notification as read
     */
    markNotificationAsRead: async (notificationId: string): Promise<void> => {
        console.log(`NOTIFICATIONS API: Marking notification ${notificationId} as read...`);
        await API.patch(`/notifications/${notificationId}/read`);
        console.log("NOTIFICATIONS API: Notification marked as read");
    },

    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead: async (): Promise<void> => {
        console.log("NOTIFICATIONS API: Marking all notifications as read...");
        await API.patch('/notifications/read-all');
        console.log("NOTIFICATIONS API: All notifications marked as read");
    },

    /**
     * Delete a notification
     */
    deleteNotification: async (notificationId: string): Promise<void> => {
        console.log(`NOTIFICATIONS API: Deleting notification ${notificationId}...`);
        await API.delete(`/notifications/${notificationId}`);
        console.log("NOTIFICATIONS API: Notification deleted");
    },
};

export const { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } = notificationsApi;
export default notificationsApi;
