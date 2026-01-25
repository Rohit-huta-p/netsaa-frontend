import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';

interface FilterOption {
    value: string;
    label: string;
}

interface FilterMultiSelectProps {
    label: string;
    options: FilterOption[];
    value: string[];
    onChange: (value: string[]) => void;
    gridColumns?: number;
}

export const FilterMultiSelect: React.FC<FilterMultiSelectProps> = ({
    label,
    options,
    value,
    onChange,
    gridColumns = 1,
}) => {
    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const isSelected = (optionValue: string) => value.includes(optionValue);

    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between">
                <Text className="text-white text-sm font-medium">{label}</Text>
                {value.length > 0 && (
                    <View className="bg-white/5 px-2.5 py-1 rounded-full">
                        <Text className="text-white text-[10px] font-bold">
                            {value.length} selected
                        </Text>
                    </View>
                )}
            </View>

            <View
                className="gap-2"
                style={
                    gridColumns > 1
                        ? {
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                        }
                        : {}
                }
            >
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => toggleOption(option.value)}
                        className={`rounded-xl border overflow-hidden ${isSelected(option.value)
                                ? 'bg-white border-white'
                                : 'bg-zinc-900/50 border-white/5'
                            }`}
                        style={
                            gridColumns > 1
                                ? {
                                    width: `${100 / gridColumns - 1}%`,
                                }
                                : {}
                        }
                    >
                        <View className="flex-row items-center justify-between p-3">
                            <Text
                                className={`text-sm font-medium ${isSelected(option.value) ? 'text-black' : 'text-white'
                                    }`}
                            >
                                {option.label}
                            </Text>
                            {isSelected(option.value) && (
                                <View className="w-5 h-5 rounded-full bg-black items-center justify-center">
                                    <Check size={12} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
