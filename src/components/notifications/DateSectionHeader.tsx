// src/components/notifications/DateSectionHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { DateGroup } from '@/utils/dateGrouping';

interface DateSectionHeaderProps {
    date: DateGroup;
}

export const DateSectionHeader: React.FC<DateSectionHeaderProps> = ({ date }) => {
    return (
        <View className="px-6 py-3 bg-black/50">
            <Text className="text-gray-400 text-sm font-semibold uppercase tracking-wide">
                {date}
            </Text>
        </View>
    );
};
