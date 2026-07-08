/**
 * DiscoverMatchesStrip — wider horizontal carousel of gigs + events that
 * fit the artist's type and skills.
 *
 * Per DOCS/04-design/mockups/artist-home-v1.html §6 (pivot 2026-05-18 from Hirers,
 * then again to horizontal big cards). Differentiated from the "For you"
 * carousel above:
 *
 *   - For you   → 240px cards, glance-mode, top match%
 *   - Discover  → 300px BIG cards with gradient header band + "why" reason,
 *                 deeper browse, vertical card layout
 *
 * Each card:
 *   ┌────────────────────────────────────────┐
 *   │ ████ gradient header w/ pill + reason  │  ← 76px
 *   │                                        │
 *   │ Title in DM Serif                      │
 *   │ city · date                            │
 *   │                                        │
 *   │ ₹18,000              VIEW →            │
 *   └────────────────────────────────────────┘
 *
 * Data: useDiscoverMatches (stub; backend follow-up tracked in hook).
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import useDiscoverMatches, {
    DiscoverMatchItem,
    DiscoverItemKind,
} from '@/hooks/useDiscoverMatches';

const PURPLE = '#8B5CF6';
const PAPER = '#F3EFE8';
const MUTED = '#6B6878';
const PAPER_DIM = '#B8B1A6';
const ORANGE = '#FF6B35';
const PINK = '#EC4899';
const GREEN = '#22C55E';
const GOLD = '#F59E0B';
const BG_TILE = '#0D0B12';

const CARD_WIDTH = 300;
const HEADER_HEIGHT = 76;

const THEME_COLORS: Record<DiscoverMatchItem['theme'], [string, string]> = {
    orange: ['#FF6B35', '#F59E0B'],
    purple: ['#8B5CF6', '#EC4899'],
    green:  ['#22C55E', '#34D399'],
    pink:   ['#EC4899', '#FB7185'],
};

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
                <View style={styles.stampRow}>
                    <View style={styles.stampLine} />
                    <Text style={styles.stampText}>DISCOVER</Text>
                    <View style={styles.stampLine} />
                </View>
                <Text style={styles.title}>Gigs and events that fit.</Text>
                <Text style={styles.subtitle}>
                    Matched by your artist type and skills.
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 12}
            >
                {items.map((it) => {
                    const pay = formatPay(it.payRupees);
                    return (
                        <Pressable
                            key={it.id}
                            onPress={() => router.push(it.href as any)}
                            style={styles.card}
                        >
                            <LinearGradient
                                colors={THEME_COLORS[it.theme]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardHeader}
                            >
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>
                                        {KIND_LABEL[it.kind]}
                                    </Text>
                                </View>
                                <Text style={styles.reason} numberOfLines={1}>
                                    {it.reason}
                                </Text>
                            </LinearGradient>

                            <View style={styles.body}>
                                <Text style={styles.cardTitle} numberOfLines={2}>
                                    {it.title}
                                </Text>
                                <Text style={styles.meta} numberOfLines={1}>
                                    {it.meta}
                                </Text>

                                <View style={styles.footer}>
                                    <Text
                                        style={[
                                            styles.pay,
                                            pay.tone === 'free' && styles.payFree,
                                        ]}
                                    >
                                        {pay.value}
                                    </Text>
                                    <View style={styles.cta}>
                                        <Text style={styles.ctaText}>VIEW →</Text>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { marginBottom: 38 },

    header: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    stampRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    stampLine: { width: 14, height: 1, backgroundColor: 'rgba(243,239,232,0.14)' },
    stampText: { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.5, color: MUTED },
    title: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        letterSpacing: -0.8,
        color: PAPER,
        marginBottom: 6,
    },
    subtitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontStyle: 'italic',
        fontSize: 12,
        color: MUTED,
    },

    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 6,
        gap: 12,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: BG_TILE,
        borderColor: 'rgba(243,239,232,0.09)',
        borderWidth: 1,
        borderRadius: 18,
        overflow: 'hidden',
    },

    // Gradient header band
    cardHeader: {
        height: HEADER_HEIGHT,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: 'space-between',
    },
    pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(11,10,15,0.30)',
    },
    pillText: {
        fontFamily: 'Outfit-Bold',
        fontSize: 9,
        letterSpacing: 1.2,
        color: PAPER,
    },
    reason: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontStyle: 'italic',
        fontSize: 12,
        color: '#0A0A0F',
    },

    // Body
    body: {
        padding: 16,
        paddingTop: 14,
        gap: 6,
        flex: 1,
    },
    cardTitle: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 19,
        lineHeight: 22,
        letterSpacing: -0.4,
        color: PAPER,
        minHeight: 44,
    },
    meta: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: MUTED,
        marginBottom: 10,
    },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 'auto',
    },
    pay: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 20,
        color: PAPER,
        letterSpacing: -0.3,
        marginRight: 'auto',
    },
    payFree: { color: GREEN, fontSize: 14 },
    cta: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.40)',
        backgroundColor: 'rgba(139,92,246,0.08)',
    },
    ctaText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: PURPLE,
    },
});
