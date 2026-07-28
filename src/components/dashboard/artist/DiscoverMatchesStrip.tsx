/**
 * DiscoverMatchesStrip — horizontal carousel of gigs + events that fit the
 * artist's type and skills.
 *
 * Design System v3 (DOCS/04-design/mockups/artist-home-redesign.html): an
 * eyebrow-labelled section over calm surface cards — no gradient header bands,
 * no dark-on-dark camouflage. Each card:
 *
 *   ┌────────────────────────────────┐
 *   │ GIG                 92% MATCH  │  ← kind (mono) · why (orange mono)
 *   │ Title in DM Serif              │
 *   │ city · date                    │
 *   │ ────────────────────────────── │
 *   │ ₹18,000              VIEW →    │  ← pay (cream) · orange link
 *   └────────────────────────────────┘
 *
 * Color = signal (v3): orange is the one accent; reach/visibility stays purple
 * elsewhere. Data: useDiscoverMatches (stub; backend follow-up tracked in hook).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useDiscoverMatches, {
    DiscoverItemKind,
} from '@/hooks/useDiscoverMatches';

const PAPER = '#F0ECE6';
const MUTED = '#8C857B';
const PAPER_DIM = '#C8C0B5';
const ORANGE = '#FF6B35';
const GREEN = '#22C55E';
const T3 = '#57524C';

const CARD_WIDTH = 232;

const KIND_LABEL: Record<DiscoverItemKind, string> = {
    gig:      'GIG',
    event:    'EVENT',
    workshop: 'WORKSHOP',
    audition: 'AUDITION',
};

function formatPay(n: number | null): { value: string; tone: 'paid' | 'free' } {
    if (n == null || n <= 0) return { value: 'Free', tone: 'free' };
    if (n >= 100_000) return { value: `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`, tone: 'paid' };
    if (n >= 1000) return { value: `₹${n.toLocaleString('en-IN')}`, tone: 'paid' };
    return { value: `₹${n}`, tone: 'paid' };
}

export default function DiscoverMatchesStrip() {
    const { items, isLoading } = useDiscoverMatches();
    const router = useRouter();

    if (isLoading) return null;
    if (items.length === 0) return null;

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>DISCOVER</Text>
                <Text style={styles.aside}>gigs + events · near you</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 10}
            >
                {items.map((it) => {
                    const pay = formatPay(it.payRupees);
                    return (
                        <Pressable
                            key={it.id}
                            onPress={() => router.push(it.href as any)}
                            style={styles.card}
                        >
                            <View style={styles.cardTop}>
                                <Text style={styles.kind}>{KIND_LABEL[it.kind]}</Text>
                                <Text style={styles.why} numberOfLines={1}>
                                    {it.reason}
                                </Text>
                            </View>

                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {it.title}
                            </Text>
                            <Text style={styles.meta} numberOfLines={1}>
                                {it.meta}
                            </Text>

                            <View style={styles.footer}>
                                <Text
                                    style={[styles.pay, pay.tone === 'free' && styles.payFree]}
                                >
                                    {pay.value}
                                </Text>
                                <Text style={styles.ctaText}>VIEW →</Text>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        marginTop: 10,
        marginBottom: 6, // Discover mb 6 + footer pt 30 ≈ 36px, matching the section rhythm
    },

    // v3 eyebrow header (matches the other home sections).
    header: {
        paddingHorizontal: 20,
        marginTop: 26,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    eyebrow: {
        fontFamily: 'Outfit-Bold',
        fontSize: 11,
        letterSpacing: 1.7,
        textTransform: 'uppercase',
        color: PAPER_DIM,
    },
    aside: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 0.6,
        color: T3,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 6,
        gap: 10,
    },

    // Calm v3 surface card (white-alpha fill + hairline — lifts off the canvas).
    card: {
        width: CARD_WIDTH,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 11,
    },
    kind: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 8.5,
        letterSpacing: 1,
        color: T3,
    },
    why: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 8.5,
        letterSpacing: 0.4,
        color: ORANGE,
        flexShrink: 1,
        marginLeft: 8,
        textAlign: 'right',
    },
    cardTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 18,
        lineHeight: 21,
        letterSpacing: -0.4,
        color: PAPER,
        minHeight: 42,
    },
    meta: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: MUTED,
        marginTop: 6,
    },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
    },
    pay: {
        fontFamily: 'Outfit-Bold',
        fontSize: 13,
        color: PAPER,
    },
    payFree: { color: GREEN },
    ctaText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9,
        letterSpacing: 1,
        color: ORANGE,
    },
});
