// app/(app)/connections/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    Search,
    Check,
    X,
    MessageCircle,
    MoreHorizontal,
    Users,
    ArrowRight,
    Send,
    Phone,
    Video
} from "lucide-react-native";
import connectionService from "@/services/connectionService";
import { useAuthStore } from "@/stores/authStore";

import { ChatWindow, UserBasic } from "@/components/connections/ChatWindow";
import { InvitationCard } from "@/components/connections/InvitationCard";
import { ConnectionItem } from "@/components/connections/ConnectionItem";
import { Connection, ConnectionRequest } from "@/types/connection";
import conversationService, { PopulatedConversation } from "@/services/conversationService";
import { socketService } from "@/services/socketService";

// Helper Interface for strict payload
interface SocketMessagePayload {
    _id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
}
type ActiveChat = {
    conversationId?: string;
    recipient: UserBasic;
};


// --- MAIN SCREEN ---

export default function ConnectionsScreen() {
    const router = useRouter();
    const [invitations, setInvitations] = useState<ConnectionRequest[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    // Map userId -> PopulatedConversation
    const [conversationMap, setConversationMap] = useState<Record<string, PopulatedConversation>>({});
    // Local unread counts: ConversationId -> count
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeConversation, setActiveConversation] = useState<ActiveChat | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());



    const fetchData = async () => {
        try {
            const [reqs, conns, convs] = await Promise.all([
                connectionService.getConnectionRequests(),
                connectionService.getConnections(),
                conversationService.getConversations()
            ]);
            setInvitations(reqs);
            setConnections(conns);

            // Populate map
            const map: Record<string, PopulatedConversation> = {};
            convs.forEach(c => {
                const other = c.participants.find(p => p._id !== useAuthStore.getState().user?._id) || c.participants[0];
                if (other) map[other._id] = c;
            });
            setConversationMap(map);

            // RESET unread counts on full fetch/refresh as per requirements
            setUnreadCounts({});

            return conns; // Return for use
        } catch (e) {
            console.error(e);
            return [];
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData().then((conns) => {
            if (conns && conns.length > 0) {
                const socket = socketService.getSocket();
                if (socket) {
                    const myId = useAuthStore.getState().user?._id;
                    const userIdsToCheck = conns.map((c: Connection) =>
                        c.requesterId._id === myId ? c.recipientId._id : c.requesterId._id
                    );
                    socket.emit("presence:check", { userIds: userIdsToCheck });
                }
            }
        });

        // Global Socket Listener for new messages
        const socket = socketService.getSocket();

        const handleNewMessage = (payload: SocketMessagePayload) => {
            console.log("ConnectionsScreen: New message", payload);

            // If this conversation is currently active, ignore (ChatWindow handles it)
            // Note: Since activeConversation is state, we need to be careful about closure staleness.
            // However, ChatWindow is a modal on top. If it's open, activeConversation is set.
            // Using a ref or simply checking state inside setUnreadCounts/setConversationMap updates might be safer if closure issue arises.
            // For now, straightforward check:

            setConversationMap(prev => {
                // Find which user this conversation belongs to
                // We might need to look up by conversationId or senderId
                // If we don't have it, we might need to fetch it or create a placeholder?
                // For simplicity, find by conversationId in values
                let foundUserId: string | undefined;
                let foundConv = Object.values(prev).find(c => c._id === payload.conversationId);

                if (foundConv) {
                    const other = foundConv.participants.find(p => p._id !== payload.senderId); // If sender is other, use sender. If sender is me?
                    // Actually, we map by "Other User ID".
                    // If sender is NOT me, sender is other.
                    const myId = useAuthStore.getState().user?._id;
                    if (payload.senderId !== myId) {
                        foundUserId = payload.senderId;
                    } else {
                        // If I sent it (maybe from another device?), the key is the recipient.
                        // We can't easily know recipient from payload unless we scan participants.
                        // But if we found the conv, we know the key.
                        foundUserId = Object.keys(prev).find(key => prev[key]._id === payload.conversationId);
                    }
                }

                if (!foundUserId) {
                    // Try to find by senderId if it's a new conversation started by someone else
                    // (But we only have senderId in payload)
                    // If we have a connection with this senderId, we can assuming it's them.
                    foundUserId = payload.senderId;
                }

                if (foundUserId && prev[foundUserId]) {
                    return {
                        ...prev,
                        [foundUserId]: {
                            ...prev[foundUserId],
                            lastMessage: payload.text
                            // lastMessageAt: payload.createdAt // Type doesn't have it yet? let's stick to text
                        }
                    };
                }
                return prev;
            });

            // If NOT active, increment unread
            setActiveConversation(current => {
                if (current?.conversationId !== payload.conversationId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [payload.conversationId]: (prev[payload.conversationId] || 0) + 1
                    }));
                }
                return current;
            });
        };

        const handleMessageSeen = (payload: { conversationId: string, userId: string }) => {
            // If *I* saw the message (e.g. on another device), clear unread count
            const myId = useAuthStore.getState().user?._id;
            if (payload.userId === myId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [payload.conversationId]: 0
                }));
            }
        };

        const handleUserOnline = (payload: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.add(payload.userId);
                return next;
            });
        };

        const handleUserOffline = (payload: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(payload.userId);
                return next;
            });
        };

        if (socket) {
            socket.on("message:new", handleNewMessage);
            socket.on("message:seen", handleMessageSeen);
            socket.on("user:online", handleUserOnline);
            socket.on("user:offline", handleUserOffline);
            socket.on("presence:online-list", (payload: { onlineUserIds: string[] }) => {
                setOnlineUsers(new Set(payload.onlineUserIds));
            });
        }

        return () => {
            if (socket) {
                socket.off("message:new", handleNewMessage);
                socket.off("message:seen", handleMessageSeen);
                socket.off("user:online", handleUserOnline);
                socket.off("user:offline", handleUserOffline);
                socket.off("presence:online-list");
            }
        };
    }, []);

    // Reset unread count when opening a chat
    useEffect(() => {
        if (activeConversation?.conversationId) {
            setUnreadCounts(prev => ({
                ...prev,
                [activeConversation.conversationId!]: 0
            }));
        }
    }, [activeConversation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    }

    const handleAccept = async (id: string) => {
        const response = await connectionService.acceptConnectionRequest(id);

        setInvitations(prev => prev.filter(i => i._id !== id));

        // Use returned data to open chat immediately
        if (response.success && response.data) {
            const { conversation, ...connData } = response.data;
            // Determine recipient from connection data (it's the other user)
            // response.data usually has requesterId/recipientId populated
            // If I initiated, they are recipient. If they initiated, they are requester.
            // Wait, handleAccept means *they* requested, so *they* are requesterId.
            const otherUser = response.data.requesterId; // The person who sent the request

            setActiveConversation({
                conversationId: conversation?._id || (typeof conversation === 'string' ? conversation : undefined),
                recipient: otherUser
            });

            // Add to list
            setConnections(prev => [response.data, ...prev]);
        }
    };


    const handleIgnore = async (id: string) => {
        try {
            await connectionService.rejectConnectionRequest(id);
            setInvitations(prev => prev.filter(i => i._id !== id));
        } catch (e) { console.error("Ignore failed", e); }
    }

    const openChat = async (connection: Connection) => {
        const currentUserId = useAuthStore.getState().user?._id;
        const otherUser = (connection.requesterId._id === currentUserId) ? connection.recipientId : connection.requesterId;

        // Optimistic / Loading state could be added here
        try {
            const conv = await conversationService.createConversation(otherUser._id);
            setActiveConversation({
                conversationId: conv._id,
                recipient: otherUser
            });
        } catch (error) {
            console.error("Failed to open chat", error);
            // Optionally show error toast
        }
    };

    return (
        <View className="flex-1 bg-[#09090b]">
            {/* Background */}
            <LinearGradient
                colors={['#0f766e', '#09090b']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
                className="absolute top-0 left-0 right-0 h-[400px]"
            />

            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <View className="px-4 pt-4 pb-2">

                    <Text className="text-pink-400 text-xs font-bold uppercase tracking-widest mb-1">
                        My Network
                    </Text>

                    <View className="flex-row items-center justify-between mb-4">
                        <Text className={`${activeConversation ? "text-xl" : "text-3xl"} font-black text-white truncate`}>
                            {activeConversation ? "Crew" : "The Crew"}
                        </Text>

                        <TouchableOpacity className="bg-white/10 p-2 rounded-full border border-white/10">
                            <Search size={18} color="white" />
                        </TouchableOpacity>

                    </View>
                </View>
                <View className="flex-1 flex-row">

                    {/* --- LEFT PANEL: LIST --- */}
                    {/* Width switches between full and 1/4 based on activeChat */}
                    <View className={`${activeConversation ? "w-1/4 hidden md:flex border-r border-white/10" : "w-full"} flex-col`}>


                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <ScrollView
                                contentContainerStyle={{ paddingBottom: 100 }}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Invitations (Hide if chat is open to save space) */}
                                {!activeConversation && invitations.length > 0 && (
                                    <View className="px-4 mb-6">
                                        <View className="flex-row items-center justify-between mb-3">
                                            <Text className="text-white font-bold text-base">Requests</Text>
                                            <View className="bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                                                <Text className="text-pink-400 text-xs font-bold">{invitations.length}</Text>
                                            </View>
                                        </View>
                                        {invitations.map(inv => (
                                            <InvitationCard key={inv._id} item={inv} onAccept={handleAccept} onIgnore={handleIgnore} />
                                        ))}
                                    </View>
                                )}

                                {/* Connections List */}
                                <View className="px-4">
                                    {!activeConversation && (
                                        <View className="flex-row items-center justify-between mb-2 border-b border-white/10 pb-2">
                                            <Text className="text-white font-bold text-base">Connections</Text>
                                            <Text className="text-gray-400 text-xs">Recent</Text>
                                        </View>
                                    )}

                                    {connections.map(conn => (
                                        <ConnectionItem
                                            key={conn._id}
                                            item={conn}
                                            currentUserId={useAuthStore.getState().user?._id}
                                            onChat={() => openChat(conn)}
                                            isCompact={!!activeConversation}
                                            lastMessage={
                                                (conn.requesterId._id === useAuthStore.getState().user?._id
                                                    ? conversationMap[conn.recipientId._id]?.lastMessage
                                                    : conversationMap[conn.requesterId._id]?.lastMessage)
                                            }
                                            unreadCount={
                                                (conn.requesterId._id === useAuthStore.getState().user?._id
                                                    ? unreadCounts[conversationMap[conn.recipientId._id]?._id]
                                                    : unreadCounts[conversationMap[conn.requesterId._id]?._id])
                                            }
                                            isOnline={
                                                onlineUsers.has(
                                                    (conn.requesterId._id === useAuthStore.getState().user?._id
                                                        ? conn.recipientId._id
                                                        : conn.requesterId._id)
                                                )
                                            }
                                        />
                                    ))}

                                    {connections.length === 0 && (
                                        <Text className="text-gray-500 text-center mt-10">No connections yet.</Text>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    {/* --- RIGHT PANEL: CHAT --- */}
                    {activeConversation && (
                        <ChatWindow
                            conversationId={activeConversation.conversationId || ""}
                            recipient={activeConversation.recipient}
                            onClose={() => setActiveConversation(null)}
                        />
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}