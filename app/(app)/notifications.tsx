// app/(app)/notifications.tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { DateSectionHeader } from '@/components/notifications/DateSectionHeader';
import { flattenGroupedNotifications, groupNotificationsByDate } from '@/utils/dateGrouping';
import { Bell } from 'lucide-react-native';

export default function NotificationsScreen() {
    const {
        notifications,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        fetchNotifications,
        loadMore,
        resetUnread,
    } = useNotificationsStore();

    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Reset unread count when screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            resetUnread();
        }, [resetUnread])
    );

    // Group notifications by date
    const groupedNotifications = groupNotificationsByDate(notifications);
    const flattenedData = flattenGroupedNotifications(groupedNotifications);

    const handleRefresh = () => {
        fetchNotifications();
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            loadMore();
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'header') {
            return <DateSectionHeader date={item.date} />;
        } else {
            return <NotificationCard notification={item.data} />;
        }
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;

        return (
            <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#A855F7" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) {
            return (
                <View className="flex-1 items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#A855F7" />
                    <Text className="text-gray-400 mt-4">Loading notifications...</Text>
                </View>
            );
        }

        return (
            <View className="flex-1 items-center justify-center py-20">
                <View className="bg-white/5 p-6 rounded-full mb-4">
                    <Bell size={48} color="#6B7280" />
                </View>
                <Text className="text-white text-xl font-semibold mb-2">No Notifications</Text>
                <Text className="text-gray-400 text-center px-8">
                    You're all caught up! We'll notify you when something new happens.
                </Text>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 pt-4 pb-3 border-b border-white/10">
                    <Text className="text-3xl font-bold text-white">Notifications</Text>
                </View>

                {/* Error State */}
                {error && (
                    <View className="bg-red-500/10 border border-red-500/30 mx-4 mt-4 p-4 rounded-xl">
                        <Text className="text-red-400 text-sm">{error}</Text>
                    </View>
                )}

                {/* Notifications List */}
                <FlatList
                    data={flattenedData}
                    renderItem={renderItem}
                    keyExtractor={(item, index) =>
                        item.type === 'header' ? `header-${item.date}` : `notification-${item.data._id}`
                    }
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={handleRefresh}
                            tintColor="#A855F7"
                            colors={['#A855F7']}
                        />
                    }
                />
            </SafeAreaView>
        </View>
    );
}
