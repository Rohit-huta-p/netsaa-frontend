import React from 'react';
import { View, Text } from 'react-native';

type SectionAccent = 'main' | 'quiet' | 'none';

interface SectionHeadingProps {
    children: React.ReactNode;
    /** Optional aside on the right of the heading row (e.g. "06 slots"). */
    aside?: React.ReactNode;
    /**
     * Leading accent tick — locked design "V1 Accent Tick" (2026-10-07,
     * see DOCS/04-design/mockups/gig-detail-final.html).
     *   'main'  → brand-orange bar; marks the sections that drive the apply
     *             decision (What you'll do, Who we're looking for, Compensation).
     *   'quiet' → grey bar; a secondary section that still wants a marker.
     *   'none'  → no bar (default). Used for "About the gig".
     */
    accent?: SectionAccent;
}

/**
 * Plan 5 v2 — uppercase tracked section heading used by inline gig
 * detail sections (About, What you'll do, Looking for, Compensation).
 * Matches the mockup's section-title style: 11px Outfit bold, 0.16em
 * tracking, zinc-400 colour, 14px bottom margin. An optional leading
 * accent tick (see `accent`) gives the main sections a touch more weight.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
    children,
    aside,
    accent = 'none',
}) => {
    const tick =
        accent === 'none' ? null : (
            <View
                testID="section-heading-tick"
                className={`w-[3px] h-2.5 rounded-[2px] mr-2.5 ${
                    accent === 'main' ? 'bg-orange-500' : 'bg-zinc-600'
                }`}
            />
        );

    return (
        <View
            className="flex-row items-center mb-3.5"
            testID="section-heading"
        >
            {tick}
            <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                {children}
                {aside ? '  ' : null}
                {aside ? (
                    <Text className="text-[10px] tracking-[0.06em] text-zinc-600 font-medium">
                        {aside}
                    </Text>
                ) : null}
            </Text>
        </View>
    );
};
