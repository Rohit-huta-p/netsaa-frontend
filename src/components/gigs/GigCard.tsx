import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, DollarSign } from 'lucide-react-native';

interface GigCardProps {
    gig: any;
    onPress: () => void;
    isSelected?: boolean;
}

export const GigCard: React.FC<GigCardProps> = ({ gig, onPress, isSelected }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`p-4 mb-4 rounded-xl border ${isSelected
                    ? 'bg-purple-50/10 border-purple-500'
                    : 'bg-white/5 border-white/10'
                }`}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                    <Text className="text-white font-bold text-lg leading-tight mb-1">
                        {gig.title}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                        {gig.organizerName} • {gig.gigTypeDetails?.clientEventType || gig.organizerType}
                    </Text>
                </View>
                <View className="bg-purple-500/20 px-3 py-1 rounded-full">
                    <Text className="text-purple-300 text-xs font-medium">#{gig.status || 'New'}</Text>
                </View>
            </View>

            <View className="flex-row flex-wrap gap-4 mt-2">
                <View className="flex-row items-center">
                    <Calendar size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs ml-1">
                        {gig.schedule?.startDate ? new Date(gig.schedule.startDate).toLocaleDateString() : 'TBD'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <MapPin size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs ml-1">
                        {gig.location?.city || 'Remote'}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <DollarSign size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs ml-1">
                        {gig.compensation?.amount ? `₹${gig.compensation.amount}` : 'Paid'}
                    </Text>
                </View>
            </View>

            {/* Skills / Tags */}
            {gig.requirements?.skills && (
                <View className="flex-row flex-wrap gap-2 mt-4">
                    {gig.requirements.skills.slice(0, 3).map((skill: string, index: number) => (
                        <View key={index} className="bg-white/5 px-2 py-1 rounded-md">
                            <Text className="text-gray-400 text-[10px]">{skill}</Text>
                        </View>
                    ))}
                    {gig.requirements.skills.length > 3 && (
                        <View className="bg-white/5 px-2 py-1 rounded-md">
                            <Text className="text-gray-400 text-[10px]">+{gig.requirements.skills.length - 3}</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};
