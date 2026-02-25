import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArticleSearch } from '@/hooks/useSupport';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { HelpArticle } from '@/types/support';

const TABS = [
    { key: undefined, label: 'All' },
    { key: 'artist', label: 'Artist' },
    { key: 'organizer', label: 'Organizer' },
    { key: 'payments', label: 'Payments' },
    { key: 'safety', label: 'Safety' },
] as const;

export default function HelpSearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
    const debouncedQuery = useDebouncedValue(query, 300);

    const { data: articles, isLoading } = useArticleSearch({
        q: debouncedQuery || undefined,
        tab: activeTab,
    });

    const renderArticle = useCallback(
        ({ item }: { item: HelpArticle }) => (
            <TouchableOpacity
                className="flex-row items-center bg-[#18181b] rounded-2xl p-4 mb-3 border border-white/5"
                onPress={() => router.push(`/(app)/support/article/${item.slug}`)}
                activeOpacity={0.7}
            >
                <View style={{ flex: 1 }}>
                    <Text className="text-white text-[15px] font-outfit-semibold">{item.title}</Text>
                    {item.excerpt && (
                        <Text className="text-zinc-500 text-[13px] font-outfit mt-1" numberOfLines={2}>
                            {item.excerpt}
                        </Text>
                    )}
                    <View className="flex-row mt-2" style={{ gap: 6 }}>
                        {item.tags?.slice(0, 3).map((tag) => (
                            <View key={tag} style={{ backgroundColor: 'rgba(157, 78, 221, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                <Text style={{ fontSize: 11, color: '#C77DFF', fontWeight: '600' }}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#71717a" />
            </TouchableOpacity>
        ),
        [router]
    );

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            {/* Search Input */}
            <View className="flex-row items-center bg-[#1a1a24] mx-4 mt-4 px-4 py-3 rounded-full border border-white/10" style={{ gap: 10 }}>
                <Ionicons name="search-outline" size={20} color="#71717a" />
                <TextInput
                    className="flex-1 text-white text-[15px] font-outfit"
                    placeholder="Search articles..."
                    placeholderTextColor="#71717a"
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#71717a" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tab Filters */}
            <FlatList
                horizontal
                data={TABS}
                keyExtractor={(item) => item.label}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
                renderItem={({ item: tab }) => (
                    <TouchableOpacity
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: activeTab === tab.key ? '#9D4EDD' : '#18181b',
                            borderWidth: 1,
                            borderColor: activeTab === tab.key ? 'rgba(199, 125, 255, 0.4)' : 'rgba(255,255,255,0.06)',
                        }}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: activeTab === tab.key ? '#FFF' : '#a1a1aa',
                            }}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Results */}
            {isLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#9D4EDD" />
            ) : (
                <FlatList
                    data={articles || []}
                    keyExtractor={(item) => item._id}
                    renderItem={renderArticle}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    ListEmptyComponent={
                        <View className="items-center mt-16" style={{ gap: 12 }}>
                            <Ionicons name="search-outline" size={48} color="#27272a" />
                            <Text className="text-zinc-500 text-[15px] font-outfit">
                                {query ? 'No articles found' : 'Start typing to search'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
