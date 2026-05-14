import React from 'react';
import { View, Text } from 'react-native';
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

    return (
        <View
            className="flex-row mb-6 border-y border-white/10 py-3"
            testID="quick-meta-row"
        >
            {/* WHEN */}
            <View className="flex-1 pr-3 border-r border-white/5">
                <Text className="text-[9px] font-bold uppercase tracking-[0.20em] text-zinc-500 mb-1">
                    When
                </Text>
                <Text className="text-[14px] font-semibold text-white tracking-tight">
                    {dateLabel}
                </Text>
                <Text className="text-[10px] text-zinc-500 mt-0.5">
                    {time ? (
                        <>
                            {time}
                            {duration ? (
                                <>
                                    {' · '}
                                    <Text className="text-zinc-300 font-semibold">
                                        {duration}
                                    </Text>
                                </>
                            ) : null}
                        </>
                    ) : duration ? (
                        <Text className="text-zinc-300 font-semibold">
                            {duration}
                        </Text>
                    ) : null}
                </Text>
            </View>

            {/* WHERE */}
            <View className="flex-1 px-3 border-r border-white/5">
                <Text className="text-[9px] font-bold uppercase tracking-[0.20em] text-zinc-500 mb-1">
                    Where
                </Text>
                <Text
                    className="text-[14px] font-semibold text-white tracking-tight"
                    numberOfLines={1}
                >
                    {venueName}
                </Text>
                <Text
                    className="text-[10px] text-zinc-500 mt-0.5"
                    testID="quickmeta-location-sub"
                    numberOfLines={1}
                >
                    {distance ? (
                        <>
                            {whereSub}
                            <Text className="text-emerald-400 font-semibold">
                                {distance}
                            </Text>
                        </>
                    ) : (
                        cityLine
                    )}
                </Text>
            </View>

            {/* SLOTS */}
            <View className="flex-1 pl-3">
                <Text className="text-[9px] font-bold uppercase tracking-[0.20em] text-zinc-500 mb-1">
                    Slots
                </Text>
                <Text className="text-[14px] font-semibold text-white tracking-tight">
                    {slotsValue || 'Open'}
                </Text>
                <Text className="text-[10px] text-zinc-500 mt-0.5">
                    per artist
                </Text>
            </View>
        </View>
    );
};
