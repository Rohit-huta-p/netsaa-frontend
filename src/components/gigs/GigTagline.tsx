import React from 'react';
import { Text } from 'react-native';

interface GigTaglineProps {
    artistTypes?: string[];
    tags?: string[];
    city?: string;
    startDate?: string | Date;
}

/**
 * Plan 5 v2 — small subtitle line directly under the gig title.
 * Composes a single sentence from artist types, tags, city, and start
 * date — separated by middle dots. Falls back gracefully when fields
 * are missing.
 *
 * Example:  "3-song fusion · Bharatanatyam & Bollywood · Pune · May 12"
 */
function shortDate(d?: string | Date): string | null {
    if (!d) return null;
    const dt = new Date(d);
    if (!isFinite(dt.getTime())) return null;
    return dt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
    });
}

function joinAnd(arr: string[]): string {
    if (arr.length <= 1) return arr.join('');
    if (arr.length === 2) return `${arr[0]} & ${arr[1]}`;
    return `${arr.slice(0, -1).join(', ')} & ${arr[arr.length - 1]}`;
}

export const GigTagline: React.FC<GigTaglineProps> = ({
    artistTypes,
    tags,
    city,
    startDate,
}) => {
    const segments: string[] = [];

    // First segment: top tag (e.g. "3-song fusion") if present
    if (Array.isArray(tags) && tags.length > 0) {
        segments.push(tags[0]);
    }

    // Second: artist types joined naturally (max 3 to keep line scannable)
    if (Array.isArray(artistTypes) && artistTypes.length > 0) {
        segments.push(joinAnd(artistTypes.slice(0, 3)));
    }

    // Third: city
    if (city) segments.push(city);

    // Fourth: short date
    const d = shortDate(startDate);
    if (d) segments.push(d);

    if (segments.length === 0) return null;

    return (
        <Text
            className="text-[13px] text-zinc-400 leading-snug mb-4"
            testID="gig-tagline"
        >
            {segments.join(' · ')}
        </Text>
    );
};
