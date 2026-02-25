// src/components/profile/ProfessionalHistory.tsx
import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";
import { Award, Plus, Edit2 } from "lucide-react-native";
import { ProfessionalHistoryProps } from "./types";
import { useProfileUiStore } from "@/stores/profileUiStore";

export const ProfessionalHistory: React.FC<ProfessionalHistoryProps> = ({
    experience,
    isEditable = false,
    onEditPress, // Deprecated prop, kept for compatibility if needed
}) => {
    const { activeEditSection, setEditSection, openSheet } = useProfileUiStore();
    const isSectionActive = activeEditSection === 'experience';

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
            <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                <Text className="text-2xl font-black text-white italic tracking-tight">PROFESSIONAL HISTORY</Text>

                {isEditable && (
                    <TouchableOpacity
                        onPress={() => isSectionActive ? setEditSection(null) : setEditSection('experience')}
                        className={`p-2 rounded-full border ${isSectionActive ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                    >
                        <Edit2 size={14} color={isSectionActive ? "#ea698b" : "#71717a"} />
                    </TouchableOpacity>
                )}
                {!isEditable && <Award size={20} color="#52525b" />}
            </View>
            <View className="space-y-6">
                {experience.length > 0 ? experience.map((exp, i) => (
                    <View key={i} className="flex-row items-center justify-between py-6 border-b border-white/5">
                        <View className="flex-row items-center gap-6">
                            <Text className="text-[10px] font-black text-zinc-600">0{i + 1}</Text>
                            <View className="flex-col">
                                <Text className="text-lg font-bold text-white">{typeof exp === 'string' ? exp : exp.title}</Text>
                                <Text className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">
                                    {typeof exp === 'string'
                                        ? 'Event'
                                        : [exp.role, exp.venue].filter(Boolean).join(' • ') || 'Performance'}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-xs font-black text-zinc-500 italic">
                            {typeof exp === 'string' ? '' : exp.date || ''}
                        </Text>
                    </View>
                )) : (
                    isSectionActive && isEditable ? (
                        <TouchableOpacity
                            onPress={() => openSheet('experience')}
                            className="py-8 border border-dashed border-white/10 items-center justify-center bg-white/5 rounded-xl space-y-2"
                        >
                            <Plus size={24} color="#52525b" />
                            <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Add First History</Text>
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
