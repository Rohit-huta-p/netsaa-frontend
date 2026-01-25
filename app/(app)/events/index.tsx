import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter } from 'lucide-react-native';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import AppScrollView from '@/components/AppScrollView';
import { EventCard } from '../../../src/components/events/EventCard';
import { usePlatform } from '@/utils/platform';
import { useRouter } from 'expo-router';
import { useEvents, useEvent } from '@/hooks/useEvents';
import { useUiStore } from '@/stores/uiStore';

export default function EventsPage() {
    const { isWeb } = usePlatform();
    const [searchQuery, setSearchQuery] = useState('');
    const numOfColumns = isWeb ? 4 : 2;
    const router = useRouter();

    // Global UI State
    const { selectedEventId, setSelectedEventId } = useUiStore();

    // Server State - List
    const { data: events, isLoading: listLoading, error: listError } = useEvents();

    const filteredEvents = events?.filter((event: any) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleEventPress = (id: string) => {
        console.log('Event pressed:', id);
        if (isWeb) {
            setSelectedEventId(id);
            // In full implementation, this might open a split view or modal
            router.push(`/events/${id}`);
        } else {
            router.push(`/events/${id}`);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <SafeAreaView className="flex-1" edges={['top']}>
                <AppScrollView>
                    {/* Header Section */}
                    <View className="px-6 pt-4 pb-2">
                        <Text className="text-3xl font-bold text-white mb-6">Discover Events</Text>

                        {/* Search Bar & Filter */}
                        <View className="flex-row items-center space-x-2 gap-4 mb-6">
                            <View className="flex-1 flex-row items-center bg-white/10 rounded-xl px-4 py-3 border border-white/5">
                                <Search size={20} color="#9CA3AF" />
                                <TextInput
                                    placeholder="Search events..."
                                    placeholderTextColor="#6B7280"
                                    className="flex-1 ml-3 text-white text-base"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <View className="bg-white/10 p-3 rounded-xl border border-white/5">
                                <Filter size={20} color="#A855F7" />
                            </View>
                        </View>
                    </View>

                    {/* Events Grid */}
                    {listLoading ? (
                        <View className="p-8 items-center h-[80%]">
                            <LoadingAnimation
                                source="https://lottie.host/a9975e00-d157-4513-b40f-77f83c2039be/fJeNBIUK06.lottie"
                                width={200}
                                height={200}
                            />
                        </View>
                    ) : listError ? (
                        <View className="p-8 items-center h-[80%]">
                            <Text className="text-red-500">Failed to load events.</Text>
                        </View>
                    ) : (
                        isWeb ? (
                            <View className='grid grid-cols-4 gap-4 p-6'>
                                {filteredEvents.map((event: any) => (
                                    <EventCard
                                        key={event._id}
                                        event={event}
                                        onPress={() => handleEventPress(event._id)}
                                    />
                                ))}
                            </View>
                        ) : (
                            <View className="px-4">
                                <FlatList
                                    data={filteredEvents}
                                    keyExtractor={(item: any) => item._id}
                                    // force re-layout when columns change
                                    key={numOfColumns}
                                    renderItem={({ item }) => (
                                        // wrapper that forces each item to flex and share available width
                                        <View style={{ flex: 1, paddingHorizontal: 6, paddingBottom: 12 }}>
                                            <EventCard
                                                event={item}
                                                onPress={() => handleEventPress(item._id)}
                                                // pass a style prop so the card itself doesn't set fixed width
                                                style={
                                                    {
                                                        // ensure EventCard knows to expand in its container
                                                        width: '100%',
                                                        height: 'fit-content',
                                                    } as any
                                                }
                                            />
                                        </View>
                                    )}
                                    numColumns={2}
                                    // simpler wrapper style; avoid space-between + extra horizontal padding
                                    columnWrapperStyle={{ justifyContent: 'flex-start' }}
                                    scrollEnabled={false}
                                    contentContainerStyle={{ paddingBottom: 40 }}
                                />
                            </View>
                        )
                    )}

                </AppScrollView>
            </SafeAreaView>
        </View>
    );
}
