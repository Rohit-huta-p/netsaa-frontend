// src/components/notifications/NotificationCard.tsx
// Editorial-inbox flush row (mockup `.b-row`). Restrained-semantic colour:
// the icon tint carries state; unread is a single orange left-rail.
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated, Image, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Check } from 'lucide-react-native';
import { Notification, useNotificationsStore } from '@/stores/notificationsStore';
import { deepLinkService } from '@/services/deepLinkService';
import connectionService from '@/services/connectionService';
import { N, FONT, SEMANTIC, getNotifConfig, formatStamp } from '@/constants/notificationsTheme';

interface NotificationCardProps {
    notification: Notification;
}

function initials(name?: string): string {
    if (!name) return 'N';
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'N';
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification }) => {
    const swipeableRef = useRef<Swipeable>(null);
    const { markAsRead } = useNotificationsStore();

    const config = getNotifConfig(notification);
    const Icon = config.Icon;
    const sem = SEMANTIC[config.semantic];
    const unread = !notification.isRead;
    const body = notification.message || notification.body || '';

    const actor = notification.actorId && typeof notification.actorId === 'object' ? notification.actorId : null;
    const actorImage = actor?.profileImageUrl;

    // Inline connection actions — only when the payload carries a connectionId.
    const connectionId = notification.data?.params?.connectionId;
    const canAct = typeof connectionId === 'string';
    const [acted, setActed] = useState(false);

    const handlePress = () => {
        if (unread) markAsRead(notification._id);
        if (notification.data?.route) deepLinkService.navigateToRoute(notification.data.route);
    };

    const respond = async (kind: 'accept' | 'decline') => {
        if (!canAct) return;
        setActed(true);
        try {
            if (kind === 'accept') await connectionService.acceptConnectionRequest(connectionId!);
            else await connectionService.rejectConnectionRequest(connectionId!);
            markAsRead(notification._id);
        } catch (e) {
            setActed(false); // restore actions on failure
            if (__DEV__) console.warn('[NotificationCard] connection respond failed', e);
        }
    };

    const handleMarkAsRead = () => {
        markAsRead(notification._id);
        swipeableRef.current?.close();
    };

    const renderRightActions = (
        _p: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({ inputRange: [-90, 0], outputRange: [1, 0], extrapolate: 'clamp' });
        return (
            <TouchableOpacity onPress={handleMarkAsRead} style={s.swipeAction}>
                <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
                    <Check size={20} color={N.orangeInk} />
                    <Text style={s.swipeText}>Read</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
            <Pressable testID="notif-row" onPress={handlePress} style={[s.row, unread && s.rowUnread]}>
                {unread && <View testID="unread-rail" style={s.rail} />}

                {/* Avatar (person) or semantic icon square */}
                {actor ? (
                    <View style={s.avatar}>
                        {actorImage ? (
                            <Image source={{ uri: actorImage }} style={s.avatarImg} resizeMode="cover" />
                        ) : (
                            <Text style={s.avatarInitials}>{initials(actor.displayName)}</Text>
                        )}
                        <View style={[s.badge, { backgroundColor: sem.color }]}>
                            <Icon size={10} color={N.bg1} strokeWidth={2.4} />
                        </View>
                    </View>
                ) : (
                    <View style={[s.icon, { backgroundColor: sem.soft }]}>
                        <Icon size={19} color={sem.color} strokeWidth={2} />
                    </View>
                )}

                {/* Body */}
                <View style={s.body}>
                    {config.eyebrow ? (
                        <Text style={[s.eyebrow, { color: sem.color }]}>{config.eyebrow}</Text>
                    ) : null}
                    <View style={s.head}>
                        <Text style={s.title} numberOfLines={2}>{notification.title}</Text>
                        <Text style={s.stamp}>{formatStamp(notification.createdAt)}</Text>
                    </View>
                    {body ? <Text style={s.bodyText} numberOfLines={2}>{body}</Text> : null}

                    {canAct && !acted ? (
                        <View style={s.actions}>
                            <Pressable onPress={() => respond('accept')} style={[s.btn, s.btnPrimary]}>
                                <Text style={s.btnPrimaryText}>Accept</Text>
                            </Pressable>
                            <Pressable onPress={() => respond('decline')} style={[s.btn, s.btnGhost]}>
                                <Text style={s.btnGhostText}>Decline</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </View>
            </Pressable>
        </Swipeable>
    );
};

const s = StyleSheet.create({
    row: {
        position: 'relative', flexDirection: 'row', gap: 13, alignItems: 'flex-start',
        paddingVertical: 14, paddingHorizontal: 20,
        borderTopWidth: 1, borderTopColor: N.hairline, backgroundColor: N.bg1,
    },
    rowUnread: { backgroundColor: 'rgba(255,107,53,0.035)' },
    rail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, backgroundColor: N.orange },

    icon: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: N.hairline2,
    },
    avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#2E2B36', alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 40, height: 40, borderRadius: 12 },
    avatarInitials: { fontFamily: FONT.bold, fontSize: 15, color: N.text0, letterSpacing: -0.2 },
    badge: {
        position: 'absolute', right: -5, bottom: -5, width: 19, height: 19, borderRadius: 7,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: N.bg1,
    },

    body: { flex: 1, minWidth: 0 },
    eyebrow: { fontFamily: FONT.monoBold, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 3 },
    head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
    title: { flex: 1, fontFamily: FONT.semi, fontSize: 14, color: N.text0, letterSpacing: -0.1, lineHeight: 18 },
    stamp: { fontFamily: FONT.mono, fontSize: 10, color: N.text3, letterSpacing: 0.2 },
    bodyText: { fontFamily: FONT.reg, fontSize: 12.5, color: N.text2, lineHeight: 18, marginTop: 3 },

    actions: { flexDirection: 'row', gap: 8, marginTop: 11 },
    btn: { paddingVertical: 7, paddingHorizontal: 15, borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
    btnPrimary: { backgroundColor: N.text0 },
    btnPrimaryText: { fontFamily: FONT.semi, fontSize: 12, color: N.orangeInk },
    btnGhost: { borderColor: N.hairline2 },
    btnGhostText: { fontFamily: FONT.semi, fontSize: 12, color: N.text2 },

    swipeAction: {
        backgroundColor: N.orange, justifyContent: 'center', alignItems: 'center', width: 90,
    },
    swipeText: { color: N.orangeInk, fontSize: 10, fontFamily: FONT.bold, marginTop: 4 },
});
