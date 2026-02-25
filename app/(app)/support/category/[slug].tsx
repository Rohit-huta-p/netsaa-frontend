import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArticleSearch } from '@/hooks/useSupport';
import FAQAccordion from '@/components/support/FAQAccordion';
import { ARTICLE_CATEGORY_LABELS } from '@/types/support';
import type { ArticleCategory, HelpArticle } from '@/types/support';

const FAQ_BY_CATEGORY: Record<string, { question: string; answer: string }[]> = {
    payments: [
        { question: 'How do I request a refund?', answer: 'Go to your payment history, select the transaction, and tap "Request Refund". Our team will review within 48 hours.' },
        { question: 'When will I receive my payment?', answer: 'Payments are processed within 3-5 business days after the gig is marked complete by the organizer.' },
        { question: 'What payment methods are supported?', answer: 'We support UPI, bank transfer, and major credit/debit cards.' },
    ],
    safety: [
        { question: 'How do I report a user?', answer: 'Go to the user\'s profile, tap the three dot menu, and select "Report". Provide details about the issue.' },
        { question: 'What happens after I report someone?', answer: 'Our safety team reviews all reports within 24 hours. You\'ll receive an update via notification.' },
    ],
    gigs: [
        { question: 'How do I apply to a gig?', answer: 'Open the gig listing, tap "Apply", write a cover note, and submit. The organizer will review your application.' },
        { question: 'Can I cancel a gig application?', answer: 'Yes, go to your applications list and tap "Withdraw" on the pending application.' },
    ],
};

export default function HelpCategoryScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const categoryLabel = ARTICLE_CATEGORY_LABELS[slug as ArticleCategory] || slug;

    const { data: articles, isLoading } = useArticleSearch({ category: slug });
    const faqs = FAQ_BY_CATEGORY[slug || ''] || [];

    const renderArticle = ({ item }: { item: HelpArticle }) => (
        <TouchableOpacity
            className="flex-row items-center bg-[#18181b] rounded-2xl p-4 mb-3 border border-white/5"
            onPress={() => router.push(`/(app)/support/article/${item.slug}`)}
            activeOpacity={0.7}
        >
            <View style={{ flex: 1 }}>
                <Text className="text-white text-[15px] font-outfit-semibold">{item.title}</Text>
                {item.excerpt && (
                    <Text className="text-zinc-500 text-[13px] font-outfit mt-1" numberOfLines={2}>{item.excerpt}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            <Stack.Screen options={{ title: categoryLabel }} />

            <FlatList
                data={articles || []}
                keyExtractor={(item) => item._id}
                renderItem={renderArticle}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                ListHeaderComponent={
                    faqs.length > 0 ? (
                        <View style={{ marginBottom: 24 }}>
                            <Text className="text-white text-lg font-outfit-bold mb-3">Frequently Asked</Text>
                            <FAQAccordion items={faqs} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#9D4EDD" />
                    ) : (
                        <View className="items-center mt-16">
                            <Text className="text-zinc-500 text-[15px] font-outfit">No articles in this category yet</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
}
