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
    const payAmount = gig.compensation?.amount || 0;
    const compModel = gig.compensation?.model || 'fixed';
    const isNegotiable = gig.compensation?.negotiable;
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
            className={`group relative overflow-hidden mb-4 transition-all ${isSelected
                ? 'bg-zinc-900/90 border-2 border-blue-500/60 shadow-2xl shadow-blue-500/10 rounded-[2.5rem] p-8'
                : 'bg-zinc-900/30 border border-white/5 active:border-white/20 active:bg-zinc-900/50 rounded-[2.5rem] p-6'
                }`}
        >
            {/* ===== TOP ROW: BADGES + FEATURED INDICATOR ===== */}
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row gap-2 flex-wrap flex-1">
                    {/* Urgency/New Badge */}
                    {/* {urgency && (
                        <View className={`border rounded-full px-3 py-0.5x flex-row items-center gap-1 ${urgency.color}`}>
                            {urgency.icon && <urgency.icon size={10} />}
                            <Text className="text-[6px] uppercase tracking-widest font-black">
                                {urgency.label}
                            </Text>
                        </View>
                    )} */}

                    {/* Artist Type Badge */}
                    <View className="bg-zinc-800/80 border border-zinc-700/50 rounded-full px-3 py-[3px] flex-row items-center">
                        <Text className="text-[8px] uppercase tracking-widest font-black text-zinc-400">
                            {primaryArtistType}
                        </Text>
                    </View>

                    {/* Experience Level Badge */}
                    <View className="bg-purple-500/10 border border-purple-500/30 rounded-full px-3 py-[3px] flex-row items-center">
                        <Text className="text-[8px] uppercase tracking-widest font-black text-purple-400">
                            {experienceLevel}
                        </Text>
                    </View>
                </View>

                {/* Featured/Urgent Icons */}
                {gig.isFeatured && (
                    <View className="w-7 h-7 rounded-full bg-yellow-500/20 items-center justify-center">
                        <Award size={14} color="#EAB308" fill="#EAB308" />
                    </View>
                )}
            </View>

            {/* ===== TITLE ===== */}
            <Text
                className="font-bold text-2xl leading-tight text-white tracking-tight mb-5"
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
                <View className="flex-row flex-wrap gap-3 mb-6 pb-6 border-b border-white/5">
                    {ageRange && (
                        <View className="flex-row items-center gap-1.5">
                            <Users size={12} color="#71717A" />
                            <Text className="text-[10px] font-black text-zinc-500">
                                {ageRange}
                            </Text>
                        </View>
                    )}
                    {genderPref && (
                        <View className="flex-row items-center gap-1.5">
                            <View className="w-1 h-1 rounded-full bg-zinc-600" />
                            <Text className="text-[10px] font-black text-zinc-500 capitalize">
                                {genderPref}
                            </Text>
                        </View>
                    )}
                    {hasPracticeDays && (
                        <View className="flex-row items-center gap-1.5">
                            <Clock size={12} color={isPracticePaid ? '#3B82F6' : '#71717A'} />
                            <Text className={`text-[10px] font-black ${isPracticePaid ? 'text-blue-400' : 'text-zinc-500'}`}>
                                {gig.schedule.practiceDays.count} Practice Days
                                {isPracticePaid && ' (Paid)'}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ===== BOTTOM ROW: LOCATION & DATE ===== */}
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-2">
                        <MapPin size={14} color="#3B82F6" />
                        <Text className="text-[11px] font-black uppercase tracking-tight text-zinc-400">
                            {gig.location?.city || 'Remote'}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Calendar size={14} color="#3B82F6" />
                        <Text className="text-[11px] font-black uppercase tracking-tight text-zinc-400">
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
                    <Text className="text-[9px] text-zinc-600 font-black uppercase tracking-wider">
                        {durationLabel || timeCommitment}
                    </Text>
                )}
            </View>

            {/* HOVER STATE INDICATOR (subtle, appears only when selected) */}
            {isSelected && (
                <View className="absolute right-4 top-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
        </TouchableOpacity>
    );
};