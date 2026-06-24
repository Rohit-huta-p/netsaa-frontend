// src/components/gigs/TalentCriteriaInline.tsx
//
// Apr 30 redesign — non-card Talent Criteria block for the artist-side gig
// page. Replaces the OrganizerTrustCard slot AND the standalone TalentTab.
// Original TalentTab.tsx is preserved for fast revert if we change our mind.
//
// Layout style: ICONIFIED ROWS (variant: compact two-line; group divider; semantic
// color icons).
//   • Each fact is its own row: 16px Lucide icon · uppercase label · value.
//   • No card background, no border — just rows on the page.
//   • Two semantic groups: Role (blue icons) + Physical (purple icons),
//     separated by a hairline divider so the page doesn't feel like a
//     uniform list.
//   • Empty fields render nothing — the section auto-collapses to whatever
//     the gig actually has.
//
// Why these choices:
//   • Lucide is already used everywhere in NETSA, so the icons feel native.
//   • Group color mirrors the old SectionCard accent so returning users
//     keep their muscle memory.
//   • Compact two-line per row beats single-line right-aligned for mobile
//     widths where long values like "Bharatanatyam, Kathak, Kuchipudi"
//     would otherwise wrap awkwardly.
//   • Hairline divider between groups (not a section header) keeps the
//     surface quiet — matches the Aditi-class craft bar referenced in
//     CLAUDE.md design direction.

import React from 'react';
import { View, Text } from 'react-native';
import {
    Drama,
    Award,
    Sparkles,
    User as UserIcon,
    Calendar,
    Ruler,
    FileText,
} from 'lucide-react-native';

const ROLE_COLOR = '#3B82F6';
const PHYSICAL_COLOR = '#8B5CF6';
const LABEL_COLOR = '#71717A';
const VALUE_COLOR = '#F0ECE6';
const SUBTLE_BORDER = 'rgba(255,255,255,0.05)';

interface TalentCriteriaInlineProps {
    gig: any;
}

/**
 * Single fact row. Icon column is fixed-width so labels + values align in
 * a clean second column even with optional fields hidden between them.
 */
function FactRow({
    Icon,
    iconColor,
    label,
    children,
}: {
    Icon: any;
    iconColor: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 14,
                marginBottom: 14,
            }}
        >
            <View style={{ width: 18, paddingTop: 2 }}>
                <Icon size={16} color={iconColor} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        color: LABEL_COLOR,
                        fontSize: 10,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        fontFamily: 'Outfit-SemiBold',
                        marginBottom: 4,
                    }}
                >
                    {label}
                </Text>
                {typeof children === 'string' ? (
                    <Text
                        style={{
                            color: VALUE_COLOR,
                            fontSize: 14,
                            fontFamily: 'Outfit-Medium',
                            lineHeight: 20,
                        }}
                    >
                        {children}
                    </Text>
                ) : (
                    children
                )}
            </View>
        </View>
    );
}

export const TalentCriteriaInline: React.FC<TalentCriteriaInlineProps> = ({ gig }) => {
    const skills: string[] = Array.isArray(gig.requiredSkills) ? gig.requiredSkills : [];
    const hasGender = !!gig.genderPreference && gig.genderPreference !== 'any';
    const hasAge = !!(gig.ageRange?.min || gig.ageRange?.max);
    const heightMale = gig.heightRequirements?.male;
    const heightFemale = gig.heightRequirements?.female;
    const hasHeight = !!(heightMale || heightFemale);
    const hasNotes = !!gig.physicalRequirements;

    const hasPhysical = hasGender || hasAge || hasHeight || hasNotes;

    return (
        <View style={{ marginBottom: 24 }}>
            {/* Section header — uppercase tracked label matching the rest of
                the artist-side gig page (replaces the old TRACK RECORD style). */}
            <Text
                style={{
                    color: LABEL_COLOR,
                    fontFamily: 'Outfit-Black',
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    marginBottom: 16,
                }}
            >
                Talent Criteria
            </Text>

            {/* ROLE GROUP — blue icons */}
            <FactRow Icon={Drama} iconColor={ROLE_COLOR} label="Artist type">
                {(gig.artistTypes && gig.artistTypes.length > 0)
                    ? gig.artistTypes.join(', ')
                    : 'Not specified'}
            </FactRow>
            <FactRow Icon={Award} iconColor={ROLE_COLOR} label="Experience">
                {gig.experienceLevel || 'Any'}
            </FactRow>
            {skills.length > 0 && (
                <FactRow Icon={Sparkles} iconColor={ROLE_COLOR} label="Skills">
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 6,
                            marginTop: 2,
                        }}
                    >
                        {skills.map((skill, idx) => (
                            <View
                                key={`${skill}-${idx}`}
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(59, 130, 246, 0.2)',
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#93C5FD',
                                        fontSize: 11,
                                        fontFamily: 'Outfit-Medium',
                                    }}
                                >
                                    {skill}
                                </Text>
                            </View>
                        ))}
                    </View>
                </FactRow>
            )}

            {/* Group separator — hairline only when both groups have content. */}
            {hasPhysical && (
                <View
                    style={{
                        height: 1,
                        backgroundColor: SUBTLE_BORDER,
                        marginTop: 4,
                        marginBottom: 18,
                    }}
                />
            )}

            {/* PHYSICAL GROUP — purple icons */}
            {hasGender && (
                <FactRow Icon={UserIcon} iconColor={PHYSICAL_COLOR} label="Gender">
                    {String(gig.genderPreference).charAt(0).toUpperCase() +
                        String(gig.genderPreference).slice(1)}
                </FactRow>
            )}
            {hasAge && (
                <FactRow Icon={Calendar} iconColor={PHYSICAL_COLOR} label="Age">
                    {`${gig.ageRange?.min ?? '?'} – ${gig.ageRange?.max ?? '?'} years`}
                </FactRow>
            )}
            {hasHeight && (
                <FactRow Icon={Ruler} iconColor={PHYSICAL_COLOR} label="Height">
                    {(() => {
                        // If male + female ranges match, render once. Otherwise
                        // render whichever sides are filled, on separate lines.
                        const sameRange =
                            heightMale &&
                            heightFemale &&
                            heightMale.min === heightFemale.min &&
                            heightMale.max === heightFemale.max;
                        if (sameRange) {
                            return (
                                <Text
                                    style={{
                                        color: VALUE_COLOR,
                                        fontSize: 14,
                                        fontFamily: 'Outfit-Medium',
                                    }}
                                >
                                    {`${heightMale.min} – ${heightMale.max} ft`}
                                </Text>
                            );
                        }
                        return (
                            <View>
                                {heightMale && (
                                    <Text
                                        style={{
                                            color: VALUE_COLOR,
                                            fontSize: 14,
                                            fontFamily: 'Outfit-Medium',
                                        }}
                                    >
                                        {`Male: ${heightMale.min} – ${heightMale.max} ft`}
                                    </Text>
                                )}
                                {heightFemale && (
                                    <Text
                                        style={{
                                            color: VALUE_COLOR,
                                            fontSize: 14,
                                            fontFamily: 'Outfit-Medium',
                                            marginTop: 2,
                                        }}
                                    >
                                        {`Female: ${heightFemale.min} – ${heightFemale.max} ft`}
                                    </Text>
                                )}
                            </View>
                        );
                    })()}
                </FactRow>
            )}
            {hasNotes && (
                <FactRow Icon={FileText} iconColor={PHYSICAL_COLOR} label="Notes">
                    {gig.physicalRequirements}
                </FactRow>
            )}
        </View>
    );
};

export default TalentCriteriaInline;
