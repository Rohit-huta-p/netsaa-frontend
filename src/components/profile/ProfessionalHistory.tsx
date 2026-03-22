// src/components/profile/ProfessionalHistory.tsx
import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
} from "react-native";
import { Award, Edit2 } from "lucide-react-native";
import { ProfessionalHistoryProps } from "./types";
import { ExperienceItem } from "./ExperienceItem";
import { useProfileUiStore } from "@/stores/profileUiStore";

export const ProfessionalHistory: React.FC<ProfessionalHistoryProps> = ({
    experience,
    isEditable = false,
    isOrganizer,
}) => {
    const { openSheet } = useProfileUiStore();

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
            <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                <Text className={`text-lg font-black italic tracking-tight text-white`}>PROFESSIONAL HISTORY</Text>

                {isEditable && (
                    <TouchableOpacity
                        onPress={() => openSheet('experience')}
                        className="p-2 rounded-full border bg-white/5 border-transparent"
                    >
                        <Edit2 size={14} color="#71717a" />
                    </TouchableOpacity>
                )}
                {!isEditable && <Award size={20} color="#52525b" />}
            </View>
            <View className="space-y-6">
                {experience.length > 0 ? experience.map((exp, i) => (
                    <ExperienceItem key={i} experience={exp} isOrganizer={isOrganizer} />
                )) : (
                    <View className="py-8 border border-dashed border-white/10 items-center justify-center">
                        <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No History Listed</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ProfessionalHistory;
