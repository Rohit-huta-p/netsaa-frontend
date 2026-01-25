import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface FilterToggleProps {
    label: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
    badge?: string;
}

export const FilterToggle: React.FC<FilterToggleProps> = ({
    label,
    description,
    value,
    onChange,
    badge,
}) => {
    return (
        <View className="gap-2">
            <View className="flex-row items-center justify-between">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-white text-sm font-medium">{label}</Text>
                        {badge && (
                            <View className="bg-blue-500/10 px-2 py-0.5 rounded-full">
                                <Text className="text-blue-400 text-[9px] font-black uppercase">
                                    {badge}
                                </Text>
                            </View>
                        )}
                    </View>
                    {description && (
                        <Text className="text-zinc-500 text-xs mt-1">{description}</Text>
                    )}
                </View>
                <TouchableOpacity
                    onPress={() => onChange(!value)}
                    className={`w-14 h-8 rounded-full p-1 ${value ? 'bg-white' : 'bg-zinc-800'
                        }`}
                    style={{ justifyContent: 'center' }}
                >
                    <View
                        className={`w-6 h-6 rounded-full ${value ? 'bg-black' : 'bg-zinc-600'
                            }`}
                        style={{
                            transform: [{ translateX: value ? 20 : 0 }],
                        }}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};
