import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyTickets } from '@/hooks/useSupport';
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_ICONS } from '@/types/support';
import type { SupportTicket } from '@/types/support';

export default function MyTicketsScreen() {
    const router = useRouter();
    const { data: tickets, isLoading, refetch, isRefetching } = useMyTickets();

    const renderTicket = ({ item }: { item: SupportTicket }) => {
        const statusColor = STATUS_COLORS[item.status];
        const timeAgo = getTimeAgo(item.createdAt);

        return (
            <TouchableOpacity
                className="bg-[#18181b] rounded-2xl p-4 mb-3 border border-white/5"
                onPress={() => router.push(`/(app)/support/ticket/${item._id}`)}
                activeOpacity={0.7}
            >
                <View className="flex-row justify-between items-center mb-2">
                    <Text style={{ fontSize: 22 }}>{CATEGORY_ICONS[item.category]}</Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: statusColor + '15',
                    }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: statusColor }}>
                            {STATUS_LABELS[item.status]}
                        </Text>
                    </View>
                </View>

                <Text className="text-white text-base font-outfit-bold mb-2">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    {item.subcategory && ` · ${item.subcategory}`}
                </Text>

                <View className="flex-row justify-between items-center">
                    <Text className="text-zinc-500 text-xs font-outfit">{timeAgo}</Text>
                    <View style={{ backgroundColor: '#27272a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#a1a1aa' }}>
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </Text>
                    </View>
                </View>

                {item.slaBreached && (
                    <View className="flex-row items-center mt-2 p-2 rounded-lg" style={{ gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <Ionicons name="warning-outline" size={14} color="#EF4444" />
                        <Text className="text-red-400 text-xs font-outfit-semibold">SLA Breached</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            {isLoading ? (
                <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#9D4EDD" />
            ) : (
                <FlatList
                    data={tickets || []}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTicket}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#9D4EDD" />
                    }
                    ListEmptyComponent={
                        <View className="items-center mt-20" style={{ gap: 8 }}>
                            <Ionicons name="ticket-outline" size={48} color="#27272a" />
                            <Text className="text-white text-lg font-outfit-bold">No tickets yet</Text>
                            <Text className="text-zinc-500 text-[14px] font-outfit">Need help? Create a support ticket.</Text>
                            <TouchableOpacity
                                className="bg-purple-600 px-6 py-3 rounded-xl mt-4"
                                onPress={() => router.push('/(app)/support/new-ticket')}
                            >
                                <Text className="text-white text-[15px] font-outfit-bold">Create Ticket</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
