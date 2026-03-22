import React from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { X, Check } from "lucide-react-native";

export const DEFINED_SKIN_TONES = [
    { label: "Fair", hex: "#fcd9b8" },
    { label: "Light", hex: "#f0cbb0" },
    { label: "Medium", hex: "#dcb084" },
    { label: "Olive", hex: "#c29367" },
    { label: "Tan", hex: "#a57245" },
    { label: "Brown", hex: "#7b4b2a" },
    { label: "Dark", hex: "#4b2a1a" },
];

export const SKILL_OPTIONS = [
    "Contemporary", "Kathak", "Hip Hop", "Jazz", "Classical",
    "Folk", "Ballet", "Salsa", "Storytelling", "Choreography",
    "Beatboxing", "Freestyle", "Improv", "Voice Acting", "Emceeing",
];

export const Pill = ({ label, isSelected, onPress, onRemove }: { label: string; isSelected?: boolean; onPress?: () => void; onRemove?: () => void }) => (
    <View
        style={{
            backgroundColor: isSelected ? 'rgba(234, 105, 139, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isSelected ? '#ea698b' : 'rgba(255, 255, 255, 0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
        }}
    >
        <Text style={{
            color: isSelected ? '#ea698b' : '#a1a1aa',
            fontWeight: '700',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
        }}>
            {label}
        </Text>
        {onRemove && (
            <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={12} color={isSelected ? '#ea698b' : '#a1a1aa'} />
            </TouchableOpacity>
        )}
    </View>
);

export const EditableInput = ({
    value,
    onChangeText,
    placeholder,
    multiline = false,
}: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    multiline?: boolean;
}) => (
    <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        multiline={multiline}
        className={`bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm outline-none ${multiline ? 'min-h-[100px] text-top' : ''
            }`}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
    />
);

export const SectionActions = ({
    isDirty,
    isSaving,
    onSave,
    onCancel,
}: {
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
}) => {
    if (!isDirty) return null;
    return (
        <View className="flex-row items-center justify-end gap-2 mt-4">
            <TouchableOpacity
                onPress={onCancel}
                className="px-3 py-2 rounded-lg border border-white/10"
            >
                <Text className="text-zinc-400 text-[10px] font-bold uppercase">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={onSave}
                disabled={isSaving}
                className="px-3 py-2 rounded-lg bg-pink-500 border border-pink-600 flex-row items-center gap-2"
            >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={12} color="#fff" />}
                <Text className="text-white text-[10px] font-bold uppercase">Save</Text>
            </TouchableOpacity>
        </View>
    );
};
