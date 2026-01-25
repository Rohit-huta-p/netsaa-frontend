import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';

interface FilterSliderProps {
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    formatLabel?: (value: number) => string;
    presets?: Array<{ label: string; value: number }>;
}

export const FilterSlider: React.FC<FilterSliderProps> = ({
    label,
    min,
    max,
    step,
    value,
    onChange,
    formatLabel = (v) => v.toString(),
    presets,
}) => {
    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between">
                <Text className="text-white text-sm font-medium">{label}</Text>
                <View className="bg-white/5 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-bold">
                        {formatLabel(value)}
                    </Text>
                </View>
            </View>

            {/* Presets */}
            {presets && (
                <View className="flex-row gap-2 mb-2">
                    {presets.map((preset) => (
                        <TouchableOpacity
                            key={preset.value}
                            onPress={() => onChange(preset.value)}
                            className={`flex-1 h-8 rounded-xl border items-center justify-center ${value === preset.value
                                    ? 'bg-white/10 border-white/20'
                                    : 'bg-transparent border-white/5'
                                }`}
                        >
                            <Text
                                className={`text-[10px] font-bold uppercase ${value === preset.value ? 'text-white' : 'text-zinc-500'
                                    }`}
                            >
                                {preset.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Slider */}
            <View className="bg-zinc-900/50 rounded-xl px-3 py-2">
                <Slider
                    minimumValue={min}
                    maximumValue={max}
                    step={step}
                    value={value}
                    onValueChange={onChange}
                    minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="#3F3F46"
                    thumbTintColor="#FFFFFF"
                />
                <View className="flex-row justify-between mt-1">
                    <Text className="text-zinc-600 text-[10px] font-medium">
                        {formatLabel(min)}
                    </Text>
                    <Text className="text-zinc-600 text-[10px] font-medium">
                        {formatLabel(max)}
                    </Text>
                </View>
            </View>
        </View>
    );
};
