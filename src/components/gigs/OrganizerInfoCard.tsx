import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { CheckCircle2, Star } from 'lucide-react-native';
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
}

/**
 * Shorten a minutes value to a human-friendly reply-speed badge.
 * Returns null for empty / unreasonable inputs (negative, > 24h) so
 * the caller can omit the cell entirely.
 */
function formatReplySpeed(mins: number | undefined): string | null {
    if (typeof mins !== 'number' || !isFinite(mins) || mins < 0) return null;
    if (mins > 24 * 60) return null; // stale signal — don't surface
    if (mins < 60) return `Replies in <${Math.max(1, Math.round(mins))}m`;
    const hrs = mins / 60;
    if (hrs < 10) return `Replies in <${hrs.toFixed(1)}h`;
    return `Replies in <${Math.round(hrs)}h`;
}

/**
 * Organizer avatar + name + star rating + verified badge.
 * Shared component — usable in GigDetails, GigCard, and other contexts.
 */
export const OrganizerInfoCard: React.FC<OrganizerInfoCardProps> = ({
    organizerId,
    displayName,
    profileImageUrl,
    rating,
    gigsHosted,
    avgReplyMinutes,
}) => {
    const router = useRouter();

    const showGigsHosted = typeof gigsHosted === 'number' && gigsHosted > 0;
    const replySpeed = formatReplySpeed(avgReplyMinutes);

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/profile/${organizerId}`)}
            className="flex-row items-center gap-4 mb-5 bg-white/10 py-5 px-1 rounded-2xl"
            accessibilityRole="button"
            accessibilityLabel={`Organizer ${displayName || ''}${
                showGigsHosted ? `, ${gigsHosted} gigs hosted` : ''
            }`}
        >
            <View className="relative">
                <View className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/10">
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
                <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full items-center justify-center border-2 border-black">
                    <CheckCircle2 size={12} color="white" />
                </View>
            </View>
            <View className="flex-1">
                <Text className="text-md font-black text-white mb-1">
                    {displayName || 'Organizer'}
                </Text>
                <View className="flex-row items-center flex-wrap gap-3">
                    <View className="flex-row items-center gap-1">
                        {[1, 2, 3, 4].map((i) => (
                            <Star key={i} size={10} color="#EAB308" fill="#EAB308" />
                        ))}
                        <Star size={8} color="#3F3F46" fill="#3F3F46" />
                        <Text className="text-[10px] font-bold text-zinc-400 ml-1">
                            {rating || '4.9'}
                        </Text>
                    </View>

                    {showGigsHosted ? (
                        <Text
                            className="text-[10px] font-semibold text-zinc-400"
                            testID="organizer-gigs-hosted"
                        >
                            {gigsHosted} {gigsHosted === 1 ? 'gig' : 'gigs'} hosted
                        </Text>
                    ) : null}

                    {replySpeed ? (
                        <Text
                            className="text-[10px] font-semibold text-emerald-400"
                            testID="organizer-reply-speed"
                        >
                            {replySpeed}
                        </Text>
                    ) : null}

                    <View className="bg-emerald-500/10 px-2 py-1 rounded">
                        <Text className="text-emerald-500 text-[6px] font-black uppercase tracking-widest">
                            VERIFIED
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
