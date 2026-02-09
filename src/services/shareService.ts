// Share Service - Production-grade sharing utilities for NETSA
// Supports WhatsApp, Instagram DM, Telegram, Copy Link, and native share sheet

import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Platform, Alert } from 'react-native';

// Base URL for deep links (update this for production)
const BASE_URL = 'https://netsa.onrender.com';

export interface ShareContent {
    title: string;
    message: string;
    url: string;
}

// Generate share content for a Gig
export const generateGigShareContent = (gig: any): ShareContent => {
    const title = gig.title || 'Check out this gig!';
    const compensation = gig.compensation?.amount
        ? `₹${gig.compensation.amount.toLocaleString()}`
        : gig.compensation?.minAmount
            ? `₹${gig.compensation.minAmount.toLocaleString()}+`
            : 'Great Pay';
    const location = gig.location?.city || 'Remote';
    const date = gig.schedule?.startDate
        ? new Date(gig.schedule.startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
        : 'Flexible dates';

    const message = `🎭 ${title}\n💰 ${compensation}\n📍 ${location}\n📅 ${date}\n\nApply now on NETSA!`;
    const url = `${BASE_URL}/gigs/${gig._id}`;

    return { title, message, url };
};

// Generate share content for an Event
export const generateEventShareContent = (event: any): ShareContent => {
    const title = event.title || 'Check out this event!';
    const price = event.ticketPrice ? `₹${event.ticketPrice}` : 'Free';
    const location = event.location?.venueName || event.location?.city || 'TBD';
    const date = event.schedule?.startDate
        ? new Date(event.schedule.startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
        : 'TBD';

    const message = `🎉 ${title}\n🎟️ ${price}\n📍 ${location}\n📅 ${date}\n\nJoin the event on NETSA!`;
    const url = `${BASE_URL}/events/${event._id}`;

    return { title, message, url };
};

// Generate share content for a Profile
export const generateProfileShareContent = (user: any): ShareContent => {
    if (!user) {
        return {
            title: 'NETSA User',
            message: 'Check out this profile on NETSA!',
            url: BASE_URL
        };
    }
    const name = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Artist';
    const artistType = user.artistType || user.roles?.[0] || 'Creative';
    const bio = user.bio ? user.bio.substring(0, 100) + (user.bio.length > 100 ? '...' : '') : '';

    const message = `🎭 ${name}\n✨ ${artistType}${bio ? `\n\n"${bio}"` : ''}\n\nView profile on NETSA!`;
    const url = `${BASE_URL}/profile/${user._id}`;

    return { title: name, message, url };
};

// Open WhatsApp with pre-filled message
export const shareToWhatsApp = async (content: ShareContent): Promise<boolean> => {
    const text = `${content.message}\n\n${content.url}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    try {
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
            await Linking.openURL(whatsappUrl);
            return true;
        } else {
            Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to share.');
            return false;
        }
    } catch (error) {
        console.error('Error opening WhatsApp:', error);
        return false;
    }
};

// Open Instagram Direct Messages (limited functionality)
export const shareToInstagramDM = async (content: ShareContent): Promise<boolean> => {
    // Instagram doesn't have a direct share URL - we open the app and user shares manually
    // First copy the link, then open Instagram
    await copyToClipboard(content.url);

    const instagramUrl = Platform.select({
        ios: 'instagram://direct-inbox',
        android: 'instagram://direct-inbox',
        default: 'https://instagram.com/direct/inbox',
    });

    try {
        const canOpen = await Linking.canOpenURL(instagramUrl);
        if (canOpen) {
            Alert.alert(
                'Link Copied!',
                'The link has been copied. Paste it in your Instagram DM.',
                [{ text: 'Open Instagram', onPress: () => Linking.openURL(instagramUrl) }]
            );
            return true;
        } else {
            Alert.alert('Instagram Not Found', 'Please install Instagram to share.');
            return false;
        }
    } catch (error) {
        console.error('Error opening Instagram:', error);
        return false;
    }
};

// Open Instagram Stories (requires native share sheet)
export const shareToInstagramStory = async (content: ShareContent): Promise<boolean> => {
    // Instagram Story sharing requires native share sheet
    // Copy link and inform user to paste in story
    await copyToClipboard(content.url);

    const instagramUrl = Platform.select({
        ios: 'instagram://story-camera',
        android: 'instagram://story-camera',
        default: 'https://instagram.com',
    });

    try {
        const canOpen = await Linking.canOpenURL(instagramUrl);
        if (canOpen) {
            Alert.alert(
                'Link Copied!',
                'Add link sticker to your story and paste the URL.',
                [{ text: 'Open Stories', onPress: () => Linking.openURL(instagramUrl) }]
            );
            return true;
        } else {
            Alert.alert('Instagram Not Found', 'Please install Instagram to share.');
            return false;
        }
    } catch (error) {
        console.error('Error opening Instagram Stories:', error);
        return false;
    }
};

// Open Telegram share dialog
export const shareToTelegram = async (content: ShareContent): Promise<boolean> => {
    const encodedUrl = encodeURIComponent(content.url);
    const encodedText = encodeURIComponent(content.message);
    const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

    try {
        const canOpen = await Linking.canOpenURL(telegramUrl);
        if (canOpen) {
            await Linking.openURL(telegramUrl);
            return true;
        } else {
            // Try tg:// scheme as fallback
            const tgUrl = `tg://msg_url?url=${encodedUrl}&text=${encodedText}`;
            const canOpenTg = await Linking.canOpenURL(tgUrl);
            if (canOpenTg) {
                await Linking.openURL(tgUrl);
                return true;
            }
            Alert.alert('Telegram Not Found', 'Please install Telegram to share.');
            return false;
        }
    } catch (error) {
        console.error('Error opening Telegram:', error);
        return false;
    }
};

// Copy URL to clipboard
export const copyToClipboard = async (url: string): Promise<boolean> => {
    try {
        await Clipboard.setStringAsync(url);
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
};

// Native share sheet (fallback for "More" option)
export const openNativeShare = async (content: ShareContent): Promise<boolean> => {
    try {
        if (Platform.OS === 'web') {
            // Web Share API
            if (navigator.share) {
                await navigator.share({
                    title: content.title,
                    text: content.message,
                    url: content.url,
                });
                return true;
            } else {
                // Fallback to clipboard
                await copyToClipboard(content.url);
                Alert.alert('Link Copied!', 'Share link has been copied to clipboard.');
                return true;
            }
        } else {
            // Native sharing
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                // Note: expo-sharing requires a file, so we'll use the native Share API instead
                const { Share } = await import('react-native');
                await Share.share({
                    message: `${content.message}\n\n${content.url}`,
                    title: content.title,
                    url: content.url, // iOS only
                });
                return true;
            } else {
                await copyToClipboard(content.url);
                Alert.alert('Link Copied!', 'Share link has been copied to clipboard.');
                return true;
            }
        }
    } catch (error) {
        console.error('Error sharing:', error);
        return false;
    }
};

// Export all functions
export default {
    generateGigShareContent,
    generateEventShareContent,
    generateProfileShareContent,
    shareToWhatsApp,
    shareToInstagramDM,
    shareToInstagramStory,
    shareToTelegram,
    copyToClipboard,
    openNativeShare,
};
