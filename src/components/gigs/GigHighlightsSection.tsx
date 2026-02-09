import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
    Mic2,
    Music,
    Camera,
    Film,
    Palette,
    Users,
    Clock,
    Briefcase,
    Star,
    Sparkles,
    Gift,
    Car,
    Utensils,
    Hotel,
    Wifi,
    Shield,
    Award,
    TrendingUp,
    MessageCircle,
    ChevronRight,
} from 'lucide-react-native';

interface GigHighlightsSectionProps {
    gig: any;
    isOrganizer: boolean;
}

// Artist type icons mapping
const getArtistTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
        'musician': Mic2,
        'singer': Mic2,
        'dancer': Users,
        'photographer': Camera,
        'videographer': Film,
        'dj': Music,
        'band': Music,
        'artist': Palette,
    };
    return icons[type?.toLowerCase()] || Sparkles;
};

// Perk icons mapping
const getPerkIcon = (perk: string) => {
    const perkLower = perk.toLowerCase();
    if (perkLower.includes('food') || perkLower.includes('meal')) return Utensils;
    if (perkLower.includes('travel') || perkLower.includes('transport')) return Car;
    if (perkLower.includes('stay') || perkLower.includes('accommodation') || perkLower.includes('hotel')) return Hotel;
    if (perkLower.includes('equipment') || perkLower.includes('gear')) return Wifi;
    if (perkLower.includes('exposure') || perkLower.includes('network')) return TrendingUp;
    return Gift;
};

export const GigHighlightsSection: React.FC<GigHighlightsSectionProps> = ({ gig, isOrganizer }) => {
    // Extract talent criteria
    const talentCriteria = gig.talentCriteria || {};
    const perks = gig.compensation?.perks || [];

    // Build requirement chips
    const requirementChips = [];

    if (talentCriteria.artistType) {
        requirementChips.push({
            label: talentCriteria.artistType,
            icon: getArtistTypeIcon(talentCriteria.artistType),
            color: '#3B82F6',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        });
    }

    if (talentCriteria.experienceLevel) {
        const expLabels: Record<string, string> = {
            'beginner': '0-1 years',
            'intermediate': '2-4 years',
            'experienced': '5+ years',
            'professional': 'Pro Level',
        };
        requirementChips.push({
            label: expLabels[talentCriteria.experienceLevel] || talentCriteria.experienceLevel,
            icon: Briefcase,
            color: '#8B5CF6',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        });
    }

    if (talentCriteria.performanceType) {
        requirementChips.push({
            label: talentCriteria.performanceType,
            icon: Star,
            color: '#F59E0B',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
        });
    }

    if (talentCriteria.equipmentRequired) {
        requirementChips.push({
            label: 'Own Equipment',
            icon: Wifi,
            color: '#10B981',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        });
    }

    // Duration chip
    if (gig.schedule?.duration) {
        requirementChips.push({
            label: `${gig.schedule.duration} mins`,
            icon: Clock,
            color: '#EC4899',
            bgColor: 'bg-pink-500/10',
            borderColor: 'border-pink-500/20',
        });
    }

    // Don't render if no data
    if (requirementChips.length === 0 && perks.length === 0) {
        return null;
    }

    return (
        <View className="mt-2 mb-6">
            {/* Talent Requirements */}
            {requirementChips.length > 0 && (
                <View className="mb-5">
                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                        LOOKING FOR
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row"
                    >
                        <View className="flex-row gap-2 flex-wrap">
                            {requirementChips.map((chip, index) => {
                                const IconComponent = chip.icon;
                                return (
                                    <View
                                        key={index}
                                        className={`flex-row items-center gap-2 px-3 py-2 rounded-xl ${chip.bgColor} border ${chip.borderColor}`}
                                    >
                                        <IconComponent size={14} color={chip.color} />
                                        <Text style={{ color: chip.color }} className="text-xs font-bold">
                                            {chip.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Perks & Highlights */}
            {perks.length > 0 && (
                <View>
                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                        WHAT'S INCLUDED
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {perks.slice(0, 4).map((perk: string, index: number) => {
                            const PerkIcon = getPerkIcon(perk);
                            return (
                                <View
                                    key={index}
                                    className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-white/5"
                                >
                                    <PerkIcon size={14} color="#71717A" />
                                    <Text className="text-zinc-300 text-xs font-medium">
                                        {perk}
                                    </Text>
                                </View>
                            );
                        })}
                        {perks.length > 4 && (
                            <View className="flex-row items-center gap-1 px-3 py-2">
                                <Text className="text-zinc-500 text-xs font-medium">
                                    +{perks.length - 4} more
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};
