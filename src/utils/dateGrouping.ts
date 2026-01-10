// src/utils/dateGrouping.ts
import { Notification } from '@/stores/notificationsStore';

export type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

export interface GroupedNotification {
    date: DateGroup;
    notifications: Notification[];
}

/**
 * Formats a date string into a human-readable label
 * @param dateString ISO date string
 * @returns Formatted date label (Today, Yesterday, This Week, or Earlier)
 */
export function formatDateLabel(dateString: string): DateGroup {
    const date = new Date(dateString);
    const now = new Date();

    // Reset time to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - compareDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return 'This Week';
    } else {
        return 'Earlier';
    }
}

/**
 * Groups notifications by date categories
 * @param notifications Array of notifications to group
 * @returns Array of grouped notifications with date labels
 */
export function groupNotificationsByDate(notifications: Notification[]): GroupedNotification[] {
    // Sort notifications by date (newest first)
    const sorted = [...notifications].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Group by date label
    const groups: Record<DateGroup, Notification[]> = {
        'Today': [],
        'Yesterday': [],
        'This Week': [],
        'Earlier': []
    };

    sorted.forEach(notification => {
        const label = formatDateLabel(notification.createdAt);
        groups[label].push(notification);
    });

    // Convert to array format, filtering out empty groups
    const groupOrder: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'Earlier'];

    return groupOrder
        .filter(date => groups[date].length > 0)
        .map(date => ({
            date,
            notifications: groups[date]
        }));
}

/**
 * Flattens grouped notifications into a single array with section headers
 * Useful for FlatList rendering with section headers
 */
export function flattenGroupedNotifications(grouped: GroupedNotification[]): Array<{ type: 'header', date: DateGroup } | { type: 'notification', data: Notification }> {
    const flattened: Array<{ type: 'header', date: DateGroup } | { type: 'notification', data: Notification }> = [];

    grouped.forEach(group => {
        // Add section header
        flattened.push({ type: 'header', date: group.date });

        // Add notifications
        group.notifications.forEach(notification => {
            flattened.push({ type: 'notification', data: notification });
        });
    });

    return flattened;
}
