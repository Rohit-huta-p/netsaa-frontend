/**
 * HeroGreetingArtistV2 — slim artist-home hero per locked mockup
 * (DOCS/04-design/mockups/artist-home-v1.html, finalized 2026-05-18).
 *
 * Layout (single row + name line, no big headline):
 *   - Avatar (44×44, purple→pink gradient, first-letter monogram)
 *   - "SUNDAY MORNING" greeting (Space Mono caps) above name
 *   - "{firstName}" (DM Serif Display, 18pt) on the next line
 *   - Trust pill on the right (RISING · TRUST 6.2)
 *
 * No editorial headline, sub-paragraph, or Devanagari watermark — the
 * hero earns visual weight from the By-the-numbers KPI grid right under it.
 *
 * Accent: purple (#8B5CF6) — distinguishes artist mode from hirer's orange
 * at a glance.
 *
 * Data: useHeroData (existing). isLoading shows a 64px skeleton tile so
 * the layout doesn't jump on first paint.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useHeroData from '@/hooks/useHeroData';

function greetingFor(d: Date): string {
    const h = d.getHours();
    if (h < 5) return 'Late Night';
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Tonight';
}

export default function HeroGreetingArtistV2() {
    const { data: user, isLoading } = useHeroData();
    const greeting = useMemo(() => greetingFor(new Date()), []);

    if (isLoading || !user) {
        return <View style={styles.skeleton} accessibilityElementsHidden />;
    }

    const displayName = (user as any).displayName ?? 'Artist';
    const firstName = displayName.split(' ')[0] ?? displayName;
    const initial = (firstName[0] ?? 'A').toUpperCase();

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
            >
                <Text style={styles.avatarInitial}>{initial}</Text>
            </LinearGradient>

            <View style={styles.nameLine}>
                <Text style={styles.greet}>{greeting.toUpperCase()}</Text>
                <Text style={styles.name} numberOfLines={1}>
                    {firstName}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 32,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(243,239,232,0.10)',
    },
    avatarInitial: {
        fontFamily: 'Outfit-Bold',
        fontSize: 16,
        color: '#0A0A0F',
    },
    nameLine: {
        flex: 1,
        gap: 2,
    },
    greet: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.6,
        color: '#6B6878',
    },
    name: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        color: '#F3EFE8',
        letterSpacing: -0.3,
    },
    skeleton: {
        height: 92,
        marginHorizontal: 24,
        marginVertical: 28,
        borderRadius: 16,
        backgroundColor: 'rgba(243,239,232,0.04)',
    },
});
