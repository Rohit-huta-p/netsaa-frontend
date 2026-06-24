import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import connectionService from '@/services/connectionService';
import { useAuthStore } from '@/stores/authStore';

/**
 * Network icon with pending-invite count badge.
 * Tapping navigates to /network. Poll-refreshes on screen focus.
 *
 * Uses the Users icon (not Bell — Bell is reserved for notifications per
 * universal UI convention). Drop into any main-screen top bar.
 * The Network screen itself should not render this — redundant there.
 */
type Props = {
    size?: number;
    color?: string;
    badgeColor?: string;
    hitSlop?: number;
    onPress?: () => void;
};

export const NetworkIcon: React.FC<Props> = ({
    size = 20,
    color = '#F0ECE6',
    badgeColor = '#EC4899',
    hitSlop = 10,
    onPress,
}) => {
    const { user } = useAuthStore();
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        if (!user) return;
        try {
            const reqs = await connectionService.getConnectionRequests();
            setCount(Array.isArray(reqs) ? reqs.length : 0);
        } catch (e) {
            // Silent — don't block UI on a header badge
            if (__DEV__) console.warn('[NetworkIcon] fetch failed', e);
        }
    }, [user]);

    useEffect(() => {
        fetchCount();
    }, [fetchCount]);

    useFocusEffect(
        useCallback(() => {
            fetchCount();
        }, [fetchCount])
    );

    const handlePress = () => {
        if (onPress) onPress();
        else router.push('/network' as any);
    };

    return (
        <Pressable
            onPress={handlePress}
            hitSlop={hitSlop}
            style={({ pressed }) => [s.root, pressed && { opacity: 0.6 }]}
            accessibilityLabel={`Open network. ${count} pending invitations.`}
            accessibilityRole="button"
        >
            <Users size={size} color={color} strokeWidth={2} />
            {count > 0 && (
                <View style={[s.badge, { backgroundColor: badgeColor }]}>
                    <Text style={s.badgeText}>{count > 99 ? '99+' : count}</Text>
                </View>
            )}
        </Pressable>
    );
};

const s = StyleSheet.create({
    root: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#0A0A10',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        fontFamily: 'Outfit-ExtraBold',
    },
});

export default NetworkIcon;
