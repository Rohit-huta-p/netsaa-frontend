// src/components/profile/UnsavedChangesBar.tsx
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { AlertTriangle, Save, X } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";

export const UnsavedChangesBar = () => {
    const { getDirtyCount, clearAllDrafts, exitEditMode } = useProfileUiStore();
    const count = getDirtyCount();

    if (count === 0) return null;

    return (
        <View className="absolute bottom-24 left-6 right-6 bg-zinc-900 border border-pink-500/20 shadow-lg shadow-pink-500/10 rounded-xl p-4 flex-row items-center justify-between z-50">
            <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-pink-500/10 items-center justify-center">
                    <AlertTriangle size={16} color="#ea698b" />
                </View>
                <View>
                    <Text className="text-white font-bold text-sm">Unsaved Changes</Text>
                    <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                        {count} {count === 1 ? 'Section' : 'Sections'} modified
                    </Text>
                </View>
            </View>
            <View className="flex-row items-center gap-2">
                <TouchableOpacity
                    onPress={() => {
                        clearAllDrafts();
                        exitEditMode();
                    }}
                    className="px-4 py-2 bg-white/5 rounded-lg border border-white/10"
                >
                    <Text className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">Discard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
