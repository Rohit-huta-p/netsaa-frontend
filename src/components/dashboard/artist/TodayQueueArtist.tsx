/**
 * TodayQueueArtist — daily action queue for the artist home.
 *
 * Per the locked mockup (DOCS/designs/artist-home-v1.html §3) shows up to
 * 5 rows of "things waiting on you", priority-sorted. Each row:
 *
 *   [icon]  title
 *           subtitle              [Reply / Open / Receipt pill]   →
 *
 * Icon color encodes urgency:
 *   - red    → urgent (hirer_reply, deadlines passing)
 *   - gold   → audition_pending
 *   - purple → gig/event starting soon
 *   - green  → payout_settled
 *
 * Hidden entirely when the queue is empty so the home page collapses
 * naturally. Hirer-side has an "all clear" pattern; the artist version
 * keeps the canvas quiet on day-1 instead.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useActionQueueArtist, {
    ArtistActionCategory,
    ArtistActionItem,
} from '@/hooks/useActionQueueArtist';

const PAPER = '#F3EFE8';
const MUTED = '#6B6878';
const RED = '#EF4444';
const GOLD = '#F59E0B';
const PURPLE = '#8B5CF6';
const GREEN = '#22C55E';

interface CategoryStyle {
    bg: string;
    color: string;
    glyph: string;
}

const CATEGORY: Record<ArtistActionCategory, CategoryStyle> = {
    hirer_reply:         { bg: 'rgba(239,68,68,0.10)',  color: RED,    glyph: '!' },
    audition_pending:    { bg: 'rgba(245,158,11,0.10)', color: GOLD,   glyph: '★' },
    gig_starting_soon:   { bg: 'rgba(139,92,246,0.10)', color: PURPLE, glyph: '▶' },
    event_starting_soon: { bg: 'rgba(139,92,246,0.10)', color: PURPLE, glyph: '▶' },
    payout_settled:      { bg: 'rgba(34,197,94,0.10)',  color: GREEN,  glyph: '₹' },
};

const CTA_DEFAULTS: Record<ArtistActionCategory, string> = {
    hirer_reply:         'Reply',
    audition_pending:    'Open',
    gig_starting_soon:   'Open',
    event_starting_soon: 'Open',
    payout_settled:      'Receipt',
};

export default function TodayQueueArtist() {
    const { items, isLoading } = useActionQueueArtist();
    const router = useRouter();

    if (isLoading) {
        return <View style={styles.skeleton} accessibilityElementsHidden />;
    }
    if (items.length === 0) {
        // Day-1 / quiet inbox → render nothing rather than an empty "All clear"
        // tile. Saves vertical space and avoids fake celebration.
        return null;
    }

    return (
        <View style={styles.root}>
            <View style={styles.stampRow}>
                <View style={styles.stampLine} />
                <Text style={styles.stampText}>TODAY</Text>
                <View style={styles.stampLine} />
            </View>
            <Text style={styles.title}>
                {items.length === 1
                    ? 'One thing waiting on you.'
                    : `${items.length} things waiting on you.`}
            </Text>

            <View style={styles.list}>
                {items.map((item) => (
                    <Row key={item.id} item={item} onPress={() => router.push(item.href as any)} />
                ))}
            </View>
        </View>
    );
}

function Row({ item, onPress }: { item: ArtistActionItem; onPress: () => void }) {
    const c = CATEGORY[item.category];
    const cta = item.cta ?? CTA_DEFAULTS[item.category];
    return (
        <Pressable onPress={onPress} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: c.bg }]}>
                <Text style={[styles.iconGlyph, { color: c.color }]}>{c.glyph}</Text>
            </View>
            <View style={styles.text}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{item.subtitle}</Text>
            </View>
            <View style={[styles.cta, { borderColor: 'rgba(139,92,246,0.30)' }]}>
                <Text style={styles.ctaText}>{cta.toUpperCase()}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: 24,
        marginBottom: 38,
    },
    stampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    stampLine: {
        width: 14,
        height: 1,
        backgroundColor: 'rgba(243,239,232,0.14)',
    },
    stampText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: MUTED,
    },
    title: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 28,
        letterSpacing: -0.8,
        color: PAPER,
        lineHeight: 30,
        marginBottom: 14,
    },

    list: {
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(243,239,232,0.05)',
    },
    icon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconGlyph: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 14,
        fontWeight: '700',
    },
    text: {
        flex: 1,
        minWidth: 0,
    },
    rowTitle: {
        fontFamily: 'Outfit-Regular',
        fontSize: 14,
        color: PAPER,
        marginBottom: 2,
    },
    rowSub: {
        fontFamily: 'Outfit-Regular',
        fontSize: 11,
        color: MUTED,
    },
    cta: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    ctaText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 10,
        letterSpacing: 1.5,
        color: PURPLE,
    },
    skeleton: {
        height: 220,
        marginHorizontal: 24,
        marginBottom: 38,
        borderRadius: 16,
        backgroundColor: 'rgba(243,239,232,0.04)',
    },
});
