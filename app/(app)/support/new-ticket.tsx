import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateTicket } from '@/hooks/useSupport';
import { PRIORITY_SLA_HOURS, CATEGORY_ICONS } from '@/types/support';
import type { TicketCategory, TicketPriority, RelatedEntity } from '@/types/support';

const CATEGORIES: TicketCategory[] = ['payment', 'gig', 'event', 'account', 'safety', 'technical'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

const PRIORITY_COLORS: Record<TicketPriority, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626',
};

export default function SupportTicketFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ gigId?: string; eventId?: string; conversationId?: string }>();
    const createTicket = useCreateTicket();

    const [category, setCategory] = useState<TicketCategory>('technical');
    const [priority, setPriority] = useState<TicketPriority>('medium');
    const [message, setMessage] = useState('');

    const getRelatedEntity = (): RelatedEntity | undefined => {
        if (params.gigId) return { type: 'gig', entityId: params.gigId };
        if (params.eventId) return { type: 'event', entityId: params.eventId };
        if (params.conversationId) return { type: 'conversation', entityId: params.conversationId };
        return undefined;
    };

    const contextLabel = params.gigId
        ? '🎵 Linked to Gig'
        : params.eventId
            ? '🎪 Linked to Event'
            : params.conversationId
                ? '💬 Linked to Conversation'
                : null;

    const handleSubmit = async () => {
        if (message.trim().length < 5) {
            Alert.alert('Too short', 'Please describe your issue in at least 5 characters.');
            return;
        }

        try {
            await createTicket.mutateAsync({
                category,
                priority,
                message: message.trim(),
                relatedEntity: getRelatedEntity(),
            });
            Alert.alert('Ticket Created', 'Our team will respond shortly.', [
                { text: 'View My Tickets', onPress: () => router.replace('/(app)/support/tickets') },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create ticket');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Context Badge */}
                {contextLabel && (
                    <View style={{ backgroundColor: 'rgba(157, 78, 221, 0.1)', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(199, 125, 255, 0.2)' }}>
                        <Text className="text-purple-300 text-[14px] font-outfit-semibold">{contextLabel}</Text>
                    </View>
                )}

                {/* Category */}
                <Text className="text-white text-[15px] font-outfit-bold mb-3 mt-2">Category</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                backgroundColor: category === cat ? 'rgba(157, 78, 221, 0.15)' : '#18181b',
                                borderWidth: 1.5,
                                borderColor: category === cat ? 'rgba(199, 125, 255, 0.4)' : 'rgba(255,255,255,0.06)',
                            }}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={{ fontSize: 16 }}>{CATEGORY_ICONS[cat]}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: category === cat ? '#C77DFF' : '#a1a1aa' }}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Priority */}
                <Text className="text-white text-[15px] font-outfit-bold mb-3 mt-5">Priority</Text>
                <View className="flex-row" style={{ gap: 8 }}>
                    {PRIORITIES.map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                paddingVertical: 10,
                                borderRadius: 10,
                                backgroundColor: priority === p ? PRIORITY_COLORS[p] + '15' : '#18181b',
                                borderWidth: 1.5,
                                borderColor: priority === p ? PRIORITY_COLORS[p] : 'rgba(255,255,255,0.06)',
                            }}
                            onPress={() => setPriority(p)}
                        >
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PRIORITY_COLORS[p] }} />
                            <Text style={{ fontSize: 12, fontWeight: priority === p ? '700' : '600', color: priority === p ? PRIORITY_COLORS[p] : '#a1a1aa' }}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* SLA Estimate */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: 'rgba(157, 78, 221, 0.08)',
                    padding: 12,
                    borderRadius: 10,
                    marginTop: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(199, 125, 255, 0.15)',
                }}>
                    <Ionicons name="time-outline" size={16} color="#C77DFF" />
                    <Text className="text-purple-300 text-[13px] font-outfit-semibold">
                        Estimated response within {PRIORITY_SLA_HOURS[priority]} hours
                    </Text>
                </View>

                {/* Message */}
                <Text className="text-white text-[15px] font-outfit-bold mb-3 mt-5">Describe your issue</Text>
                <TextInput
                    className="text-white text-[15px] font-outfit"
                    style={{
                        backgroundColor: '#18181b',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: 14,
                        minHeight: 140,
                    }}
                    placeholder="Tell us what happened..."
                    placeholderTextColor="#71717a"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    value={message}
                    onChangeText={setMessage}
                    maxLength={5000}
                />
                <Text className="text-zinc-600 text-xs font-outfit text-right mt-1">{message.length}/5000</Text>

                {/* Submit */}
                <TouchableOpacity
                    className="flex-row items-center justify-center bg-purple-600 rounded-2xl py-4 mt-6"
                    style={{ gap: 8, opacity: createTicket.isPending ? 0.6 : 1 }}
                    onPress={handleSubmit}
                    disabled={createTicket.isPending}
                    activeOpacity={0.85}
                >
                    {createTicket.isPending ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="send-outline" size={18} color="#FFF" />
                            <Text className="text-white text-base font-outfit-bold">Submit Ticket</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
