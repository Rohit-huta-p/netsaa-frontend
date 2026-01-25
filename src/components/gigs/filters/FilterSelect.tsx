import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterSelectProps {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
    label,
    options,
    value,
    onChange,
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <>
            <View className="gap-2">
                <Text className="text-white text-sm font-medium">{label}</Text>
                <TouchableOpacity
                    onPress={() => setShowPicker(true)}
                    className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex-row items-center justify-between"
                >
                    <Text className="text-white text-sm">
                        {selectedOption?.label || 'Select...'}
                    </Text>
                    <ChevronDown size={18} color="#71717A" />
                </TouchableOpacity>
            </View>

            {/* Picker Modal */}
            <Modal
                visible={showPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/60 justify-center items-center"
                    activeOpacity={1}
                    onPress={() => setShowPicker(false)}
                >
                    <View className="bg-zinc-900 rounded-2xl border border-white/10 w-80 max-h-96 overflow-hidden">
                        <View className="border-b border-white/5 p-4">
                            <Text className="text-white text-sm font-bold">{label}</Text>
                        </View>
                        <ScrollView className="max-h-80">
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => {
                                        onChange(option.value);
                                        setShowPicker(false);
                                    }}
                                    className={`p-4 border-b border-white/5 flex-row items-center justify-between ${option.value === value ? 'bg-white/5' : ''
                                        }`}
                                >
                                    <Text
                                        className={`text-sm ${option.value === value
                                                ? 'text-white font-bold'
                                                : 'text-zinc-400'
                                            }`}
                                    >
                                        {option.label}
                                    </Text>
                                    {option.value === value && (
                                        <Check size={16} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};
