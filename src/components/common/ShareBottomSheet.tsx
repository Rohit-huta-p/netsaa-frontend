// ShareBottomSheet - Premium sharing modal with app-specific icons
// Supports WhatsApp, Instagram DM, Instagram Story, Telegram, Copy Link, and More

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Alert,
    Platform,
} from 'react-native';
import { X, Link, MoreHorizontal } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import shareService, {
    ShareContent,
    generateGigShareContent,
    generateEventShareContent,
    generateProfileShareContent,
} from '@/services/shareService';

interface ShareBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    type: 'gig' | 'event' | 'profile';
    data: any; // Gig, Event, or User object
}

// Brand colors for each platform
const BRAND_COLORS = {
    whatsapp: '#25D366',
    instagram: '#E4405F',
    instagramGradient: ['#833AB4', '#FD1D1D', '#F77737'],
    telegram: '#0088CC',
};

// Inline SVG-like icon components using View elements for cross-platform support
const WhatsAppIcon = () => (
    <View className="w-6 h-6 items-center justify-center">
        <Text style={{ fontSize: 20 }}>📱</Text>
    </View>
);

const InstagramIcon = () => (
    <View className="w-6 h-6 items-center justify-center">
        <Text style={{ fontSize: 20 }}>📷</Text>
    </View>
);

const InstagramStoryIcon = () => (
    <View className="w-6 h-6 items-center justify-center">
        <Text style={{ fontSize: 20 }}>📸</Text>
    </View>
);

const TelegramIcon = () => (
    <View className="w-6 h-6 items-center justify-center">
        <Text style={{ fontSize: 20 }}>✈️</Text>
    </View>
);

export const ShareBottomSheet: React.FC<ShareBottomSheetProps> = ({
    visible,
    onClose,
    type,
    data,
}) => {
    const [isSharing, setIsSharing] = useState(false);

    // Generate share content based on type
    const getShareContent = (): ShareContent => {
        switch (type) {
            case 'gig':
                return generateGigShareContent(data);
            case 'event':
                return generateEventShareContent(data);
            case 'profile':
                return generateProfileShareContent(data);
            default:
                return { title: 'Check this out!', message: 'Shared from NETSA', url: 'https://netsa.app' };
        }
    };

    const handleShare = async (platform: string) => {
        if (isSharing) return;
        setIsSharing(true);

        const content = getShareContent();

        try {
            let success = false;
            switch (platform) {
                case 'whatsapp':
                    success = await shareService.shareToWhatsApp(content);
                    break;
                case 'instagram':
                    success = await shareService.shareToInstagramDM(content);
                    break;
                case 'instagram-story':
                    success = await shareService.shareToInstagramStory(content);
                    break;
                case 'telegram':
                    success = await shareService.shareToTelegram(content);
                    break;
                case 'copy':
                    success = await shareService.copyToClipboard(content.url);
                    if (success) {
                        Alert.alert('Copied!', 'Link copied to clipboard');
                    }
                    break;
                case 'more':
                    success = await shareService.openNativeShare(content);
                    break;
            }

            if (success && platform !== 'copy') {
                onClose();
            }
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share. Please try again.');
        } finally {
            setIsSharing(false);
        }
    };

    const shareOptions = [
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            icon: WhatsAppIcon,
            color: BRAND_COLORS.whatsapp,
        },
        {
            id: 'instagram',
            label: 'Instagram',
            icon: InstagramIcon,
            color: BRAND_COLORS.instagram,
        },
        {
            id: 'instagram-story',
            label: 'Story',
            icon: InstagramStoryIcon,
            color: BRAND_COLORS.instagram,
        },
        {
            id: 'telegram',
            label: 'Telegram',
            icon: TelegramIcon,
            color: BRAND_COLORS.telegram,
        },
    ];

    const secondaryOptions = [
        {
            id: 'copy',
            label: 'Copy Link',
            icon: Link,
            color: '#71717A',
        },
        {
            id: 'more',
            label: 'More',
            icon: MoreHorizontal,
            color: '#71717A',
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 justify-end bg-black/60"
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    className="bg-zinc-900 rounded-t-3xl border-t border-white/10"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-5 border-b border-white/10">
                        <Text className="text-white font-black text-lg">Share</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center"
                        >
                            <X size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Preview Section */}
                    <View className="px-6 py-4 border-b border-white/5">
                        <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                            SHARING
                        </Text>
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                            {getShareContent().title}
                        </Text>
                        <Text className="text-zinc-500 text-sm mt-1" numberOfLines={2}>
                            {getShareContent().message.split('\n')[0]}
                        </Text>
                    </View>

                    {/* Primary Share Options */}
                    <View className="px-6 py-6">
                        <View className="flex-row justify-around mb-6">
                            {shareOptions.map((option) => {
                                const IconComponent = option.icon;
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => handleShare(option.id)}
                                        disabled={isSharing}
                                        className="items-center"
                                        style={{ opacity: isSharing ? 0.5 : 1 }}
                                    >
                                        <View
                                            className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                                            style={{ backgroundColor: `${option.color}20` }}
                                        >
                                            <View
                                                className="w-10 h-10 rounded-xl items-center justify-center"
                                                style={{ backgroundColor: option.color }}
                                            >
                                                <IconComponent />
                                            </View>
                                        </View>
                                        <Text className="text-zinc-400 text-xs font-medium">
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Secondary Options */}
                        <View className="flex-row justify-center gap-8">
                            {secondaryOptions.map((option) => {
                                const IconComponent = option.icon;
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={() => handleShare(option.id)}
                                        disabled={isSharing}
                                        className="flex-row items-center gap-2 px-5 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700"
                                        style={{ opacity: isSharing ? 0.5 : 1 }}
                                    >
                                        <IconComponent size={18} color={option.color} />
                                        <Text className="text-zinc-300 text-sm font-bold">
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Safe area padding for bottom */}
                    <View className="h-8" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

export default ShareBottomSheet;
