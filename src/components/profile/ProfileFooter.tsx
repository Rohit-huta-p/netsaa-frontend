// src/components/profile/ProfileFooter.tsx
import React from "react";
import {
    View,
    Text,
} from "react-native";

export const ProfileFooter: React.FC = () => {
    return (
        <View className="py-8 border-t border-white/5 bg-black px-6">
            <View className="flex-row justify-between items-center">
                <Text className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">© 2026 NETSA PLATFORMS.</Text>
                <View className="flex-row gap-4">
                    <Text className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Privacy</Text>
                    <Text className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Terms</Text>
                </View>
            </View>
        </View>
    );
};

export default ProfileFooter;
