import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface OrganizerInfoCardProps {
    organizerId: string;
    displayName?: string;
    profileImageUrl?: string;
    rating?: string | number;
    /**
     * Plan 5 — count of non-draft gigs this organizer has hosted
     * (refreshed server-side on every getGigById read). When >0, surfaces
     * as "N gigs hosted" beside the rating row. Hidden when 0/undefined.
     */
    gigsHosted?: number;
    /**
     * Plan 5 — average minutes between an applicant's first message and
     * the organizer's first reply. When set + reasonable (<24h), surfaces
     * as "Replies in <Xm" or "<Xh". Hidden when undefined or > 24h.
     */
    avgReplyMinutes?: number;
    /** When true, a blue verified tick renders beside the poster's name. */
    isVerified?: boolean;
}

/**
 * Organizer avatar + name + blue verified tick + a single dynamic
 * "N gigs hosted" line. Shared — usable in GigDetails, GigCard, etc.
 */
export const OrganizerInfoCard: React.FC<OrganizerInfoCardProps> = ({
    organizerId,
    displayName,
    profileImageUrl,
    gigsHosted,
    isVerified,
}) => {
    const router = useRouter();

    const showGigsHosted = typeof gigsHosted === 'number' && gigsHosted > 0;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/profile/${organizerId}`)}
            className="flex-row items-center gap-3 mb-5 py-3 border-y border-white/5"
            accessibilityRole="button"
            accessibilityLabel={`Organizer ${displayName || ''}${
                showGigsHosted ? `, ${gigsHosted} gigs hosted` : ''
            }`}
        >
            <View className="relative">
                <View className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    {profileImageUrl ? (
                        <Image
                            source={{ uri: profileImageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                            <Text className="text-white font-black text-xl">
                                {displayName?.charAt(0) || 'O'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
            <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-1">
                    <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: '#F0ECE6' }}>
                        {displayName || 'Organizer'}
                    </Text>
                    {isVerified ? (
                        <View
                            className="w-4 h-4 rounded-full bg-blue-500 items-center justify-center"
                            testID="organizer-verified-tick"
                        >
                            <Check size={9} color="#FFFFFF" strokeWidth={3.5} />
                        </View>
                    ) : null}
                </View>
                {showGigsHosted ? (
                    <Text
                        style={{ fontFamily: 'Outfit-Light', fontSize: 11, color: '#8C857B', marginTop: 1 }}
                        testID="organizer-gigs-hosted"
                    >
                        {gigsHosted} {gigsHosted === 1 ? 'gig' : 'gigs'} hosted
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};
