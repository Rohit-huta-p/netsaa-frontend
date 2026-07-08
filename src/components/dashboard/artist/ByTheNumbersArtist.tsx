/**
 * ByTheNumbersArtist — 5-tile KPI grid on artist home.
 *
 * Layout per locked mockup (DOCS/04-design/mockups/artist-home-v1.html):
 *   Row 1: [ EARNED THIS MONTH · span-2 + sparkline ]  [ PROFILE VIEWS ]
 *   Row 2: [ APPLICATIONS ]  [ DELIVERED ]  [ RATING ]
 *
 * Editorial typography: SpaceMono labels, DM Serif Display values,
 * Outfit sub-text. Earnings tile uses purple accent (matches artist
 * mode color).
 *
 * Empty-state behavior — when all numbers are 0, we still render the grid
 * with "—" placeholders. Day-1 artists see scaffolding instead of a
 * disappearing section.
 *
 * Data: useArtistNumbers. Sparkline degrades gracefully when no
 * earnings data exists yet.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useArtistNumbers from '@/hooks/useArtistNumbers';

const PURPLE = '#8B5CF6';
const PAPER = '#F3EFE8';
const PAPER_DIM = '#B8B1A6';
const MUTED = '#6B6878';

function formatIN(n: number): string {
    return n.toLocaleString('en-IN');
}

function formatRupeesCompact(n: number): string {
    if (n <= 0) return '—';
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(n % 10_000_000 === 0 ? 0 : 1)}Cr`;
    if (n >= 100_000) return `${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)}L`;
    return formatIN(n);
}

export default function ByTheNumbersArtist() {
    const { data, isLoading } = useArtistNumbers();

    if (isLoading) {
        return <View style={styles.skeleton} accessibilityElementsHidden />;
    }

    const earnedDisplay = formatRupeesCompact(data.earnedThisMonth);
    const profileDelta =
        data.profileViewsDelta > 0
            ? `+${data.profileViewsDelta} this week`
            : data.profileViews > 0
                ? 'all-time'
                : 'no views yet';
    const earnedSub =
        data.delivered > 0
            ? `${data.delivered} gigs delivered${data.pendingPayouts > 0 ? ` · ${data.pendingPayouts} pending payout` : ''}`
            : 'No gigs delivered yet';
    const applicationsSub =
        data.applicationsActive > 0
            ? `${data.applicationsActive} active`
            : data.applicationsTotal > 0
                ? 'all-time'
                : 'none yet';
    const ratingSub =
        data.reviewCount > 0
            ? `${data.reviewCount} review${data.reviewCount === 1 ? '' : 's'}`
            : 'no reviews yet';

    return (
        <View style={styles.root}>
            {/* Stamp header */}
            <View style={styles.stampRow}>
                <View style={styles.stampLine} />
                <Text style={styles.stampText}>BY THE NUMBERS</Text>
                <View style={styles.stampLine} />
            </View>

            {/* Row 1 */}
            <View style={styles.row}>
                <View style={[styles.tile, styles.tileSpan2, styles.tileAccent]}>
                    <Text style={styles.label}>EARNED THIS MONTH</Text>
                    <Text style={styles.valueAccent}>
                        <Text style={styles.currency}>₹</Text>{earnedDisplay}
                    </Text>
                    <Text style={styles.sub}>{earnedSub}</Text>
                    <Sparkline data={data.sparkline} />
                </View>

                <View style={styles.tile}>
                    <Text style={styles.label}>PROFILE VIEWS</Text>
                    <Text style={styles.value}>
                        {data.profileViews > 0 ? formatIN(data.profileViews) : '—'}
                    </Text>
                    <Text style={styles.sub}>{profileDelta}</Text>
                </View>
            </View>

            {/* Row 2 */}
            <View style={styles.row}>
                <View style={styles.tile}>
                    <Text style={styles.label}>APPLICATIONS</Text>
                    <Text style={styles.value}>
                        {data.applicationsTotal > 0 ? data.applicationsTotal : '—'}
                    </Text>
                    <Text style={styles.sub}>{applicationsSub}</Text>
                </View>

                <View style={styles.tile}>
                    <Text style={styles.label}>DELIVERED</Text>
                    <Text style={styles.value}>{data.delivered > 0 ? data.delivered : '—'}</Text>
                    <Text style={styles.sub}>{data.delivered > 0 ? 'all-time' : 'none yet'}</Text>
                </View>

                <View style={styles.tile}>
                    <Text style={styles.label}>RATING</Text>
                    <Text style={styles.value}>{data.rating > 0 ? data.rating.toFixed(1) : '—'}</Text>
                    <Text style={styles.sub}>{ratingSub}</Text>
                </View>
            </View>
        </View>
    );
}

function Sparkline({ data }: { data: number[] }) {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 1);
    return (
        <View style={styles.sparkline}>
            {data.map((v, i) => (
                <View
                    key={i}
                    style={[
                        styles.sparkBar,
                        { height: `${Math.max(6, (v / max) * 100)}%` },
                    ]}
                />
            ))}
        </View>
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
        marginBottom: 14,
    },
    stampLine: {
        flex: 0,
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

    row: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    tile: {
        flex: 1,
        backgroundColor: '#11111A',
        borderColor: 'rgba(243,239,232,0.09)',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 4,
    },
    tileSpan2: {
        flex: 2,
    },
    tileAccent: {
        backgroundColor: '#11111A',
        borderColor: 'rgba(139,92,246,0.20)',
        // Light tint overlay achieved via the value color; the tile itself
        // keeps the same dark fill so the grid stays visually consistent.
    },

    label: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9,
        letterSpacing: 1.5,
        color: MUTED,
    },
    value: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 26,
        letterSpacing: -0.8,
        color: PAPER,
        lineHeight: 28,
    },
    valueAccent: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 26,
        letterSpacing: -0.8,
        color: PURPLE,
        lineHeight: 28,
    },
    currency: {
        fontSize: 14,
        color: PAPER_DIM,
    },
    sub: {
        fontSize: 10,
        fontFamily: 'Outfit-Regular',
        color: MUTED,
    },

    sparkline: {
        marginTop: 6,
        height: 18,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
    },
    sparkBar: {
        flex: 1,
        backgroundColor: PURPLE,
        opacity: 0.6,
        borderRadius: 1,
    },

    skeleton: {
        height: 220,
        marginHorizontal: 24,
        marginBottom: 38,
        borderRadius: 16,
        backgroundColor: 'rgba(243,239,232,0.04)',
    },
});
