import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArticle } from '@/hooks/useSupport';
import MarkdownViewer from '@/components/support/MarkdownViewer';

export default function HelpArticleScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const { data: article, isLoading } = useArticle(slug || '');

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#09090b]">
                <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#9D4EDD" />
            </SafeAreaView>
        );
    }

    if (!article) {
        return (
            <SafeAreaView className="flex-1 bg-[#09090b]">
                <View className="items-center mt-16" style={{ gap: 12 }}>
                    <Ionicons name="document-outline" size={48} color="#27272a" />
                    <Text className="text-zinc-500 text-[15px] font-outfit">Article not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            <Stack.Screen options={{ title: '' }} />
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={{ marginBottom: 16 }}>
                    <View style={{ backgroundColor: 'rgba(157, 78, 221, 0.12)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#C77DFF', textTransform: 'capitalize' }}>{article.category}</Text>
                    </View>
                    <Text className="text-white text-2xl font-outfit-black mb-2">{article.title}</Text>
                    <Text className="text-zinc-500 text-[13px] font-outfit">
                        Updated {new Date(article.updatedAt).toLocaleDateString()} · {article.viewCount} views
                    </Text>
                </View>

                {/* Tags */}
                {article.tags?.length > 0 && (
                    <View className="flex-row flex-wrap mb-5" style={{ gap: 6 }}>
                        {article.tags.map((tag) => (
                            <View key={tag} style={{ backgroundColor: '#18181b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                                <Text style={{ fontSize: 12, color: '#a1a1aa', fontWeight: '500' }}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Markdown Content */}
                <View style={{ marginBottom: 32 }}>
                    <MarkdownViewer content={article.content} />
                </View>

                {/* Related Articles */}
                {article.relatedArticles?.length > 0 && (
                    <View style={{ marginBottom: 32 }}>
                        <Text className="text-white text-[17px] font-outfit-bold mb-3">Related Articles</Text>
                        {article.relatedArticles.map((related) => (
                            <TouchableOpacity
                                key={related._id}
                                className="flex-row items-center justify-between bg-[#18181b] p-4 rounded-xl mb-2 border border-white/5"
                                onPress={() => router.push(`/(app)/support/article/${related.slug}`)}
                                activeOpacity={0.7}
                            >
                                <Text className="text-zinc-300 text-[14px] font-outfit-semibold flex-1">{related.title}</Text>
                                <Ionicons name="chevron-forward" size={16} color="#71717a" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Feedback */}
                <View className="items-center p-5">
                    <Text className="text-zinc-300 text-base font-outfit-semibold mb-3">Was this helpful?</Text>
                    <View className="flex-row" style={{ gap: 24 }}>
                        <TouchableOpacity className="items-center" style={{ gap: 4 }}>
                            <Ionicons name="thumbs-up-outline" size={22} color="#10B981" />
                            <Text className="text-emerald-500 text-[13px] font-outfit-semibold">Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center" style={{ gap: 4 }}>
                            <Ionicons name="thumbs-down-outline" size={22} color="#EF4444" />
                            <Text className="text-red-400 text-[13px] font-outfit-semibold">No</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
