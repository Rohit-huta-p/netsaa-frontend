import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity
} from "react-native";
import {
    MessageCircle,
    MoreHorizontal
} from "lucide-react-native";
import { Connection } from "@/types/connection";


export const ConnectionItem = ({ item, currentUserId, onChat, isCompact, lastMessage, unreadCount, isOnline }: { item: Connection, currentUserId?: string, onChat: (conn: Connection) => void, isCompact: boolean, lastMessage?: string, unreadCount?: number, isOnline?: boolean }) => {
    const otherUser = (item.requesterId._id === currentUserId) ? item.recipientId : item.requesterId;

    return (
        <View className="flex-row items-center py-3 border-b border-white/5">
            <View>
                <Image
                    source={{ uri: otherUser.profilePicture || "https://i.pravatar.cc/150?img=5" }}
                    className={`${isCompact ? "w-10 h-10" : "w-14 h-14"} rounded-full bg-gray-800 mr-3`}
                />
                {isOnline && (
                    <View className={`absolute bottom-0 right-3 bg-green-500 rounded-full border-2 border-[#09090b] ${isCompact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"}`} />
                )}
            </View>

            <View className="flex-1 min-w-0">
                <View className="flex-row items-center justify-between">
                    <Text className="text-white font-bold text-sm truncate" numberOfLines={1}>{otherUser.displayName}</Text>
                    {!isCompact && (unreadCount || 0) > 0 && (
                        <View className="bg-pink-500 rounded-full h-5 min-w-[20px] items-center justify-center px-1">
                            <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {!isCompact && (
                    <>
                        {lastMessage ? (
                            <Text className="text-gray-400 text-xs truncate mt-0.5" numberOfLines={1}>
                                {lastMessage}
                            </Text>
                        ) : (
                            <Text className="text-gray-400 text-xs capitalize">{otherUser.role || "Member"}</Text>
                        )}
                        {!lastMessage && <Text className="text-gray-600 text-[10px] mt-0.5">Connected {new Date(item.createdAt).toLocaleDateString()}</Text>}
                    </>
                )}
            </View>

            <View className="flex-row gap-2 ml-2">
                <TouchableOpacity
                    onPress={() => onChat(item)}
                    className="p-2 bg-white/5 rounded-full border border-white/10 active:bg-white/10"
                >
                    <MessageCircle size={isCompact ? 16 : 20} color="#60a5fa" />
                </TouchableOpacity>
                {!isCompact && (
                    <TouchableOpacity className="p-2 rounded-full active:bg-white/5">
                        <MoreHorizontal size={20} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
