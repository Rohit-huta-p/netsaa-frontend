// src/stores/notificationsStore.ts
import { create } from 'zustand';

// Notification type definition
export type Notification = {
    _id: string;
    userId: string;
    type: string; // e.g., 'connection_request', 'event_reminder', 'message', etc.
    title: string;
    message: string;
    data?: {
        route?: string; // Deep link route for navigation (e.g., '/events/123', '/gigs/456')
        [key: string]: any; // Additional metadata
    };
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

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
            const response = await import('@/services/api/notificationsApi').then(
                (module) => module.getNotifications({ page: 1, limit: 20 })
            );

            set({
                notifications: response.data,
                hasMore: response.hasMore,
                page: 1,
                isLoading: false
            });

            console.log(`Fetched ${response.data.length} notifications from API`);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch notifications',
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

            const response = await import('@/services/api/notificationsApi').then(
                (module) => module.getNotifications({ page: nextPage, limit: 20 })
            );

            set(state => ({
                notifications: [...state.notifications, ...response.data],
                hasMore: response.hasMore,
                page: nextPage,
                isLoadingMore: false
            }));

            console.log(`Loaded ${response.data.length} more notifications (page ${nextPage})`);
        } catch (error) {
            console.error('Failed to load more notifications:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load more notifications',
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
            await import('@/services/api/notificationsApi').then(
                (module) => module.markNotificationAsRead(notificationId)
            );

            console.log(`Marked notification ${notificationId} as read`);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
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
            await import('@/services/api/notificationsApi').then(
                (module) => module.markAllNotificationsAsRead()
            );

            console.log('Marked all notifications as read');
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            // Revert optimistic update on error
            get().fetchNotifications();
        }
    },

    // Increment unread count when receiving a new notification via socket
    incrementUnread: (notification: Notification) => {
        set(state => ({
            notifications: [notification, ...state.notifications]
        }));
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
