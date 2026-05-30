// app/(app)/search/results.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSearchPeople, useSearchGigs, useSearchEvents } from '@/hooks/useSearchQueries';
import { PersonItem } from '@/components/search/items/PersonItem';
import { GigItem } from '@/components/search/items/GigItem';
import { EventItem } from '@/components/search/items/EventItem';

type Tab = 'people' | 'gigs' | 'events';

export default function ResultsPage() {
    const params = useLocalSearchParams<{ q?: string; tab?: string }>();
    const router = useRouter();
    const q = (params.q as string) || '';
    const initialTab = (params.tab as Tab) || 'people';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    useEffect(() => {
        if (params.tab) setActiveTab(params.tab as Tab);
    }, [params.tab]);

    const { data: peopleData, isLoading: peopleLoading } = useSearchPeople(q);
    const { data: gigsData,   isLoading: gigsLoading   } = useSearchGigs(q);
    const { data: eventsData, isLoading: eventsLoading } = useSearchEvents(q);

    const counts = {
        people: peopleData?.total ?? 0,
        gigs:   gigsData?.total   ?? 0,
        events: eventsData?.total ?? 0,
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'people', label: 'People' },
        { key: 'gigs',   label: 'Gigs'   },
        { key: 'events', label: 'Events'  },
    ];

    const renderContent = () => {
        if (activeTab === 'people') {
            if (peopleLoading) return <ActivityIndicator color="#fff" />;
            return (peopleData?.results ?? []).map((p: any) => (
                <PersonItem
                    key={p._id}
                    item={p}
                    status={'none'}
                    onPress={() => router.push(`/profile/${p._id}`)}
                />
            ));
        }
        if (activeTab === 'gigs') {
            if (gigsLoading) return <ActivityIndicator color="#fff" />;
            return (gigsData?.results ?? []).map((g: any) => (
                <GigItem key={g._id} item={g} onPress={() => router.push(`/gigs/${g._id}`)} />
            ));
        }
        if (activeTab === 'events') {
            if (eventsLoading) return <ActivityIndicator color="#fff" />;
            return (eventsData?.results ?? []).map((e: any) => (
                <EventItem key={e._id} item={e} onPress={() => router.push(`/events/${e._id}`)} />
            ));
        }
        return null;
    };

    return (
        <View className="flex-1 bg-[#09090b]">
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header: back arrow + query echo */}
                <View className="flex-row items-center px-4 py-3 gap-3">
                    <TouchableOpacity
                        testID="results-back"
                        onPress={() => router.back()}
                        className="w-9 h-9 rounded-full bg-white/8 items-center justify-center"
                    >
                        <ChevronLeft size={18} color="#9ca3af" />
                    </TouchableOpacity>
                    <Text className="text-gray-400 text-xs">
                        Results for <Text className="text-white font-bold">"{q}"</Text>
                    </Text>
                </View>

                {/* Tab strip with counts */}
                <View className="flex-row px-4 border-b border-white/8">
                    {tabs.map(({ key, label }) => {
                        const active = activeTab === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                testID={`results-tab-${key}`}
                                onPress={() => setActiveTab(key)}
                                className="px-3 py-2 mr-2"
                                style={{ borderBottomWidth: 2, borderBottomColor: active ? '#a78bfa' : 'transparent' }}
                            >
                                <Text className={`font-bold text-xs ${active ? 'text-purple-300' : 'text-gray-400'}`}>
                                    {label}{' '}
                                    <Text className="text-gray-500 text-[10px]">{counts[key]}</Text>
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Filter chip row (placeholder) */}
                <View className="px-4 py-2 flex-row gap-2">
                    <View className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30">
                        <Text className="text-purple-300 text-[10px] font-bold">+ Filter</Text>
                    </View>
                </View>

                {/* Content */}
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
