import React from 'react';
import { View, Text } from 'react-native';
import { Calendar, MapPin, Users, Star } from 'lucide-react-native';
import { IEvent } from '@/types/event';

interface EventMetaInfoProps {
    event: IEvent;
}

export const EventMetaInfo: React.FC<EventMetaInfoProps> = ({ event }) => {
    const startDate = new Date(event.schedule.startDate).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric", year: "numeric" }
    );

    const startTime = new Date(event.schedule.startDate).toLocaleTimeString(
        undefined,
        { hour: "2-digit", minute: "2-digit" }
    );

    const max = event.maxParticipants;

    return (
        <View className="flex-1">
            <Text className="text-4xl font-satoshi-bold text-white mb-4 leading-tight">
                {event.title}
            </Text>

            {/* Organizer */}
            <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 to-yellow-400 items-center justify-center">
                    <Text className="text-white font-bold">
                        {event.organizerSnapshot?.name?.charAt(0) || "M"}
                    </Text>
                </View>

                <View className="ml-3">
                    <Text className="font-semibold text-white">
                        {event.organizerSnapshot?.name || "Maria Santos"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Star size={14} color="#F59E0B" />
                        <Text className="text-sm text-netsa-text-secondary ml-1">
                            4.9 · 47 events
                        </Text>
                    </View>
                </View>
            </View>

            {/* Date / Location */}
            <View className="space-y-2">
                <View className="flex-row items-center">
                    <Calendar size={16} color="#6B7280" />
                    <Text className="ml-2 text-netsa-text-secondary text-sm">
                        {startDate} · {startTime}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="ml-2 text-netsa-text-secondary text-sm">
                        {event.location.city}
                    </Text>
                </View>

                {/* Only show generic participants info here if desired, otherwise relying on the right card for details 
                    But typically left column has basic info. The original EventDetails had this.
                */}
                <View className="flex-row items-center">
                    <Users size={16} color="#6B7280" />
                    <Text className="ml-2 text-netsa-text-secondary text-sm">
                        {max} participants
                    </Text>
                </View>
            </View>
        </View>
    );
};
