import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArticleSearch } from '@/hooks/useSupport';
import type { ArticleCategory } from '@/types/support';

const CATEGORIES: { key: ArticleCategory; icon: string; label: string }[] = [
    { key: 'getting_started', icon: '🚀', label: 'Getting Started' },
    { key: 'payments', icon: '💳', label: 'Payments' },
    { key: 'gigs', icon: '🎵', label: 'Gigs' },
    { key: 'events', icon: '🎪', label: 'Events' },
    { key: 'account', icon: '👤', label: 'Account' },
    { key: 'safety', icon: '🛡️', label: 'Safety' },
    { key: 'technical', icon: '🔧', label: 'Technical' },
];

export default function HelpHomeScreen() {
    const router = useRouter();
    const { data: popularArticles } = useArticleSearch({ page: 1 });

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <TouchableOpacity
                    className="flex-row items-center bg-[#1a1a24] rounded-full px-5 py-4 border border-white/10 mb-6"
                    onPress={() => router.push('/(app)/support/search')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="search-outline" size={20} color="#71717a" />
                    <Text className="text-zinc-500 text-[15px] font-outfit ml-3">Search help articles...</Text>
                </TouchableOpacity>

                {/* Categories Grid */}
                <Text className="text-white text-lg font-outfit-bold mb-3">Browse by Category</Text>
                <View className="flex-row flex-wrap" style={{ gap: 10, marginBottom: 24 }}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.key}
                            className="bg-[#18181b] rounded-2xl p-4 items-center border border-white/5"
                            style={{ width: '30%', gap: 8 }}
                            onPress={() => router.push(`/(app)/support/category/${cat.key}`)}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 28 }}>{cat.icon}</Text>
                            <Text className="text-zinc-300 text-xs font-outfit-semibold text-center">{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Popular Articles */}
                {popularArticles && popularArticles.length > 0 && (
                    <>
                        <Text className="text-white text-lg font-outfit-bold mb-3">Popular Articles</Text>
                        {popularArticles.slice(0, 5).map((article) => (
                            <TouchableOpacity
                                key={article._id}
                                className="flex-row items-center bg-[#18181b] rounded-2xl p-4 mb-2 border border-white/5"
                                onPress={() => router.push(`/(app)/support/article/${article.slug}`)}
                                activeOpacity={0.7}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text className="text-white text-[15px] font-outfit-semibold">{article.title}</Text>
                                    {article.excerpt && (
                                        <Text className="text-zinc-500 text-[13px] font-outfit mt-1" numberOfLines={2}>
                                            {article.excerpt}
                                        </Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#71717a" />
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Actions */}
                <View style={{ marginTop: 24, gap: 12 }}>
                    <TouchableOpacity
                        className="flex-row items-center justify-center bg-purple-600 rounded-2xl py-4"
                        style={{ gap: 8 }}
                        onPress={() => router.push('/(app)/support/new-ticket')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" />
                        <Text className="text-white text-base font-outfit-bold">Contact Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center justify-center rounded-2xl py-4 border border-white/10"
                        style={{ gap: 8, backgroundColor: 'rgba(157, 78, 221, 0.1)' }}
                        onPress={() => router.push('/(app)/support/tickets')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="document-text-outline" size={20} color="#C77DFF" />
                        <Text className="text-purple-300 text-base font-outfit-semibold">My Tickets</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
