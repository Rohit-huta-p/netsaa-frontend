import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { MapPin, ArrowUpRight } from 'lucide-react-native';

interface MapLinkCardProps {
    venueName?: string;
    address: string;
    city: string;
    state: string;
    country: string;
}

export const MapLinkCard: React.FC<MapLinkCardProps> = ({
    venueName,
    address,
    city,
    state,
    country
}) => {
    const fullAddress = [
        venueName,
        address,
        city,
        state,
        country
    ]
        .filter(Boolean)
        .join(", ");

    const openMaps = () => {
        const encoded = encodeURIComponent(fullAddress);

        const url =
            Platform.OS === "ios"
                ? `http://maps.apple.com/?q=${encoded}`
                : `https://www.google.com/maps/search/?api=1&query=${encoded}`;

        Linking.openURL(url);
    };

    return (
        <TouchableOpacity
            onPress={openMaps}
            activeOpacity={0.7}
            className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50"
        >
            <View className="flex-row items-center p-4 gap-4">
                {/* Icon Box */}
                <View className="w-12 h-12 rounded-full bg-[#FF6B35]/10 items-center justify-center border border-[#FF6B35]/20">
                    <MapPin size={24} color="#FF6B35" />
                </View>

                {/* Content */}
                <View className="flex-1">
                    <Text className="text-white font-semibold text-base mb-0.5" numberOfLines={1}>
                        {venueName || city || "Location"}
                    </Text>
                    <Text className="text-zinc-400 text-xs leading-4" numberOfLines={2}>
                        {fullAddress || "Address details will appear here"}
                    </Text>
                </View>

                {/* Action Icon */}
                <View className="bg-zinc-800/50 p-2 rounded-full">
                    <ArrowUpRight size={16} color="#71717a" />
                </View>
            </View>
        </TouchableOpacity>
    );
};
