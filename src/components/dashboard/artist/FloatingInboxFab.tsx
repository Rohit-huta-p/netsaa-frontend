/**
 * FloatingInboxFab — LinkedIn-style floating inbox button.
 *
 * Per DOCS/designs/artist-home-v1.html footer: bottom-right purple FAB
 * with a red unread badge. Sits above the bottom nav (positioned at
 * `bottom = safeBottom + 12` so it never overlaps the tab bar). Hides
 * its badge when totalUnread is 0; the button itself stays visible as
 * a quick-jump to /messages.
 *
 * Data: useUnreadCount (existing artist-side hook).
 */
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';
import useUnreadCount from '@/hooks/useUnreadCount';

const PAPER = '#F3EFE8';
const RED = '#EF4444';
const BG = '#060509';

interface Props {
    /** Override the default bottom inset (default sits above 92px nav). */
    bottom?: number;
}

export default function FloatingInboxFab({ bottom = 104 }: Props) {
    const router = useRouter();
    const { totalUnread } = useUnreadCount();

    const badge = totalUnread > 0 ? (totalUnread > 99 ? '99+' : String(totalUnread)) : null;

    return (
        <Pressable
            accessibilityLabel={`Open messages${totalUnread > 0 ? `, ${totalUnread} unread` : ''}`}
            accessibilityRole="button"
            onPress={() => router.push('/inbox' as any)}
            style={[styles.fab, { bottom }]}
        >
            <LinearGradient
                colors={['#8B5CF6', '#6D23B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabInner}
            >
                <MessageSquare size={24} color={PAPER} strokeWidth={2} />
                {badge ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                ) : null}
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        // Shadow: orange-purple glow on iOS, elevation on Android.
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.40,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    fabInner: {
        flex: 1,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 22,
        height: 22,
        paddingHorizontal: 6,
        borderRadius: 11,
        backgroundColor: RED,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: BG,
    },
    badgeText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 11,
        color: PAPER,
    },
});
