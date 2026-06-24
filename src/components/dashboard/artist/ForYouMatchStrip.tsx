/**
 * ForYouMatchStrip — horizontal carousel of personalized matches.
 *
 * Per DOCS/designs/artist-home-v1.html §5: mixed feed of gigs + events
 * with type-tag pills (match% for gigs, WORKSHOP / AUDITION etc. for
 * events). 240px card width with scroll-snap.
 *
 * Data: useArtistMatches (currently stubbed — see hook for backend
 * follow-up TODO).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useArtistMatches, { ArtistMatchItem, MatchKind } from '@/hooks/useArtistMatches';

const PURPLE = '#8B5CF6';
const PAPER = '#F3EFE8';
const MUTED = '#6B6878';
const PAPER_DIM = '#B8B1A6';
const ORANGE = '#FF6B35';
const PINK = '#EC4899';
const GREEN = '#22C55E';

const KIND_PILL: Record<MatchKind, { label: (m: ArtistMatchItem) => string; bg: string; color: string }> = {
    gig:       { label: (m) => `GIG · ${m.matchPct ?? '—'}% MATCH`, bg: 'rgba(255,107,53,0.12)', color: ORANGE },
    workshop:  { label: () => 'EVENT · WORKSHOP', bg: 'rgba(236,72,153,0.10)', color: PINK },
    audition:  { label: () => 'EVENT · AUDITION', bg: 'rgba(236,72,153,0.10)', color: PINK },
    event:     { label: () => 'EVENT', bg: 'rgba(139,92,246,0.10)', color: PURPLE },
};

function fmtRupees(n: number | null): { value: string; tone: 'paid' | 'free' } {
    if (n == null || n <= 0) return { value: 'Free RSVP', tone: 'free' };
    if (n >= 100_000) return { value: `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`, tone: 'paid' };
    if (n >= 1000) return { value: `₹${n.toLocaleString('en-IN')}`, tone: 'paid' };
    return { value: `₹${n} fee`, tone: 'paid' };
}

export default function ForYouMatchStrip() {
    const { items, isLoading } = useArtistMatches();
    const router = useRouter();

    if (isLoading) {
        return <View style={styles.skeleton} accessibilityElementsHidden />;
    }
    if (items.length === 0) return null;

    return (
        <View style={styles.root}>
            <View style={styles.headerRow}>
                <View>
                    <View style={styles.stampRow}>
                        <View style={styles.stampLine} />
                        <Text style={styles.stampText}>FOR YOU</Text>
                        <View style={styles.stampLine} />
                    </View>
                    <Text style={styles.title}>Matched on your skills.</Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={250}
            >
                {items.map((it) => {
                    const pill = KIND_PILL[it.kind];
                    const pay = fmtRupees(it.payRupees);
                    return (
                        <Pressable
                            key={it.id}
                            onPress={() => router.push(it.href as any)}
                            style={styles.card}
                        >
                            <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                                <Text style={[styles.pillText, { color: pill.color }]}>
                                    {pill.label(it)}
                                </Text>
                            </View>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {it.title}
                            </Text>
                            <Text style={styles.cardMeta} numberOfLines={1}>
                                {it.meta}
                            </Text>
                            <Text
                                style={[
                                    styles.cardPay,
                                    pay.tone === 'free' && styles.cardPayFree,
                                ]}
                            >
                                {pay.value}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { marginBottom: 38 },
    headerRow: { paddingHorizontal: 24, marginBottom: 14 },
    stampRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    stampLine: { width: 14, height: 1, backgroundColor: 'rgba(243,239,232,0.14)' },
    stampText: { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.5, color: MUTED },
    title: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        letterSpacing: -0.8,
        color: PAPER,
    },

    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 4,
        gap: 10,
    },
    card: {
        width: 240,
        backgroundColor: '#0D0B12',
        borderColor: 'rgba(243,239,232,0.09)',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },
    pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
        marginBottom: 10,
    },
    pillText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 9,
        letterSpacing: 1,
    },
    cardTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 16,
        lineHeight: 19,
        letterSpacing: -0.3,
        color: PAPER,
        minHeight: 38,
        marginBottom: 6,
    },
    cardMeta: {
        fontSize: 11,
        fontFamily: 'Outfit-Regular',
        color: MUTED,
        marginBottom: 14,
    },
    cardPay: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        color: PAPER,
        letterSpacing: -0.3,
        marginTop: 'auto',
    },
    cardPayFree: { color: GREEN, fontSize: 13 },

    skeleton: {
        height: 220,
        marginHorizontal: 24,
        marginBottom: 38,
        borderRadius: 16,
        backgroundColor: 'rgba(243,239,232,0.04)',
    },
});
