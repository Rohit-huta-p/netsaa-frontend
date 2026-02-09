import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import {
    Star,
    CheckCircle2,
    Calendar,
    Users,
    Shield,
    ChevronRight,
    Quote,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getBaseUrl } from '@/services/gigService';

interface OrganizerTrustCardProps {
    organizer: {
        _id: string;
        displayName?: string;
        profileImageUrl?: string;
        rating?: number;
        gigsHosted?: number;
        verificationStatus?: string;
        isVerified?: boolean;
    };
    isOrganizer: boolean;
}

export const OrganizerTrustCard: React.FC<OrganizerTrustCardProps> = ({
    organizer,
    isOrganizer
}) => {
    const router = useRouter();
    const [organizerStats, setOrganizerStats] = useState<{ gigsHosted: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // Don't show for organizers viewing their own gig
    if (isOrganizer) {
        return null;
    }

    // Fetch organizer stats from API
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const baseUrl = getBaseUrl();
                const response = await fetch(`${baseUrl}/v1/users/${organizer._id}/organizer-stats`);
                if (response.ok) {
                    const result = await response.json();
                    setOrganizerStats(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch organizer stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (organizer._id) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [organizer._id]);

    // Use API data with fallbacks
    const gigsHosted = organizerStats?.gigsHosted ?? organizer.gigsHosted ?? 0;
    const avgRating = organizer.rating ?? 0;
    const isVerified = organizer.isVerified || organizer.verificationStatus === 'approved';

    // Mock testimonial (in production, fetch from API)
    const testimonial = {
        text: "Great organizer! Professional setup and always pays on time.",
        author: "Verified Artist",
        rating: 5,
    };

    return (
        <View className="mb-6">
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                ORGANIZER TRACK RECORD
            </Text>

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/profile/${organizer._id}`)}
                className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden"
            >
                {/* Stats Row */}
                <View className="flex-row p-4 border-b border-white/5">
                    <View className="flex-1 items-center border-r border-white/5">
                        <View className="flex-row items-center gap-1 mb-1">
                            <Calendar size={12} color="#3B82F6" />
                            {loading ? (
                                <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                                <Text className="text-white font-black text-lg">{gigsHosted}</Text>
                            )}
                        </View>
                        <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">
                            Gigs Hosted
                        </Text>
                    </View>

                    <View className="flex-1 items-center">
                        <View className="flex-row items-center gap-1 mb-1">
                            <Star size={12} color="#EAB308" fill="#EAB308" />
                            <Text className="text-white font-black text-lg">
                                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                            </Text>
                        </View>
                        <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">
                            Avg Rating
                        </Text>
                    </View>
                </View>

                {/* Testimonial */}
                <View className="p-4">
                    <View className="flex-row items-start gap-3">
                        <View className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center mt-1">
                            <Quote size={14} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-zinc-300 text-sm leading-relaxed mb-2" numberOfLines={2}>
                                "{testimonial.text}"
                            </Text>
                            <View className="flex-row items-center gap-2">
                                <View className="flex-row">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            size={10}
                                            color={i <= testimonial.rating ? "#EAB308" : "#3F3F46"}
                                            fill={i <= testimonial.rating ? "#EAB308" : "none"}
                                        />
                                    ))}
                                </View>
                                <Text className="text-zinc-500 text-[10px] font-medium">
                                    — {testimonial.author}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* View Profile CTA */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white/5">
                    <View className="flex-row items-center gap-2">
                        <Shield size={14} color={isVerified ? "#10B981" : "#71717A"} />
                        <Text className={`text-[10px] font-bold uppercase tracking-wider ${isVerified ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {isVerified ? 'Identity Verified' : 'Not Verified'}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Text className="text-zinc-400 text-xs font-medium">View Profile</Text>
                        <ChevronRight size={14} color="#71717A" />
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};
