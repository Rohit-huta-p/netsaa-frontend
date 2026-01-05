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
    AppState // Import AppState
} from "react-native";
import {
    X,
    Send,
    Phone,
    Video,
    AlertCircle
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";

import messageService from "@/services/messageService";
import { socketService } from "@/services/socketService";
import { Message } from "@/types/chat";
import { generateId } from "@/utils/idGenerator";
import { Connection } from "@/types/connection";


export interface UserBasic {
    _id: string;
    displayName: string;
    profilePicture?: string;
    email?: string;
    role?: string;
}

import conversationService from "@/services/conversationService";

interface ChatWindowProps {
    conversationId: string;
    recipient?: UserBasic; // Made optional
    onClose: () => void;
}

interface SocketMessagePayload {
    _id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
    clientMessageId?: string;
}

export const ChatWindow = ({ conversationId, recipient: initialRecipient, onClose }: ChatWindowProps) => {
    const currentUserId = useAuthStore.getState().user?._id || "me";

    // State
    const [recipient, setRecipient] = useState<UserBasic | undefined>(initialRecipient);
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgText, setMsgText] = useState("");
    const [loading, setLoading] = useState(true);
    const [remoteIsTyping, setRemoteIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false); // Default to false
    const [error, setError] = useState<string | null>(null);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const remoteTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    // Initial Fetch Effect
    useEffect(() => {
        // If neither ID nor recipient is provided, we can't load anything
        if (!conversationId) {
            setError("Invalid Conversation ID");
            setLoading(false);
            return;
        }

        // Clear messages from previous conversation immediately
        setMessages([]);

        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Recipient if missing
                // (Only needed if we navigated here without passing recipient object)
                if (!recipient) {
                    const conv = await conversationService.getConversationById(conversationId);
                    if (conv) {
                        const otherPart = conv.participants.find((p: any) => p._id !== currentUserId) || conv.participants[0];
                        setRecipient(otherPart);
                    } else {
                        throw new Error("Conversation not found");
                    }
                }

                // 2. Fetch Messages
                // ALWAYS fetch messages for the given ID on mount
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

        // Real-time: Join Conversation Room
        const socket = socketService.getSocket();

        const handleNewMessage = (payload: SocketMessagePayload) => {
            console.log("Socket: New message received", payload);
            if (payload.conversationId !== conversationId) return;

            setMessages(prev => {
                // 1. Check for duplicates by _id
                if (prev.some(m => m._id === payload._id)) {
                    return prev;
                }

                const newMessage: Message = {
                    ...payload,
                    seenBy: [], // Default for UI compatibility
                    optimistic: false,
                    failed: false
                };

                // 2. Check for optimistic match
                const optimisticIndex = prev.findIndex(m =>
                    payload.clientMessageId && m.clientMessageId === payload.clientMessageId
                );

                if (optimisticIndex !== -1) {
                    // Replace optimistic message
                    const next = [...prev];
                    next[optimisticIndex] = newMessage;
                    return next;
                }

                // 3. Append new message
                return [...prev, newMessage];
            });
        };

        const handleTypingStart = (payload: { conversationId: string, senderId: string }) => {
            console.log("Socket: typing:start received", payload); // DEBUG LOG

            // Check conversation ID AND ensure it's not me (though backend should filter me, good to be safe)
            if (payload.conversationId === conversationId && payload.senderId !== currentUserId) {
                setRemoteIsTyping(true);

                // Clear existing safety timeout
                if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);

                // Set new safety timeout (e.g. 5 seconds)
                remoteTypingTimeoutRef.current = setTimeout(() => {
                    setRemoteIsTyping(false);
                }, 5000);
            } else {
                console.log("Socket: typing:start ignored - mismatch", {
                    currentConvo: conversationId,
                    myId: currentUserId,
                    payload
                });
            }
        };

        const handleTypingStop = (payload: { conversationId: string, senderId: string }) => {
            console.log("Socket: typing:stop received", payload); // DEBUG LOG
            if (payload.conversationId === conversationId && payload.senderId !== currentUserId) {
                setRemoteIsTyping(false);
                if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
            }
        };

        const handleUserOnline = (payload: { userId: string }) => {
            if (recipient && payload.userId === recipient._id) {
                setIsOnline(true);
            }
        };

        const handleUserOffline = (payload: { userId: string }) => {
            if (recipient && payload.userId === recipient._id) {
                setIsOnline(false);
            }
        };

        const handleMessageSeen = (payload: { conversationId: string, userId: string, seenAt: string }) => {
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
                console.log("Socket: Reconnected (or connected), re-joining and fetching");

                // 1. Re-join room
                socket.emit("conversation:join", { conversationId });

                // 2. Refetch messages (REST source of truth)
                loadData();

                // 3. Reset typing state
                setRemoteIsTyping(false);
                if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
            }
        };

        if (socket && conversationId) {
            console.log("Socket: Joining conversation", conversationId);
            socket.emit("conversation:join", { conversationId });
            socket.on("message:new", handleNewMessage);
            socket.on("typing:start", handleTypingStart);
            socket.on("typing:stop", handleTypingStop);
            socket.on("message:seen", handleMessageSeen);
            socket.on("user:online", handleUserOnline);
            socket.on("user:offline", handleUserOffline);
            socket.on("connect", handleReconnect); // Handle reconnects

            // Mark as seen on join
            messageService.markAsSeen(conversationId).catch(err => console.error("Failed to mark as seen", err));
        }

        // Handle AppState changes (Background -> Foreground)
        const subscription = AppState.addEventListener("change", nextAppState => {
            if (nextAppState === "active") {
                handleReconnect();
            }
        });

        return () => {
            subscription.remove();
            if (socket && conversationId) {
                console.log("Socket: Leaving conversation", conversationId);
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
    }, [conversationId]); // Re-run if ID changes

    // Helper to reconcile optimistic messages with server response
    const reconcileMessage = (clientMessageId: string, serverMessage: Message) => {
        setMessages(prev => prev.map(m => {
            if (m.clientMessageId === clientMessageId) {
                // RACE CONDITION FIX:
                // If message is already NOT optimistic, it means Socket updated it first.
                // Do not overwrite with REST response to preserve potential newer state (like seenBy) or avoid flicker.
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

        // Reset inactivity timer (2s)
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

    const handleSend = async () => {
        if (!msgText.trim() || !conversationId) return;

        // Stop typing immediately on send
        const socket = socketService.getSocket();
        if (socket && isTypingRef.current) {
            socket.emit("typing:stop", { conversationId });
            isTypingRef.current = false;
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }

        const clientMessageId = generateId();
        const tempId = generateId(); // Temporary local ID for key prop

        const optimisticMessage: Message = {
            _id: tempId,
            conversationId: conversationId,
            senderId: currentUserId,
            text: msgText,
            seenBy: [currentUserId],
            createdAt: new Date().toISOString(),
            clientMessageId,
            optimistic: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMsgText("");

        try {
            const serverMessage = await messageService.sendMessage(conversationId, optimisticMessage.text, clientMessageId);
            reconcileMessage(clientMessageId, serverMessage);
        } catch (err) {
            console.error("Send failed", err);
            // Mark as failed but keep visible
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

        // Reset state to optimistic
        setMessages(prev => prev.map(m => {
            if (m.clientMessageId === message.clientMessageId) {
                return { ...m, failed: undefined, optimistic: true };
            }
            return m;
        }));

        try {
            const serverMessage = await messageService.sendMessage(conversationId, message.text, message.clientMessageId);
            reconcileMessage(message.clientMessageId, serverMessage);
        } catch (err) {
            console.error("Retry failed", err);
            // Mark as failed again
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

    const displayUser = recipient || { _id: "unknown", displayName: "Loading...", profilePicture: "" };

    return (
        <View className="flex-1 bg-[#09090b] border-l border-white/10">
            {/* Chat Header */}
            <View className="px-4 py-3 border-b border-white/10 flex-row items-center justify-between bg-white/5">
                <View className="flex-row items-center">
                    <View>
                        <Image
                            source={{ uri: displayUser.profilePicture || "https://i.pravatar.cc/150?img=5" }}
                            className="w-10 h-10 rounded-full bg-gray-800 mr-3"
                        />
                        {isOnline && (
                            <View className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-[#18181b]" />
                        )}
                    </View>
                    <View>
                        <Text className="text-white font-bold">{displayUser.displayName}</Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity><Phone size={20} color="#9ca3af" /></TouchableOpacity>
                    <TouchableOpacity><Video size={20} color="#9ca3af" /></TouchableOpacity>
                    <TouchableOpacity onPress={onClose} className="bg-white/10 p-1.5 rounded-full">
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages Area - Always render list to show optimistic updates even if loading history */}
            <FlatList
                data={messages}
                keyExtractor={item => item._id || item.clientMessageId || Math.random().toString()}
                contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
                className="flex-1"
                refreshing={loading}
                onRefresh={() => {
                    // Manual refresh mechanism
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
                    const isMe = item.senderId === currentUserId;
                    const timeString = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                        <View className={`max-w-[80%] p-3 rounded-2xl ${isMe
                            ? 'bg-purple-600 self-end rounded-tr-none'
                            : 'bg-white/10 self-start rounded-tl-none'
                            } ${item.optimistic ? 'opacity-70' : ''} ${item.failed ? 'border border-red-500' : ''}`}>
                            <Text className="text-white text-base">{item.text}</Text>
                            <View className="flex-row items-center justify-end mt-1 gap-1">
                                <Text className="text-white/40 text-[10px]">
                                    {timeString}
                                    {isMe && item.seenBy.length > 1 && (
                                        <Text className="text-blue-400 font-bold ml-1"> • Seen</Text>
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
                <View className="px-4 py-2 bg-[#09090b]">
                    <Text className="text-gray-400 text-xs italic">
                        {displayUser.displayName} is typing...
                    </Text>
                </View>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View className="p-4 border-t border-white/10 bg-[#09090b] flex-row items-center gap-3">
                    <TextInput
                        value={msgText}
                        onChangeText={handleTextChange}
                        onBlur={handleBlur}
                        placeholder="Type a message..."
                        placeholderTextColor="#6b7280"
                        className="flex-1 bg-white/10 text-white rounded-full px-4 py-3 max-h-24"
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!msgText.trim()} // Only disable if empty
                        className={`p-3 rounded-full ${!msgText.trim() ? 'bg-gray-700' : 'bg-purple-600'}`}
                    >
                        <Send size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};
