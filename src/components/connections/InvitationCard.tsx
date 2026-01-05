import React, { useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { ConnectionRequest } from "@/src/types/connection";

export const InvitationCard = ({ item, onAccept, onIgnore }: { item: ConnectionRequest, onAccept: (id: string) => void, onIgnore: (id: string) => void }) => {
    const [processing, setProcessing] = useState(false);

    const handleAccept = async () => {
        setProcessing(true);
        await onAccept(item._id);
        setProcessing(false);
    }

    const handleIgnore = async () => {
        setProcessing(true);
        await onIgnore(item._id);
        setProcessing(false);
    }

    return (
        <View className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-3">
            <View className="flex-row items-start">
                <Image
                    source={{ uri: item.requesterId.profilePicture || "https://i.pravatar.cc/150?img=11" }}
                    className="w-12 h-12 rounded-full bg-gray-800 mr-3"
                />
                <View className="flex-1">
                    <Text className="text-white font-bold text-base">{item.requesterId.displayName}</Text>
                    <Text className="text-gray-400 text-xs mb-1 capitalize">{item.requesterId.role || "Artist"}</Text>
                    {item.message && (
                        <Text className="text-gray-300 text-xs italic bg-white/5 p-1.5 rounded mb-2">"{item.message}"</Text>
                    )}
                </View>
            </View>
            <View className="flex-row gap-2 mt-2 ml-14">
                <TouchableOpacity onPress={handleIgnore} disabled={processing} className="flex-1 border border-white/20 py-2 rounded-lg items-center">
                    <Text className="text-gray-400 text-xs font-bold">Ignore</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAccept} disabled={processing} className="flex-1 bg-green-600 py-2 rounded-lg items-center flex-row justify-center">
                    {processing ? <ActivityIndicator color="white" size="small" /> : (
                        <>
                            <Check size={12} color="white" className="mr-1" />
                            <Text className="text-white text-xs font-bold">Accept</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};
