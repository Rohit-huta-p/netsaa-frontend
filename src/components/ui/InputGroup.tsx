import React from 'react';
import { View, Text } from 'react-native';

interface InputGroupProps {
    label: string;
    children: React.ReactNode;
    required?: boolean;
    subtitle?: string;
    error?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, children, required, subtitle, error }) => (
    <View className="mb-6 space-y-2">
        <View className="flex-row justify-between items-baseline mb-2">
            <Text className="text-sm font-medium text-zinc-300">
                {label} {required && <Text className="text-rose-500">*</Text>}
            </Text>
            {subtitle && <Text className="text-xs text-zinc-500 ml-2">{subtitle}</Text>}
        </View>
        {children}
        {error && <Text className="text-xs text-rose-500 mt-1">{error}</Text>}
    </View>
);
