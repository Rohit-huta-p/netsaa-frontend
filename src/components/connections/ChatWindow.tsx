// src/mobile/connections/ChatWindow
//
// A·Minimal reskin (2026-10): #121216 canvas, lifted #1C1C23 "their" bubbles, orange "mine",
// SpaceMono timestamps. Tokens + layout only — the realtime wiring (socket join/leave,
// message:new, typing, seen, presence), optimistic send + reconcile + failed/Retry, and the
// web Enter-to-send are all unchanged. Shared by /inbox and /connections.
//
// Two elements were removed per the inbox redesign: the header "Mark booked" pill and the
// requirement context chip (and their now-orphaned handlers/state). A requirement-linked
// thread is still marked by the opening system pill + the purple "payment coming soon" footer.
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    ActivityIndicator,
    AppState,
} from "react-native";
import {
    X,
    Send,
    AlertCircle,
    ChevronLeft,
} from "lucide-react-native";
import { useRouter } from 'expo-router';
import { useAuthStore } from "@/stores/authStore";

import messageService from "@/services/messageService";
import { socketService } from "@/services/socketService";
import { Message } from "@/types/chat";
import { generateId } from "@/utils/idGenerator";

import conversationService, { PopulatedConversation } from "@/services/conversationService";


export interface UserBasic {
    _id: string;
    displayName?: string;
    /** Backend sometimes populates first/last instead of displayName. */
    firstName?: string;
    lastName?: string;
    username?: string;
    profilePicture?: string;
    /** Backend sometimes serves this instead of `profilePicture` — both are accepted. */
    profileImageUrl?: string;
    email?: string;
    role?: string;
}

const composeName = (u?: { displayName?: string; firstName?: string; lastName?: string; username?: string } | null): string => {
    if (!u) return 'Loading...';
    if (u.displayName) return u.displayName;
    const composed = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (composed) return composed;
    if (u.username) return u.username;
    return 'Loading...';
};

// Initials fallback for users without a photo — mirrors the inbox launcher's avatar chip.
const initialsOf = (n?: string) =>
    (n || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

interface ChatWindowProps {
    conversationId: string;
    recipient?: UserBasic;
    onClose: () => void;
    /**
     * Hide the close (X) button in the chat header. Useful when the parent
     * page already provides its own back/close affordance (e.g. /messages).
     */
    hideClose?: boolean;
}

interface SocketMessagePayload {
    _id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
    clientMessageId?: string;
    attachments?: { type: string; url: string; size?: number }[];
    system?: boolean;
}

// ── System pill — centered, muted, no sender bubble ──
const SystemPill = ({ text }: { text: string }) => (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <View
            style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 5,
                maxWidth: '80%',
            }}
        >
            <Text
                style={{
                    color: '#8B8B99',
                    fontSize: 11.5,
                    fontFamily: 'Outfit-Regular',
                    textAlign: 'center',
                }}
            >
                {text}
            </Text>
        </View>
    </View>
);

export const ChatWindow = ({ conversationId, recipient: initialRecipient, onClose, hideClose }: ChatWindowProps) => {
    const currentUserId = useAuthStore.getState().user?._id || "me";
    const router = useRouter();

    // State
    const [recipient, setRecipient] = useState<UserBasic | undefined>(initialRecipient);
    const [conversation, setConversation] = useState<PopulatedConversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgText, setMsgText] = useState("");
    const [loading, setLoading] = useState(true);
    const [remoteIsTyping, setRemoteIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const remoteTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    // Derived: is this a booking thread (requirement-linked)? Still used to show the
    // purple "payment coming soon" footer — the Mark-booked action itself was removed.
    const ctx = conversation?.context;
    const isBookingThread = !!ctx?.requirementId;

    // Initial Fetch Effect
    useEffect(() => {
        if (!conversationId) {
            setError("Invalid Conversation ID");
            setLoading(false);
            return;
        }

        setMessages([]);
        setConversation(null);

        const loadData = async () => {
            setLoading(true);
            try {
                const conv = await conversationService.getConversationById(conversationId);
                if (conv) {
                    setConversation(conv);
                    if (!recipient) {
                        const otherPart = (conv.participants as any[]).find((p: any) =>
                            (p._id ?? p) !== currentUserId
                        ) || conv.participants[0];
                        setRecipient(otherPart);
                    }
                } else {
                    throw new Error("Conversation not found");
                }

                const fetchedMessages = await messageService.getMessages(conversationId);
                const sorted = fetchedMessages.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                setMessages(sorted);
                setError(null);
            } catch (err) {
                console.error("Failed to load chat", err);
                setError("Failed to load messages.");
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const socket = socketService.getSocket();

        const handleNewMessage = (payload: SocketMessagePayload) => {
            if (payload.conversationId !== conversationId) return;

            setMessages(prev => {
                if (prev.some(m => m._id === payload._id)) return prev;

                const newMessage: Message = {
                    ...payload,
                    seenBy: [],
                    optimistic: false,
                    failed: false,
                };

                const optimisticIndex = prev.findIndex(m =>
                    payload.clientMessageId && m.clientMessageId === payload.clientMessageId
                );

                if (optimisticIndex !== -1) {
                    const next = [...prev];
                    next[optimisticIndex] = newMessage;
                    return next;
                }

                return [...prev, newMessage];
            });
        };

        const handleTypingStart = (payload: { conversationId: string; senderId: string }) => {
            if (payload.conversationId === conversationId && payload.senderId !== currentUserId) {
                setRemoteIsTyping(true);
                if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
                remoteTypingTimeoutRef.current = setTimeout(() => setRemoteIsTyping(false), 5000);
            }
        };

        const handleTypingStop = (payload: { conversationId: string; senderId: string }) => {
            if (payload.conversationId === conversationId && payload.senderId !== currentUserId) {
                setRemoteIsTyping(false);
                if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
            }
        };

        const handleUserOnline = (payload: { userId: string }) => {
            if (recipient && payload.userId === recipient._id) setIsOnline(true);
        };

        const handleUserOffline = (payload: { userId: string }) => {
            if (recipient && payload.userId === recipient._id) setIsOnline(false);
        };

        const handleMessageSeen = (payload: { conversationId: string; userId: string; seenAt: string }) => {
            if (payload.conversationId === conversationId) {
                setMessages(prev => prev.map(m => {
                    if (!m.seenBy.includes(payload.userId)) {
                        return { ...m, seenBy: [...m.seenBy, payload.userId] };
                    }
                    return m;
                }));
            }
        };

        const handleReconnect = () => {
            if (conversationId && socket) {
                socket.emit("conversation:join", { conversationId });
                loadData();
                setRemoteIsTyping(false);
                if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
            }
        };

        if (socket && conversationId) {
            socket.emit("conversation:join", { conversationId });
            socket.on("message:new", handleNewMessage);
            socket.on("typing:start", handleTypingStart);
            socket.on("typing:stop", handleTypingStop);
            socket.on("message:seen", handleMessageSeen);
            socket.on("user:online", handleUserOnline);
            socket.on("user:offline", handleUserOffline);
            socket.on("connect", handleReconnect);

            messageService.markAsSeen(conversationId).catch(err => console.error("Failed to mark as seen", err));
        }

        const subscription = AppState.addEventListener("change", nextAppState => {
            if (nextAppState === "active") handleReconnect();
        });

        return () => {
            subscription.remove();
            if (socket && conversationId) {
                socket.emit("conversation:leave", { conversationId });
                socket.off("message:new", handleNewMessage);
                socket.off("typing:start", handleTypingStart);
                socket.off("typing:stop", handleTypingStop);
                socket.off("message:seen", handleMessageSeen);
                socket.off("user:online", handleUserOnline);
                socket.off("user:offline", handleUserOffline);
                socket.off("connect", handleReconnect);
            }
        };
    }, [conversationId]);

    // ── Presence: initial check + live updates, keyed to the resolved recipient ──
    useEffect(() => {
        const otherId = recipient?._id;
        if (!otherId) return;
        const socket = socketService.getSocket();
        if (!socket) return;

        const onOnline = (payload: { userId: string }) => {
            if (payload.userId === otherId) setIsOnline(true);
        };
        const onOffline = (payload: { userId: string }) => {
            if (payload.userId === otherId) setIsOnline(false);
        };
        const onList = (payload: { onlineUserIds: string[] }) => {
            if (Array.isArray(payload?.onlineUserIds)) {
                setIsOnline(payload.onlineUserIds.includes(otherId));
            }
        };

        socket.on("user:online", onOnline);
        socket.on("user:offline", onOffline);
        socket.on("presence:online-list", onList);

        const requestPresence = () => socket.emit("presence:check", { userIds: [otherId] });
        requestPresence();
        socket.on("connect", requestPresence);

        return () => {
            socket.off("user:online", onOnline);
            socket.off("user:offline", onOffline);
            socket.off("presence:online-list", onList);
            socket.off("connect", requestPresence);
        };
    }, [recipient?._id]);

    const reconcileMessage = (clientMessageId: string, serverMessage: Message) => {
        setMessages(prev => prev.map(m => {
            if (m.clientMessageId === clientMessageId) {
                if (!m.optimistic) return m;
                return serverMessage;
            }
            return m;
        }));
    };

    const handleTextChange = (text: string) => {
        setMsgText(text);

        const socket = socketService.getSocket();
        if (!socket || !conversationId) return;

        if (text.length === 0) {
            socket.emit("typing:stop", { conversationId });
            isTypingRef.current = false;
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            return;
        }

        if (!isTypingRef.current) {
            socket.emit("typing:start", { conversationId });
            isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing:stop", { conversationId });
            isTypingRef.current = false;
        }, 2000);
    };

    const handleBlur = () => {
        const socket = socketService.getSocket();
        if (socket && conversationId && isTypingRef.current) {
            socket.emit("typing:stop", { conversationId });
            isTypingRef.current = false;
        }
    };

    // Open the other participant's profile from the chat header.
    const goToProfile = () => {
        if (recipient?._id) router.push(`/(app)/profile/${recipient._id}` as any);
    };

    // Web: Enter sends, Shift+Enter inserts a newline. (Native uses onSubmitEditing.)
    const handleInputKeyPress = (e: any) => {
        if (Platform.OS !== 'web') return;
        const ne = e?.nativeEvent ?? e;
        const isEnter = ne?.key === 'Enter' || e?.key === 'Enter';
        const withShift = e?.shiftKey ?? ne?.shiftKey ?? false;
        if (isEnter && !withShift) {
            e?.preventDefault?.();
            handleSend();
        }
    };

    const handleSend = async () => {
        const hasText = msgText.trim().length > 0;
        if (!hasText) return;
        if (!conversationId) return;

        const socket = socketService.getSocket();
        if (socket && isTypingRef.current) {
            socket.emit("typing:stop", { conversationId });
            isTypingRef.current = false;
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }

        const clientMessageId = generateId();
        const tempId = generateId();

        const optimisticMessage: Message = {
            _id: tempId,
            conversationId: conversationId,
            senderId: currentUserId,
            text: msgText,
            seenBy: [currentUserId],
            createdAt: new Date().toISOString(),
            clientMessageId,
            optimistic: true,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMsgText("");

        try {
            const serverMessage = await messageService.sendMessage(
                conversationId,
                optimisticMessage.text,
                clientMessageId,
            );
            reconcileMessage(clientMessageId, serverMessage);
        } catch (err) {
            console.error("Send failed", err);
            setMessages(prev => prev.map(m => {
                if (m.clientMessageId === clientMessageId) {
                    return { ...m, failed: true, optimistic: false };
                }
                return m;
            }));
        }
    };

    const handleRetry = async (message: Message) => {
        if (!conversationId || !message.clientMessageId) return;

        setMessages(prev => prev.map(m => {
            if (m.clientMessageId === message.clientMessageId) {
                return { ...m, failed: undefined, optimistic: true };
            }
            return m;
        }));

        try {
            const serverMessage = await messageService.sendMessage(
                conversationId,
                message.text,
                message.clientMessageId,
                message.attachments,
            );
            reconcileMessage(message.clientMessageId, serverMessage);
        } catch (err) {
            console.error("Retry failed", err);
            setMessages(prev => prev.map(m => {
                if (m.clientMessageId === message.clientMessageId) {
                    return { ...m, failed: true, optimistic: false };
                }
                return m;
            }));
        }
    };

    // If we have neither ID nor recipient, we can't do anything
    if (!conversationId && !loading) {
        return (
            <View className="flex-1 bg-[#121216] border-l border-white/[0.08] items-center justify-center p-6">
                <View className="absolute top-4 right-4">
                    <TouchableOpacity onPress={onClose} className="bg-white/10 p-2 rounded-full">
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <AlertCircle size={48} color="#ef4444" className="mb-4" />
                <Text className="text-white font-bold text-xl mb-2">Chat Unavailable</Text>
                <Text className="text-gray-400 text-center">
                    Unable to start chat. Missing conversation ID.
                </Text>
            </View>
        );
    }

    const displayUser = recipient || { _id: "unknown", profilePicture: "", profileImageUrl: "" };
    const displayName = composeName(displayUser as any);
    const avatarUri = (displayUser as any).profilePicture || (displayUser as any).profileImageUrl;

    return (
        <View style={{ flex: 1, minHeight: 0 }} className="bg-[#121216] border-l border-white/[0.08]">
            {/* Chat Header — back · avatar · name · presence (Mark-booked pill + context chip removed). */}
            <View style={{ flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.02)' }} className="border-b border-white/[0.08]">
                <View className="px-4 py-3 flex-row items-center">
                    <View className="flex-row items-center" style={{ flex: 1, minWidth: 0 }}>
                        {!hideClose ? (
                            <TouchableOpacity
                                onPress={onClose}
                                accessibilityLabel="Back"
                                style={{ width: 30, height: 30, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
                            >
                                <ChevronLeft size={18} color="#D4D4D8" />
                            </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                            onPress={goToProfile}
                            disabled={!recipient?._id}
                            className="flex-row items-center"
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            <View style={{ position: 'relative', width: 40, height: 40, marginRight: 12 }}>
                                {avatarUri ? (
                                    <Image
                                        source={{ uri: avatarUri }}
                                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C23' }}
                                    />
                                ) : (
                                    <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,107,53,0.14)' }}>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>{initialsOf(displayName)}</Text>
                                    </View>
                                )}
                                {isOnline && (
                                    <View
                                        style={{ position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#121216' }}
                                    />
                                )}
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FFFFFF', fontSize: 14.5 }} numberOfLines={1}>{displayName}</Text>
                                {isOnline ? (
                                    <Text style={{ fontFamily: 'Outfit-Regular', color: '#22C55E', fontSize: 11, marginTop: 1 }}>Active now</Text>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Messages Area */}
            <FlatList
                data={messages}
                keyExtractor={item => item._id || item.clientMessageId || Math.random().toString()}
                contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 16, gap: 11, flexGrow: 1 }}
                style={{ flex: 1, minHeight: 0 }}
                refreshing={loading}
                onRefresh={() => {
                    if (conversationId) {
                        setLoading(true);
                        messageService.getMessages(conversationId)
                            .then(fetchedMessages => {
                                const sorted = fetchedMessages.sort((a, b) =>
                                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                                );
                                setMessages(sorted);
                                setError(null);
                            })
                            .catch(err => {
                                console.error("Refresh failed", err);
                                setError("Failed to refresh messages.");
                            })
                            .finally(() => setLoading(false));
                    }
                }}
                ListEmptyComponent={() => (
                    <View className="flex-1 items-center justify-center py-10" style={{ paddingHorizontal: 40 }}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#FF6B35" />
                        ) : error ? (
                            <View className="items-center">
                                <Text style={{ color: '#f87171', fontFamily: 'Outfit-Regular', marginBottom: 8 }}>{error}</Text>
                                <TouchableOpacity onPress={() => setLoading(true)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
                                    <Text style={{ color: '#D4D4D8', fontFamily: 'Outfit-SemiBold' }}>Retry Loading</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', color: '#D4D4D8', fontSize: 20 }}>No messages yet</Text>
                                <Text style={{ fontFamily: 'Outfit-Regular', color: '#8B8B99', fontSize: 12.5 }}>Say hello 👋</Text>
                            </View>
                        )}
                    </View>
                )}
                renderItem={({ item }) => {
                    // ── System message: centered pill ──
                    if (item.system) {
                        return <SystemPill text={item.text} />;
                    }

                    const isMe = item.senderId === currentUserId;
                    const timeString = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                        <View className={`max-w-[80%] rounded-2xl ${isMe
                            ? 'bg-[#FF6B35] self-end rounded-tr-none'
                            : 'bg-[#1C1C23] border border-white/[0.08] self-start rounded-tl-none'
                            } ${item.optimistic ? 'opacity-60' : ''} ${item.failed ? 'border border-red-500' : ''}`}>

                            {/* Image attachments */}
                            {item.attachments && item.attachments.length > 0 ? (
                                <View style={{ padding: 4, gap: 4 }}>
                                    {item.attachments.map((att, idx) =>
                                        att.type === 'image' ? (
                                            <Image
                                                key={idx}
                                                source={{ uri: att.url }}
                                                style={{
                                                    width: 200,
                                                    height: 150,
                                                    borderRadius: 12,
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                }}
                                                resizeMode="cover"
                                            />
                                        ) : null
                                    )}
                                </View>
                            ) : null}

                            {/* Message text (only if non-empty) */}
                            {item.text ? (
                                <View style={{ paddingHorizontal: 13, paddingTop: item.attachments?.length ? 2 : 9, paddingBottom: 7 }}>
                                    <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 14, lineHeight: 20, color: isMe ? '#190B05' : '#D4D4D8' }}>{item.text}</Text>
                                </View>
                            ) : null}

                            <View className="flex-row items-center justify-end" style={{ paddingHorizontal: 13, paddingBottom: 7, gap: 5 }}>
                                <Text style={{ fontFamily: 'SpaceMono-Regular', fontSize: 9, color: isMe ? 'rgba(25,11,5,0.5)' : '#6B6B78' }}>
                                    {timeString}
                                    {isMe && item.seenBy.length > 1 && (
                                        <Text style={{ fontFamily: 'Outfit-Bold', color: 'rgba(25,11,5,0.6)' }}>  Seen</Text>
                                    )}
                                </Text>
                                {item.failed && (
                                    <TouchableOpacity
                                        onPress={() => handleRetry(item)}
                                        style={{ marginLeft: 6, backgroundColor: 'rgba(239,68,68,0.16)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}
                                    >
                                        <Text style={{ color: '#f87171', fontFamily: 'Outfit-Bold', fontSize: 9 }}>Retry</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            {/* Typing Indicator */}
            {remoteIsTyping && (
                <View style={{ flexShrink: 0, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#121216' }}>
                    <Text style={{ fontFamily: 'Outfit-Regular', fontStyle: 'italic', color: '#8B8B99', fontSize: 11 }}>
                        {displayName} is typing…
                    </Text>
                </View>
            )}

            {/* Requirement-linked footer — the Mark-booked action is gone; this just signals
                that secure booking/payment is still on the way for threads tied to a requirement. */}
            {isBookingThread ? (
                <View
                    style={{
                        flexShrink: 0,
                        alignItems: 'center',
                        paddingVertical: 7,
                        backgroundColor: 'rgba(139,92,246,0.06)',
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(139,92,246,0.14)',
                    }}
                >
                    <Text style={{ color: 'rgba(139,92,246,0.75)', fontSize: 11, fontFamily: 'Outfit-Regular' }}>
                        Secure booking & payment — coming soon
                    </Text>
                </View>
            ) : null}

            {/* Input Area */}
            {Platform.OS === 'web' ? (
                <View style={{ flexShrink: 0, backgroundColor: '#121216' }} className="p-4 border-t border-white/[0.08] flex-row items-center gap-3">
                    <TextInput
                        nativeID="chatMsgInput"
                        value={msgText}
                        onChangeText={handleTextChange}
                        onBlur={handleBlur}
                        onKeyPress={handleInputKeyPress}
                        onSubmitEditing={handleSend}
                        placeholder="Write a message…"
                        placeholderTextColor="#8B8B99"
                        selectionColor="#FF6B35"
                        className="flex-1 rounded-full px-4 max-h-24"
                        multiline
                        numberOfLines={1}
                        style={{ outlineStyle: 'none', backgroundColor: '#212129', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF', paddingTop: 10, paddingBottom: 10, textAlignVertical: 'center', fontFamily: 'Outfit-Regular' } as any}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!msgText.trim()}
                        className="p-3 rounded-full"
                        style={{ backgroundColor: msgText.trim() ? '#FF6B35' : 'rgba(255,255,255,0.08)' }}
                    >
                        <Send size={20} color={msgText.trim() ? '#190B05' : '#6B6B78'} />
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 0 }}>
                    <View style={{ backgroundColor: '#121216' }} className="p-4 border-t border-white/[0.08] flex-row items-center gap-3">
                        <TextInput
                            value={msgText}
                            onChangeText={handleTextChange}
                            onBlur={handleBlur}
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                            placeholder="Write a message…"
                            placeholderTextColor="#8B8B99"
                            selectionColor="#FF6B35"
                            className="flex-1 rounded-full px-4 max-h-24"
                            multiline
                            numberOfLines={1}
                            style={{ backgroundColor: '#212129', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', color: '#FFFFFF', paddingTop: 10, paddingBottom: 10, textAlignVertical: 'center', fontFamily: 'Outfit-Regular' }}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!msgText.trim()}
                            className="p-3 rounded-full"
                            style={{ backgroundColor: msgText.trim() ? '#FF6B35' : 'rgba(255,255,255,0.08)' }}
                        >
                            <Send size={20} color={msgText.trim() ? '#190B05' : '#6B6B78'} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </View>
    );
};
