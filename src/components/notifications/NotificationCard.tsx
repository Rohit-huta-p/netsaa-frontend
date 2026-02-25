// src/components/notifications/NotificationCard.tsx
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import noAvatar from '@/assets/no-avatar.jpg';
import { Swipeable } from 'react-native-gesture-handler';
import { Notification } from '@/stores/notificationsStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { deepLinkService } from '@/services/deepLinkService';
import {
    Bell,
    Check,
    UserPlus,
    UserCheck,
    MessageCircle,
    Music,
    Calendar,
    CreditCard,
    FileText,
    Settings,
    AlertCircle,
    Briefcase,
    Star,
    X as XIcon,
    Gift,
} from 'lucide-react-native';

// ─── Type → Visual Config ────────────────────────────────────
type NotifConfig = {
    icon: React.ElementType;
    accentColor: string;
    bgColor: string;
    borderColor: string;
    label: string;
};

const NOTIF_CONFIG: Record<string, NotifConfig> = {
    // Connection subtypes
    'connection.request': {
        icon: UserPlus,
        accentColor: '#ec4899',
        bgColor: 'rgba(236,72,153,0.1)',
        borderColor: 'rgba(236,72,153,0.25)',
        label: 'Connection Request',
    },
    'connection.accepted': {
        icon: UserCheck,
        accentColor: '#10b981',
        bgColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.25)',
        label: 'Connection Accepted',
    },
    'connection.rejected': {
        icon: XIcon,
        accentColor: '#71717a',
        bgColor: 'rgba(113,113,122,0.1)',
        borderColor: 'rgba(113,113,122,0.2)',
        label: 'Connection Update',
    },
    // Message subtypes
    'message.new': {
        icon: MessageCircle,
        accentColor: '#3b82f6',
        bgColor: 'rgba(59,130,246,0.1)',
        borderColor: 'rgba(59,130,246,0.25)',
        label: 'New Message',
    },
    'message.mention': {
        icon: MessageCircle,
        accentColor: '#6366f1',
        bgColor: 'rgba(99,102,241,0.1)',
        borderColor: 'rgba(99,102,241,0.25)',
        label: 'Mentioned You',
    },
    // Gig subtypes
    'gig.application.received': {
        icon: Briefcase,
        accentColor: '#a855f7',
        bgColor: 'rgba(168,85,247,0.1)',
        borderColor: 'rgba(168,85,247,0.25)',
        label: 'New Application',
    },
    'gig.application.shortlisted': {
        icon: Star,
        accentColor: '#f59e0b',
        bgColor: 'rgba(245,158,11,0.1)',
        borderColor: 'rgba(245,158,11,0.25)',
        label: 'Shortlisted',
    },
    'gig.application.hired': {
        icon: Gift,
        accentColor: '#10b981',
        bgColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.25)',
        label: 'Hired!',
    },
    'gig.application.rejected': {
        icon: XIcon,
        accentColor: '#71717a',
        bgColor: 'rgba(113,113,122,0.1)',
        borderColor: 'rgba(113,113,122,0.2)',
        label: 'Application Update',
    },
    'gig.cancelled': {
        icon: AlertCircle,
        accentColor: '#ef4444',
        bgColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.25)',
        label: 'Gig Cancelled',
    },
    // Event subtypes
    'event.registration.success': {
        icon: Calendar,
        accentColor: '#10b981',
        bgColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.25)',
        label: 'Registration Confirmed',
    },
    'event.reservation.expiring': {
        icon: AlertCircle,
        accentColor: '#f59e0b',
        bgColor: 'rgba(245,158,11,0.1)',
        borderColor: 'rgba(245,158,11,0.25)',
        label: 'Expiring Soon',
    },
    'event.cancelled': {
        icon: XIcon,
        accentColor: '#ef4444',
        bgColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.25)',
        label: 'Event Cancelled',
    },
    'event.updated': {
        icon: Calendar,
        accentColor: '#3b82f6',
        bgColor: 'rgba(59,130,246,0.1)',
        borderColor: 'rgba(59,130,246,0.25)',
        label: 'Event Updated',
    },
    'event.reminder': {
        icon: Calendar,
        accentColor: '#f59e0b',
        bgColor: 'rgba(245,158,11,0.1)',
        borderColor: 'rgba(245,158,11,0.25)',
        label: 'Event Reminder',
    },
    // Payment subtypes
    'payment.success': {
        icon: CreditCard,
        accentColor: '#10b981',
        bgColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.25)',
        label: 'Payment Success',
    },
    'payment.failed': {
        icon: CreditCard,
        accentColor: '#ef4444',
        bgColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.25)',
        label: 'Payment Failed',
    },
    // Contract subtypes
    'contract.sent': {
        icon: FileText,
        accentColor: '#f97316',
        bgColor: 'rgba(249,115,22,0.1)',
        borderColor: 'rgba(249,115,22,0.25)',
        label: 'New Contract',
    },
    'contract.signed': {
        icon: FileText,
        accentColor: '#10b981',
        bgColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.25)',
        label: 'Contract Signed',
    },
    // System subtypes
    'system.alert': {
        icon: AlertCircle,
        accentColor: '#f59e0b',
        bgColor: 'rgba(245,158,11,0.1)',
        borderColor: 'rgba(245,158,11,0.25)',
        label: 'System Alert',
    },
    'system.maintenance': {
        icon: Settings,
        accentColor: '#71717a',
        bgColor: 'rgba(113,113,122,0.1)',
        borderColor: 'rgba(113,113,122,0.2)',
        label: 'Maintenance',
    },
    'system.feature.announcement': {
        icon: Gift,
        accentColor: '#a855f7',
        bgColor: 'rgba(168,85,247,0.1)',
        borderColor: 'rgba(168,85,247,0.25)',
        label: 'New Feature',
    },
};

// Fallback configs by type (when subtype not matched)
const TYPE_FALLBACK: Record<string, NotifConfig> = {
    connection: {
        icon: UserPlus,
        accentColor: '#ec4899',
        bgColor: 'rgba(236,72,153,0.1)',
        borderColor: 'rgba(236,72,153,0.25)',
        label: 'Connection',
    },
    message: {
        icon: MessageCircle,
        accentColor: '#3b82f6',
        bgColor: 'rgba(59,130,246,0.1)',
        borderColor: 'rgba(59,130,246,0.25)',
        label: 'Message',
    },
    gig: {
        icon: Music,
        accentColor: '#a855f7',
        bgColor: 'rgba(168,85,247,0.1)',
        borderColor: 'rgba(168,85,247,0.25)',
        label: 'Gig',
    },
    event: {
        icon: Calendar,
        accentColor: '#f59e0b',
        bgColor: 'rgba(245,158,11,0.1)',
        borderColor: 'rgba(245,158,11,0.25)',
        label: 'Event',
    },
    payment: {
        icon: CreditCard,
        accentColor: '#10b981',
        bgColor: 'rgba(16,185,129,0.1)',
        borderColor: 'rgba(16,185,129,0.25)',
        label: 'Payment',
    },
    contract: {
        icon: FileText,
        accentColor: '#f97316',
        bgColor: 'rgba(249,115,22,0.1)',
        borderColor: 'rgba(249,115,22,0.25)',
        label: 'Contract',
    },
    system: {
        icon: Settings,
        accentColor: '#71717a',
        bgColor: 'rgba(113,113,122,0.1)',
        borderColor: 'rgba(113,113,122,0.2)',
        label: 'System',
    },
};

const DEFAULT_CONFIG: NotifConfig = {
    icon: Bell,
    accentColor: '#a855f7',
    bgColor: 'rgba(168,85,247,0.1)',
    borderColor: 'rgba(168,85,247,0.25)',
    label: 'Notification',
};

function getConfig(notification: Notification): NotifConfig {
    // Try exact subtype match first
    if (notification.subtype && NOTIF_CONFIG[notification.subtype]) {
        return NOTIF_CONFIG[notification.subtype];
    }
    // Fall back to type
    if (notification.type && TYPE_FALLBACK[notification.type]) {
        return TYPE_FALLBACK[notification.type];
    }
    return DEFAULT_CONFIG;
}

// ─── Component ────────────────────────────────────────────────

interface NotificationCardProps {
    notification: Notification;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
    const swipeableRef = useRef<Swipeable>(null);
    const { markAsRead } = useNotificationsStore();

    const config = getConfig(notification);
    const Icon = config.icon;
    const displayMessage = notification.message || notification.body || '';

    // Extract actor info from populated actorId
    const actor = notification.actorId && typeof notification.actorId === 'object'
        ? notification.actorId
        : null;
    const actorName = actor?.displayName;
    const actorImage = actor?.profileImageUrl;

    const handlePress = () => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.data?.route) {
            deepLinkService.navigateToRoute(notification.data.route);
        }
    };

    const handleMarkAsRead = () => {
        markAsRead(notification._id);
        swipeableRef.current?.close();
    };

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity
                onPress={handleMarkAsRead}
                style={{
                    backgroundColor: '#166534',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: 90,
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                }}
            >
                <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
                    <Check size={20} color="white" />
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '600', marginTop: 4 }}>Read</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            overshootRight={false}
            friction={2}
        >
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                style={{
                    backgroundColor: !notification.isRead ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.03)',
                    borderWidth: 1,
                    borderColor: !notification.isRead ? config.borderColor : 'rgba(255,255,255,0.06)',
                    marginHorizontal: 16,
                    marginBottom: 10,
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                }}
            >
                {/* Unread dot */}
                {!notification.isRead && (
                    <View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: config.accentColor,
                            marginRight: 10,
                            marginTop: 6,
                        }}
                    />
                )}

                {/* Avatar + Icon */}
                <View style={{ marginRight: 12 }}>
                    {actor ? (
                        <View style={{ position: 'relative' }}>
                            <Image
                                source={actorImage ? { uri: actorImage } : noAvatar}
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    backgroundColor: '#27272a',
                                    borderWidth: 1,
                                    borderColor: config.borderColor,
                                }}
                                resizeMode="cover"
                            />
                            {/* Type icon badge */}
                            <View
                                style={{
                                    position: 'absolute',
                                    bottom: -4,
                                    right: -4,
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    backgroundColor: config.accentColor,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#000',
                                }}
                            >
                                <Icon size={10} color="#fff" />
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 12,
                                backgroundColor: config.bgColor,
                                borderWidth: 1,
                                borderColor: config.borderColor,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon size={20} color={config.accentColor} />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    {/* Subtype label chip */}
                    <View
                        style={{
                            alignSelf: 'flex-start',
                            backgroundColor: config.bgColor,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            marginBottom: 5,
                        }}
                    >
                        <Text
                            style={{
                                color: config.accentColor,
                                fontSize: 9,
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            {config.label}
                        </Text>
                    </View>

                    {/* Actor name */}
                    {actorName ? (
                        <Text
                            style={{
                                color: '#ffffff',
                                fontWeight: '800',
                                fontSize: 14,
                                marginBottom: 2,
                            }}
                            numberOfLines={1}
                        >
                            {actorName}
                        </Text>
                    ) : null}

                    {/* Title */}
                    <Text
                        style={{
                            color: actorName ? '#a1a1aa' : '#ffffff',
                            fontWeight: actorName ? '600' : '700',
                            fontSize: actorName ? 13 : 14,
                            marginBottom: 3,
                            lineHeight: 18,
                        }}
                        numberOfLines={2}
                    >
                        {notification.title}
                    </Text>

                    {/* Body */}
                    {displayMessage ? (
                        <Text
                            style={{
                                color: '#a1a1aa',
                                fontSize: 13,
                                lineHeight: 18,
                            }}
                            numberOfLines={2}
                        >
                            {displayMessage}
                        </Text>
                    ) : null}

                    {/* Timestamp */}
                    <Text
                        style={{
                            color: '#52525b',
                            fontSize: 11,
                            marginTop: 6,
                            fontWeight: '500',
                        }}
                    >
                        {formatTimestamp(notification.createdAt)}
                    </Text>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago", "Just now")
 */
function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
