import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Bell icon with unread-notification count badge.
 * Tapping navigates to /notifications. Count comes from useNotificationsStore
 * (already socket-updated in real time — no manual polling needed).
 *
 * Pair with <NetworkIcon /> in a screen's top-right bar:
 *   [NetworkIcon]  [NotificationsBell]
 */
type Props = {
    size?: number;
    color?: string;
    badgeColor?: string;
    hitSlop?: number;
    onPress?: () => void;
};

export const NotificationsBell: React.FC<Props> = ({
    size = 20,
    color = '#F0ECE6',
    badgeColor = '#F97316',
    hitSlop = 10,
    onPress,
}) => {
    const { user } = useAuthStore();
    const { fetchNotifications, notifications } = useNotificationsStore();
    const count = notifications.filter((n) => !n.isRead).length;

    const refresh = useCallback(() => {
        if (!user) return;
        try {
            fetchNotifications();
        } catch (e) {
            if (__DEV__) console.warn('[NotificationsBell] fetch failed', e);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const handlePress = () => {
        if (onPress) onPress();
        else router.push('/notifications' as any);
    };

    return (
        <Pressable
            onPress={handlePress}
            hitSlop={hitSlop}
            style={({ pressed }) => [s.root, pressed && { opacity: 0.6 }]}
            accessibilityLabel={`Open notifications. ${count} unread.`}
            accessibilityRole="button"
        >
            <Bell size={size} color={color} strokeWidth={2} />
            {count > 0 && (
                <View style={[s.badge, { backgroundColor: badgeColor }]}>
                    <Text style={s.badgeText}>{count > 99 ? '99+' : count}</Text>
                </View>
            )}
        </Pressable>
    );
};

const s = StyleSheet.create({
    root: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0A0A10',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        fontFamily: 'Outfit-ExtraBold',
    },
});

export default NotificationsBell;
