// app/(app)/notifications.tsx — editorial inbox (v2)
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { DateSectionHeader } from '@/components/notifications/DateSectionHeader';
import { NotificationFilterTabs } from '@/components/notifications/NotificationFilterTabs';
import { flattenGroupedNotifications, groupNotificationsByDate } from '@/utils/dateGrouping';
import {
    N, FONT, CATEGORY_TABS, bucketCounts, filterByCategory, type NotifCategory,
} from '@/constants/notificationsTheme';
import AppFlatList from '@/components/AppFlatList';

export default function NotificationsScreen() {
    const {
        notifications, isLoading, isLoadingMore, hasMore, error,
        fetchNotifications, loadMore, markAllAsRead,
    } = useNotificationsStore();

    const [cat, setCat] = useState<NotifCategory>('all');

    // Fetch on mount. NOTE: we intentionally do NOT resetUnread() on focus —
    // the unread treatment (orange rail + count) is the point of the redesign;
    // items clear as they're read (tap/swipe) or via "Mark all read".
    useEffect(() => { fetchNotifications(); }, []);

    const unread = notifications.filter((n) => !n.isRead).length;
    const counts = useMemo(() => bucketCounts(notifications), [notifications]);
    const flattenedData = useMemo(
        () => flattenGroupedNotifications(groupNotificationsByDate(filterByCategory(notifications, cat))),
        [notifications, cat]
    );

    const handleLoadMore = () => { if (!isLoadingMore && hasMore) loadMore(); };

    const renderItem = ({ item }: { item: any }) =>
        item.type === 'header'
            ? <DateSectionHeader date={item.date} />
            : <NotificationCard notification={item.data} />;

    const renderFooter = () =>
        isLoadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={N.orange} />
            </View>
        ) : null;

    const catLabel = CATEGORY_TABS.find((t) => t.key === cat)?.label ?? '';
    const renderEmpty = () => {
        if (isLoading) {
            return (
                <View style={s.empty}>
                    <ActivityIndicator size="large" color={N.orange} />
                    <Text style={s.emptySub}>Loading notifications…</Text>
                </View>
            );
        }
        return (
            <View style={s.empty}>
                <View style={s.emptyIcon}><Bell size={40} color={N.text3} /></View>
                <Text style={s.emptyTitle}>
                    {cat === 'all' ? 'No notifications' : `No ${catLabel.toLowerCase()} notifications`}
                </Text>
                <Text style={s.emptySub}>
                    {cat === 'all'
                        ? "You're all caught up — we'll ping you when something happens."
                        : `Nothing under ${catLabel} yet.`}
                </Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: N.bg1 }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.eyebrow}>INBOX</Text>
                    <Text style={s.title}>Notifications</Text>
                    <View style={s.meta}>
                        <Text style={s.metaCount}>
                            {unread > 0 ? <><Text style={s.metaUnread}>{unread}</Text> unread</> : 'All caught up'}
                        </Text>
                        {unread > 0 ? (
                            <Pressable onPress={markAllAsRead} hitSlop={8}>
                                <Text style={s.markAll}>MARK ALL READ <Text style={{ color: N.orange }}>→</Text></Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>

                {/* Category filter tabs */}
                <NotificationFilterTabs active={cat} counts={counts} onChange={setCat} />

                {/* Error */}
                {error ? (
                    <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
                ) : null}

                {/* List */}
                <AppFlatList
                    data={flattenedData}
                    renderItem={renderItem}
                    keyExtractor={(item: any, index) =>
                        item.type === 'header' ? `header-${item.date}` : `notification-${item.data._id ?? index}`
                    }
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={fetchNotifications}
                            tintColor={N.orange}
                            colors={[N.orange]}
                        />
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
    eyebrow: { fontFamily: FONT.monoBold, fontSize: 9.5, letterSpacing: 2.3, color: N.orange },
    title: { fontFamily: FONT.serif, fontSize: 27, letterSpacing: -0.5, color: N.text0, marginTop: 5 },
    meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    metaCount: { fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 0.5, color: N.text2 },
    metaUnread: { fontFamily: FONT.monoBold, color: N.orange },
    markAll: { fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: 0.4, color: N.text1 },

    errorBox: {
        marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 12,
        backgroundColor: N.redSoft, borderWidth: 1, borderColor: 'rgba(239,68,68,0.30)',
    },
    errorText: { color: '#FCA5A5', fontFamily: FONT.reg, fontSize: 13 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
    emptyIcon: {
        width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
        backgroundColor: N.bg2, borderWidth: 1, borderColor: N.hairline, marginBottom: 18,
    },
    emptyTitle: { fontFamily: FONT.serif, fontSize: 22, color: N.text0, marginBottom: 8 },
    emptySub: { fontFamily: FONT.reg, fontSize: 13, color: N.text2, textAlign: 'center', lineHeight: 19, marginTop: 4 },
});
