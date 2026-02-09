// app/(app)/connections/index.tsx
import React, { useState, useEffect } from "react";
import noAvatar from '@/assets/no-avatar.jpg'
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
    Platform,
    useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Search,
    Check,
    X,
    MessageCircle,
    Users,
    Sparkles,
    UserPlus,
    ArrowRight,
    Zap
} from "lucide-react-native";
import connectionService from "@/services/connectionService";
import { useAuthStore } from "@/stores/authStore";
import AppScrollView from "@/components/AppScrollView";

import { ChatWindow, UserBasic } from "@/components/connections/ChatWindow";
import { Connection, ConnectionRequest } from "@/types/connection";
import conversationService, { PopulatedConversation } from "@/services/conversationService";
import { socketService } from "@/services/socketService";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";

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

// --- ENHANCED COMPONENTS ---

// Connection Request Card with Premium Styling
const RequestCard = ({
    item,
    onAccept,
    onIgnore
}: {
    item: ConnectionRequest;
    onAccept: (id: string) => void;
    onIgnore: (id: string) => void;
}) => {
    const requester = item.requesterId;
    const imageUri = requester?.profileImageUrl || noAvatar;

    return (
        <View className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 mb-3 flex-row items-center">
            {/* Avatar with Pulse Effect */}
            <View className="relative mr-4">
                <View className="w-14 h-14 rounded-xl overflow-hidden border-2 border-pink-500/30">
                    <Image
                        source={{ uri: imageUri }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
                <View className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center border border-black">
                    <UserPlus size={8} color="#fff" />
                </View>
            </View>

            {/* Info */}
            <View className="flex-1">
                <Text className="text-white font-bold text-base mb-0.5">
                    {requester?.displayName || requester?.firstName || "Artist"}
                </Text>
                <Text className="text-zinc-500 text-xs font-medium">
                    {requester?.artistType || "Performing Artist"}
                </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => onIgnore(item._id)}
                    className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/10 items-center justify-center"
                >
                    <X size={18} color="#71717a" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => onAccept(item._id)}
                    className="w-10 h-10 rounded-xl bg-pink-500 items-center justify-center"
                >
                    <Check size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Connection Card with Premium Styling
const ConnectionCard = ({
    connection,
    currentUserId,
    onChat,
    lastMessage,
    unreadCount = 0,
    isOnline = false
}: {
    connection: Connection;
    currentUserId?: string;
    onChat: () => void;
    lastMessage?: string;
    unreadCount?: number;
    isOnline?: boolean;
}) => {
    const otherUser = connection.requesterId._id === currentUserId
        ? connection.recipientId
        : connection.requesterId;

    const imageUri = otherUser?.profileImageUrl || "https://via.placeholder.com/80";

    return (
        <TouchableOpacity
            onPress={onChat}
            activeOpacity={0.8}
            className="bg-zinc-900/40 border border-white/10 rounded-2xl p-4 mb-3"
        >
            <View className="flex-row items-center">
                {/* Avatar with Online Status */}
                <View className="relative mr-4">

                    <View className="w-14 h-14 rounded-xl overflow-hidden border border-white/10">
                        <Image
                            source={otherUser?.profileImageUrl ? { uri: otherUser.profileImageUrl } : noAvatar}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            className="rounded-full mr-4 bg-gray-800"
                            resizeMode="cover"
                        />
                    </View>
                    {isOnline && (
                        <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                        <Text className="text-white font-bold text-base">
                            {otherUser?.displayName || "Artist"}
                        </Text>
                        {unreadCount > 0 && (
                            <View className="bg-pink-500 px-2 py-0.5 rounded-full">
                                <Text className="text-white text-[10px] font-black">{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-zinc-500 text-xs font-medium mb-1">
                        {otherUser?.artistType || "Performing Artist"}
                    </Text>
                    {lastMessage && (
                        <Text
                            numberOfLines={1}
                            className={`text-xs ${unreadCount > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}
                        >
                            {lastMessage}
                        </Text>
                    )}
                </View>

                {/* Chat Icon */}
                <View className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center">
                    <MessageCircle size={18} color="#fff" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Empty State Component
const EmptyState = () => (
    <View className="items-center justify-center py-20 px-8">
        <View className="w-24 h-24 rounded-full bg-zinc-800/50 items-center justify-center mb-6">
            <Users size={40} color="#71717a" />
        </View>
        <Text className="text-white font-bold text-2xl text-center mb-2">
            No Connections Yet
        </Text>
        <Text className="text-zinc-500 text-center text-base mb-8 max-w-xs">
            Start building your network by connecting with other artists in the community.
        </Text>
        <TouchableOpacity className="bg-white px-8 py-4 rounded-2xl flex-row items-center gap-2">
            <Sparkles size={18} color="#000" />
            <Text className="text-black font-black uppercase tracking-wide">
                Discover Artists
            </Text>
        </TouchableOpacity>
    </View>
);

// --- MAIN SCREEN ---

export default function ConnectionsScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [invitations, setInvitations] = useState<ConnectionRequest[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [conversationMap, setConversationMap] = useState<Record<string, PopulatedConversation>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeConversation, setActiveConversation] = useState<ActiveChat | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        try {
            const [reqs, conns, convs] = await Promise.all([
                connectionService.getConnectionRequests(),
                connectionService.getConnections(),
                conversationService.getConversations()
            ]);
            setInvitations(reqs);
            setConnections(conns);

            const map: Record<string, PopulatedConversation> = {};
            convs.forEach(c => {
                const other = c.participants.find(p => p._id !== useAuthStore.getState().user?._id) || c.participants[0];
                if (other) map[other._id] = c;
            });
            setConversationMap(map);
            setUnreadCounts({});

            return conns;
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

        const socket = socketService.getSocket();

        const handleNewMessage = (payload: SocketMessagePayload) => {
            setConversationMap(prev => {
                let foundUserId: string | undefined;
                const foundConv = Object.values(prev).find(c => c._id === payload.conversationId);

                if (foundConv) {
                    const myId = useAuthStore.getState().user?._id;
                    if (payload.senderId !== myId) {
                        foundUserId = payload.senderId;
                    } else {
                        foundUserId = Object.keys(prev).find(key => prev[key]._id === payload.conversationId);
                    }
                }

                if (!foundUserId) {
                    foundUserId = payload.senderId;
                }

                if (foundUserId && prev[foundUserId]) {
                    return {
                        ...prev,
                        [foundUserId]: {
                            ...prev[foundUserId],
                            lastMessage: payload.text
                        }
                    };
                }
                return prev;
            });

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
    };

    const handleAccept = async (id: string) => {
        const response = await connectionService.acceptConnectionRequest(id);
        setInvitations(prev => prev.filter(i => i._id !== id));

        if (response.success && response.data) {
            const { conversation } = response.data;
            const otherUser = response.data.requesterId;

            setActiveConversation({
                conversationId: conversation?._id || (typeof conversation === 'string' ? conversation : undefined),
                recipient: otherUser
            });

            setConnections(prev => [response.data, ...prev]);
        }
    };

    const handleIgnore = async (id: string) => {
        try {
            await connectionService.rejectConnectionRequest(id);
            setInvitations(prev => prev.filter(i => i._id !== id));
        } catch (e) {
            console.error("Ignore failed", e);
        }
    };

    const openChat = async (connection: Connection) => {
        const currentUserId = useAuthStore.getState().user?._id;
        const otherUser = (connection.requesterId._id === currentUserId) ? connection.recipientId : connection.requesterId;

        try {
            const conv = await conversationService.createConversation(otherUser._id);
            setActiveConversation({
                conversationId: conv._id,
                recipient: otherUser
            });
        } catch (error) {
            console.error("Failed to open chat", error);
        }
    };

    // Filter connections by search query
    const filteredConnections = connections.filter(conn => {
        if (!searchQuery.trim()) return true;
        const currentUserId = useAuthStore.getState().user?._id;
        const otherUser = conn.requesterId._id === currentUserId ? conn.recipientId : conn.requesterId;
        const name = otherUser?.displayName || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <View className="flex-1 bg-black">
            {/* Ambient Background Effects */}
            <View className="absolute top-[5%] -left-[15%] w-[500px] h-[500px] bg-pink-900/15 rounded-full opacity-50 blur-3xl pointer-events-none" />
            <View className="absolute bottom-[20%] -right-[10%] w-[400px] h-[400px] bg-purple-900/10 rounded-full opacity-30 blur-3xl pointer-events-none" />

            <SafeAreaView edges={['top']} className="flex-1 w-[90%] mx-auto">
                <View className="flex-1 flex-row">
                    {/* --- LEFT PANEL: LIST --- */}
                    <View className={`${activeConversation && isDesktop ? "w-1/3 border-r border-white/10" : "flex-1"}`}>
                        {/* Hide list on mobile when chat is open */}
                        {(!activeConversation || isDesktop) && (
                            <AppScrollView
                                className="flex-1"
                                contentContainerStyle={{ paddingBottom: 100 }}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Hero Section */}
                                <View className="px-6 pt-12 pb-8">
                                    <View className="mb-8">
                                        <View className="self-start bg-white/5 border border-white/10 px-4 py-1.5 mb-6 rounded-full">
                                            <Text className="text-zinc-400 text-[10px] uppercase tracking-[0.3em] font-bold">
                                                The Network
                                            </Text>
                                        </View>
                                        <Text className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-3">
                                            YOUR CREW.
                                        </Text>
                                        <Text className="text-lg text-zinc-500 font-light max-w-md">
                                            Build meaningful connections with artists who share your passion.
                                        </Text>
                                    </View>

                                    {/* Search Bar */}
                                    <View className="relative h-14 bg-zinc-900/50 border border-white/5 rounded-2xl flex-row items-center px-4">
                                        <Search size={20} color="#71717a" />
                                        <TextInput
                                            placeholder="Search connections..."
                                            placeholderTextColor="#71717a"
                                            className="flex-1 ml-3 text-white text-lg font-light h-full outline-none"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                    </View>
                                </View>

                                {loading ? (
                                    <View className="flex-1 justify-center items-center py-20">
                                        <LoadingAnimation
                                            source="https://lottie.host/ecebcd4d-d1c9-4e57-915f-d3f61705a717/VFWGhqMAX0.lottie"
                                            width={200}
                                            height={200}
                                        />
                                        <Text className="text-zinc-500 mt-4 text-xs font-medium">
                                            Loading your network...
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {/* Connection Requests */}
                                        {invitations.length > 0 && (
                                            <View className="px-6 mb-8">
                                                <View className="flex-row items-center justify-between mb-4">
                                                    <View className="flex-row items-center gap-2">
                                                        <Zap size={16} color="#f43f5e" />
                                                        <Text className="text-white font-black text-sm uppercase tracking-wider">
                                                            Requests
                                                        </Text>
                                                    </View>
                                                    <View className="bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
                                                        <Text className="text-pink-400 text-xs font-black">{invitations.length}</Text>
                                                    </View>
                                                </View>
                                                {invitations.map(inv => (
                                                    <RequestCard
                                                        key={inv._id}
                                                        item={inv}
                                                        onAccept={handleAccept}
                                                        onIgnore={handleIgnore}
                                                    />
                                                ))}
                                            </View>
                                        )}

                                        {/* Connections List */}
                                        <View className="px-6 mb-52">
                                            <View className="flex-row items-center justify-between mb-4">
                                                <View className="flex-row items-center gap-2">
                                                    <Users size={16} color="#fff" />
                                                    <Text className="text-white font-black text-sm uppercase tracking-wider">
                                                        Connections
                                                    </Text>
                                                </View>
                                                <Text className="text-zinc-600 text-xs font-bold uppercase">
                                                    {filteredConnections.length} {filteredConnections.length === 1 ? 'artist' : 'artists'}
                                                </Text>
                                            </View>

                                            {filteredConnections.length === 0 && connections.length === 0 ? (
                                                <EmptyState />
                                            ) : filteredConnections.length === 0 ? (
                                                <View className="py-12 items-center">
                                                    <Text className="text-zinc-500 text-center">
                                                        No connections match your search.
                                                    </Text>
                                                </View>
                                            ) : (
                                                filteredConnections.map(conn => {
                                                    const currentUserId = useAuthStore.getState().user?._id;
                                                    const otherUserId = conn.requesterId._id === currentUserId
                                                        ? conn.recipientId._id
                                                        : conn.requesterId._id;

                                                    return (
                                                        <ConnectionCard
                                                            key={conn._id}
                                                            connection={conn}
                                                            currentUserId={currentUserId}
                                                            onChat={() => openChat(conn)}
                                                            lastMessage={conversationMap[otherUserId]?.lastMessage}
                                                            unreadCount={unreadCounts[conversationMap[otherUserId]?._id]}
                                                            isOnline={onlineUsers.has(otherUserId)}
                                                        />
                                                    );
                                                })
                                            )}
                                        </View>
                                    </>
                                )}
                            </AppScrollView>
                        )}
                    </View>

                    {/* --- RIGHT PANEL: CHAT --- */}
                    {activeConversation && (
                        <View className={isDesktop ? "flex-1" : "absolute inset-0 bg-black"}>
                            <ChatWindow
                                conversationId={activeConversation.conversationId || ""}
                                recipient={activeConversation.recipient}
                                onClose={() => setActiveConversation(null)}
                            />
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}