import React from 'react';
import { Text } from 'react-native';

interface SectionHeadingProps {
    children: React.ReactNode;
    /** Optional aside on the right of the heading row (e.g. "06 slots"). */
    aside?: React.ReactNode;
}

/**
 * Plan 5 v2 — uppercase tracked section heading used by inline gig
 * detail sections (About, What you'll do, Looking for, Compensation).
 * Matches the mockup's section-title style: 11px Outfit bold, 0.16em
 * tracking, white-1 colour, 14px bottom margin.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
    children,
    aside,
}) => {
    if (aside) {
        return (
            <Text
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-3.5"
                testID="section-heading"
            >
                {children}
                {'  '}
                <Text className="text-[10px] tracking-[0.06em] text-zinc-600 font-medium">
                    {aside}
                </Text>
            </Text>
        );
    }
    return (
        <Text
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-3.5"
            testID="section-heading"
        >
            {children}
        </Text>
    );
};
