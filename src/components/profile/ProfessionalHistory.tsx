// src/components/profile/ProfessionalHistory.tsx
import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";
import { Award } from "lucide-react-native";
import { ProfessionalHistoryProps } from "./types";

export const ProfessionalHistory: React.FC<ProfessionalHistoryProps> = ({
    experience,
    isEditable = false,
    onEditPress,
}) => {
    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
            <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                <Text className="text-2xl font-black text-white italic tracking-tight">PROFESSIONAL HISTORY</Text>
                <Award size={20} color="#52525b" />
            </View>
            <View className="space-y-6">
                {experience.length > 0 ? experience.map((exp, i) => (
                    <View key={i} className="flex-row items-center justify-between py-6 border-b border-white/5">
                        <View className="flex-row items-center gap-6">
                            <Text className="text-[10px] font-black text-zinc-600">0{i + 1}</Text>
                            <View className="flex-col">
                                <Text className="text-lg font-bold text-white">{exp}</Text>
                                <Text className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">
                                    {isEditable ? 'Event • 2026' : 'Verified Event'}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-xs font-black text-zinc-500 italic">
                            {isEditable ? 'Jan 2026' : '2026'}
                        </Text>
                    </View>
                )) : (
                    isEditable && onEditPress ? (
                        <TouchableOpacity onPress={onEditPress} className="py-8 border border-dashed border-white/10 items-center justify-center">
                            <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Add Experience</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="py-8 border border-dashed border-white/10 items-center justify-center">
                            <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No History Listed</Text>
                        </View>
                    )
                )}
            </View>
        </View>
    );
};

export default ProfessionalHistory;
