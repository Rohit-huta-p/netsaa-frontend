// src/mobile/connections/ChatWindow
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
    FileText,
    CheckCircle,
} from "lucide-react-native";
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from "@/stores/authStore";

import messageService from "@/services/messageService";
import { socketService } from "@/services/socketService";
import { requirementService } from "@/services/requirementService";
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
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: 12,
                    fontFamily: 'Outfit-Regular',
                    textAlign: 'center',
                }}
            >
                {text}
            </Text>
        </View>
    </View>
);

// ── Context chip under the header (booking threads only) ──
const ContextChip = ({
    label,
    requirementId,
    proposalId,
}: {
    label: string;
    requirementId: string;
    proposalId: string;
}) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => router.push(`/(app)/client/${requirementId}?proposal=${proposalId}` as any)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 6,
                backgroundColor: 'rgba(255,107,53,0.08)',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,107,53,0.15)',
            }}
        >
            <FileText size={12} color="#FF6B35" />
            <Text
                style={{
                    color: '#FF6B35',
                    fontSize: 12,
                    fontFamily: 'Outfit-Regular',
                    flex: 1,
                }}
                numberOfLines={1}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

// ── Mark-as-booked inline confirm state ──
type BookState = 'idle' | 'confirming' | 'loading' | 'booked';

export const ChatWindow = ({ conversationId, recipient: initialRecipient, onClose, hideClose }: ChatWindowProps) => {
    const currentUserId = useAuthStore.getState().user?._id || "me";
    const currentUserRole = useAuthStore.getState().user?.role;
    const queryClient = useQueryClient();
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

    // Mark-as-booked state
    const [bookState, setBookState] = useState<BookState>('idle');
    const [bookError, setBookError] = useState<string | null>(null);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const remoteTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    // Derived: is this a booking thread (has context) + is viewer the client?
    const ctx = conversation?.context;
    const isBookingThread = !!ctx?.requirementId;
    const isClient = currentUserRole === 'client';

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

    // ── Mark as booked ──
    const handleMarkBooked = async () => {
        if (!ctx?.requirementId) return;
        if (bookState === 'confirming') {
            // Confirmed — proceed
            setBookState('loading');
            setBookError(null);
            try {
                await requirementService.changeStatus(ctx.requirementId, 'book');
                queryClient.invalidateQueries({ queryKey: ['client', 'requirements'] });
                setBookState('booked');
            } catch (e: any) {
                const msg = e?.response?.data?.meta?.message || e?.message || 'Could not mark as booked';
                setBookError(msg);
                setBookState('idle');
            }
        } else if (bookState === 'idle') {
            setBookState('confirming');
        }
    };

    const handleCancelBook = () => {
        setBookState('idle');
        setBookError(null);
    };

    // If we have neither ID nor recipient, we can't do anything
    if (!conversationId && !loading) {
        return (
            <View className="flex-1 bg-[#09090b] border-l border-white/10 items-center justify-center p-6">
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

    // Context chip label
    const chipLabel = ctx?.label || 'View requirement';

    return (
        <View style={{ flex: 1, minHeight: 0 }} className="bg-[#09090b] border-l border-white/10">
            {/* Chat Header */}
            <View style={{ flexShrink: 0 }} className="border-b border-white/10 bg-white/5">
                <View className="px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-row items-center" style={{ flex: 1, minWidth: 0 }}>
                        {!hideClose ? (
                            <TouchableOpacity
                                onPress={onClose}
                                accessibilityLabel="Back"
                                className="mr-1 p-1.5 rounded-full"
                                style={{ marginLeft: -6 }}
                            >
                                <ChevronLeft size={24} color="white" />
                            </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                            onPress={goToProfile}
                            disabled={!recipient?._id}
                            className="flex-row items-center"
                            style={{ flex: 1, minWidth: 0 }}
                        >
                            <View className="relative w-10 h-10 mr-3">
                                {avatarUri ? (
                                    <Image
                                        source={{ uri: avatarUri }}
                                        className="w-10 h-10 rounded-full bg-gray-800"
                                    />
                                ) : (
                                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,107,53,0.15)' }}>
                                        <Text style={{ fontFamily: 'Outfit-SemiBold', color: '#FF6B35', fontSize: 14 }}>{initialsOf(displayName)}</Text>
                                    </View>
                                )}
                                {isOnline && (
                                    <View
                                        className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-[#09090b]"
                                        style={{ bottom: 0, right: 0 }}
                                    />
                                )}
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text className="text-white" style={{ fontFamily: 'Outfit-SemiBold' }} numberOfLines={1}>{displayName}</Text>
                                {isOnline ? (
                                    <Text className="text-green-400 text-[11px]">Active now</Text>
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center gap-3">
                        {/* Mark as booked — client only, booking thread only, not already booked */}
                        {isBookingThread && isClient && bookState !== 'booked' ? (
                            bookState === 'confirming' ? (
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <TouchableOpacity
                                        onPress={handleMarkBooked}
                                        style={{
                                            backgroundColor: 'rgba(34,197,94,0.15)',
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: 'rgba(34,197,94,0.4)',
                                        }}
                                    >
                                        <Text style={{ color: '#22c55e', fontSize: 12, fontFamily: 'Outfit-SemiBold' }}>
                                            Confirm
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleCancelBook}
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.06)',
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: 8,
                                        }}
                                    >
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Outfit-Regular' }}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : bookState === 'loading' ? (
                                <ActivityIndicator size="small" color="#22c55e" />
                            ) : (
                                <TouchableOpacity
                                    onPress={handleMarkBooked}
                                    style={{
                                        backgroundColor: 'rgba(34,197,94,0.1)',
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: 'rgba(34,197,94,0.25)',
                                    }}
                                >
                                    <Text style={{ color: '#22c55e', fontSize: 12, fontFamily: 'Outfit-SemiBold' }}>
                                        Mark booked
                                    </Text>
                                </TouchableOpacity>
                            )
                        ) : null}
                    </View>
                </View>

                {/* Context chip — booking threads only (requirementId guaranteed by isBookingThread gate) */}
                {isBookingThread && ctx ? (
                    <ContextChip
                        label={chipLabel}
                        requirementId={ctx.requirementId!}
                        proposalId={ctx.proposalId!}
                    />
                ) : null}
            </View>

            {/* Book error banner */}
            {bookError ? (
                <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 14, paddingVertical: 6 }}>
                    <Text style={{ color: '#f87171', fontSize: 12, fontFamily: 'Outfit-Regular' }}>{bookError}</Text>
                </View>
            ) : null}

            {/* Messages Area */}
            <FlatList
                data={messages}
                keyExtractor={item => item._id || item.clientMessageId || Math.random().toString()}
                contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
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
                    <View className="flex-1 items-center justify-center py-10">
                        {loading ? (
                            <ActivityIndicator size="large" color="white" />
                        ) : error ? (
                            <View className="items-center">
                                <Text className="text-red-500 mb-2">{error}</Text>
                                <TouchableOpacity onPress={() => setLoading(true)} className="bg-white/10 px-4 py-2 rounded-full">
                                    <Text className="text-white">Retry Loading</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text className="text-gray-500 italic">No messages yet. Say hello!</Text>
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
                            : 'bg-[#17151d] border border-white/[0.06] self-start rounded-tl-none'
                            } ${item.optimistic ? 'opacity-70' : ''} ${item.failed ? 'border border-red-500' : ''}`}>

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
                                                    borderRadius: 10,
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
                                <View style={{ paddingHorizontal: 12, paddingTop: item.attachments?.length ? 2 : 12, paddingBottom: 8 }}>
                                    <Text style={{ fontFamily: 'Outfit-Regular' }} className={`text-base ${isMe ? 'text-[#1A0D06]' : 'text-[#e8e4ea]'}`}>{item.text}</Text>
                                </View>
                            ) : null}

                            <View className="flex-row items-center justify-end px-3 pb-2 gap-1">
                                <Text className={`text-[10px] ${isMe ? 'text-black/45' : 'text-white/40'}`}>
                                    {timeString}
                                    {isMe && item.seenBy.length > 1 && (
                                        <Text className="font-bold ml-1"> • Seen</Text>
                                    )}
                                </Text>
                                {item.failed && (
                                    <TouchableOpacity
                                        onPress={() => handleRetry(item)}
                                        className="ml-2 bg-red-500/20 px-2 py-0.5 rounded"
                                    >
                                        <Text className="text-red-400 text-[10px] font-bold">Retry</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            {/* Typing Indicator */}
            {remoteIsTyping && (
                <View style={{ flexShrink: 0 }} className="px-4 py-2 bg-[#09090b]">
                    <Text className="text-gray-400 text-xs italic">
                        {displayName} is typing...
                    </Text>
                </View>
            )}

            {/* Booking footer */}
            {isBookingThread ? (
                bookState === 'booked' ? (
                    <View
                        style={{
                            flexShrink: 0,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            backgroundColor: 'rgba(34,197,94,0.08)',
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(34,197,94,0.2)',
                        }}
                    >
                        <CheckCircle size={14} color="#22c55e" />
                        <Text style={{ color: '#22c55e', fontSize: 12, fontFamily: 'Outfit-SemiBold' }}>
                            Booked
                        </Text>
                    </View>
                ) : (
                    <View
                        style={{
                            flexShrink: 0,
                            alignItems: 'center',
                            paddingVertical: 6,
                            backgroundColor: 'rgba(139,92,246,0.05)',
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(139,92,246,0.12)',
                        }}
                    >
                        <Text style={{ color: 'rgba(139,92,246,0.6)', fontSize: 11, fontFamily: 'Outfit-Regular' }}>
                            Secure booking & payment — coming soon
                        </Text>
                    </View>
                )
            ) : null}

            {/* Input Area */}
            {Platform.OS === 'web' ? (
                <View style={{ flexShrink: 0 }} className="p-4 border-t border-white/10 bg-[#09090b] flex-row items-center gap-3">
                    <TextInput
                        nativeID="chatMsgInput"
                        value={msgText}
                        onChangeText={handleTextChange}
                        onBlur={handleBlur}
                        onKeyPress={handleInputKeyPress}
                        onSubmitEditing={handleSend}
                        placeholder="Write a message..."
                        placeholderTextColor="#6b7280"
                        selectionColor="#FF6B35"
                        className="flex-1 bg-white/10 text-white rounded-full px-4 max-h-24"
                        multiline
                        numberOfLines={1}
                        style={{ outlineStyle: 'none', paddingTop: 10, paddingBottom: 10, textAlignVertical: 'center', fontFamily: 'Outfit-Regular' } as any}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!msgText.trim()}
                        className={`p-3 rounded-full ${!msgText.trim() ? 'bg-white/10' : 'bg-[#FF6B35]'}`}
                    >
                        <Send size={20} color="#1A0D06" />
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flexShrink: 0 }}>
                    <View className="p-4 border-t border-white/10 bg-[#09090b] flex-row items-center gap-3">
                        <TextInput
                            value={msgText}
                            onChangeText={handleTextChange}
                            onBlur={handleBlur}
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                            placeholder="Write a message..."
                            placeholderTextColor="#6b7280"
                            selectionColor="#FF6B35"
                            className="flex-1 bg-white/10 text-white rounded-full px-4 max-h-24"
                            multiline
                            numberOfLines={1}
                            style={{ paddingTop: 10, paddingBottom: 10, textAlignVertical: 'center', fontFamily: 'Outfit-Regular' }}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!msgText.trim()}
                            className={`p-3 rounded-full ${!msgText.trim() ? 'bg-white/10' : 'bg-[#FF6B35]'}`}
                        >
                            <Send size={20} color="#1A0D06" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </View>
    );
};
