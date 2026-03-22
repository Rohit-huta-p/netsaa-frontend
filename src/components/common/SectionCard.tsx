import React from 'react';
import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface SectionCardProps {
    icon: LucideIcon;
    iconColor: string;
    label: string;
    labelColor?: string;
    /** Override default bg/border classes */
    cardClassName?: string;
    children: React.ReactNode;
}

/**
 * Reusable card wrapper with an icon + uppercase label header.
 * Used across gig detail tabs and other detail screens.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
    icon: Icon,
    iconColor,
    label,
    labelColor,
    cardClassName,
    children,
}) => (
    <View className={cardClassName || 'p-6 rounded-2xl bg-zinc-900/30 border border-white/5'}>
        <View className="flex-row items-center gap-2 mb-6">
            <Icon size={16} color={iconColor} />
            <Text
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: labelColor || iconColor }}
            >
                {label}
            </Text>
        </View>
        {children}
    </View>
);
