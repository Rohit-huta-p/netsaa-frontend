// src/services/api/notificationsApi.ts
import { API_URL } from '@/lib/constants';
import { Notification } from '@/stores/notificationsStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Notifications API Service
 * Handles all notification-related API calls to the backend
 */

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
 * Fetch notifications with pagination
 */
export async function getNotifications(
    params: GetNotificationsParams = {}
): Promise<GetNotificationsResponse> {
    const { page = 1, limit = 20 } = params;
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(
        `${API_URL}/api/users/notifications?page=${page}&limit=${limit}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch notifications' }));
        throw new Error(error.message || 'Failed to fetch notifications');
    }

    return response.json();
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(
        `${API_URL}/api/users/notifications/${notificationId}/read`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to mark notification as read' }));
        throw new Error(error.message || 'Failed to mark notification as read');
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(
        `${API_URL}/api/users/notifications/read-all`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to mark all notifications as read' }));
        throw new Error(error.message || 'Failed to mark all notifications as read');
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(
        `${API_URL}/api/users/notifications/${notificationId}`,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
        throw new Error(error.message || 'Failed to delete notification');
    }
}
