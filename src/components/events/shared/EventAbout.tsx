import React from 'react';
import { View, Text } from 'react-native';
import { IEvent } from '@/types/event';

interface EventAboutProps {
    event: IEvent;
}

export const EventAbout: React.FC<EventAboutProps> = ({ event }) => {
    return (
        <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10 mb-8">
            <Text className="text-lg font-satoshi-bold text-white mb-3">
                About This Event
            </Text>

            <Text className="text-netsa-text-secondary leading-relaxed mb-4">
                {event.description}
            </Text>

            <Text className="font-semibold mb-2 text-white">What to Expect:</Text>

            {[
                "Warm-up and technique practice",
                "Learning contemporary movement phrases",
                "Improvisation exercises",
                "Cool-down and reflection",
            ].map((item, i) => (
                <View key={i} className="flex-row items-start mb-2">
                    <Text className="mr-2">•</Text>
                    <Text className="text-netsa-text-secondary flex-1">{item}</Text>
                </View>
            ))}

            <Text className="font-semibold mt-4 mb-1 text-white">
                Requirements:
            </Text>
            <Text className="text-netsa-text-secondary">
                No prior experience required. Wear comfortable clothes and bring water.
            </Text>
        </View>
    );
};
