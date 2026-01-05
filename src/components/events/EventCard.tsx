import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';

interface EventCardProps {
    event: any;
    style?: any;
    onPress: () => void;
}

const { width } = Dimensions.get('window');
const GAP = 12;
// 2 columns with padding (16px * 2) and gap (12px)
// Total width = screenWidth - paddingHorizontal * 2
// Card width = (Total width - gap) / 2


export const EventCard: React.FC<EventCardProps> = ({ event, onPress, style }) => {
    // Format date if available
    const formattedDate = event.schedule?.startDate
        ? new Date(event.schedule.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'TBD';

    // Format location
    const locationText = event.location
        ? `${event.location.city}, ${event.location.state}`
        : 'Online';

    return (
        <TouchableOpacity
            activeOpacity={0.97}
            onPress={onPress}
            style={[
                { borderRadius: 12, overflow: 'hidden', backgroundColor: '#0b0b0b' },
                style,
            ]}
        >
            {/* Image Placeholder - Darker shade or gradient */}
            < View className=" relative h-24 bg-purple-900/20 w-full items-center justify-center p-2" >
                <View className="absolute top-1 left-1 mt-3 bg-white/5 self-start px-2 py-1 rounded">
                    <Text className="text-gray-300 text-[10px]">{event.category}</Text>
                </View>
                <Text className="text-purple-300 font-bold text-xs text-center">{event.title.substring(0, 1)}</Text>
            </View >

            <View className="p-3">
                {/* Date Badge */}
                <View className="flex-row items-center mb-2">
                    <Calendar size={12} color="#A855F7" />
                    <Text className="text-gray-400 text-xs ml-1">
                        {formattedDate}
                    </Text>
                </View>

                {/* Title */}
                <Text numberOfLines={2} className="text-white font-bold text-lg mb-1">
                    {event.title}
                </Text>

                {/* Location */}
                <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#6B7280" />
                    <Text numberOfLines={1} className="text-gray-400 text-[10px] ml-1 flex-1">
                        {locationText}
                    </Text>
                </View>

                {/* Price/Tag - Optional */}

            </View>
        </TouchableOpacity >
    );
};
