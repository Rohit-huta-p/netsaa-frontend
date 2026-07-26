import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { describeDistance, type Coords } from '@/utils/distance';

interface QuickMetaRowProps {
    location?: {
        venueName?: string;
        city?: string;
        state?: string;
        /** Plan 5 — geocoded venue coords (server-side). */
        geo?: Coords;
    };
    schedule?: {
        startDate?: string;
        endDate?: string;
        timeCommitment?: string;
    };
    /** Total slots/applicants the hirer wants to fill (gig.maxApplications). */
    slots?: number;
    /**
     * Plan 5 — viewer's current coords (e.g. expo-location result). When
     * present together with location.geo, renders an exact distance line.
     */
    viewerCoords?: Coords | null;
    /**
     * Plan 5 — viewer's stored city string from User.location. Used as a
     * soft fallback ("in your city") when precise coords aren't available.
     */
    viewerCity?: string | null;
}

/**
 * Plan 5 — gig detail v2 editorial stat line.
 *
 * Replaces the old 2-column icon+text row with a 3-column hairlined band:
 * When · Where · Slots. No card chrome. Tick marks at the corners. Each
 * cell has 3 levels: tiny mono label / Outfit value / tiny detail line.
 *
 * Distance still appended to the Where sub-line (via describeDistance).
 */
function formatDateShort(d?: string): string {
    if (!d) return 'TBD';
    const dt = new Date(d);
    if (!isFinite(dt.getTime())) return 'TBD';
    // "Tue, May 12"
    return dt.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatTimeShort(d?: string): string | null {
    if (!d) return null;
    const dt = new Date(d);
    if (!isFinite(dt.getTime())) return null;
    return dt.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

export const QuickMetaRow: React.FC<QuickMetaRowProps> = ({
    location,
    schedule,
    slots,
    viewerCoords,
    viewerCity,
}) => {
    const dateLabel = formatDateShort(schedule?.startDate);
    const time = formatTimeShort(schedule?.startDate);
    const duration = schedule?.timeCommitment;

    const venueName =
        location?.venueName || location?.city || 'TBD';
    const cityLine = location?.city
        ? `${location.city}${location.state ? `, ${location.state}` : ''}`
        : '';

    const distance = describeDistance(
        location ? { geo: location.geo, city: location.city } : undefined,
        viewerCoords ?? undefined,
        viewerCity ?? undefined
    );

    const whereSub = distance
        ? cityLine
            ? `${location?.city || cityLine} · `
            : ''
        : cityLine;

    const slotsValue =
        typeof slots === 'number' && slots > 0
            ? `${slots} ${slots === 1 ? 'artist' : 'artists'}`
            : null;

    const whenSub = [time, duration].filter(Boolean).join('  ·  ');
    const whereSubText = distance ? `${whereSub}${distance}` : cityLine;

    // Editorial accent-rail: When · Where · Slots stacked vertically (one below
    // the other) on every width — the old 3-column strip was cramped on mobile.
    return (
        <View className="mb-6" testID="quick-meta-row">
            <View style={styles.rail}>
                {/* WHEN */}
                <View style={styles.row}>
                    <Text style={styles.label}>When</Text>
                    <Text style={styles.value}>
                        {dateLabel}
                        {whenSub ? <Text style={styles.sub}>{`  ·  ${whenSub}`}</Text> : null}
                    </Text>
                </View>

                {/* WHERE */}
                <View style={styles.row}>
                    <Text style={styles.label}>Where</Text>
                    <Text style={styles.value} numberOfLines={1}>
                        {venueName}
                        {whereSubText ? (
                            <Text style={styles.sub}>
                                {'  ·  '}
                                <Text testID="quickmeta-location-sub">{whereSubText}</Text>
                            </Text>
                        ) : null}
                    </Text>
                </View>

                {/* SLOTS */}
                <View style={styles.row}>
                    <Text style={styles.label}>Slots</Text>
                    <Text style={styles.value}>
                        {slotsValue || 'Open'}
                        <Text style={styles.sub}>{'  ·  per artist'}</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    rail: {
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(255,107,53,0.4)',
        paddingLeft: 16,
    },
    row: { paddingVertical: 11 },
    label: {
        fontFamily: 'SpaceMono-Bold',
        fontSize: 9,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: '#8C857B',
        marginBottom: 4,
    },
    value: {
        fontFamily: 'DMSerifDisplay_400Regular',
        fontSize: 19,
        lineHeight: 22,
        color: '#F0ECE6',
    },
    sub: {
        fontFamily: 'Outfit-Regular',
        fontSize: 12,
        color: '#8C857B',
    },
});
