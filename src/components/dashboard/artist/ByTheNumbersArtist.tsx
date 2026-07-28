/**
 * ByTheNumbersArtist — Earnings + Profile Views as a v3 gridlined stat grid.
 *
 * Redesign per DOCS/04-design/mockups/artist-home-redesign.html (Column A),
 * on Design System v3 §8 "gridlined stat grid": a bordered rounded frame whose
 * background (rgba(243,239,232,0.10)) shows through 1px gaps as hairline
 * gridlines between dark #11111A tiles — a dashboard, not a pair of cards.
 *
 * Color = signal (v3 §2.4): money reads orange #FF6B35 (the one accent); reach
 * reads purple #8B5CF6 (the visibility semantic). Warm cream ink, mono labels,
 * DM-Serif values. Empty states render "—" (honest data, v3 P8).
 *
 * Data: useArtistNumbers (earnedThisMonth, sparkline, pendingPayouts,
 * profileViews, profileViewsDelta).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import useArtistNumbers from '@/hooks/useArtistNumbers';

const ORANGE = '#FF6B35';
const PURPLE = '#8B5CF6';
const T2 = '#8C857B';
const T3 = '#57524C';

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
        return <ByTheNumbersSkeleton />;
    }

    const hasEarnings = data.earnedThisMonth > 0;
    const earnedDisplay = formatRupeesCompact(data.earnedThisMonth);
    const earnFoot =
        data.pendingPayouts > 0
            ? `${data.pendingPayouts} PENDING PAYOUT${data.pendingPayouts === 1 ? '' : 'S'}`
            : hasEarnings
                ? 'ALL SETTLED'
                : 'NO EARNINGS YET';

    const hasViews = data.profileViews > 0;
    const viewsDisplay = hasViews ? formatIN(data.profileViews) : '—';
    const hasDelta = data.profileViewsDelta > 0;

    return (
        <View style={styles.root}>
            <View style={styles.grid}>
                {/* ── Earnings ── */}
                <View style={styles.tile}>
                    <Text style={styles.label}>EARNED · THIS MONTH</Text>
                    <Text style={[styles.value, styles.money]} numberOfLines={1} adjustsFontSizeToFit>
                        {hasEarnings ? <Text style={styles.currency}>₹</Text> : null}
                        {earnedDisplay}
                    </Text>
                    <Sparkline data={data.sparkline} />
                    <Text style={styles.foot}>{earnFoot}</Text>
                </View>

                {/* ── Profile views ── */}
                <View style={styles.tile}>
                    <Text style={styles.label}>PROFILE VIEWS</Text>
                    <Text style={[styles.value, styles.views]} numberOfLines={1} adjustsFontSizeToFit>
                        {viewsDisplay}
                    </Text>
                    <View style={styles.viewsFoot}>
                        {hasDelta ? (
                            <View style={styles.deltaPill}>
                                <Text style={styles.deltaText}>▲ {data.profileViewsDelta} this week</Text>
                            </View>
                        ) : (
                            <Text style={styles.foot}>{hasViews ? 'ALL-TIME' : 'NO VIEWS YET'}</Text>
                        )}
                    </View>
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
                    style={[styles.sparkBar, { height: `${Math.max(6, (v / max) * 100)}%` }]}
                />
            ))}
        </View>
    );
}

/**
 * ByTheNumbersSkeleton — loading placeholder that mirrors the stat grid tile-for-
 * tile (same frame, gridlines, positions) so there's zero layout shift on load.
 * The static labels (EARNED · THIS MONTH, PROFILE VIEWS) render for real — only
 * the data-dependent slots (value, sparkline, foot) pulse. Blocks breathe on a
 * single shared opacity loop; each value slot carries a faint accent tint so the
 * tile's identity — orange money · purple reach — is already legible before the
 * numbers arrive. Calm pulse, not a shimmer sweep: on-brand.
 */
const SPARK_STUB = [0.4, 0.68, 0.5, 0.92, 0.58, 0.8, 0.54];

function ByTheNumbersSkeleton() {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 850,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 850,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

    return (
        <View
            style={styles.root}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View style={styles.grid}>
                {/* Earnings */}
                <View style={styles.tile}>
                    <Text style={styles.label}>EARNED · THIS MONTH</Text>
                    <Animated.View style={[styles.skBlock, styles.skValue, styles.skValueMoney, { opacity }]} />
                    <View style={styles.sparkline}>
                        {SPARK_STUB.map((h, i) => (
                            <Animated.View
                                key={i}
                                style={[styles.skSpark, { opacity, height: `${h * 100}%` }]}
                            />
                        ))}
                    </View>
                    <View style={styles.skFootRow}>
                        <Animated.View style={[styles.skBlock, styles.skFoot, { opacity }]} />
                    </View>
                </View>

                {/* Profile views */}
                <View style={styles.tile}>
                    <Text style={styles.label}>PROFILE VIEWS</Text>
                    <Animated.View style={[styles.skBlock, styles.skValue, styles.skValueViews, { opacity }]} />
                    <View style={styles.viewsFoot}>
                        <Animated.View style={[styles.skBlock, styles.skPill, { opacity }]} />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: 20,
        marginTop: 4,
        marginBottom: 6,
    },
    // Gridlined stat grid (v3 §8): frame bg shows through 1px gaps as gridlines.
    grid: {
        flexDirection: 'row',
        gap: 1,
        backgroundColor: 'rgba(243,239,232,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        borderRadius: 14,
        overflow: 'hidden',
    },
    tile: {
        flex: 1,
        minHeight: 132,
        backgroundColor: '#11111A',
        paddingVertical: 15,
        paddingHorizontal: 14,
    },
    label: {
        fontFamily: 'SpaceMono-Bold',
        fontSize: 9,
        letterSpacing: 1.6,
        textTransform: 'uppercase',
        color: T3,
    },
    value: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 32,
        letterSpacing: -1,
        lineHeight: 34,
        marginTop: 11,
    },
    money: { color: ORANGE },
    views: { color: PURPLE },
    currency: { fontSize: 17, color: T2 },

    sparkline: {
        marginTop: 12,
        height: 22,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
    },
    sparkBar: {
        flex: 1,
        backgroundColor: ORANGE,
        opacity: 0.8,
        borderRadius: 2,
    },

    foot: {
        marginTop: 'auto',
        paddingTop: 11,
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9,
        letterSpacing: 0.4,
        color: T3,
    },
    viewsFoot: { marginTop: 'auto', paddingTop: 11, flexDirection: 'row' },
    deltaPill: {
        backgroundColor: 'rgba(139,92,246,0.11)',
        borderWidth: 1,
        borderColor: 'rgba(139,92,246,0.22)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    deltaText: {
        fontFamily: 'SpaceMono-Regular',
        fontSize: 9.5,
        color: PURPLE,
    },

    // ── Skeleton (mirrors the tiles above; blocks share one breathing opacity) ──
    skBlock: {
        backgroundColor: 'rgba(240,236,230,0.09)',
        borderRadius: 6,
    },
    skValue: { height: 30, borderRadius: 7, marginTop: 11 },
    skValueMoney: { width: 104, backgroundColor: 'rgba(255,107,53,0.16)' },
    skValueViews: { width: 68, backgroundColor: 'rgba(139,92,246,0.16)' },
    skSpark: {
        flex: 1,
        backgroundColor: 'rgba(255,107,53,0.22)',
        borderRadius: 2,
    },
    skFootRow: { marginTop: 'auto' },
    skFoot: { width: 82, height: 9, borderRadius: 3, marginTop: 11 },
    skPill: { width: 116, height: 20, borderRadius: 999, marginTop: 11 },
});
