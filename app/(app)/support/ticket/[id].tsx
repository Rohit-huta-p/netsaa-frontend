import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTicket, useMessages, useSendMessage } from '@/hooks/useSupport';
import useAuthStore from '@/stores/authStore';
import { STATUS_LABELS, STATUS_COLORS } from '@/types/support';
import type { SupportMessage } from '@/types/support';

export default function TicketConversationScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();
    const flatListRef = useRef<FlatList>(null);

    const { data: ticket } = useTicket(id || '');
    const { data: messages, isLoading } = useMessages(id || '');
    const sendMessage = useSendMessage(id || '');

    const [input, setInput] = useState('');

    const isClosed = ticket?.status === 'closed';
    const statusColor = ticket ? STATUS_COLORS[ticket.status] : '#6B7280';

    useEffect(() => {
        if (messages && messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
        }
    }, [messages?.length]);

    const handleSend = async () => {
        if (!input.trim() || isClosed) return;
        const text = input.trim();
        setInput('');
        await sendMessage.mutateAsync({ message: text });
    };

    const renderMessage = ({ item }: { item: SupportMessage }) => {
        const isMe = item.senderId === user?._id || item.senderId === 'me';
        const isOptimistic = item._id.startsWith('temp-');

        return (
            <View style={{ marginBottom: 8, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <View
                    style={{
                        maxWidth: '78%',
                        borderRadius: 16,
                        padding: 12,
                        ...(isMe
                            ? { backgroundColor: '#9D4EDD', borderBottomRightRadius: 4 }
                            : { backgroundColor: '#1a1a24', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }),
                    }}
                >
                    <Text style={{ fontSize: 15, lineHeight: 22, color: isMe ? '#FFF' : '#a1a1aa' }}>
                        {item.message}
                    </Text>

                    {item.attachments?.length > 0 && (
                        <View style={{ marginTop: 8, gap: 4 }}>
                            {item.attachments.map((att, i) => (
                                <View key={i} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                    backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(157, 78, 221, 0.1)',
                                    padding: 6,
                                    borderRadius: 6,
                                }}>
                                    <Ionicons name="document-outline" size={14} color={isMe ? '#E0AAFF' : '#C77DFF'} />
                                    <Text style={{ fontSize: 12, color: isMe ? '#E0AAFF' : '#C77DFF', fontWeight: '500', maxWidth: 160 }} numberOfLines={1}>
                                        {att.fileName}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Text style={{ fontSize: 11, color: isMe ? 'rgba(224, 170, 255, 0.7)' : '#71717a' }}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isOptimistic && <Ionicons name="time-outline" size={12} color="rgba(224, 170, 255, 0.7)" />}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#09090b]" edges={['bottom']}>
            <Stack.Screen
                options={{ title: ticket ? `Ticket · ${ticket.category}` : 'Conversation' }}
            />

            {/* Status Bar */}
            {ticket && (
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5" style={{ backgroundColor: '#0a0a0f' }}>
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
                        <Text style={{ fontSize: 13, fontWeight: '700', color: statusColor }}>
                            {STATUS_LABELS[ticket.status]}
                        </Text>
                    </View>
                    {ticket.slaBreached && (
                        <View className="flex-row items-center" style={{ gap: 4 }}>
                            <Ionicons name="warning-outline" size={14} color="#EF4444" />
                            <Text className="text-red-400 text-xs font-outfit-semibold">SLA Breached</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Messages */}
            {isLoading ? (
                <ActivityIndicator style={{ flex: 1, marginTop: 60 }} size="large" color="#9D4EDD" />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages || []}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center mt-20" style={{ gap: 12 }}>
                            <Ionicons name="chatbubbles-outline" size={48} color="#27272a" />
                            <Text className="text-zinc-500 text-[15px] font-outfit">No messages yet</Text>
                        </View>
                    }
                />
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                {isClosed ? (
                    <View className="flex-row items-center justify-center py-4 border-t border-white/5" style={{ gap: 6, backgroundColor: '#18181b' }}>
                        <Ionicons name="lock-closed-outline" size={16} color="#71717a" />
                        <Text className="text-zinc-500 text-[14px] font-outfit-semibold">This ticket is closed</Text>
                    </View>
                ) : (
                    <View className="flex-row items-end p-3 border-t border-white/5" style={{ gap: 8, backgroundColor: '#0a0a0f' }}>
                        <TextInput
                            className="flex-1 text-white text-[15px] font-outfit"
                            style={{
                                backgroundColor: '#18181b',
                                borderRadius: 20,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                maxHeight: 120,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.08)',
                            }}
                            placeholder="Type a message..."
                            placeholderTextColor="#71717a"
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={10000}
                        />
                        <TouchableOpacity
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: '#9D4EDD',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: input.trim() ? 1 : 0.4,
                            }}
                            onPress={handleSend}
                            disabled={!input.trim() || sendMessage.isPending}
                        >
                            {sendMessage.isPending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="send" size={18} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
