import React from 'react';
import { View, Text } from 'react-native';
import { SectionHeading } from './SectionHeading';

interface LookingForSectionProps {
    artistTypes?: string[];
    experienceLevel?: string;
    genderPreference?: 'any' | 'male' | 'female' | 'other';
    ageRange?: { min?: number; max?: number };
    heightRequirements?: {
        male?: { min?: string | number; max?: string | number };
        female?: { min?: string | number; max?: string | number };
    };
    requiredSkills?: string[];
    /** Optional slot count to render as the right aside (e.g. "06 slots"). */
    slots?: number;
}

/**
 * Plan 5 v2 — inline "Who we're looking for" block. Replaces the old
 * TalentCriteriaInline / TalentTab when used on the artist-side gig
 * page. Layout matches the mockup:
 *
 *   Type        Dancer · Female
 *   Experience  Mid-level · 3+ years
 *   Age         20 – 35 years
 *   Height      5'2" – 5'8"
 *
 *   Required skills
 *   [Bharatanatyam] [Kathak] [Mudra] [Abhinaya]
 *
 * Empty rows hide so legacy gigs still render cleanly.
 */
function capitalize(s?: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function expLabel(level?: string): string {
    if (!level) return 'Any';
    const map: Record<string, string> = {
        beginner: 'Beginner',
        intermediate: 'Mid-level',
        professional: 'Professional',
    };
    return map[level] ?? capitalize(level);
}

function expDetail(level?: string): string | null {
    if (!level) return null;
    const map: Record<string, string> = {
        beginner: '0 – 1 years',
        intermediate: '3+ years',
        professional: '5+ years',
    };
    return map[level] ?? null;
}

function heightLabel(
    h?: LookingForSectionProps['heightRequirements']
): string | null {
    if (!h) return null;
    const m = h.male;
    const f = h.female;
    if (m && f && m.min === f.min && m.max === f.max) {
        return `${m.min}″ – ${m.max}″`;
    }
    if (f) return `${f.min}″ – ${f.max}″`;
    if (m) return `${m.min}″ – ${m.max}″`;
    return null;
}

export const LookingForSection: React.FC<LookingForSectionProps> = ({
    artistTypes,
    experienceLevel,
    genderPreference,
    ageRange,
    heightRequirements,
    requiredSkills,
    slots,
}) => {
    const hasType = Array.isArray(artistTypes) && artistTypes.length > 0;
    const hasExp = !!experienceLevel;
    const hasAge = !!(ageRange?.min || ageRange?.max);
    const heightStr = heightLabel(heightRequirements);
    const hasHeight = !!heightStr;
    const hasSkills = Array.isArray(requiredSkills) && requiredSkills.length > 0;

    if (!hasType && !hasExp && !hasAge && !hasHeight && !hasSkills) {
        return null;
    }

    const slotsAside =
        typeof slots === 'number' && slots > 0
            ? `${String(slots).padStart(2, '0')} slots`
            : undefined;

    const showGenderBesideType =
        genderPreference && genderPreference !== 'any';

    return (
        <View className="mb-7" testID="looking-for-section">
            <SectionHeading aside={slotsAside}>
                Who we're looking for
            </SectionHeading>

            <View className="gap-2.5">
                {hasType ? (
                    <Row
                        label="Type"
                        value={artistTypes!.join(', ')}
                        secondary={
                            showGenderBesideType
                                ? `· ${capitalize(genderPreference!)}`
                                : undefined
                        }
                    />
                ) : null}

                {hasExp ? (
                    <Row
                        label="Experience"
                        value={expLabel(experienceLevel)}
                        secondary={
                            expDetail(experienceLevel)
                                ? `· ${expDetail(experienceLevel)}`
                                : undefined
                        }
                    />
                ) : null}

                {hasAge ? (
                    <Row
                        label="Age"
                        value={`${ageRange?.min ?? '?'} – ${ageRange?.max ?? '?'} years`}
                    />
                ) : null}

                {hasHeight ? (
                    <Row label="Height" value={heightStr!} />
                ) : null}
            </View>

            {hasSkills ? (
                <View className="mt-5" testID="looking-for-skills">
                    <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2.5">
                        Required skills
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                        {requiredSkills!.map((skill, idx) => (
                            <View
                                key={`${skill}-${idx}`}
                                className="px-2.5 py-1 rounded-md border border-blue-500/20 bg-blue-500/10"
                            >
                                <Text className="text-[11px] font-medium text-blue-300">
                                    {skill}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}
        </View>
    );
};

function Row({
    label,
    value,
    secondary,
}: {
    label: string;
    value: string;
    secondary?: string;
}) {
    return (
        <View className="flex-row items-baseline gap-3">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 w-[90px]">
                {label}
            </Text>
            <Text className="flex-1 text-[14px] text-white font-medium">
                {value}
                {secondary ? (
                    <Text className="text-zinc-400 font-light"> {secondary}</Text>
                ) : null}
            </Text>
        </View>
    );
}
