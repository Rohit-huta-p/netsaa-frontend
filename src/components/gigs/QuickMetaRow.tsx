import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, Calendar } from 'lucide-react-native';

interface QuickMetaRowProps {
    location?: {
        venueName?: string;
        city?: string;
        state?: string;
    };
    schedule?: {
        startDate?: string;
    };
    gigType?: string;
}

/**
 * Quick location + date row displayed below the gig title.
 */
export const QuickMetaRow: React.FC<QuickMetaRowProps> = ({
    location,
    schedule,
    gigType,
}) => {
    const formattedDate = schedule?.startDate
        ? new Date(schedule.startDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : 'Date TBD';

    const typeLabel =
        gigType === 'one-time'
            ? 'One-time gig'
            : gigType === 'recurring'
            ? 'Recurring'
            : 'Contract';

    return (
        <View className="flex-row justify-start gap-6 mb-10">
            <View className="flex-row items-center gap-1">
                <View className="w-8 h-8 items-center justify-center">
                    <MapPin size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                    <Text className="text-[12px] font-bold text-white mb-1">
                        {location?.venueName || location?.city || 'Location TBD'}
                    </Text>
                    <Text className="text-[10px] text-zinc-400">
                        {location?.city || ''}
                        {location?.state ? `, ${location.state}` : ''}
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center gap-1">
                <View className="w-8 h-8 items-center justify-center">
                    <Calendar size={24} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                    <Text className="text-[12px] font-bold text-white mb-1">
                        {formattedDate}
                    </Text>
                    <Text className="text-[10px] text-zinc-400">{typeLabel}</Text>
                </View>
            </View>
        </View>
    );
};
