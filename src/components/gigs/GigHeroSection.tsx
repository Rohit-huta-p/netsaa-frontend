import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import {
    Heart,
    Share2,
    Settings2,
} from 'lucide-react-native';
import { ApplicationsBadge } from './applications';
import useAuthStore from '@/stores/authStore';

interface GigHeroSectionProps {
    gig: any;
    isSaved: boolean;
    onSave: () => void;
    onShare: () => void;
    onSettingsPress: () => void;
    onApplicationsPress: () => void;
    totalApplications: number;
    pendingApplications: number;
}

/**
 * Hero section at the top of gig details — tags + action buttons.
 * Reads user from authStore to determine organizer status.
 */
export const GigHeroSection: React.FC<GigHeroSectionProps> = ({
    gig,
    isSaved,
    onSave,
    onShare,
    onSettingsPress,
    onApplicationsPress,
    totalApplications,
    pendingApplications,
}) => {
    const { width } = useWindowDimensions();
    const isMobileWidth = width < 768;
    const user = useAuthStore((state) => state.user);
    const isOrganizer = user?._id === gig.organizerId._id;

    const buttonSize = isMobileWidth ? 'w-8 h-8' : 'w-10 h-10';
    const iconSize = isMobileWidth ? 16 : 20;

    return (
        <View className="relative w-full overflow-hidden rounded-xl">
            <View className="flex-row w-full justify-between">
                {/* Tags */}
                <View className="flex-1 justify-end">
                    <View className="flex-row gap-2">
                        {gig.isUrgent && (
                            <View className="bg-orange-600 rounded-full px-3 py-1">
                                <Text className="text-white font-black text-[8px] uppercase tracking-[0.2em]">
                                    URGENT
                                </Text>
                            </View>
                        )}
                        <View className="bg-blue-600 rounded-full px-4 py-1">
                            <Text className="text-white font-black text-[8px] uppercase tracking-[0.2em]">
                                {gig.artistTypes?.[0] || 'MUSIC'} • {gig.category?.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row items-center gap-3 z-30">
                    {!isOrganizer && (
                        <TouchableOpacity
                            onPress={onSave}
                            className={`${buttonSize} rounded-2xl bg-black/50 border border-white/10 items-center justify-center`}
                        >
                            <Heart
                                size={iconSize}
                                color={isSaved ? '#EF4444' : '#FFFFFF'}
                                fill={isSaved ? '#EF4444' : 'none'}
                            />
                        </TouchableOpacity>
                    )}

                    {isOrganizer && (
                        <>
                            {/* <ApplicationsBadge
                                count={totalApplications}
                                pendingCount={pendingApplications}
                                onPress={onApplicationsPress}
                            /> */}
                            <TouchableOpacity
                                onPress={onSettingsPress}
                                className={`${buttonSize} rounded-2xl bg-black/50 border border-white/10 items-center justify-center`}
                            >
                                <Settings2 size={iconSize} color="#FFFFFF" />
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        onPress={onShare}
                        className={`${buttonSize} rounded-2xl bg-black/50 border border-white/10 items-center justify-center`}
                    >
                        <Share2 size={iconSize} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
