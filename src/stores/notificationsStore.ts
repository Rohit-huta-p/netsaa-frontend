// src/stores/notificationsStore.ts
import { create } from 'zustand';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/api/notificationsApi';

// Notification type definition — mirrors backend INotification
export type Notification = {
    _id: string;
    userId: string;
    actorId?: string | {
        _id: string;
        displayName?: string;
        profileImageUrl?: string;
        artistType?: string;
    };
    type: 'connection' | 'message' | 'gig' | 'event' | 'payment' | 'contract' | 'system' | 'profile';
    subtype: string;
    title: string;
    message: string; // mapped from body on backend
    body?: string;   // raw field name from backend
    entityType?: 'gig' | 'event' | 'conversation' | 'contract';
    entityId?: string;
    data?: {
        route?: string;
        params?: Record<string, any>;
        [key: string]: any;
    };
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

/**
 * Shape of the real-time payload the users-service emits over Socket.IO
 * (`notification:new`). It is a PARTIAL notification — note `id` (not `_id`),
 * `body` (not `message`), and no `isRead`/`actorId`/`updatedAt`.
 * See netsa-backend/users-service/src/notifications/notification.worker.ts.
 */
export type NotificationSocketPayload = {
    id: string;
    type: Notification['type'];
    subtype: string;
    title: string;
    body?: string;
    data?: Notification['data'];
    createdAt: string;
};

/** Normalize a socket payload into a store Notification so it renders like a
 *  fetched one (actorId absent → the card shows the semantic icon, not an avatar,
 *  until the next fetch backfills it). */
export function normalizeSocketNotification(p: NotificationSocketPayload): Notification {
    return {
        _id: p.id,
        userId: '',
        type: p.type,
        subtype: p.subtype,
        title: p.title,
        message: p.body ?? '',
        body: p.body,
        data: p.data,
        isRead: false,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
    };
}

type NotificationsState = {
    // State
    notifications: Notification[];

    // Derived state - unread count is computed from notifications array
    get unreadCount(): number;

    // Pagination state
    page: number;
    hasMore: boolean;
    isLoadingMore: boolean;

    // Actions
    fetchNotifications: () => Promise<void>;
    loadMore: () => Promise<void>; // Load next page for infinite scroll
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    incrementUnread: (notification: Notification) => void; // For socket events
    resetUnread: () => void; // When notification screen opens

    // Internal state management
    isLoading: boolean;
    error: string | null;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    // Initial state
    notifications: [],
    isLoading: false,
    error: null,

    // Pagination state
    page: 1,
    hasMore: true,
    isLoadingMore: false,

    // Derived state - unread count computed from notifications
    get unreadCount() {
        return get().notifications.filter(n => !n.isRead).length;
    },

    // Fetch all notifications from the API (first page)
    fetchNotifications: async () => {
        set({ isLoading: true, error: null, page: 1 });

        try {
            const response = await getNotifications({ page: 1, limit: 20 });

            set({
                notifications: response.data,
                hasMore: response.hasMore,
                page: 1,
                isLoading: false
            });

            console.log(`Fetched ${response.data.length} notifications from API`);
        } catch (error: any) {
            const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
            console.error('Failed to fetch notifications:', serverMsg || error.message);
            set({
                error: serverMsg || error.message || 'Failed to fetch notifications',
                isLoading: false
            });
        }
    },

    // Load more notifications for infinite scroll
    loadMore: async () => {
        const { hasMore, isLoadingMore, page } = get();

        // Don't load if already loading or no more data
        if (isLoadingMore || !hasMore) return;

        set({ isLoadingMore: true, error: null });

        try {
            const nextPage = page + 1;

            const response = await getNotifications({ page: nextPage, limit: 20 });

            set(state => ({
                notifications: [...state.notifications, ...response.data],
                hasMore: response.hasMore,
                page: nextPage,
                isLoadingMore: false
            }));

            console.log(`Loaded ${response.data.length} more notifications (page ${nextPage})`);
        } catch (error: any) {
            const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
            console.error('Failed to load more notifications:', serverMsg || error.message);
            set({
                error: serverMsg || error.message || 'Failed to load more notifications',
                isLoadingMore: false
            });
        }
    },

    // Mark a single notification as read
    markAsRead: async (notificationId: string) => {
        try {
            // Optimistically update UI
            set(state => ({
                notifications: state.notifications.map(n =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            }));

            // Call API to persist the change
            await markNotificationAsRead(notificationId);

            console.log(`Marked notification ${notificationId} as read`);
        } catch (error: any) {
            const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
            console.error('Failed to mark notification as read:', serverMsg || error.message);
            // Revert optimistic update on error
            get().fetchNotifications();
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            // Optimistically update UI
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            }));

            // Call API to persist the change
            await markAllNotificationsAsRead();

            console.log('Marked all notifications as read');
        } catch (error: any) {
            const serverMsg = error.response?.data?.msg || error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message);
            console.error('Failed to mark all notifications as read:', serverMsg || error.message);
            // Revert optimistic update on error
            get().fetchNotifications();
        }
    },

    // Prepend a new notification received in real time via socket.
    // Deduped by _id so a socket insert + a later fetch (or a double emit)
    // can't create a duplicate row.
    incrementUnread: (notification: Notification) => {
        set(state =>
            state.notifications.some(n => n._id === notification._id)
                ? state
                : { notifications: [notification, ...state.notifications] }
        );
    },

    // Reset unread count when notification screen opens
    // This marks all current notifications as read locally and syncs with server
    resetUnread: () => {
        const unreadNotifications = get().notifications.filter(n => !n.isRead);

        if (unreadNotifications.length > 0) {
            // Mark all as read in the UI immediately
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            }));

            // Sync with server in the background
            get().markAllAsRead();
        }
    },
}));

export default useNotificationsStore;
