// src/components/notifications/NotificationCard.tsx
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Notification } from '@/stores/notificationsStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { deepLinkService } from '@/services/deepLinkService';
import { Bell, Check } from 'lucide-react-native';

interface NotificationCardProps {
    notification: Notification;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
    const router = useRouter();
    const swipeableRef = useRef<Swipeable>(null);
    const { markAsRead } = useNotificationsStore();

    const handlePress = () => {
        // Mark as read when tapped
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        // Navigate to deep link if route is provided using deepLinkService
        // This ensures consistent navigation handling with push notifications
        if (notification.data?.route) {
            deepLinkService.navigateToRoute(notification.data.route);
        }
    };

    const handleMarkAsRead = () => {
        markAsRead(notification._id);
        swipeableRef.current?.close();
    };

    // Render right swipe action (Mark as Read)
    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity
                onPress={handleMarkAsRead}
                className="bg-green-600 justify-center items-center px-6 rounded-r-2xl"
                style={{ width: 100 }}
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Check size={24} color="white" />
                    <Text className="text-white text-xs font-semibold mt-1">Read</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            overshootRight={false}
            friction={2}
        >
            <TouchableOpacity
                onPress={handlePress}
                className={`bg-white/5 border border-white/10 mx-4 mb-3 rounded-2xl p-4 flex-row items-start ${!notification.isRead ? 'bg-purple-500/10 border-purple-500/30' : ''
                    }`}
                activeOpacity={0.7}
            >
                {/* Unread Indicator */}
                {!notification.isRead && (
                    <View className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2" />
                )}

                {/* Icon */}
                <View className="bg-purple-500/20 p-2 rounded-full mr-3">
                    <Bell size={20} color="#A855F7" />
                </View>

                {/* Content */}
                <View className="flex-1">
                    <Text className="text-white font-semibold text-base mb-1">
                        {notification.title}
                    </Text>
                    <Text className="text-gray-400 text-sm leading-5">
                        {notification.message}
                    </Text>

                    {/* Timestamp */}
                    <Text className="text-gray-500 text-xs mt-2">
                        {formatTimestamp(notification.createdAt)}
                    </Text>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago", "Just now")
 */
function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        // Format as date for older notifications
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
