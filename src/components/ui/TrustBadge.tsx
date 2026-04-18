import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, Star, CheckCircle, Award } from 'lucide-react-native';

type TrustTier = 'new' | 'rising' | 'trusted' | 'verified';
type BadgeSize = 'sm' | 'md' | 'lg';

const TIER_CONFIG: Record<TrustTier, { color: string; bg: string; label: string; Icon: any }> = {
    new: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'New', Icon: Shield },
    rising: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Rising', Icon: Star },
    trusted: { color: '#34D399', bg: 'rgba(52,211,153,0.1)', label: 'Trusted', Icon: CheckCircle },
    verified: { color: '#EAB308', bg: 'rgba(234,179,8,0.1)', label: 'Verified', Icon: Award },
};

const SIZES: Record<BadgeSize, { icon: number; font: number; px: number; py: number }> = {
    sm: { icon: 10, font: 9, px: 6, py: 2 },
    md: { icon: 12, font: 10, px: 8, py: 3 },
    lg: { icon: 14, font: 12, px: 10, py: 4 },
};

interface Props {
    tier: TrustTier;
    size?: BadgeSize;
    showLabel?: boolean;
}

export default function TrustBadge({ tier, size = 'sm', showLabel = true }: Props) {
    const config = TIER_CONFIG[tier];
    const sz = SIZES[size];
    const { Icon } = config;

    return (
        <View style={[styles.badge, { backgroundColor: config.bg, paddingHorizontal: sz.px, paddingVertical: sz.py }]}>
            <Icon size={sz.icon} color={config.color} strokeWidth={2} />
            {showLabel && (
                <Text style={[styles.label, { color: config.color, fontSize: sz.font }]}>
                    {config.label.toUpperCase()}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: 100,
    },
    label: {
        fontFamily: 'Outfit-SemiBold',
        letterSpacing: 0.5,
    },
});
