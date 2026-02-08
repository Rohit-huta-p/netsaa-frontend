import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import {
    MapPin,
    Calendar,
    CheckCircle2,
    Star,
    Users,
    Zap,
    TrendingUp,
    Award,
    Clock
} from 'lucide-react-native';

interface GigCardProps {
    gig: any;
    onPress: () => void;
    isSelected?: boolean;
}

export const GigCard: React.FC<GigCardProps> = ({ gig, onPress, isSelected }) => {
    // ===== SMART BADGE LOGIC =====
    const getUrgencyBadge = () => {
        const daysLeft = gig.applicationDeadline
            ? Math.ceil((new Date(gig.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

        if (daysLeft !== null && daysLeft <= 3) {
            return {
                label: `${daysLeft}d left`,
                color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                icon: Zap
            };
        }

        const hoursSinceCreation = gig.createdAt
            ? (Date.now() - new Date(gig.createdAt).getTime()) / (1000 * 60 * 60)
            : 999;

        if (hoursSinceCreation <= 24) {
            return {
                label: 'New Today',
                color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                icon: TrendingUp
            };
        }

        return null;
    };

    // ===== EXTRACT KEY DATA =====
    const urgency = getUrgencyBadge();
    // Compensation variables removed as they are currently unused in the UI
    // const payAmount = gig.compensation?.amount || 0;
    // const compModel = gig.compensation?.model || 'fixed';
    // const isNegotiable = gig.compensation?.negotiable;
    const experienceLevel = gig.experienceLevel || 'intermediate';
    const artistTypes = gig.artistTypes || [];
    const primaryArtistType = artistTypes[0] || 'Artist';

    // Practice days info (important for artists planning their schedule)
    const hasPracticeDays = gig.schedule?.practiceDays?.count > 0;
    const isPracticePaid = gig.schedule?.practiceDays?.isPaid;

    // Age/gender requirements (critical screening info)
    const ageRange = gig.ageRange?.min || gig.ageRange?.max
        ? `${gig.ageRange.min || '?'}-${gig.ageRange.max || '?'} yrs`
        : null;
    const genderPref = gig.genderPreference !== 'any' ? gig.genderPreference : null;

    // Duration/commitment
    const durationLabel = gig.schedule?.durationLabel;
    const timeCommitment = gig.schedule?.timeCommitment;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={{
                backgroundColor: isSelected ? 'rgba(24, 24, 24, 1)' : 'rgba(18, 18, 18, 1)',
                borderWidth: 1,
                borderColor: isSelected ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                // Purple glow effect
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isSelected ? 0.15 : 0.15,
                shadowRadius: isSelected ? 20 : 20,
                elevation: 8,
            }}
        >
            {/* ===== TOP ROW: BADGES + FEATURED INDICATOR ===== */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                    {/* Artist Type Badge - Purple accent */}
                    <View style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderWidth: 1,
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: '#8B5CF6',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            {primaryArtistType}
                        </Text>
                    </View>

                    {/* Experience Level Badge - Subtle */}
                    <View style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: 'rgba(255, 255, 255, 0.7)',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            {experienceLevel}
                        </Text>
                    </View>
                </View>

                {/* Featured/Urgent Icons */}
                {gig.isFeatured && (
                    <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(234, 179, 8, 0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Award size={14} color="#EAB308" fill="#EAB308" />
                    </View>
                )}
            </View>

            {/* ===== TITLE ===== */}
            <Text
                style={{
                    fontSize: 24,
                    fontWeight: '700',
                    letterSpacing: -0.5,
                    lineHeight: 28,
                    color: '#FFFFFF',
                    marginBottom: 12,
                    fontFamily: 'Outfit-Bold',
                }}
                numberOfLines={2}
            >
                {gig.title}
            </Text>

            {/* ===== ORGANIZER INFO ===== */}
            {/* <View className="flex-row items-center gap-3 mb-6"> */}
            {/* <View className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 ring-2 ring-white/5">
                    {gig.organizerSnapshot?.profileImageUrl ? (
                        <Image
                            source={{ uri: gig.organizerSnapshot.profileImageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-zinc-800">
                            <Text className="text-white font-black text-sm">
                                {gig.organizerSnapshot?.displayName?.charAt(0) || 'O'}
                            </Text>
                        </View>
                    )}
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center gap-1 mb-0.5">
                        <Text className="text-sm font-bold text-white" numberOfLines={1}>
                            {gig.organizerSnapshot?.displayName || 'Organizer'}
                        </Text>
                        <CheckCircle2 size={12} color="#3B82F6" />
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Star size={10} color="#EAB308" fill="#EAB308" />
                        <Text className="text-[10px] text-zinc-500 font-black">
                            {gig.organizerSnapshot?.rating || '4.8'}
                        </Text>
                        <Text className="text-[10px] text-zinc-600 ml-1">Verified</Text>
                    </View>
                </View> */}

            {/* PAY - RIGHT ALIGNED */}
            {/* <View className="items-end">
                    <Text className="text-white font-black text-xl">
                        ₹{payAmount.toLocaleString()}
                    </Text>
                    <Text className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">
                        {compModel === 'fixed' ? 'Fixed' : compModel === 'hourly' ? '/Hour' : '/Day'}
                        {isNegotiable && ' • Neg'}
                    </Text>
                </View> */}
            {/* </View> */}

            {/* ===== KEY REQUIREMENTS ROW (COMPACT) ===== */}
            {(ageRange || genderPref || hasPracticeDays) && (
                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                }}>
                    {ageRange && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Users size={12} color="rgba(255, 255, 255, 0.5)" />
                            <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)' }}>
                                {ageRange}
                            </Text>
                        </View>
                    )}
                    {genderPref && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.3)' }} />
                            <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'capitalize' }}>
                                {genderPref}
                            </Text>
                        </View>
                    )}
                    {hasPracticeDays && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} color={isPracticePaid ? '#8B5CF6' : 'rgba(255, 255, 255, 0.5)'} />
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                color: isPracticePaid ? '#8B5CF6' : 'rgba(255, 255, 255, 0.5)',
                            }}>
                                {gig.schedule.practiceDays.count} Practice Days
                                {isPracticePaid && ' (Paid)'}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ===== BOTTOM ROW: LOCATION & DATE ===== */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MapPin size={14} color="#8B5CF6" />
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '400',
                            color: 'rgba(255, 255, 255, 0.5)',
                        }}>
                            {gig.location?.city || 'Remote'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} color="#8B5CF6" />
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '400',
                            color: 'rgba(255, 255, 255, 0.5)',
                        }}>
                            {gig.schedule?.startDate
                                ? new Date(gig.schedule.startDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short'
                                })
                                : 'TBD'}
                        </Text>
                    </View>
                </View>

                {/* Duration/Commitment Indicator */}
                {(durationLabel || timeCommitment) && (
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: 'rgba(255, 255, 255, 0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}>
                        {durationLabel || timeCommitment}
                    </Text>
                )}
            </View>

            {/* SELECTED INDICATOR */}
            {isSelected && (
                <View style={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#8B5CF6',
                }} />
            )}
        </TouchableOpacity>
    );
};